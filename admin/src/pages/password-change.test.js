import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import App from '../App.vue';
import AdminHeader from '../layouts/AdminHeader.vue';
import PasswordChangePage from './PasswordChangePage.vue';
import { api } from '../api/client';
import { setLocale } from '../i18n';

let wrapper;
let previousToken;
beforeEach(() => {
  vi.useFakeTimers();
  previousToken = api.token;
  api.token = 'existing-session';
  localStorage.setItem('hexo_admin_token', api.token);
  setLocale('zh-CN');
  location.hash = '#/password';
  vi.spyOn(api, 'get').mockResolvedValue({ mustChangePassword: false });
});
afterEach(() => {
  wrapper?.unmount();
  api.token = previousToken;
  localStorage.clear();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
async function openPage() {
  wrapper = mount(App);
  await flushPromises();
}
async function fill(current = 'current-passphrase', next = 'new-passphrase-2026', confirm = next) {
  await wrapper.get('#current-password').setValue(current);
  await wrapper.get('#new-password').setValue(next);
  await wrapper.get('#confirm-password').setValue(confirm);
}
async function navigate(hash) {
  location.hash = hash;
  window.dispatchEvent(new Event('hashchange'));
  await flushPromises();
}

it('opens password settings from the navigation and clears passwords when leaving', async () => {
  location.hash = '#/media';
  await openPage();
  await wrapper.get('.nav-account summary').trigger('click');
  await wrapper.get('a[href="#/password"]').trigger('click');
  window.dispatchEvent(new Event('hashchange'));
  await flushPromises();
  expect(wrapper.get('h1').text()).toBe('修改密码');
  expect(wrapper.text()).toContain('其他会话需使用新密码重新登录');
  expect(wrapper.find('.login-wrap').exists()).toBe(false);
  await fill();
  await wrapper.getComponent(PasswordChangePage).findAll('button')[1].trigger('click');
  window.dispatchEvent(new Event('hashchange'));
  await flushPromises();
  await navigate('#/password');
  for (const input of wrapper.findAll('input[type="password"]')) expect(input.element.value).toBe('');
});

it.each([
  ['', 'new-passphrase-2026', 'new-passphrase-2026', '请输入当前密码'],
  ['old-password', 'short', 'short', '新密码需要 12–256 个字符'],
  ['old-password', 'x'.repeat(257), 'x'.repeat(257), '新密码需要 12–256 个字符'],
  ['old-password', 'new-passphrase-2026', 'another-passphrase', '两次输入的新密码不一致'],
  ['same-passphrase', 'same-passphrase', 'same-passphrase', '新密码不能与当前密码相同']
])('validates password input before submitting (%s)', async (current, next, confirm, message) => {
  const post = vi.spyOn(api, 'post');
  await openPage();
  await fill(current, next, confirm);
  await wrapper.get('form').trigger('submit');
  expect(post).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain(message);
});

it('shows current-password errors, prevents duplicate submissions, and keeps the new session', async () => {
  let resolve;
  const post = vi.spyOn(api, 'post')
    .mockRejectedValueOnce(Object.assign(new Error('invalid'), { code: 'CURRENT_PASSWORD_INVALID' }))
    .mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await openPage();
  await fill();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(wrapper.text()).toContain('当前密码不正确');
  expect(api.token).toBe('existing-session');
  await wrapper.get('form').trigger('submit');
  await wrapper.get('form').trigger('submit');
  expect(post).toHaveBeenCalledTimes(2);
  expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true);
  resolve({ token: 'updated-session', mustChangePassword: false });
  await flushPromises();
  expect(post).toHaveBeenLastCalledWith('/auth/change-password', { currentPassword: 'current-passphrase', newPassword: 'new-passphrase-2026' });
  expect(api.token).toBe('updated-session');
  expect(localStorage.getItem('hexo_admin_token')).toBe('updated-session');
  expect(wrapper.findComponent(AdminHeader).exists()).toBe(true);
  expect(wrapper.text()).toContain('密码已更新，其他会话需重新登录');
  for (const input of wrapper.findAll('input[type="password"]')) expect(input.element.value).toBe('');
});

it('preserves mandatory initialization and enters the admin after saving', async () => {
  location.hash = '#/media';
  api.get.mockResolvedValue({ mustChangePassword: true });
  vi.spyOn(api, 'post').mockResolvedValue({ token: 'initialized-session', mustChangePassword: false });
  await openPage();
  expect(wrapper.text()).toContain('设置新管理员密码');
  expect(wrapper.findComponent(AdminHeader).exists()).toBe(false);
  expect(wrapper.getComponent(PasswordChangePage).findAll('button')).toHaveLength(1);
  await fill();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(wrapper.findComponent(AdminHeader).exists()).toBe(true);
  expect(api.token).toBe('initialized-session');
});

it('clears password fields when the session expires', async () => {
  await openPage();
  await fill();
  window.dispatchEvent(new Event('hexo-auth-expired'));
  await flushPromises();
  expect(wrapper.findComponent(PasswordChangePage).exists()).toBe(false);
  expect(wrapper.get('#admin-password').element.value).toBe('');
});

it('localizes the account page in English', async () => {
  setLocale('en');
  await openPage();
  expect(wrapper.get('h1').text()).toBe('Change password');
  expect(wrapper.get('button[type="submit"]').text()).toBe('Save new password');
});
