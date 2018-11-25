import { Store, Module, GetterTree, ActionContext } from "vuex";

export interface IVuexClassModule {
  __mutations?: Dictionary<(payload?: any) => void>;
  __actions?: Dictionary<(payload?: any) => Promise<void>>;
}
// tslint:disable-next-line:ban-types
export type VuexClassModule = IVuexClassModule & Function;

type Dictionary<T> = { [k: string]: T };

interface ModuleDefinition {
  state: Dictionary<any>;
  getters: Dictionary<() => void>;
  mutations: Dictionary<(payload?: any) => void>;
  actions: Dictionary<(payload?: any) => Promise<void>>;
  helperFunctions: Dictionary<(...args: any[]) => any>;
}

export interface ModuleOptions {
  name: string;
  store: Store<any>;
  generateMutationSetters?: boolean;
}

export function Module(options: ModuleOptions): ClassDecorator {
  return moduleDecoratorFactory(options);
}

function moduleDecoratorFactory(moduleOptions: ModuleOptions) {
  // tslint:disable-next-line:ban-types
  return <TFunction extends Function>(constructor: TFunction): TFunction | void => {
    if (moduleOptions.store.state[moduleOptions.name]) {
      throw Error(`[vuex-class-module]: A module with name '${moduleOptions.name}' already exists.`);
    }

    const classModule: VuexClassModule = constructor;

    const moduleDefinition = buildModuleDefinition(classModule);

    const vuexModule = buildVuexModule(moduleDefinition, moduleOptions);

    moduleOptions.store.registerModule(moduleOptions.name, vuexModule);

    const accessor: any = function() {
      return buildAccessor(moduleDefinition, moduleOptions);
    };
    accessor.prototype = classModule.prototype;
    return accessor;
  };
}

