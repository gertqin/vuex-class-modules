import store from "./";
import shop, { Product } from "../api/shop";
import { Module, Mutation, Action } from "../../../lib/index";

@Module({ name: "products", store, generateMutationSetters: true })
class Products {
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

export const productsModule = new Products();
