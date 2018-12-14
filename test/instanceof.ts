import { Module, VuexModule } from "../src";
import Vuex from "vuex";
import Vue from "vue";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

@Module()
class MyModule extends VuexModule {
  foo = {
    text: "some text"
  };
  bar = 1;
}

const myModule = new MyModule({ store, name: "myModule" });

test("instance of", () => {
  expect(myModule instanceof MyModule).toBe(true);
  expect(myModule instanceof VuexModule).toBe(true);
});