function buildModuleDefinition(classModule: VuexClassModule) {
  const moduleDefinition: ModuleDefinition = {
    state: {},
    getters: {},
    mutations: classModule.__mutations || {},
    actions: classModule.__actions || {},
    helperFunctions: {}
  };

  // state
  const classObj = new classModule.prototype.constructor();
  for (const key of Object.keys(classObj)) {
    if (classObj.hasOwnProperty(key) && typeof classObj[key] !== "function") {
      moduleDefinition.state[key] = classObj[key];
    }
  }

  // getters & helper functions
  const actionsAndMutations = Object.keys(moduleDefinition.mutations).concat(Object.keys(moduleDefinition.actions));

  for (const key of Object.getOwnPropertyNames(classModule.prototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(classModule.prototype, key) as PropertyDescriptor;

    const isGetter = !!descriptor.get;
    if (isGetter) {
      moduleDefinition.getters[key] = descriptor.get!;
    }

    const isHelperFunction =
      descriptor.value &&
      typeof classModule.prototype[key] === "function" &&
      actionsAndMutations.indexOf(key) === -1 &&
      key !== "constructor";

    if (isHelperFunction) {
      moduleDefinition.helperFunctions[key] = classModule.prototype[key];
    }
  }

  return moduleDefinition;
}

function buildVuexModule(moduleDefinition: ModuleDefinition, moduleOptions: ModuleOptions) {
  const vuexModule = {
    state: moduleDefinition.state,
    getters: {},
    mutations: {},
    actions: {},
    namespaced: true
  } as Module<any, any>;

  // getters
  for (const key of Object.keys(moduleDefinition.getters)) {
    const getter = moduleDefinition.getters[key];
    vuexModule.getters![key] = (state: any, getters: GetterTree<any, any>) => {
      const thisObj: any = {};
      addState(thisObj, moduleDefinition, state);
      addGetters(thisObj, moduleDefinition, moduleOptions);
      addHelperFunctions(thisObj, moduleDefinition);

      return getter.call(thisObj);
    };
  }

  // mutations
  for (const key of Object.keys(moduleDefinition.mutations)) {
    const mutationFunction = moduleDefinition.mutations[key];

    const mutation = (state: any, payload: any) => {
      const thisObj: any = {};
      addState(thisObj, moduleDefinition, state, (field, val) => (state[field] = val));
      addHelperFunctions(thisObj, moduleDefinition);

      mutationFunction.call(thisObj, payload);
    };
    vuexModule.mutations![key as string] = mutation;
  }
  if (moduleOptions.generateMutationSetters) {
    for (const stateKey of Object.keys(moduleDefinition.state)) {
      const mutation = (state: any, payload: any) => {
        state[stateKey] = payload;
      };
      vuexModule.mutations![getMutationSetterName(stateKey)] = mutation;
    }
  }

  // actions
  for (const key of Object.keys(moduleDefinition.actions)) {
    const actionFunction = moduleDefinition.actions[key];
    const action = (context: ActionContext<any, any>, payload: any) => {
      const thisObj: any = {};

      const stateSet = moduleOptions.generateMutationSetters
        ? (field: string, val: any) => {
            context.commit(getMutationSetterName(field), val);
          }
        : undefined;
      addState(thisObj, moduleDefinition, context.state, stateSet);

      addGetters(thisObj, moduleDefinition, moduleOptions);
      addMutations(thisObj, moduleDefinition, moduleOptions);
      addActions(thisObj, moduleDefinition, moduleOptions);
      addHelperFunctions(thisObj, moduleDefinition);

      return actionFunction.call(thisObj, payload);
    };
    vuexModule.actions![key as string] = action;
  }

  return vuexModule;
}

function buildAccessor(moduleDefinition: ModuleDefinition, moduleOptions: ModuleOptions) {
  const { store, name } = moduleOptions;

  const accessorModule: any = {};

  addState(accessorModule, moduleDefinition, store.state[name]);
  addGetters(accessorModule, moduleDefinition, moduleOptions);
  addMutations(accessorModule, moduleDefinition, moduleOptions);
  addActions(accessorModule, moduleDefinition, moduleOptions);

  for (const key of Object.keys(moduleDefinition.helperFunctions)) {
    accessorModule[key as string] = (...args: any[]) => {
      warn("Only Mutations or Actions should be called outside the module.");
    };
  }

  return accessorModule;
}

function getMutationSetterName(stateKey: string) {
  return "set__" + stateKey;
}

function addState(
  obj: any,
  moduleDefinition: ModuleDefinition,
  storeState: any,
  set?: (field: string, val: any) => void
) {
  for (const field of Object.keys(moduleDefinition.state)) {
    Object.defineProperty(obj, field, {
      get() {
        return storeState[field];
      },
      set: set
        ? (val: any) => set(field, val)
        : () => {
            throw Error("[vuex-class-module]: Cannot modify state outside mutations.");
          }
    });
  }
}

function addGetters(obj: any, moduleDefinition: ModuleDefinition, { store, name }: ModuleOptions) {
  for (const getter of Object.keys(moduleDefinition.getters)) {
    Object.defineProperty(obj, getter, {
      get() {
        return store.getters[`${name}/${getter}`];
      }
    });
  }
}

function addMutations(obj: any, moduleDefinition: ModuleDefinition, { store, name }: ModuleOptions) {
  for (const key of Object.keys(moduleDefinition.mutations)) {
    obj[key as string] = (payload?: any) => {
      store.commit(`${name}/${key}`, payload);
    };
  }
}
function addActions(obj: any, moduleDefinition: ModuleDefinition, { store, name }: ModuleOptions) {
  for (const key of Object.keys(moduleDefinition.actions)) {
    obj[key as string] = (payload?: any) => {
      return store.dispatch(`${name}/${key}`, payload);
    };
  }
}
function addHelperFunctions(obj: any, moduleDefinition: ModuleDefinition) {
  for (const key of Object.keys(moduleDefinition.helperFunctions)) {
    const helperFunction = moduleDefinition.helperFunctions[key];
    obj[key] = (...args: any[]) => {
      return helperFunction.apply(obj, args);
    };
  }
}

function warn(text: string) {
  console.warn("[vuex-class-module]: " + text);
}
