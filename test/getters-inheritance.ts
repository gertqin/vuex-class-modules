import { Action, Module, Mutation, VuexModule } from "../src";
import Vuex, { Store } from "vuex";
import Vue from "vue";

Vue.use(Vuex);

class ParentModule extends VuexModule {
  foo = "bar";

  get bigFoo() {
    return this.foo.toUpperCase();
  }

  @Mutation
  myMutation(value: string) {
    this.foo = value;
  }

  @Action
  myAction() {
    if (this.bigFoo === "BAR") {
      this.myMutation("ok");
    }
  }
}

@Module
class MyModule extends ParentModule {
  //
}

describe("getters-inheritance", () => {
  let store: Store<any>;
  let myModule: MyModule;

  beforeEach(() => {
    store = new Vuex.Store({});
    myModule = new MyModule({ store, name: "myModule" });
  });

  test("allows the use of getters from an inheriting class", () => {
    expect(myModule.bigFoo).toBe("BAR");
    expect(myModule.bigFoo).toBe(store.getters["myModule/bigFoo"]);
  });

  test("allows the use of getters in inherited class", () => {
    myModule.myAction();
    expect(myModule.bigFoo).toBe("OK");
    expect(myModule.bigFoo).toBe(store.getters["myModule/bigFoo"]);
  });
});
