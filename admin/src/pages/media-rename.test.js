import { afterEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import App from '../App.vue';
import MediaPage from './MediaPage.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { api } from '../api/client';
import { setLocale } from '../i18n';

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

it('shows rename impact before committing and sends the reviewed revision', async () => {
  vi.useFakeTimers();
  setLocale('zh-CN');
  const previousToken = api.token;
  api.token = 'test';
  location.hash = '#/media';
  const file = { name: 'a.png', path: '/images/a.png', used: true, size: 12, referenceCount: 2 };
  vi.spyOn(api, 'get').mockImplementation(async url => url === '/auth/verify' ? {} : { files: [file], total_pages: 1 });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ name: 'b.png', affectedFiles: 1, revision: 'a'.repeat(64), references: [{ source: '_posts/story.md', count: 2 }] });
  const put = vi.spyOn(api, 'put').mockResolvedValue({ affectedFiles: 1 });
  const wrapper = mount(App);
  try {
    await flushPromises();
    wrapper.getComponent(MediaPage).vm.$emit('rename', file, 'b.png');
    await flushPromises();
    expect(post).toHaveBeenCalledWith('/media/a.png/rename-preview', { name: 'b.png' });
    expect(wrapper.get('[role="dialog"]').text()).toContain('_posts/story.md');
    expect(wrapper.get('[role="dialog"]').text()).toContain('b.png');
    expect(put).not.toHaveBeenCalled();
    wrapper.getComponent(ConfirmDialog).vm.$emit('cancel');
    await flushPromises();
    expect(put).not.toHaveBeenCalled();
    wrapper.getComponent(MediaPage).vm.$emit('rename', file, 'b.png');
    await flushPromises();
    wrapper.getComponent(ConfirmDialog).vm.$emit('confirm');
    await flushPromises();
    expect(put).toHaveBeenCalledExactlyOnceWith('/media/a.png/rename', { name: 'b.png', revision: 'a'.repeat(64) });
  } finally {
    wrapper.unmount();
    api.token = previousToken;
    location.hash = '';
    vi.clearAllTimers();
  }
});
