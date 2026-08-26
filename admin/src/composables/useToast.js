import { ref } from 'vue';

export function useToast(timeout = 3000) {
  const toasts = ref([]);
  function toast(message, type = 'info') {
    toasts.value.push({ msg: message, type });
    setTimeout(() => { toasts.value.shift(); }, timeout);
  }
  return { toasts, toast };
}
