<template>
  <div class="login-wrap">
    <div class="login-box">
      <h2>Hexo Admin Panel</h2>
      <p class="text-sm text-muted">{{ tr('首次使用且未配置密码时，请查看启动 Hexo 的终端获取一次性初始化凭据。','For first-time setup without a configured password, find the one-time credentials in the terminal running Hexo.') }}</p>
      <form @submit.prevent="$emit('submit')">
        <div class="form-group">
          <label for="admin-username">{{ tr('用户名','Username') }}</label>
          <input id="admin-username" v-model="form.username" placeholder="admin" autofocus autocomplete="username">
        </div>
        <div class="form-group">
          <label for="admin-password">{{ tr('密码','Password') }}</label>
          <input id="admin-password" v-model="form.password" type="password" :placeholder="tr('请输入密码','Enter your password')" autocomplete="current-password">
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? tr('登录中...','Signing in...') : tr('登录','Sign in') }}</button>
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
