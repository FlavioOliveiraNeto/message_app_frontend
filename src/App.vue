<template>
  <div class="container">
    <RouterView />
  </div>
</template>

<script setup>
  import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
  .container {
    display: grid;
    align-items: center;
    height: 100%;
  }
</style>
