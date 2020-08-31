import { Action, Module, Mutation, VuexModule } from "../src";
import Vuex, { Store } from "vuex";
import Vue from "vue";

Vue.use(Vuex);

class ParentModule extends VuexModule {
  foo = "bar";

  get bigFoo() {
    return this.foo.toUpperCase();
  }

  get snakeFoo() {
    return "__";
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
    if (this.bigFoo === "BAZ") {
      this.myMutation("alright");
    }
  }
}

@Module
class Module1 extends ParentModule {
  private tag = "child1";

  get snakeFoo() {
    return `_${this.foo}_${this.tag}_`;
  }
}

@Module
class Module2 extends ParentModule {
  private tag = "child2";
  foo = "baz";

  get snakeFoo() {
    return `_${this.foo}_${this.tag}_`;
  }
}

describe("getters-inheritance", () => {
  let store: Store<any>;
  let child1: Module1;
  let child2: Module2;

  beforeEach(() => {
    store = new Vuex.Store({});
    child1 = new Module1({ store, name: "child1" });
    child2 = new Module2({ store, name: "child2" });
  });

  test("allows the use of getters from an inheriting class", () => {
    expect(child1.bigFoo).toBe("BAR");
    expect(child1.bigFoo).toBe(store.getters["child1/bigFoo"]);
    expect(child2.bigFoo).toBe("BAZ");
    expect(child2.bigFoo).toBe(store.getters["child2/bigFoo"]);
  });

  test("allows the use of getters in inherited class", () => {
    child1.myAction();
    child2.myAction();
    expect(child1.bigFoo).toBe("OK");
    expect(child1.bigFoo).toBe(store.getters["child1/bigFoo"]);
    expect(child2.bigFoo).toBe("ALRIGHT");
    expect(child2.bigFoo).toBe(store.getters["child2/bigFoo"]);
  });

  test("overriden getters behave as expected", () => {
    expect(child1.snakeFoo).toBe("_bar_child1_");
    expect(child1.snakeFoo).toBe(store.getters["child1/snakeFoo"]);
    expect(child2.snakeFoo).toBe("_baz_child2_");
    expect(child2.snakeFoo).toBe(store.getters["child2/snakeFoo"]);
  });
});
