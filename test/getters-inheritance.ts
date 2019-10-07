import { Action, Module, Mutation, VuexModule } from "../src";
import Vuex, { Store } from "vuex";
import Vue from "vue";

Vue.use(Vuex);

class ParentModule extends VuexModule {
  foo = "bar";

  get textTransforms() {
    return this.foo.toUpperCase();
  }

  @Mutation
  myMutation(value: string) {
    this.foo = value;
  }

  @Action
  myAction() {
    if (this.textTransforms === "BAR") {
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
    expect(myModule.textTransforms).toBe("BAR");
    expect(myModule.textTransforms).toBe(store.getters["myModule/textTransforms"]);
  });

  test("allows the use of getters in inherited class", () => {
    myModule.myAction();
    expect(myModule.textTransforms).toBe("OK");
    expect(myModule.textTransforms).toBe(store.getters["myModule/textTransforms"]);
  });
});
