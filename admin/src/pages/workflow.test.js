import {afterEach,describe,it,expect,vi} from 'vitest';
import {mount,flushPromises} from '@vue/test-utils';
import {defineComponent,reactive} from 'vue';
import {useLocalDraft} from '../composables/useLocalDraft';
import PageEditorPage from './PageEditorPage.vue';
import ContentHistory from '../components/ContentHistory.vue';
import ConfigPage from './ConfigPage.vue';
import PagesPage from './PagesPage.vue';
import {api} from '../api/client';

afterEach(()=>{vi.restoreAllMocks();localStorage.clear();});
describe('draft recovery, conflicts and review gates',()=>{
  it('preserves a draft revision over disconnect and restores without accepting the new server revision',async()=>{
    const Harness=defineComponent({setup(){const form=reactive({text:'server',revision:'first'});const draft=useLocalDraft({key:()=> 'test',state:()=>({...form}),apply:value=>Object.assign(form,value),emit:()=>{}});draft.loaded();return {form,draft};},template:'<input v-model="form.text">'});
    let wrapper=mount(Harness);await wrapper.get('input').setValue('local');window.dispatchEvent(new Event('hexo-auth-expired'));wrapper.unmount();
    wrapper=mount(Harness);expect(wrapper.vm.draft.pending.value.state.text).toBe('local');wrapper.vm.form.revision='new-server';wrapper.vm.draft.restore();
    expect(wrapper.vm.form.text).toBe('local');expect(wrapper.vm.form.revision).toBe('first');wrapper.unmount();
  });
  it('does not clear edits typed while a page save is in flight',async()=>{
    vi.spyOn(api,'get').mockImplementation(async url=>url==='/native'?{timeZone:'Asia/Shanghai'}:{title:'Title',content:'Original',raw:'---\ntitle: Title\n---\nOriginal',revision:'a'.repeat(64),frontMatter:{},path:'page/index.md'});
    let finish;vi.spyOn(api,'put').mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
    const wrapper=mount(PageEditorPage,{props:{pageId:'page'}});
    await flushPromises();const input=wrapper.get('.post-meta-card input');await input.setValue('Submitted');await wrapper.get('.editor-commandbar .btn-primary').trigger('click');await input.setValue('Typed later');
    finish({revision:'b'.repeat(64),raw:'Saved version',refreshed:true});await flushPromises();
    expect(input.element.value).toBe('Typed later');expect(wrapper.emitted('dirty-change').at(-1)).toEqual([true]);
    const saved=Object.keys(localStorage).find(key=>key.includes('page_page'));expect(JSON.parse(localStorage.getItem(saved)).state.editor.title).toBe('Typed later');wrapper.unmount();
  });
  it('shows all three versions and requires removing conflict markers before accepting a merge',async()=>{
    vi.spyOn(api,'get').mockResolvedValue({raw:'server',revision:'b'.repeat(64)});
    const wrapper=mount(ContentHistory,{props:{source:'source/post.md',endpoint:'/posts/id'}});
    await wrapper.vm.capture('base','local');await flushPromises();
    expect(wrapper.findAll('.conflict-columns textarea').map(item=>item.element.value)).toEqual(['base','local','server']);
    await wrapper.get('.btn-primary').trigger('click');expect(wrapper.emitted('merge')).toBeUndefined();
    await wrapper.findAll('textarea').at(-1).setValue('merged content');await wrapper.get('.btn-primary').trigger('click');expect(wrapper.emitted('merge')[0][0]).toEqual({raw:'merged content',revision:'b'.repeat(64),base:'server'});wrapper.unmount();
  });
  it('requires a config diff preview and rejects confirmation after subsequent edits',async()=>{
    vi.spyOn(api,'get').mockResolvedValue({parsed:{title:'Original'},raw:'title: Original\n',revision:'a'.repeat(64)});
    const post=vi.spyOn(api,'post').mockResolvedValue({before:'title: Original\n',after:'title: New\n',revision:'a'.repeat(64)});const put=vi.spyOn(api,'put').mockResolvedValue({revision:'b'.repeat(64)});
    const wrapper=mount(ConfigPage);await flushPromises();await wrapper.get('.config-form input').setValue('New');await wrapper.get('.btn-success').trigger('click');await flushPromises();
    expect(post).toHaveBeenCalled();expect(put).not.toHaveBeenCalled();expect(wrapper.find('.text-diff').exists()).toBe(true);
    await wrapper.get('.config-form input').setValue('Newer');await wrapper.findAll('button').find(button=>/确认保存并重启/.test(button.text())).trigger('click');await flushPromises();expect(put).not.toHaveBeenCalled();expect(wrapper.emitted('notify').at(-1)[1]).toBe('warning');wrapper.unmount();
  });
});


it('recovers unfinished theme field JSON after login expiry and still blocks saving it',async()=>{
  vi.spyOn(api,'get').mockImplementation(async url=>url==='/themes'?{themes:[]}:url.includes('type=theme')?{parsed:{items:['original']},raw:'items: [original]\n',revision:'a'.repeat(64),schema:{fields:[{key:'items',path:['items'],type:'array',label:'Items'}]}}:{parsed:{title:'Site'},raw:'title: Site\n',revision:'a'.repeat(64)});
  const post=vi.spyOn(api,'post').mockResolvedValue({});
  let wrapper=mount(ConfigPage);await flushPromises();await wrapper.findAll('.filter-tabs button')[1].trigger('click');await flushPromises();
  await wrapper.get('.config-field textarea').setValue('["unfinished');window.dispatchEvent(new Event('hexo-auth-expired'));wrapper.unmount();
  wrapper=mount(ConfigPage);await flushPromises();await wrapper.findAll('.filter-tabs button')[1].trigger('click');await flushPromises();
  const restore=wrapper.findAll('button').find(button=>/恢复本地草稿/.test(button.text()));expect(restore).toBeTruthy();await restore.trigger('click');await flushPromises();
  expect(wrapper.get('.config-field textarea').element.value).toBe('["unfinished');expect(wrapper.find('.config-error').exists()).toBe(true);
  await wrapper.get('.btn-success').trigger('click');expect(post).not.toHaveBeenCalled();wrapper.unmount();
});

it('recovers page creation and menu order without adopting a new server revision',async()=>{
  vi.spyOn(api,'get').mockResolvedValue({items:[],menu:{items:[{label:'A',path:'/a/'},{label:'B',path:'/b/'}],revision:'first'}});
  let wrapper=mount(PagesPage);await flushPromises();await wrapper.get('.section-heading button').trigger('click');await wrapper.get('.page-create-card input').setValue('Unfinished page');
  await wrapper.findAll('.menu-order-item')[0].findAll('button')[1].trigger('click');wrapper.unmount();
  wrapper=mount(PagesPage);await flushPromises();for(const button of wrapper.findAll('button').filter(button=>/恢复本地草稿/.test(button.text())))await button.trigger('click');
  expect(wrapper.get('.page-create-card input').element.value).toBe('Unfinished page');expect(wrapper.get('.menu-order-item strong').text()).toBe('B');expect(wrapper.emitted('dirty-change').at(-1)).toEqual([true]);wrapper.unmount();
});
