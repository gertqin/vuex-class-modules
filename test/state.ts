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
  bar = 1;
}

const myModule = new MyModule();

test("state", () => {
  expect(myModule.foo).toBe(store.state.myModule.foo);
  expect(myModule.foo.text).toBe("some text");

  expect(myModule.bar).toBe(store.state.myModule.bar);
  expect(myModule.bar).toBe(1);
});
