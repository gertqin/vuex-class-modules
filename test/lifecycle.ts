import { Module, VuexModule, RegisterOptions } from "../src";
import Vuex from "vuex";
import Vue from "vue";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

@Module({ generateMutationSetters: true })
class MyModule extends VuexModule {
  isCreated = false;

  constructor(foo: string, options: RegisterOptions) {
    super(options);
  }

  created() {
    this.isCreated = true;
  }
}

test("lifecycle", () => {
  const myModule = new MyModule("bar", { store, name: "myModule" });
  expect(myModule.isCreated).toBeTruthy();
});
