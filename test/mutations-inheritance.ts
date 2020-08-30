import { Module, Mutation, VuexModule } from "../src";
import Vuex, { Store } from "vuex";
import Vue from "vue";

Vue.use(Vuex);

class ParentModule extends VuexModule {
  foo = "init";

  @Mutation
  mutation1(value: string) {
    //
  }

  @Mutation
  mutation2(value: string) {
    //
  }

  @Mutation
  mutation3(value: string) {
    this.foo = value;
  }
}

@Module
class Module1 extends ParentModule {
  private tag = "child1";
  baz = "init" + this.tag;

  @Mutation
  mutation1(value: string) {
    this.baz = value + this.tag;
  }

  @Mutation
  mutation2(value: string) {
    this.foo = value + this.tag;
  }

  @Mutation
  mutation3(value: string) {
    super.mutation3(value);
    this.foo = this.foo + this.tag;
  }
}

@Module
class Module2 extends ParentModule {
  private tag = "child2";
  bar = "init" + this.tag;
  baz = "init" + this.tag;

  @Mutation
  mutation1(value: string) {
    this.bar = value + this.tag;
  }

  @Mutation
  mutation2(value: string) {
    this.baz = value + this.tag;
  }

  @Mutation
  mutation3(value: string) {
    super.mutation3(value);
    this.foo = this.foo + this.tag;
  }
}

describe("mutations-inheritance", () => {
  let store: Store<any>;
  let parent: ParentModule;
  let child1: Module1;
  let child2: Module2;

  beforeEach(() => {
    store = new Vuex.Store({});
    parent = new ParentModule({ store, name: "parentModule" });
    child1 = new Module1({ store, name: "myModule1" });
    child2 = new Module2({ store, name: "myModule2" });
  });

  test("overriden mutation can modify state", () => {
    parent.mutation1("_");
    child1.mutation1("bar1");
    child2.mutation1("bar2");
    expect(parent.foo).toBe("init");
    expect(child1.baz).toBe("bar1child1");
    expect(child2.bar).toBe("bar2child2");
    expect(child2.baz).toBe("initchild2");
  });

  test("overriden mutation can modify parent state", () => {
    parent.mutation2("_");
    child1.mutation2("bar");
    child2.mutation2("baz");
    expect(parent.foo).toBe("init");
    expect(child1.foo).toBe("barchild1");
    expect(child2.bar).toBe("initchild2");
    expect(child2.baz).toBe("bazchild2");
  });

  test("overriden mutation has access to parent method implementation", () => {
    parent.mutation3("foo_");
    child1.mutation3("foo1");
    child2.mutation3("foo2");
    expect(parent.foo).toBe("foo_");
    expect(child1.foo).toBe("foo1child1");
    expect(child1.baz).toBe("initchild1");
    expect(child2.foo).toBe("foo2child2");
    expect(child2.bar).toBe("initchild2");
    expect(child2.baz).toBe("initchild2");
  });
});
