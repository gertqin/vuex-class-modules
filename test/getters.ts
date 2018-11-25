import { Module } from "../src";
import Vuex from "vuex";
import Vue from "vue";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

@Module({ name: "myModule", store })
class MyModule {
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

const myModule = new MyModule();

test("getters", () => {
  expect(myModule.textTransforms).toBe(store.getters["myModule/textTransforms"]);
  expect(myModule.textTransforms.upperCase).toBe("SOME TEXT");
});
