<template>
  <div class="cart">
    <h2>Your Cart</h2>
    <p v-show="!products.length"><i>Please add some products to cart.</i></p>
    <ul>
      <li v-for="product in products" :key="product.id">
        {{ product.title }} - {{ product.price }}€ x {{ product.quantity }}
      </li>
    </ul>
    <p>Total: {{ total }}€</p>
    <p><button :disabled="!products.length" @click="checkout(products);">Checkout</button></p>
    <p v-show="checkoutStatus">Checkout {{ checkoutStatus }}.</p>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { cartModule } from "../store/cart";

@Component
export default class ShoppingCart extends Vue {
  get checkoutStatus() {
    return cartModule.checkoutStatus;
  }
  get products() {
    return cartModule.cartProducts;
  }
  get total() {
    return cartModule.cartTotalPrice;
  }

  checkout() {
    cartModule.checkout();
  }
}
</script>
