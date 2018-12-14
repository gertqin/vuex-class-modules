import { Store, Module as StoreModule, GetterTree, ActionContext, Dispatch, Commit } from "vuex";
import { VuexModule } from "./VuexModule";

export interface ModuleOptions {
  generateMutationSetters?: boolean;
}

export interface RegisterOptions {
  store: Store<any>;
  name: string;
}

export interface IVuexModule extends Dictionary<any> {
  __options: RegisterOptions;
}
export interface IModulePrototype {
  __mutations?: Dictionary<(payload?: any) => void>;
  __actions?: Dictionary<(payload?: any) => Promise<void>>;
}
export type ModulePrototype = IModulePrototype & Function;

type Dictionary<T> = { [k: string]: T };

interface ModuleDefinition {
  state: Dictionary<any>;
  moduleRefs: Dictionary<VuexModule>;
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
  excludeModuleRefs?: boolean;
  excludeLocalFunctions?: boolean;
}

export class VuexClassModuleFactory {
  moduleOptions: ModuleOptions;
  registerOptions: RegisterOptions;

  definition: ModuleDefinition = {
    state: {},
    moduleRefs: {},
    getters: {},
    mutations: {},
    actions: {},
    localFunctions: {}
  };

  constructor(classModule: ModulePrototype, instance: IVuexModule, moduleOptions: ModuleOptions) {
    this.moduleOptions = moduleOptions;
    this.registerOptions = instance.__options;
    this.init(classModule, instance);
  }

  private init(classModule: ModulePrototype, instance: IVuexModule) {
    // state
    for (const key of Object.keys(instance)) {
      const val = instance[key];
      if (key !== "__options" && instance.hasOwnProperty(key) && typeof val !== "function") {
        if (val instanceof VuexModule) {
          this.definition.moduleRefs[key] = val;
        } else {
          this.definition.state[key] = instance[key];
        }
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
    const vuexModule: StoreModule<any, any> = {
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
    if (this.moduleOptions.generateMutationSetters) {
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
          stateSetter: this.moduleOptions.generateMutationSetters
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
    const { store, name } = this.registerOptions;
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
      store.registerModule(this.registerOptions.name, vuexModule);
    }
  }

  buildAccessor(instance: IVuexModule) {
    const { store, name } = this.registerOptions;
    const accessorModule = this.buildThisProxy({
      ...store,
      state: store.state[name],
      useNamespaceKey: true,
      excludeModuleRefs: true,
      excludeLocalFunctions: true
    });

    Object.setPrototypeOf(accessorModule, Object.getPrototypeOf(instance));
    Object.freeze(accessorModule);

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
    if (!proxyDefinition.excludeModuleRefs) {
      mapValues(obj, this.definition.moduleRefs, val => val);
    }

    const namespaceKey = proxyDefinition.useNamespaceKey ? this.registerOptions.name + "/" : "";

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
