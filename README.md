# vuex-class-modules

This is yet another package to introduce a simple type-safe class style syntax for your vuex modules, inspired by [vue-class-component](https://github.com/vuejs/vue-class-component).

[![npm](https://img.shields.io/npm/v/vuex-class-modules.svg)](https://www.npmjs.com/package/vuex-class-modules)

## Installation

`npm install vuex-class-modules`

And make sure to have the `--experimentalDecorators` flag enabled.

Both a `commonjs` and a `esm` module build are published. If you have a webpack-based setup, it will use the `esm` modules by default.

## Usage

Vuex modules can be written using decorators as a class:

```typescript
// user-module.ts
import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

@Module
class UserModule extends VuexModule {
  // state
  firstName = "Foo";
  lastName = "Bar";

  // getters
  get fullName() {
    return this.firstName + " " + this.lastName;
  }

  // mutations
  @Mutation
  setFirstName(firstName: string) {
    this.firstName = firstName;
  }
  @Mutation
  setLastName(lastName: string) {
    this.lastName = lastName;
  }

  // actions
  @Action
  async loadUser() {
    const user = await fetchUser();
    this.setFirstName(user.firstName);
    this.setLastName(user.lastName);
  }
}

// register module (could be in any file)
import store from "path/to/store";
export const userModule = new UserModule({ store, name: "user" });
```

The module will automatically be registered to the store as a namespaced dynamic module when it is instantiated. (The modules are namespaced to avoid name conflicts between modules for getters/mutations/actions.)

The module can then be used in vue components as follows:

```ts
// MyComponent.vue
import Vue from "vue";
import { userModule } from "path/to/user-module.ts";

export class MyComponent extends Vue {
  get firstName() {
    return userModule.firstName; // -> store.state.user.firstName
  }
  get fullName() {
    return userModule.fullName; // -> store.getters["user/fullName]
  }

  created() {
    userModule.setFirstName("Foo"); // -> store.commit("user/setFirstName", "Foo")
    userModule.loadUser(); // -> store.dispatch("user/loadUser")
  }
}
```

### What about `rootState` and `rootGetters`?

There are two ways to access other modules within a module, or dispatch actions to other modules.

1. Simply import the instantiated module (suitable if the modules are instantiated in the same file as they are defined):

```ts
// my-module.ts

// import the module instance
import { otherModule } from "./other-module";

@Module
class MyModule extends VuexModule {
  get myGetter() {
    return otherModule.foo;
  }

  @Action
  async myAction() {
    await otherModule.someAction();
    // ...
  }
}
```

2. The other module can be registered through the constructor (suitable if the modules are instantiated elsewhere)

```ts
// my-module.ts

// import the class, not the instance
import { OtherModule } from "./other-module";

@Module
export class MyModule extends VuexModule {
  private otherModule: OtherModule;

  constructor(otherModule: OtherModule, options: RegisterOptions) {
    super(options);
    this.otherModule = otherModule;
  }

  get myGetter() {
    return this.otherModule.foo;
  }

  @Action
  async myAction() {
    await this.otherModule.someAction();
    // ...
  }
}

// register-modules.ts
import store from "path/to/store";
import { OtherModule } from "path/to/other-module";
import { MyModule } from "path/to/my-module";

export const otherModule = new OtherModule({ store, name: "otherModule" });
export const myModule = new MyModule(otherModule, { store, name: "myModule" });
```

The local modules will not be part of the state and cannot be accessed from the outside, so they should always be declared private.

```ts
myModule.otherModule; // -> undefined
```

### The `store.watch` function

Vuex can also be used ouside of vue modules. To listen for changes to the state, vuex provides a [watch method](https://vuex.vuejs.org/api/#watch).

This api is also provided by vuex-class-modules under the method name `$watch` to prevent name collisions. For example you can do:

```ts
import store from "./store";
import { MyModule } from "./my-module";

const myModule = new MyModule({ store, name: "MyModule" });
myModule.$watch(
  (theModule) => theModule.fullName,
  (newName: string, oldName: string) => {
    // ...
  },
  {
    deep: false,
    immediate: false,
  }
);
```

and to unwatch:

```ts
const unwatch = myModule.$watch(...);
unwatch();
```

### Register options

- `name` [required]: Name of the module
- `store` [required]: The vuex store - which can just be instantiated as empty:

```ts
// store.ts
import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);
const store = new Vuex.Store({});
```

### Module options

The module decorator can also accept options:

- `generateMutationSetters` [optional, default=false]: Whether automatic mutation setters for the state properties should be generated, see [Generate Mutation Setters](#generate-mutation-setters).

## Example

The vuex shopping cart example rewritten using `vue-class-component` and `vuex-class-modules` can be found in the [example directory](/example). Build the example using:

`npm run example`

## Caveats of `this`

As for vue-class-component `this` inside the module is just a proxy object to the store. It can therefore only access what the corresponding vuex module function would be able to access:

```ts
@Module
class MyModule extends VuexModule {
  foo = "bar";

  get someGetter() {
    return 123;
  }
  get myGetter() {
    this.foo; // -> "bar"
    this.someGetter; // -> 123
    this.someMutation(); // undefined, getters cannot call mutations
    this.someAction(); // -> undefined, getters cannot call actions
  }

  @Mutation
  someMutation() {
    /* ... */
  }
  @Mutation
  myMutation() {
    this.foo; // -> "bar"
    this.someGetter; // -> undefined, mutations dont have access to getters
    this.someMutation(); // -> undefined, mutations cannot call other mutations
    this.someAction(); // -> undefined, mutations cannot call actions
  }

  @Action
  async someAction() {
    /* ... */
  }
  @Action
  async myAction() {
    this.foo; // -> "bar"
    this.someGetter; // -> 123
    this.myMutation(); // Ok
    await this.someAction(); // Ok
  }
}
```

## Local Functions

The module can have non-mutation/action functions which can be used inside the module. As for local modules, these functions will not be exposed outside the module and should therefore be private. `this` will be passed on to the local function from the getter/mutation/action.

```ts
@Module
class MyModule extends VuexModule {
  get myGetter() {
    return myGetterHelper();
  }
  private myGetterHelper() {
    // same 'this' context as myGetter
  }

  @Mutation
  myMutation() {
    this.myMutationHelper();
  }

  // should be private
  myMutationHelper() { /* ... */}
}
const myModule = new MyModule({ store, name: "myModule });
myModule.myMutationHelper // -> undefined.
```

## Generate Mutation Setters

As I often find myself writing a lot of simple setter mutations like

```ts
@Module
class UserModule extends VuexModule {
  firstName = "Foo";
  lastName = "Bar";

  @Mutation
  setFirstName(firstName: string) {
    this.firstName = firstName;
  }
  @Mutation
  setLastName(lastName: string) {
    this.lastName = lastName;
  }
}
```

a module option `generateMutationSetters` has been added, which when enabled will generate a setter mutation for each state property. The state can then be modified directly from the actions:

```ts
@Module({ generateMutationSetters: true })
class UserModule extends VuexModule {
  firstName = "Foo";
  lastName = "Bar";

  // Auto generated:
  // @Mutation set__firstName(val: any) { this.firstName = val }
  // @Mutation set__lastName(val: any) { this.lastName = val }

  @Action
  async loadUser() {
    const user = await fetchUser();
    this.firstName = user.firstName; // -> this.set__firstName(user.firstName);
    this.lastName = user.lastName; // -> this.set__lastName(user.lastName);
  }
}
```

_NOTE:_ Setters are only generated for root-level state properties, so in order to update a property of an object you have to use a mutation or replace the entire object:

```ts
@Module({ generateMutationSetters: true })
class UserModule extends VuexModule {
  user = {
    id: 123,
    name: "Foo",
  };

  @Mutation
  setUserName() {
    this.user.name = "Bar"; // OK!
  }

  @Action
  async loadUser() {
    this.user.name = "Bar"; // Bad, the state is mutated outside a mutation
    this.user = { ...this.user, name: "Bar" }; // OK!
  }
}
```

## Vite HMR

[Vite](https://vitejs.dev/) (and possibly other bundlers) uses `import.meta.hot` for HMR, which `vuex-class-modules` doesn't support currently. Instead a static property

```ts
VuexModule.__useHotUpdate = true; // default false
```

is provided, which will force hot updates to the store instead of throwing an error when a module with a duplicate name is registered. This could for instance be set only in dev mode

```ts
VuexModule.__useHotUpdate = import.meta.env.DEV;
```

## License

[MIT](http://opensource.org/licenses/MIT)
