import { computed, ref } from 'vue';

const STORAGE_KEY = 'hexo_admin_locale';
const initialLocale = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh-CN';

export const locale = ref(initialLocale);

function interpolate(message, values = {}) {
  return String(message).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

export function tr(zh, en, values) {
  return interpolate(locale.value === 'en' ? en : zh, values);
}

export function localize(value, fallback = '') {
  if (!value || typeof value !== 'object') return value || fallback;
  return value[locale.value] || value[locale.value === 'en' ? 'en' : 'zh-CN'] || value.zh || value.en || fallback;
}

export function setLocale(next) {
  locale.value = next === 'en' ? 'en' : 'zh-CN';
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, locale.value);
  if (typeof document !== 'undefined') document.documentElement.lang = locale.value;
}

const ERROR_MESSAGES = {
  UNKNOWN_ERROR: ['操作失败', 'The operation failed'],
  UPLOAD_FAILED: ['上传失败', 'Upload failed'],
  VALIDATION_ERROR: ['提交的数据不符合要求', 'The submitted data is invalid'],
  INVALID_JSON: ['JSON 格式无效', 'Invalid JSON format'],
  INVALID_URL: ['URL 格式无效', 'Invalid URL'],
  UNAUTHORIZED: ['登录状态已失效，请重新登录', 'Your session has expired. Please sign in again'],
  PASSWORD_CHANGE_REQUIRED: ['请先设置新的管理员密码', 'Set a new administrator password first'],
  POST_REVISION_CONFLICT: ['文章已在其他位置被修改，请刷新后重试', 'This post changed elsewhere. Refresh and try again'],
  ESSAYS_REVISION_CONFLICT: ['随笔已在其他位置被修改，请刷新后重试', 'Essays changed elsewhere. Refresh and try again'],
  REVISION_REQUIRED: ['缺少版本信息，请刷新后重试', 'Version information is missing. Refresh and try again'],
  UPLOAD_CONTENT_MISMATCH: ['文件内容与扩展名不一致', 'The file content does not match its extension'],
  INTERNAL_ERROR: ['服务器处理失败，请稍后重试', 'The server could not complete the request. Try again later']
};

export function errorMessage(error, fallback) {
  const translated = ERROR_MESSAGES[error?.code];
  if (translated) return locale.value === 'en' ? translated[1] : translated[0];
  return error?.message || fallback || tr('操作失败', 'The operation failed');
}

export function useI18n() {
  return {
    locale,
    isEnglish: computed(() => locale.value === 'en'),
    tr,
    localize,
    setLocale,
    toggleLocale: () => setLocale(locale.value === 'en' ? 'zh-CN' : 'en'),
    errorMessage
  };
}

setLocale(initialLocale);
