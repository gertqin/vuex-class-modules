<template>
  <div id="app">
    <h1>Shopping Cart Example</h1>
    <hr />
    <h2>Products</h2>
    <ProductList />
    <hr />
    <ShoppingCart />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import ProductList from "./ProductList.vue";
import ShoppingCart from "./ShoppingCart.vue";

@Component({
  components: { ProductList, ShoppingCart }
})
export default class App extends Vue {}
</script>
