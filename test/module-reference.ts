import { Module, VuexModule, RegisterOptions } from "../src";
import Vuex from "vuex";
import Vue from "vue";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

@Module()
class MyModule extends VuexModule {
  foo = "bar";
}

@Module()
class OtherModule extends VuexModule {
  private myModule: MyModule;

  get moduleRef() {
    return this.myModule;
  }

  constructor(myModule: MyModule, options: RegisterOptions) {
    super(options);
    this.myModule = myModule;
  }
}

test("module references", () => {
  const myModule = new MyModule({ store, name: "myModule" });
  const otherModule = new OtherModule(myModule, { store, name: "otherModule" });
  expect(store.state.otherModule.myModule).toBeUndefined();
  expect(otherModule.moduleRef).toBe(myModule);
});
