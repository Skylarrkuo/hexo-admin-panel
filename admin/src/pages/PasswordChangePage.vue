<template>
  <div class="login-wrap">
    <div class="login-box">
      <h2>设置新管理员密码</h2>
      <p class="text-sm text-muted mb-16">默认账号仅可使用一次。修改成功后才能进入后台。</p>
      <form @submit.prevent="$emit('submit')">
        <div class="form-group">
          <label for="current-password">当前密码</label>
          <input id="current-password" v-model="form.currentPassword" type="password" autocomplete="current-password">
        </div>
        <div class="form-group">
          <label for="new-password">新密码（至少 12 个字符）</label>
          <input id="new-password" v-model="form.newPassword" type="password" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label for="confirm-password">确认新密码</label>
          <input id="confirm-password" v-model="form.confirmPassword" type="password" autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? '保存中...' : '保存并进入后台' }}</button>
      </form>
    </div>
  </div>
</template>

<script setup>
defineProps({ form: { type: Object, required: true }, loading: Boolean });
defineEmits(['submit']);
</script>
