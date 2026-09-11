import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import App from '../App.vue';
import EssaysPage from './EssaysPage.vue';
import RecoveryPage from './RecoveryPage.vue';
import PostsPage from './PostsPage.vue';
import LoginPage from './LoginPage.vue';
import PasswordChangePage from './PasswordChangePage.vue';
import { api } from '../api/client';
import { setLocale } from '../i18n';

const wrappers=[];
const render=(component,options)=>{const wrapper=mount(component,options);wrappers.push(wrapper);return wrapper;};
const button=(wrapper,label)=>wrapper.findAll('button').find(item=>item.text()===label);
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const essays=[{id:'first',date:'2026-09-11 10:00:00',content:'First entry'},{id:'second',date:'2026-09-10 09:00:00',content:'Second entry'}];
let previousToken;
beforeEach(()=>{previousToken=api.token;localStorage.clear();setLocale('zh-CN');location.hash='#/media';});
afterEach(()=>{wrappers.splice(0).forEach(wrapper=>wrapper.unmount());api.token=previousToken;localStorage.clear();vi.restoreAllMocks();});

for(const outcome of ['valid','expired','password-change']){
  it(`does not mount login or protected pages while session verification is pending (${outcome})`,async()=>{
    api.token='saved-session';
    const pending=deferred();
    const get=vi.spyOn(api,'get').mockImplementation(url=>url==='/auth/verify'?pending.promise:Promise.resolve({files:[],total_pages:1}));
    const wrapper=render(App);
    expect(wrapper.find('.auth-pending').exists()).toBe(true);
    expect(wrapper.findComponent(LoginPage).exists()).toBe(false);
    expect(wrapper.find('.app').exists()).toBe(false);
    expect(get.mock.calls.map(([url])=>url)).toEqual(['/auth/verify']);
    if(outcome==='expired')pending.reject(new Error('Unauthorized'));
    else pending.resolve({mustChangePassword:outcome==='password-change'});
    await flushPromises();
    expect(wrapper.find('.auth-pending').exists()).toBe(false);
    expect(wrapper.findComponent(LoginPage).exists()).toBe(outcome==='expired');
    expect(wrapper.findComponent(PasswordChangePage).exists()).toBe(outcome==='password-change');
    expect(wrapper.find('.app').exists()).toBe(outcome==='valid');
  });
}

it('shows login immediately when no saved session exists',()=>{
  api.token=null;
  const get=vi.spyOn(api,'get');
  const wrapper=render(App);
  expect(wrapper.findComponent(LoginPage).exists()).toBe(true);
  expect(wrapper.find('.auth-pending').exists()).toBe(false);
  expect(get).not.toHaveBeenCalled();
});

it('edits and saves the selected essay in place without a list reload or scrolling to the top',async()=>{
  const get=vi.spyOn(api,'get').mockImplementation(async url=>url==='/native'?{timeZone:'Asia/Shanghai'}:{items:essays,revision:'rev-1'});
  const put=vi.spyOn(api,'put').mockResolvedValue({item:{...essays[1],content:'Edited second entry'},revision:'rev-2'});
  const scroll=vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  const wrapper=render(EssaysPage);
  await flushPromises();
  await button(wrapper.findAll('article')[1],'编辑').trigger('click');
  expect(wrapper.findAll('article')[0].find('textarea').exists()).toBe(false);
  expect(wrapper.findAll('article')[1].get('textarea').element.value).toBe('Second entry');
  expect(wrapper.find('.essay-create-card').exists()).toBe(false);
  expect(scroll).not.toHaveBeenCalled();
  await wrapper.get('textarea').setValue('Edited second entry');
  await wrapper.get('form.essay-editor').trigger('submit');
  await flushPromises();
  expect(put).toHaveBeenCalledWith('/essays/second',{date:essays[1].date,content:'Edited second entry',revision:'rev-1'});
  expect(wrapper.find('textarea').exists()).toBe(false);
  expect(wrapper.findAll('article')[1].text()).toContain('Edited second entry');
  expect(get.mock.calls.filter(([url])=>url==='/essays')).toHaveLength(1);
});

