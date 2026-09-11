<template>
  <div v-if="dialog.show" class="confirm-overlay" @click.self="$emit('cancel')">
    <div class="confirm-box" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <h3 :id="titleId">{{ dialog.title }}</h3>
      <p>{{ dialog.message }}</p>
      <ul v-if="dialog.details?.length" class="confirmation-details"><li v-for="item in dialog.details" :key="item.label"><code>{{ item.label }}</code> — {{ item.value }}</li></ul>
      <div class="btn-group" style="justify-content:flex-end">
        <button class="btn btn-outline" @click="$emit('cancel')">{{ tr('取消','Cancel') }}</button>
        <button class="btn btn-danger" @click="$emit('confirm')">{{ tr('确认','Confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '../i18n';
const {tr}=useI18n();
defineProps({ dialog: { type: Object, required: true } });
defineEmits(['cancel', 'confirm']);
const titleId = 'confirm-dialog-title';
</script>

<style scoped>
.confirmation-details { max-height: 35vh; overflow: auto; padding-left: 1.25rem; overflow-wrap: anywhere; }
</style>
