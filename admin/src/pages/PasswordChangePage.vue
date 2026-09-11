<template>
  <div class="login-wrap">
    <div class="login-box">
      <h2>{{ tr('设置新管理员密码','Set a new admin password') }}</h2>
      <p class="text-sm text-muted mb-16">{{ tr('初始化凭据仅用于设置正式密码。修改成功后才能进入后台。','Initialization credentials are only for setting your permanent password. Set a new password to continue.') }}</p>
      <form @submit.prevent="$emit('submit')">
        <div class="form-group">
          <label for="current-password">{{ tr('当前密码','Current password') }}</label>
          <input id="current-password" v-model="form.currentPassword" type="password" autocomplete="current-password">
        </div>
        <div class="form-group">
          <label for="new-password">{{ tr('新密码（至少 12 个字符）','New password (at least 12 characters)') }}</label>
          <input id="new-password" v-model="form.newPassword" type="password" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label for="confirm-password">{{ tr('确认新密码','Confirm new password') }}</label>
          <input id="confirm-password" v-model="form.confirmPassword" type="password" autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? tr('保存中...','Saving...') : tr('保存并进入后台','Save and continue') }}</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '../i18n';
const {tr}=useI18n();
defineProps({ form: { type: Object, required: true }, loading: Boolean });
defineEmits(['submit']);
</script>