it('keeps newer edits while a save is pending and prevents cancelling that save',async()=>{
  vi.spyOn(api,'get').mockImplementation(async url=>url==='/native'?{timeZone:'UTC'}:{items:essays,revision:'rev-1'});
  const pending=deferred();
  vi.spyOn(api,'put').mockReturnValue(pending.promise);
  const wrapper=render(EssaysPage);
  await flushPromises();
  await button(wrapper.findAll('article')[1],'编辑').trigger('click');
  await wrapper.get('textarea').setValue('Submitted');
  await wrapper.get('form.essay-editor').trigger('submit');
  expect(button(wrapper,'取消').element.disabled).toBe(true);
  await wrapper.get('textarea').setValue('Newer local edits');
  pending.resolve({item:{...essays[1],content:'Submitted'},revision:'rev-2'});
  await flushPromises();
  expect(wrapper.findAll('article')[1].get('textarea').element.value).toBe('Newer local edits');
  expect(wrapper.emitted('dirty-change').at(-1)).toEqual([true]);
});

it('preserves unsaved edits when switching is declined and supports indeterminate selection',async()=>{
  vi.spyOn(api,'get').mockImplementation(async url=>url==='/native'?{timeZone:'UTC'}:{items:essays,revision:'rev-1'});
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
  const wrapper=render(EssaysPage);
  await flushPromises();
  await wrapper.findAll('article')[1].get('input[type="checkbox"]').setValue(true);
  expect(wrapper.get('.essay-selection-bar input').element.indeterminate).toBe(true);
  await button(wrapper.findAll('article')[1],'编辑').trigger('click');
  await wrapper.get('textarea').setValue('Unsaved');
  await button(wrapper.findAll('article')[0],'编辑').trigger('click');
  expect(confirm).toHaveBeenCalledOnce();
  expect(wrapper.findAll('article')[1].get('textarea').element.value).toBe('Unsaved');
});

it('expands the correct backup inline and submits its reviewed revision only once',async()=>{
  const items=[{id:'backup',source:'source/_data/essays.yml',group:'essays',createdAt:'2026-09-11T00:00:00Z',policy:'Keep 20'}];
  vi.spyOn(api,'get').mockImplementation(async url=>url==='/recovery'?{items,totalBytes:1024,note:'History'}:{...items[0],encoding:'utf8',current:'Current',content:'Backup',currentRevision:'reviewed-revision'});
  const pending=deferred();const post=vi.spyOn(api,'post').mockReturnValue(pending.promise);
  const wrapper=render(RecoveryPage);await flushPromises();
  await button(wrapper,'预览恢复差异').trigger('click');await flushPromises();
  expect(wrapper.get('tbody tr:nth-child(2) .recovery-preview').text()).toContain('Backup');
  await button(wrapper,'确认恢复此文件').trigger('click');
  expect(button(wrapper,'恢复中…').element.disabled).toBe(true);
  expect(post).toHaveBeenCalledExactlyOnceWith('/recovery/backup/restore',{revision:'reviewed-revision'});
  pending.resolve({refreshed:true});await flushPromises();
  expect(wrapper.find('.recovery-preview').exists()).toBe(false);
});

it('keeps post actions in a dismissible menu and schedules the selected post below its row',async()=>{
  vi.spyOn(api,'get').mockResolvedValue({timeZone:'Asia/Shanghai'});
  const posts=[{_id:'post',title:'A readable post title',date:'2026-09-11T00:00:00Z',wordCount:2048,categories:['Notes'],tags:['Hexo'],published:false,workflowStatus:'draft'}];
  const wrapper=render(PostsPage,{props:{posts,loading:false,search:'',status:'all',page:1,total:1,totalPages:1,pageRange:[1]}});
  await flushPromises();
  const menu=wrapper.get('.post-more-actions');
  expect(menu.element.open).toBe(false);
  expect(wrapper.get('.post-actions').findAll(':scope > button')).toHaveLength(1);
  menu.element.open=true;await menu.trigger('toggle');
  await button(wrapper,'定时').trigger('click');
  expect(menu.element.open).toBe(false);
  expect(wrapper.get('.post-schedule-row #schedule-post').exists()).toBe(true);
  await wrapper.get('#schedule-post').setValue('2026-09-20T10:00');
  await button(wrapper,'确认').trigger('click');
  expect(wrapper.emitted('schedule')[0]).toEqual([posts[0],'2026-09-20T02:00:00.000Z']);
  expect(wrapper.find('.post-schedule-row').exists()).toBe(false);
  menu.element.open=true;await menu.trigger('toggle');
  await menu.trigger('keydown',{key:'Escape'});
  expect(menu.element.open).toBe(false);
  menu.element.open=true;await menu.trigger('toggle');
  document.body.click();await wrapper.vm.$nextTick();
  expect(menu.element.open).toBe(false);
});
