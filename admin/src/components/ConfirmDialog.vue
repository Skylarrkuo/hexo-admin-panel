<template>
  <div v-if="dialog.show" class="confirm-overlay" @click.self="$emit('cancel')">
    <div class="confirm-box" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <h3 :id="titleId">{{ dialog.title }}</h3>
      <p>{{ dialog.message }}</p>
      <div class="btn-group" style="justify-content:flex-end">
        <button class="btn btn-outline" @click="$emit('cancel')">取消</button>
        <button class="btn btn-danger" @click="$emit('confirm')">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ dialog: { type: Object, required: true } });
defineEmits(['cancel', 'confirm']);
const titleId = 'confirm-dialog-title';
</script>
