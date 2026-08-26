<template>
  <div class="login-wrap">
    <div class="login-box">
      <h2>Hexo 后台管理</h2>
      <form @submit.prevent="$emit('submit')">
        <div class="form-group">
          <label for="admin-username">用户名</label>
          <input id="admin-username" v-model="form.username" placeholder="admin" autofocus autocomplete="username">
        </div>
        <div class="form-group">
          <label for="admin-password">密码</label>
          <input id="admin-password" v-model="form.password" type="password" placeholder="请输入密码" autocomplete="current-password">
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
      </form>
    </div>
  </div>
</template>

<script setup>
defineProps({ form: { type: Object, required: true }, loading: Boolean });
defineEmits(['submit']);
</script>
