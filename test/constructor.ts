import { Module, VuexModule, RegisterOptions } from "../src";
import Vuex from "vuex";
import Vue from "vue";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

@Module()
class MyModule extends VuexModule {
  foo: string;

  constructor(foo: string, options: RegisterOptions) {
    super(options);
    this.foo = foo;
  }
}

test("constructor", () => {
  const myModule = new MyModule("bar", { store, name: "myModule" });
  expect(myModule.foo).toBe("bar");
});
