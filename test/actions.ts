import { Module, Mutation, Action, VuexModule } from "../src";
import Vuex, { Payload, MutationPayload } from "vuex";
import Vue from "vue";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

@Module()
class MyModule extends VuexModule {
  documentId = 0;
  text = "";

  get documentHasText() {
    return this.documentId > 10;
  }

  @Mutation
  setDocumentId(id: number) {
    this.documentId = id;
  }
  @Mutation
  setText(text: string) {
    this.text = text;
  }

  @Action
  async dummyAction(payload: any) {
    // to test accessor
  }

  @Action
  async loadText(documentId: number) {
    if (this.documentId === 0) {
      this.setDocumentId(documentId);

      if (this.documentHasText) {
        const text = await Promise.resolve("some other text");
        this.setText(text);
      }
    }
  }
}

const myModule = new MyModule({ store, name: "myModule" });

interface ActionPayload extends Payload {
  payload?: any;
}

describe("actions", () => {
  test("accessor dispatches action", async () => {
    // subscribeAction missing from vuex typings
    const actionObserver = jest.fn((action: ActionPayload) => action);
    (store as any).subscribeAction(actionObserver);

    await myModule.dummyAction(5);

    expect(actionObserver.mock.calls.length).toBe(1);

    const mutationPayload = actionObserver.mock.results[0].value as ActionPayload;
    expect(mutationPayload.type).toBe("myModule/dummyAction");
    expect(mutationPayload.payload).toBe(5);
  });

  test("'this' matches vuex context", async () => {
    const mutationObserver = jest.fn((mutation: MutationPayload) => mutation);
    store.subscribe(mutationObserver);

    await store.dispatch("myModule/loadText", 11);

    expect(mutationObserver.mock.calls.length).toBe(2);

    const firstMutation = mutationObserver.mock.results[0].value as MutationPayload;
    expect(firstMutation.type).toBe("myModule/setDocumentId");
    expect(firstMutation.payload).toBe(11);

    const secondMutation = mutationObserver.mock.results[1].value as MutationPayload;
    expect(secondMutation.type).toBe("myModule/setText");
    expect(secondMutation.payload).toBe("some other text");
  });
});
