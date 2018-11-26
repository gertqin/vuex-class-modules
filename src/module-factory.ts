import { Store, Module as VuexModule, GetterTree, ActionContext, Dispatch, Commit } from "vuex";

export interface ModuleOptions {
  name: string;
  store: Store<any>;
  generateMutationSetters?: boolean;
}

export interface IVuexClassModule {
  __mutations?: Dictionary<(payload?: any) => void>;
  __actions?: Dictionary<(payload?: any) => Promise<void>>;
}
export type VuexClassModule = IVuexClassModule & Function;

type Dictionary<T> = { [k: string]: T };

interface ModuleDefinition {
  state: Dictionary<any>;
  getters: Dictionary<() => void>;
  mutations: Dictionary<(payload?: any) => void>;
  actions: Dictionary<(payload?: any) => Promise<void>>;
  localFunctions: Dictionary<(...args: any[]) => any>;
}
interface StoreProxyDefinition {
  state?: Dictionary<any>;
  stateSetter?: (key: string, val: any) => void;

  getters?: Dictionary<any>;
  commit?: Commit;
  dispatch?: Dispatch;

  useNamespaceKey?: boolean;
  excludeLocalFunctions?: boolean;
}

export class VuexClassModuleFactory {
  options: ModuleOptions;

  definition: ModuleDefinition = {
    state: {},
    getters: {},
    mutations: {},
    actions: {},
    localFunctions: {}
  };

  constructor(classModule: VuexClassModule, moduleOptions: ModuleOptions) {
    this.options = moduleOptions;
    this.init(classModule);
  }

  private init(classModule: VuexClassModule) {
    // state
    const classObj = new classModule.prototype.constructor();
    for (const key of Object.keys(classObj)) {
      if (classObj.hasOwnProperty(key) && typeof classObj[key] !== "function") {
        this.definition.state[key] = classObj[key];
      }
    }

    this.definition.mutations = classModule.__mutations || {};
    this.definition.actions = classModule.__actions || {};

    // getters & helper functions
    const actionKeys = Object.keys(this.definition.mutations);
    const mutationKeys = Object.keys(this.definition.actions);

    for (const key of Object.getOwnPropertyNames(classModule.prototype)) {
      const descriptor = Object.getOwnPropertyDescriptor(classModule.prototype, key) as PropertyDescriptor;

      const isGetter = !!descriptor.get;
      if (isGetter) {
        this.definition.getters[key] = descriptor.get!;
      }

      const isHelperFunction =
        descriptor.value &&
        typeof classModule.prototype[key] === "function" &&
        actionKeys.indexOf(key) === -1 &&
        mutationKeys.indexOf(key) === -1 &&
        key !== "constructor";

      if (isHelperFunction) {
        this.definition.localFunctions[key] = classModule.prototype[key];
      }
    }
  }

  registerVuexModule() {
    const vuexModule: VuexModule<any, any> = {
      state: this.definition.state,
      getters: {},
      mutations: {},
      actions: {},
      namespaced: true
    };

    // getters
    mapValues(vuexModule.getters!, this.definition.getters, getter => {
      return (state: any, getters: GetterTree<any, any>) => {
        const thisObj = this.buildThisProxy({ state, getters });
        return getter.call(thisObj);
      };
    });

    // mutations
    mapValues(vuexModule.mutations!, this.definition.mutations, mutation => {
      return (state: any, payload: any) => {
        const thisObj = this.buildThisProxy({
          state,
          stateSetter: (stateField: string, val: any) => {
            state[stateField] = val;
          }
        });
        mutation.call(thisObj, payload);
      };
    });
    if (this.options.generateMutationSetters) {
      for (const stateKey of Object.keys(this.definition.state)) {
        const mutation = (state: any, payload: any) => {
          state[stateKey] = payload;
        };
        vuexModule.mutations![this.getMutationSetterName(stateKey)] = mutation;
      }
    }

    // actions
    mapValues(vuexModule.actions!, this.definition.actions, action => {
      return (context: ActionContext<any, any>, payload: any) => {
        const proxyDefinition: StoreProxyDefinition = {
          ...context,
          stateSetter: this.options.generateMutationSetters
            ? (field: string, val: any) => {
                context.commit(this.getMutationSetterName(field), val);
              }
            : undefined
        };
        const thisObj = this.buildThisProxy(proxyDefinition);

        return action.call(thisObj, payload);
      };
    });

    // register module
    const { store, name } = this.options;
    if (store.state[name]) {
      if (module.hot) {
        store.hotUpdate({
          modules: {
            [name]: vuexModule
          }
        });
      } else {
        throw Error(`[vuex-class-module]: A module with name '${name}' already exists.`);
      }
    } else {
      store.registerModule(this.options.name, vuexModule);
    }
  }

  buildAccessor() {
    const { store, name } = this.options;
    const accessorModule = this.buildThisProxy({
      ...store,
      state: store.state[name],
      useNamespaceKey: true,
      excludeLocalFunctions: true
    });

    return accessorModule;
  }

  private buildThisProxy(proxyDefinition: StoreProxyDefinition) {
    const obj: any = {};

    if (proxyDefinition.state) {
      mapValuesToProperty(
        obj,
        this.definition.state,
        key => proxyDefinition.state![key],
        proxyDefinition.stateSetter
          ? (key, val) => proxyDefinition.stateSetter!(key, val)
          : () => {
              throw Error("[vuex-class-module]: Cannot modify state outside mutations.");
            }
      );
    }

    const namespaceKey = proxyDefinition.useNamespaceKey ? this.options.name + "/" : "";

    if (proxyDefinition.getters) {
      mapValuesToProperty(obj, this.definition.getters, key => proxyDefinition.getters![`${namespaceKey}${key}`]);
    }

    if (proxyDefinition.commit) {
      mapValues(obj, this.definition.mutations, (mutation, key) => {
        return (payload?: any) => proxyDefinition.commit!(`${namespaceKey}${key}`, payload);
      });
    }

    if (proxyDefinition.dispatch) {
      mapValues(obj, this.definition.actions, (action, key) => {
        return (payload?: any) => proxyDefinition.dispatch!(`${namespaceKey}${key}`, payload);
      });
    }

    if (!proxyDefinition.excludeLocalFunctions) {
      mapValues(obj, this.definition.localFunctions, localFunction => {
        return (...args: any[]) => localFunction.apply(obj, args);
      });
    }

    return obj;
  }

  private getMutationSetterName(stateKey: string) {
    return "set__" + stateKey;
  }
}

function mapValues<S, V>(target: Dictionary<any>, source: Dictionary<S>, mapFunc: (val: S, key: string) => V) {
  for (const key of Object.keys(source)) {
    target[key] = mapFunc(source[key], key);
  }
}

function mapValuesToProperty<S, V>(
  target: Dictionary<any>,
  source: Dictionary<S>,
  get: (key: string) => any,
  set?: (key: string, val: any) => void
) {
  for (const key of Object.keys(source)) {
    Object.defineProperty(target, key, {
      get: () => get(key),
      set: set ? (val: string) => set(key, val) : undefined
    });
  }
}
