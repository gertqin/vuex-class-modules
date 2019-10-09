import { Action, Module, Mutation, VuexModule } from "../src";
import Vuex, { Store } from "vuex";
import Vue from "vue";

Vue.use(Vuex);

class ParentModule extends VuexModule {
  foo = "init";

  get bigFoo() {
    return this.foo.toUpperCase();
  }

  @Mutation
  updateFoo(value: string) {
    this.foo = value;
  }

  @Action
  action1() {
    //
  }

  @Action
  action2() {
    //
  }

  @Action
  action3() {
    //
  }

  @Action
  action4() {
    //
  }
}

@Module
class MyModule extends ParentModule {
  get doubledFoo() {
    return this.foo + this.foo;
  }

  @Mutation
  setFooToExample() {
    this.foo = "example";
  }

  @Action
  action1() {
    this.setFooToExample();
  }

  @Action
  action2() {
    this.updateFoo("bar");
  }

  @Action
  action3() {
    this.updateFoo(this.doubledFoo);
  }

  @Action
  action4() {
    this.updateFoo(this.bigFoo);
  }
}

describe("actions-inheritance", () => {
  let store: Store<any>;
  let myModule: MyModule;

  beforeEach(() => {
    store = new Vuex.Store({});
    myModule = new MyModule({ store, name: "myModule" });
  });

  test("overriden action has access to mutations", () => {
    myModule.action1();
    expect(myModule.foo).toBe("example");
  });

  test("overriden action has access to parent mutations", () => {
    myModule.action2();
    expect(myModule.foo).toBe("bar");
  });

  test("overriden action has access to getters", () => {
    myModule.action3();
    expect(myModule.foo).toBe("initinit");
  });

  test("overriden action has access to parent getters", () => {
    myModule.action4();
    expect(myModule.foo).toBe("INIT");
  });
});
