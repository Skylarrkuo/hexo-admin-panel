import { afterEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import App from '../App.vue';
import AdminHeader from '../layouts/AdminHeader.vue';
import { api } from '../api/client';
import { setLocale } from '../i18n';

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

for (const [event, endpoint] of [['logout', '/auth/logout'], ['logout-all', '/auth/logout-all']]) {
  it(`${event} clears the browser token only after server revocation is confirmed`, async () => {
    vi.useFakeTimers();
    setLocale('zh-CN');
    const previous = api.token;
    api.token = 'test-session';
    localStorage.setItem('hexo_admin_token', 'test-session');
    location.hash = '#/media';
    vi.spyOn(api, 'get').mockResolvedValue({ files: [] });
    const post = vi.spyOn(api, 'post').mockRejectedValueOnce(new Error('network failure')).mockResolvedValue({ revoked: true });
    const wrapper = mount(App);
    try {
      await flushPromises();
      wrapper.getComponent(AdminHeader).vm.$emit(event);
      await flushPromises();
      expect(post).toHaveBeenCalledWith(endpoint);
      expect(api.token).toBe('test-session');
      expect(wrapper.text()).toContain('服务端尚未确认撤销会话');
      wrapper.getComponent(AdminHeader).vm.$emit(event);
      await flushPromises();
      expect(api.token).toBeNull();
      expect(localStorage.getItem('hexo_admin_token')).toBeNull();
      expect(wrapper.findComponent(AdminHeader).exists()).toBe(false);
    } finally {
      wrapper.unmount();
      api.token = previous;
      localStorage.removeItem('hexo_admin_token');
      vi.clearAllTimers();
    }
  });
}
