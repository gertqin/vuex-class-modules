import Vue from "vue";
import Vuex, { Store } from "vuex";
import { Action, Module, Mutation, VuexModule } from "../src";

Vue.use(Vuex);

abstract class Parent extends VuexModule {
  canTransform = true;
  text = "parent text";

  get upperCaseText() {
    return this.text.toUpperCase();
  }

  get noSpaceText() {
    return this.snakeText();
  }

  private snakeText() {
    // 'this' has access to state & getters
    return this.canTransform ? this.upperCaseText.replace(/ /g, "_") : "";
  }

  @Mutation
  setText(text: string) {
    this.localSetText(text);
  }

  @Mutation
  clearText() {
    this.text = "";
  }

  protected abstract localSetText(text: string): void;
  protected localLoadText() {
    this.setText("parent: yet another text");
  }
}

@Module
class Module1 extends Parent {
  private tag = "child1";
  canTransform = true;
  text = `${this.tag} text`;

  get upperCaseText() {
    return this.text.toUpperCase();
  }

  protected localSetText(text: string) {
    // 'this' has state
    this.text = `${text} ${this.tag}`;
  }

  @Action
  async loadText() {
    this.localLoadText();
  }

  protected localLoadText() {
    // 'this' has getters & mutations
    if (!this.upperCaseText) {
      this.setText(`${this.tag.toUpperCase()}: yet another text`);
    }
  }
}

@Module
class Module2 extends Parent {
  private tag = "child2";
  canTransform = true;
  text = `${this.tag} text`;

  get upperCaseText() {
    return this.text.toUpperCase();
  }
  get noSpaceText() {
    return this.dashText();
  }

  private dashText() {
    // 'this' has access to state & getters
    return this.canTransform ? this.upperCaseText.replace(/ /g, "--") : "";
  }

  protected localSetText(text: string) {
    // 'this' has state
    this.text = `***${text}*** ${this.tag}`;
  }

  @Action
  async loadText() {
    this.localLoadText();
  }

  protected localLoadText() {
    // 'this' has getters & mutations
    if (!this.upperCaseText) {
      this.setText(`${this.tag}: yet another text`);
    }
  }
}

describe("local-functions", () => {
  let child1: Module1;
  let child2: Module2;
  let store: Store<any>;

  beforeEach(() => {
    store = new Vuex.Store({});
    child1 = new Module1({ store, name: "myModule1" });
    child2 = new Module2({ store, name: "myModule2" });
  });

  test("from getter", () => {
    expect(child1.noSpaceText).toBe("CHILD1_TEXT");
    expect(child2.noSpaceText).toBe("CHILD2--TEXT");
  });

  test("from mutation", () => {
    child1.setText("some other text");
    child2.setText("some other text");
    expect(child1.text).toBe("some other text child1");
    expect(child2.text).toBe("***some other text*** child2");
  });

  test("from action", async () => {
    child1.clearText();
    child2.clearText();

    await child1.loadText();
    await child2.loadText();
    expect(child1.text).toBe("CHILD1: yet another text child1");
    expect(child2.text).toBe("***child2: yet another text*** child2");
  });
});
