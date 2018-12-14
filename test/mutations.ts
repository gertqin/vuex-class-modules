import { Module, Mutation, VuexModule } from "../src";
import Vuex, { MutationPayload } from "vuex";
import Vue from "vue";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

@Module()
class MyModule extends VuexModule {
  shouldUpdate = true;
  text = "";

  @Mutation
  setText(text: string) {
    if (this.shouldUpdate) {
      this.text = text;
    }
  }
}

const myModule = new MyModule({ store, name: "myModule" });

describe("mutations", () => {
  test("accessor calls commit", () => {
    const mutationObserver = jest.fn((mutation: MutationPayload) => mutation);
    store.subscribe(mutationObserver);

    myModule.setText("some text");

    expect(mutationObserver.mock.calls.length).toBe(1);

    const mutationPayload = mutationObserver.mock.results[0].value as MutationPayload;
    expect(mutationPayload.type).toBe("myModule/setText");
    expect(mutationPayload.payload).toBe("some text");
  });

  test("updates store", () => {
    store.commit("myModule/setText", "some other text");
    expect(store.state.myModule.text).toBe("some other text");
  });
});
