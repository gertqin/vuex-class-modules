import store from "./";
import shop, { Product } from "../api/shop";
import { Module, Mutation, Action, VuexModule } from "../../../lib/index";

@Module({ generateMutationSetters: true })
class Products extends VuexModule {
  all: Product[] = [];

  @Mutation
  decrementProductInventory(id: number) {
    const product = this.all.find(p => p.id === id);
    product!.inventory--;
  }

  @Action
  async getAllProducts() {
    this.all = await shop.getProducts();
  }
}

export const productsModule = new Products({ store, name: "products" });
