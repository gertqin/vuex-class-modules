import { Store, Module, GetterTree, ActionContext, Dispatch, Commit } from "vuex";

export interface IVuexClassModule {
  __mutations?: Dictionary<(payload?: any) => void>;
  __actions?: Dictionary<(payload?: any) => Promise<void>>;
}
export type VuexClassModule = IVuexClassModule & Function;

export interface ModuleOptions {
  name: string;
  store: Store<any>;
  generateMutationSetters?: boolean;
}

export function Module(options: ModuleOptions): ClassDecorator {
  return moduleDecoratorFactory(options);
}

function moduleDecoratorFactory(moduleOptions: ModuleOptions) {
  return <TFunction extends Function>(constructor: TFunction): TFunction | void => {
    if (moduleOptions.store.state[moduleOptions.name]) {
      throw Error(`[vuex-class-module]: A module with name '${moduleOptions.name}' already exists.`);
    }

    const factory = new VuexClassModuleFactory(constructor, moduleOptions);
    factory.registerVuexModule();

    const accessor: any = function() {
      return factory.buildAccessor();
    };
    accessor.prototype = constructor.prototype;
    return accessor;
  };
}

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

class VuexClassModuleFactory {
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
    const vuexModule = {
      state: this.definition.state,
      getters: {},
      mutations: {},
      actions: {},
      namespaced: true
    } as Module<any, any>;

    // getters
    for (const key of Object.keys(this.definition.getters)) {
      const getter = this.definition.getters[key];
      vuexModule.getters![key] = (state: any, getters: GetterTree<any, any>) => {
        const thisObj: any = {};
        this.buildThisProxy(thisObj, { state, getters });
        return getter.call(thisObj);
      };
    }

    // mutations
    for (const key of Object.keys(this.definition.mutations)) {
      const mutationFunction = this.definition.mutations[key];
      const mutation = (state: any, payload: any) => {
        const thisObj: any = {};
        this.buildThisProxy(thisObj, {
          state,
          stateSetter: (stateField: string, val: any) => {
            state[stateField] = val;
          }
        });
        mutationFunction.call(thisObj, payload);
      };
      vuexModule.mutations![key as string] = mutation;
    }
    if (this.options.generateMutationSetters) {
      for (const stateKey of Object.keys(this.definition.state)) {
        const mutation = (state: any, payload: any) => {
          state[stateKey] = payload;
        };
        vuexModule.mutations![this.getMutationSetterName(stateKey)] = mutation;
      }
    }

    // actions
    for (const key of Object.keys(this.definition.actions)) {
      const actionFunction = this.definition.actions[key];
      const action = (context: ActionContext<any, any>, payload: any) => {
        const thisObj: any = {};

        const proxyDefinition: StoreProxyDefinition = {
          ...context,
          stateSetter: this.options.generateMutationSetters
            ? (field: string, val: any) => {
                context.commit(this.getMutationSetterName(field), val);
              }
            : undefined
        };
        this.buildThisProxy(thisObj, proxyDefinition);

        return actionFunction.call(thisObj, payload);
      };
      vuexModule.actions![key as string] = action;
    }

    this.options.store.registerModule(this.options.name, vuexModule);
  }

  buildAccessor() {
    const accessorModule: any = {};
    const store = this.options.store;
    this.buildThisProxy(accessorModule, {
      ...store,
      state: store.state[this.options.name],
      useNamespaceKey: true,
      excludeLocalFunctions: true
    });

    return accessorModule;
  }

  private buildThisProxy(obj: any, store: StoreProxyDefinition) {
    const namespaceKey = store.useNamespaceKey ? this.options.name + "/" : "";

    if (store.state) {
      for (const key of Object.keys(this.definition.state)) {
        Object.defineProperty(obj, key, {
          get() {
            return store.state![key];
          },
          set: store.stateSetter
            ? (val: any) => store.stateSetter!(key, val)
            : () => {
                throw Error("[vuex-class-module]: Cannot modify state outside mutations.");
              }
        });
      }
    }

    if (store.getters) {
      for (const key of Object.keys(this.definition.getters)) {
        Object.defineProperty(obj, key, {
          get() {
            return store.getters![`${namespaceKey}${key}`];
          }
        });
      }
    }

    if (store.commit) {
      for (const key of Object.keys(this.definition.mutations)) {
        obj[key as string] = (payload?: any) => {
          store.commit!(`${namespaceKey}${key}`, payload);
        };
      }
    }

    if (store.dispatch) {
      for (const key of Object.keys(this.definition.actions)) {
        obj[key as string] = (payload?: any) => {
          return store.dispatch!(`${namespaceKey}${key}`, payload);
        };
      }
    }

    if (!store.excludeLocalFunctions) {
      for (const key of Object.keys(this.definition.localFunctions)) {
        const localFunction = this.definition.localFunctions[key];
        obj[key] = (...args: any[]) => {
          return localFunction.apply(obj, args);
        };
      }
    }
  }

  private getMutationSetterName(stateKey: string) {
    return "set__" + stateKey;
  }
}
