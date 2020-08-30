import { Action, Module, Mutation, VuexModule, RegisterOptions } from "../src";
import Vuex, { Store } from "vuex";
import Vue from "vue";

Vue.use(Vuex);

abstract class ParentModule extends VuexModule {
  foo = "init";

  get bigFoo() {
    return this.foo.toUpperCase();
  }

  get decoratedFoo() {
    return `***${this.foo}***`;
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

  @Action
  action5() {
    this.updateFoo(this.foo + "action5");
  }

  @Action
  action6() {
    this.updateFoo(this.foo + "polymorphicCallOf");
    this.action7();
  }

  abstract action7(): void;
}

@Module
class Module1 extends ParentModule {
  private tag = "child1";
  foo: string = "init" + this.tag;

  get doubleFoo() {
    return this.foo + this.foo;
  }

  @Mutation
  setFooToExample() {
    this.foo = "example" + this.tag;
  }

  @Action
  action1() {
    this.setFooToExample();
  }

  @Action
  action2() {
    this.updateFoo("bar" + this.tag);
  }

  @Action
  action3() {
    this.updateFoo(this.doubleFoo);
  }

  @Action
  action4() {
    this.updateFoo(this.bigFoo);
  }

  @Action
  action5() {
    super.action5();
    this.updateFoo(this.foo + this.tag);
  }

  @Action
  action7(): void {
    this.updateFoo(this.foo + "action7" + this.tag);
  }
}

@Module
class Module2 extends ParentModule {
  private tag = "child2";

  constructor(options: RegisterOptions) {
    super(options);
    this.foo = this.foo + this.tag;
  }

  get tripleFoo() {
    return this.foo + this.foo + this.foo;
  }

  @Mutation
  setFooToAnotherExample() {
    this.foo = "example" + this.tag;
  }

  @Action
  action1() {
    this.setFooToAnotherExample();
  }

  @Action
  action2() {
    this.updateFoo("baz" + this.tag);
  }

  @Action
  action3() {
    this.updateFoo(this.tripleFoo);
  }

  @Action
  action4() {
    this.updateFoo(this.decoratedFoo);
  }

  @Action
  action5() {
    super.action5();
    this.updateFoo(this.foo + this.tag);
  }

  @Action
  action7(): void {
    this.updateFoo(this.foo + "action7" + this.tag);
  }
}

describe("actions-inheritance", () => {
  let store: Store<any>;
  let child1: Module1;
  let child2: Module2;

  beforeEach(() => {
    store = new Vuex.Store({});
    child1 = new Module1({ store, name: "child1" });
    child2 = new Module2({ store, name: "child2" });
  });

  test("overriden action has access to mutations", () => {
    child1.action1();
    child2.action1();
    expect(child1.foo).toBe("examplechild1");
    expect(child2.foo).toBe("examplechild2");
  });

  test("overriden action has access to parent mutations", () => {
    child1.action2();
    child2.action2();
    expect(child1.foo).toBe("barchild1");
    expect(child2.foo).toBe("bazchild2");
  });

  test("overriden action has access to getters", () => {
    child1.action3();
    child2.action3();
    expect(child1.foo).toBe("initchild1initchild1");
    expect(child2.foo).toBe("initchild2initchild2initchild2");
  });

  test("overriden action has access to parent getters", () => {
    child1.action4();
    child2.action4();
    expect(child1.foo).toBe("INITCHILD1");
    expect(child2.foo).toBe("***initchild2***");
  });

  test("overriden action has access to parent method implementation", () => {
    child1.action5();
    child2.action5();
    expect(child1.foo).toBe("initchild1action5child1");
    expect(child2.foo).toBe("initchild2action5child2");
  });

  test("parent action access derived action polymorphically", () => {
    child1.action6();
    child2.action6();
    expect(child1.foo).toBe("initchild1polymorphicCallOfaction7child1");
    expect(child2.foo).toBe("initchild2polymorphicCallOfaction7child2");
  });
  test("access action7 directly", () => {
    child1.action7();
    child2.action7();
    expect(child1.foo).toBe("initchild1action7child1");
    expect(child2.foo).toBe("initchild2action7child2");
  });
});
