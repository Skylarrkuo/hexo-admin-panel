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
  CONFIG_REVISION_CONFLICT: ['配置已在其他位置被修改，请刷新后重试', 'The configuration changed elsewhere. Refresh and try again'],
  ABOUT_REVISION_CONFLICT: ['About 页面已在其他位置被修改，请刷新后重试', 'The About page changed elsewhere. Refresh and try again'],
  ESSAYS_REVISION_CONFLICT: ['随笔已在其他位置被修改，请刷新后重试', 'Essays changed elsewhere. Refresh and try again'],
  REVISION_REQUIRED: ['缺少版本信息，请刷新后重试', 'Version information is missing. Refresh and try again'],
  UPLOAD_CONTENT_MISMATCH: ['文件内容与扩展名不一致', 'The file content does not match its extension'],
  MEDIA_COMPRESSION_UNSUPPORTED: ['此文件类型不支持压缩', 'This file type cannot be compressed'],
  INVALID_MEDIA_PATH: ['媒体路径无效', 'The media path is invalid'],
  DUPLICATE_POST: ['批量操作中不能包含重复文章', 'A post cannot appear twice in a bulk operation'],
  SCHEDULE_DATE_INVALID: ['定时发布时间无效', 'The scheduled publish time is invalid'],
  POST_ALREADY_PUBLISHED: ['只能为草稿设置定时发布', 'Only drafts can be scheduled'],
  COMMAND_JOB_NOT_FOUND: ['命令任务不存在', 'The command job was not found'],
  COMMAND_FAILED: ['命令执行失败', 'The command failed'],
  COMMAND_INTERRUPTED: ['命令因 Hexo 服务停止而中断', 'The command was interrupted when Hexo stopped'],
  COMMAND_STATE_FAILED: ['无法保存命令任务状态', 'The command job state could not be saved'],
  COMMAND_TIMEOUT: ['命令仍在后台执行，请稍后刷新查看', 'The command is still running. Refresh later to check it'],
  COMMAND_CANCELLED: ['命令已取消', 'The command was cancelled'],
  COMMAND_NOT_CANCELLABLE: ['该命令已经结束，无法取消', 'This command has already finished and cannot be cancelled'],
  COMMAND_NOT_RETRYABLE: ['该命令无法重试', 'This command cannot be retried'],
  PAGE_ID_INVALID: ['页面编号无效', 'The page ID is invalid'],
  PAGE_NOT_FOUND: ['页面不存在', 'The page was not found'],
  PAGE_PATH_INVALID: ['页面路径无效', 'The page path is invalid'],
  PAGE_PATH_CONFLICT: ['页面路径已存在', 'The page path already exists'],
  PAGE_REVISION_CONFLICT: ['页面已在其他位置修改，请刷新后重试', 'This page changed elsewhere. Refresh and try again'],
  MENU_REVISION_CONFLICT: ['主题菜单已在其他位置修改，请刷新后重试', 'The theme menu changed elsewhere. Refresh and try again'],
  TAXONOMY_INVALID: ['分类标签操作无效', 'The taxonomy operation is invalid'],
  TAXONOMY_NOT_FOUND: ['没有文章使用该分类或标签', 'No posts use this taxonomy'],
  PREVIEW_NOT_FOUND: ['主题预览不存在或已经过期', 'The theme preview was not found or has expired'],
  PREVIEW_OUTPUT_NOT_FOUND: ['构建完成，但未找到目标预览页面', 'The build completed but the preview page was not found'],
  SCAFFOLD_NOT_FOUND: ['Hexo 模板不存在', 'The Hexo scaffold was not found'],
  SCHEDULE_NOT_RETRYABLE: ['该定时任务无法重试', 'This schedule cannot be retried'],
  SCHEDULE_NOT_CANCELLABLE: ['该定时任务已经结束，无法取消', 'This schedule has already finished and cannot be cancelled'],
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
