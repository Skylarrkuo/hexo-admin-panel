import {afterEach,it,expect,vi} from 'vitest';
import {mount,flushPromises} from '@vue/test-utils';
import EssayBatchEditor from '../components/EssayBatchEditor.vue';
import EssaysPage from './EssaysPage.vue';
import {splitEssays} from '../utils/essay-batch';
import {api} from '../api/client';
const revision='a'.repeat(64);
const props={revision,timeZone:'Asia/Shanghai',initialItems:[{id:'one',content:'Original',date:'2026-01-01 12:00:37'}]};
afterEach(()=>{vi.restoreAllMocks();localStorage.clear();});
function button(wrapper,text){return wrapper.findAll('button').find(item=>item.text().includes(text));}
it('splits pasted essays while preserving fenced code and rejecting batches over 100',async()=>{
  expect(splitEssays('First\n---\n```md\n---\n```\n---\n\n---\nLast')).toEqual(['First','```md\n---\n```','Last']);
  const wrapper=mount(EssayBatchEditor,{props:{revision}});await wrapper.get('#essay-import-text').setValue('First\n---\nSecond');await button(wrapper,'拆分并添加').trigger('click');expect(wrapper.findAll('.essay-batch-row')).toHaveLength(2);
  await wrapper.get('#essay-import-text').setValue(Array(100).fill('More').join('\n---\n'));await button(wrapper,'拆分并添加').trigger('click');expect(wrapper.findAll('.essay-batch-row')).toHaveLength(2);expect(wrapper.emitted('notify').at(-1)[1]).toBe('error');wrapper.unmount();
});
it('preserves in-flight edits and reuses saved IDs instead of creating the same essay again',async()=>{
  let finish;const post=vi.spyOn(api,'post').mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  const wrapper=mount(EssayBatchEditor,{props:{revision,timeZone:'Asia/Shanghai'}});await button(wrapper,'添加一条').trigger('click');await wrapper.get('.essay-textarea').setValue('Submitted');await wrapper.get('.essay-batch-save').trigger('click');
  expect(post.mock.calls[0][1].entries[0].createId).toMatch(/^[a-f0-9]{32}$/);await wrapper.get('.essay-textarea').setValue('Typed later');
  finish({revision:'b'.repeat(64),changed:[{id:'created'}],items:[],created:1,updated:0});await flushPromises();expect(wrapper.get('.essay-textarea').element.value).toBe('Typed later');expect(wrapper.emitted('dirty-change').at(-1)).toEqual([true]);
  await wrapper.get('.essay-batch-save').trigger('click');expect(post.mock.calls[1][1].entries[0].id).toBe('created');expect(post.mock.calls[1][1].revision).toBe('b'.repeat(64));
  finish({revision:'c'.repeat(64),changed:[{id:'created'}],items:[],created:0,updated:1});await flushPromises();wrapper.unmount();
});
it('restores batch content, pasted text and original revision after login expiry',async()=>{
  let wrapper=mount(EssayBatchEditor,{props});await wrapper.get('.essay-textarea').setValue('Local');await wrapper.get('#essay-import-text').setValue('Not split yet');window.dispatchEvent(new Event('hexo-auth-expired'));wrapper.unmount();
  const post=vi.spyOn(api,'post').mockRejectedValue(new Error('offline'));
  wrapper=mount(EssayBatchEditor,{props:{...props,revision:'b'.repeat(64)}});await flushPromises();await button(wrapper,'恢复本地草稿').trigger('click');expect(wrapper.get('.essay-textarea').element.value).toBe('Local');expect(wrapper.get('#essay-import-text').element.value).toBe('Not split yet');await wrapper.get('.essay-batch-save').trigger('click');await flushPromises();expect(post.mock.calls[0][1].revision).toBe(revision);expect(post.mock.calls[0][1].entries[0].date).toBe('2026-01-01 12:00:37');wrapper.unmount();
});
it('requires reviewing server differences before retrying a conflicting batch',async()=>{
  const post=vi.spyOn(api,'post').mockRejectedValue({status:409,message:'conflict'});vi.spyOn(api,'get').mockResolvedValue({revision:'b'.repeat(64),items:[{id:'one',content:'Server edit',date:'2026-01-01 12:00:37'}]});
  const wrapper=mount(EssayBatchEditor,{props});await wrapper.get('.essay-textarea').setValue('Local edit');await wrapper.get('.essay-batch-save').trigger('click');await flushPromises();expect(wrapper.find('.text-diff').text()).toContain('Server edit');expect(wrapper.get('.essay-batch-save').attributes('disabled')).toBeDefined();await button(wrapper,'已核对').trigger('click');await wrapper.get('.essay-batch-save').trigger('click');await flushPromises();expect(post.mock.calls[1][1].revision).toBe('b'.repeat(64));expect(post.mock.calls[1][1].entries[0].content).toBe('Local edit');wrapper.unmount();
});
it('opens selected essays in the batch editor without losing timestamp seconds',async()=>{
  vi.spyOn(api,'get').mockImplementation(async url=>url==='/native'?{timeZone:'Asia/Shanghai'}:{items:props.initialItems,revision});
  const wrapper=mount(EssaysPage);await flushPromises();await wrapper.get('.essay-item input[type=checkbox]').setValue(true);await button(wrapper,'批量编辑已选 1 条').trigger('click');expect(wrapper.findAll('.essay-batch-row')).toHaveLength(1);expect(wrapper.get('.essay-batch-row input').element.value.slice(0,19)).toBe('2026-01-01T12:00:37');wrapper.unmount();
});

it('recognizes an already committed new entry after an uncertain response and conflict retry',async()=>{
  const post=vi.spyOn(api,'post').mockRejectedValueOnce(new Error('Connection closed')).mockRejectedValue({status:409,message:'conflict'});
  vi.spyOn(api,'get').mockImplementation(async()=>({revision:'b'.repeat(64),items:[{id:post.mock.calls[0][1].entries[0].createId,content:'Saved remotely',date:'2026-01-01 12:00:00'}]}));
  const wrapper=mount(EssayBatchEditor,{props:{revision}});await button(wrapper,'添加一条').trigger('click');await wrapper.get('.essay-textarea').setValue('Local');await wrapper.get('.essay-batch-save').trigger('click');await flushPromises();await wrapper.get('.essay-batch-save').trigger('click');await flushPromises();
  expect(wrapper.find('.text-diff').text()).toContain('Saved remotely');await button(wrapper,'已核对').trigger('click');await wrapper.get('.essay-batch-save').trigger('click');await flushPromises();expect(post.mock.calls[2][1].entries[0].id).toBe(post.mock.calls[0][1].entries[0].createId);wrapper.unmount();
});
it('keeps pasted text that has not been imported when the current rows are saved',async()=>{
  vi.spyOn(api,'post').mockResolvedValue({revision:'b'.repeat(64),changed:[{id:'one'}],items:props.initialItems,created:0,updated:1});
  const wrapper=mount(EssayBatchEditor,{props});await wrapper.get('#essay-import-text').setValue('Still to add');await wrapper.get('.essay-batch-save').trigger('click');await flushPromises();expect(wrapper.emitted('dirty-change').at(-1)).toEqual([true]);const storage=Object.keys(localStorage).find(key=>key.endsWith('essays_batch'));expect(JSON.parse(localStorage.getItem(storage)).state.importText).toBe('Still to add');wrapper.unmount();
});
