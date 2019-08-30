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

  square = (num: number) => num * num;
}

const myModule = new MyModule({ store, name: "myModule" });

test("state", () => {
  expect(myModule.foo).toBe(store.state.myModule.foo);
  expect(myModule.foo.text).toBe("some text");

  expect(myModule.bar).toBe(store.state.myModule.bar);
  expect(myModule.bar).toBe(1);

  expect(myModule.square).toBe(store.state.myModule.square);
  expect(myModule.square(2)).toBe(4);
});
