<template>
  <ul>
    <li v-for="product in products" :key="product.id">
      {{ product.title }} - {{ product.price }}€<br />
      <button :disabled="!product.inventory" @click="addProductToCart(product);">Add to cart</button>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { productsModule } from "../store/products";
import { cartModule } from "../store/cart";
import { Product } from "../api/shop";

@Component
export default class ProductList extends Vue {
  get products() {
    return productsModule.all;
  }

  created() {
    productsModule.getAllProducts();
  }

  addProductToCart(product: Product) {
    cartModule.addProductToCart(product);
  }
}
</script>
