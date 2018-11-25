import Vue from "vue";
import Vuex, { MutationPayload } from "vuex";
import { Action, Module } from "../src";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

@Module({ name: "myModule", store, generateMutationSetters: true })
class MyModule {
  id = 0;
  text = "";

  @Action
  async loadData() {
    const { id, text } = await Promise.resolve({ id: 1, text: "some text" });
    this.id = id;
    this.text = text;
  }
}

const myModule = new MyModule();

test("generate-mutations", async () => {
  const mutationObserver = jest.fn((mutation: MutationPayload) => mutation);
  store.subscribe(mutationObserver);

  await myModule.loadData();

  const firstMutation = mutationObserver.mock.results[0].value as MutationPayload;
  expect(firstMutation.type).toBe("myModule/set__id");
  expect(firstMutation.payload).toBe(1);

  const secondMutation = mutationObserver.mock.results[1].value as MutationPayload;
  expect(secondMutation.type).toBe("myModule/set__text");
  expect(secondMutation.payload).toBe("some text");
});
