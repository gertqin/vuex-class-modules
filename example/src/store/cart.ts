import store from "./";
import shop, { CartItem, Product } from "../api/shop";
import { Module, Mutation, Action, VuexModule } from "../../../lib/index";
import { productsModule } from "./products";

@Module({ generateMutationSetters: true })
class Cart extends VuexModule {
  items: CartItem[] = [];
  checkoutStatus = "";

  get cartProducts() {
    return this.items.map(({ id, quantity }) => {
      const product = productsModule.all.find(p => p.id === id);
      return {
        title: product!.title,
        price: product!.price,
        quantity
      };
    });
  }

  get cartTotalPrice() {
    return this.cartProducts.reduce((total, product) => {
      return total + product.price * product.quantity;
    }, 0);
  }

  @Mutation
  pushProductToCart(id: number) {
    this.items.push({
      id,
      quantity: 1
    });
  }

  @Mutation
  incrementItemQuantity(id: number) {
    const cartItem = this.items.find(item => item.id === id);
    cartItem!.quantity++;
  }

  @Action
  async addProductToCart(product: Product) {
    this.checkoutStatus = "";

    if (product.inventory > 0) {
      const cartItem = this.items.find(item => item.id === product.id);
      if (!cartItem) {
        this.pushProductToCart(product.id);
      } else {
        this.incrementItemQuantity(cartItem.id);
      }
      // remove 1 item from stock
      productsModule.decrementProductInventory(product.id);
    }
  }

  @Action
  async checkout() {
    const savedCartItems = [...this.items];
    this.checkoutStatus = "";

    // empty cart
    this.items = [];

    try {
      await shop.buyProducts(savedCartItems);
      this.checkoutStatus = "successful";
    } catch (e) {
      this.items = savedCartItems;
      this.checkoutStatus = "failed";
    }
  }
}

export const cartModule = new Cart({ store, name: "cart" });
