import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import PostEditorPage from './PostEditorPage.vue';
import PageEditorPage from './PageEditorPage.vue';
import { api } from '../api/client';

afterEach(() => vi.restoreAllMocks());

describe('committed content with a failed Hexo refresh', () => {
  for (const [Component, props] of [[PostEditorPage, { postId: 'post' }], [PageEditorPage, { pageId: 'page' }]]) {
    it(`keeps the new revision and warns without reporting an unsaved file in ${Component.__name}`, async () => {
      vi.spyOn(api, 'get').mockResolvedValue({ _id: 'post', title: 'Title', content: 'Body', revision: 'a'.repeat(64), frontMatter: {} });
      const post = vi.spyOn(api, 'post').mockResolvedValue({ html: '<p>Body</p>' });
      const put = vi.spyOn(api, 'put').mockResolvedValue({ saved: true, refreshed: false, revision: 'b'.repeat(64), warning: { code: 'SOURCE_REFRESH_FAILED' } });
      const wrapper = mount(Component, { props });
      try {
        await flushPromises();
        await wrapper.get('.editor-commandbar .btn-primary').trigger('click');
        await flushPromises();
        expect(wrapper.get('[role="status"]').text()).toMatch(/已保存到文件|saved to disk/);
        expect(wrapper.emitted('notify').at(-1)[1]).toBe('warning');
        expect(wrapper.emitted('saved')).toBeUndefined();
        put.mockResolvedValue({ saved: true, refreshed: true, revision: 'c'.repeat(64) });
        await wrapper.get('.editor-commandbar .btn-primary').trigger('click');
        await flushPromises();
        expect(put.mock.calls.at(-1)[1].revision).toBe('b'.repeat(64));
        expect(wrapper.find('[role="status"]').exists()).toBe(false);
        expect(post.mock.calls.every(([url]) => url !== '/previews')).toBe(true);
      } finally { wrapper.unmount(); }
    });
  }
});
