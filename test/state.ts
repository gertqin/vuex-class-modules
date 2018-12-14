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
  bar = 1;
}

const myModule = new MyModule({ store, name: "myModule" });

test("state", () => {
  expect(myModule.foo).toBe(store.state.myModule.foo);
  expect(myModule.foo.text).toBe("some text");

  expect(myModule.bar).toBe(store.state.myModule.bar);
  expect(myModule.bar).toBe(1);
});
