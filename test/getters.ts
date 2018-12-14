import { Module, VuexModule } from "../src";
import Vuex from "vuex";
import Vue from "vue";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

@Module
class MyModule extends VuexModule {
  foo = {
    text: "some text"
  };

  get textTransforms() {
    return {
      original: this.foo.text,
      upperCase: this.foo.text.toUpperCase()
    };
  }
}

const myModule = new MyModule({ store, name: "myModule" });

test("getters", () => {
  expect(myModule.textTransforms).toBe(store.getters["myModule/textTransforms"]);
  expect(myModule.textTransforms.upperCase).toBe("SOME TEXT");
});
