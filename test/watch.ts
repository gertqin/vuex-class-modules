import { Module, Mutation, Action, VuexModule } from "../src";
import Vuex from "vuex";
import Vue from "vue";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

@Module
class MyModule extends VuexModule {
  text = "";

  get getText() {
    return this.text;
  }

  @Mutation
  setText(text: string) {
    this.text = text;
  }

  @Action
  async changeText(text: string) {
    this.setText(text);
  }
}

const myModule = new MyModule({ store, name: "myModule" });

describe("watch", () => {
  test("watch callback is called", async () => {
    const watchCallback = jest.fn((newValue: string, oldValue: string) => undefined);

    myModule.setText("bar")
    myModule.$watch(theModule => theModule.getText, watchCallback);
    await myModule.changeText("foo");

    expect(watchCallback.mock.calls.length).toBe(1);
    expect(watchCallback.mock.calls[0].length).toBe(2);
    expect(watchCallback.mock.calls[0][0]).toBe("foo");
    expect(watchCallback.mock.calls[0][1]).toBe("bar");
  });

  test("watch for state changes as well", async () => {
    const watchCallback = jest.fn((newValue: string, oldValue: string) => undefined);

    myModule.setText("bar")
    myModule.$watch(theModule => theModule.text, watchCallback);
    await myModule.changeText("foo");

    expect(watchCallback.mock.calls.length).toBe(1);
    expect(watchCallback.mock.calls[0].length).toBe(2);
    expect(watchCallback.mock.calls[0][0]).toBe("foo");
    expect(watchCallback.mock.calls[0][1]).toBe("bar");
  });
});
