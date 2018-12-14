import Vue from "vue";
import Vuex from "vuex";
import { Action, Module, Mutation, VuexModule } from "../src";

Vue.use(Vuex);
const store = new Vuex.Store<any>({});

@Module()
class MyModule extends VuexModule {
  canTransform = true;
  text = "some text";

  get upperCaseText() {
    return this.text.toUpperCase();
  }
  get pascalText() {
    return this.transformText();
  }
  private transformText() {
    // 'this' has access to state & getters
    return this.canTransform ? this.upperCaseText.replace(/ /g, "_") : "";
  }

  @Mutation
  setText(text: string) {
    this.localSetText(text);
  }
  private localSetText(text: string) {
    // 'this' has state
    this.text = text;
  }

  @Action
  async loadText() {
    this.localLoadText();
  }
  private localLoadText() {
    // 'this' has getters & mutations
    if (!this.upperCaseText) {
      this.setText("yet another text");
    }
  }
}

const myModule = new MyModule({ store, name: "myModule" });

describe("local-functions", () => {
  test("from getter", () => {
    expect(myModule.pascalText).toBe("SOME_TEXT");
  });

  test("from mutation", () => {
    myModule.setText("some other text");
    expect(myModule.text).toBe("some other text");
  });

  test("from action", async () => {
    myModule.setText("");

    await myModule.loadText();
    expect(myModule.text).toBe("yet another text");
  });
});
