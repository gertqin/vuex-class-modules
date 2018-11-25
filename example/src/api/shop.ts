/**
 * Mocking client-server processing
 */
export interface Product {
  id: number;
  title: string;
  price: number;
  inventory: number;
}

export interface CartItem {
  id: number;
  quantity: number;
}

const products: Product[] = [
  { id: 1, title: "iPad 4 Mini", price: 500.01, inventory: 2 },
  { id: 2, title: "H&M T-Shirt White", price: 10.99, inventory: 10 },
  { id: 3, title: "Charli XCX - Sucker CD", price: 19.99, inventory: 5 }
];

export default {
  async getProducts() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return products;
  },

  async buyProducts(items: CartItem[]) {
    await new Promise(resolve => setTimeout(resolve, 100));

    if (Math.random() > 0.5) {
      throw Error();
    }
  }
};
