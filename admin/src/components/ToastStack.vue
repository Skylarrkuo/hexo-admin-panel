<template>
  <div class="toast-container" aria-live="polite">
    <div v-for="(toast, index) in items" :key="index" :class="'toast toast-' + toast.type">{{ toast.msg }}</div>
  </div>
</template>

<script setup>
defineProps({ items: { type: Array, required: true } });
</script>
