<template>
  <div :class="initialization ? 'login-wrap' : 'password-settings'">
    <div :class="initialization ? 'login-box' : 'card'">
      <h2 v-if="initialization">{{ tr('设置新管理员密码','Set a new admin password') }}</h2>
      <p id="password-help" class="text-sm text-muted mb-16">{{ initialization ? tr('初始化凭据仅用于设置正式密码。修改成功后才能进入后台。','Initialization credentials are only for setting your permanent password. Set a new password to continue.') : tr('修改密码需要验证当前密码。保存后当前会话保持登录，其他会话需使用新密码重新登录。','Enter your current password to make a change. This session stays signed in; other sessions must sign in again with the new password.') }}</p>
      <form @submit.prevent="$emit('submit')">
        <div class="form-group">
          <label for="current-password">{{ tr('当前密码','Current password') }}</label>
          <input id="current-password" v-model="form.currentPassword" type="password" autocomplete="current-password" required maxlength="256" :disabled="loading">
        </div>
        <div class="form-group">
          <label for="new-password">{{ tr('新密码（至少 12 个字符）','New password (at least 12 characters)') }}</label>
          <input id="new-password" v-model="form.newPassword" type="password" autocomplete="new-password" required minlength="12" maxlength="256" aria-describedby="password-help" :disabled="loading">
        </div>
        <div class="form-group">
          <label for="confirm-password">{{ tr('确认新密码','Confirm new password') }}</label>
          <input id="confirm-password" v-model="form.confirmPassword" type="password" autocomplete="new-password" required minlength="12" maxlength="256" :disabled="loading">
        </div>
        <div class="password-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? tr('保存中...','Saving...') : initialization ? tr('保存并进入后台','Save and continue') : tr('保存新密码','Save new password') }}</button>
          <button v-if="!initialization" type="button" class="btn btn-secondary" :disabled="loading" @click="$emit('cancel')">{{ tr('取消','Cancel') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '../i18n';
const {tr}=useI18n();
defineProps({ form: { type: Object, required: true }, loading: Boolean, initialization: { type: Boolean, default: true } });
defineEmits(['submit', 'cancel']);
</script>

<style scoped>
.password-settings { max-width: 560px; }
.password-actions { display: flex; flex-wrap: wrap; gap: 12px; }
</style>
