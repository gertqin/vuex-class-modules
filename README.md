# vuex-class-modules
This is yet another package to introduce a simple type-safe class style syntax for your vuex modules, inspired by [vue-class-component](https://github.com/vuejs/vue-class-component).

[![npm](https://img.shields.io/npm/v/vuex-class-modules.svg)](https://www.npmjs.com/package/vuex-class-modules)

## Installation
`npm install vuex-class-modules`

And make sure to have the `--experimentalDecorators` flag enabled.

## Usage
Vuex modules can be written using decorators as a class:

```typescript
// user-module.ts
import { Module, Mutation, Action } from "vuex-class-modules";
import store from "path/to/store";

@Module({ name: "user", store })
class UserModule {
  // state
  firstName = "Foo";
  lastName = "Bar";

  // getters
  get fullName() {
    return this.firstName + " " + this.lastName
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
    const user = await fetchUser()
    this.setFirstName(user.firstName);
    this.setLastName(user.lastName);
  }
}

export const userModule = new UserModule();
```

The module will automatically be registered to the store as a namespaced dynamic module with when it is imported. (The modules are namespaced to avoid name conflicts between modules for getters/mutations/actions.)

The module can then be used in a vue component:

```ts
// MyComponent.vue
import Vue from "vue";
import { userModule } from "path/to/user-module.ts"

export class MyComponent extends Vue {
  get firstName() {
    return userModule.firstName // -> store.state.user.firstName
  }
  get fullName() {
    return userModule.fullName // -> store.getters["user/fullName]
  }

  created() {
    userModule.setFirstName("Foo") // -> store.commit("user/setFirstName", "Foo")
    userModule.loadUser(); // -> store.dispatch("user/loadUser")
  }
}
```

### What about `rootState` and `rootGetters`?

To access another module within a module, or dispatch an action to another module, simply import the other module:

```ts
// my-module.ts
import myOtherModule from "./my-other-module";

@Module({ name: "myModule", store })
class MyModule {
  get myGetter() {
    return myOtherModule.foo;
  }

  @Action
  async myAction() {
    await myOtherModule.fireAction();
    // ...
  }
}
```

### Module options
* `name` [required]: Name of the module
* `store` [required]: The vuex store obj - which can just be empty:
```ts
// store.ts
import Vue from "vue"
import Vuex from "vuex";
Vue.use(Vuex);
export default new Vuex.Store({})
```
* `generateMutationSetters` [optional, default=false]: Whether automatic mutation setters for the state properties should be generated, see [Generate Mutation Setters](#generate-mutation-setters).

## Example
The vuex shopping cart example rewritten using `vue-class-component` and `vuex-class-modules` can be found in the [example directory](/example). Build the example using:

`npm run example`

## Caveats of `this`
As for vue-class-component `this` inside the module is just a proxy object to the store and can therefore only access what the corresponding module function would be able to access:

```ts
@Module({ name: "myModule", store })
class MyModule {
  foo = "bar";

  get someGetter() { return 123 }
  get myGetter() {
    this.foo // -> "bar"
    this.someGetter // -> 123
    this.someMutation() // undefined, getters cannot call mutations
    this.someAction() // -> undefined, getters cannot call actions
  }

  @Mutation
  someMutation() { /* ... */ }
  @Mutation
  myMutation() {
    this.foo // -> "bar"
    this.someGetter // -> undefined, mutations dont have access to getters 
    this.someMutation() // -> undefined, mutations cannot call other mutations
    this.someAction() // -> undefined, mutations cannot call actions
  }

  @Action
  async someAction() { /* ... */ }
  @Action
  async myAction() {
    this.foo // -> "bar"
    this.someGetter // -> 123
    this.myMutation() // Ok
    await this.someAction() // Ok
  }
}
```

## Local Functions
The module can have non-mutation/action functions which can be used inside the module. As these will not be exposed outside the module, they should always be private. `this` will be passed to the local function from the getter/mutation/action.

```ts
@Module({ name: "myModule", store })
class MyModule {
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
const myModule = new MyModule();
myModule.myMutationHelper() // -> undefined.
```

## Generate Mutation Setters
As I often find myself writing a lot of simple setter mutations like

```ts
@Module({ name: "user", store })
class UserModule {
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
@Module({ name: "user", store, generateMutationSetters: true })
class UserModule {
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

_NOTE:_ Setters are only generated for root-level state properties, so to update a property of an object you have to use a mutation or replace the entire object: 

```ts
@Module({ name: "user", store, generateMutationSetters: true })
class UserModule {
  user = {
    id: 123,
    name: "Foo"
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

## License

[MIT](http://opensource.org/licenses/MIT)