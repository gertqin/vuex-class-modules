import { Module, VuexModule } from "../src";
import Vuex from "vuex";
import Vue from "vue";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

class OriginalModule extends VuexModule {
  foo = {
    text: "some text"
  };
  bar = 1;
}

/** Manually apply decorator, to have access to initial class definition */
const MyModule = Module(OriginalModule);
const myModule = new MyModule({ store, name: "myModule" });

test("instance of", () => {
  expect(myModule instanceof OriginalModule).toBe(true);
  expect(myModule instanceof MyModule).toBe(true);
  expect(myModule instanceof VuexModule).toBe(true);
});
