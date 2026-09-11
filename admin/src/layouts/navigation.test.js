import { afterEach, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminHeader from './AdminHeader.vue';
import AdminNavigation from './AdminNavigation.vue';
import { setLocale } from '../i18n';

let wrapper;
afterEach(()=>{wrapper?.unmount();vi.restoreAllMocks();vi.unstubAllGlobals();});
function renderNavigation(route='/posts/edit/demo'){
  setLocale('zh-CN');
  wrapper=mount(AdminNavigation,{attachTo:document.body,props:{route,brandName:'Hexo Admin Panel'}});
}
it('marks the parent destination of an editor and keeps each destination in one group',()=>{
  renderNavigation();
  expect(wrapper.findAll('[aria-current="page"]')).toHaveLength(1);
  expect(wrapper.get('[aria-current="page"]').attributes('href')).toBe('#/posts');
  expect(wrapper.findAll('.nav-group h2').map(item=>item.text())).toEqual(['内容管理','发布与维护','站点设置']);
  const hrefs=wrapper.findAll('a[href^="#/"]').map(item=>item.attributes('href'));
  expect(new Set(hrefs).size).toBe(13);
  expect(hrefs).toHaveLength(13);
});
it('closes the account disclosure with Escape and restores keyboard focus',async()=>{
  renderNavigation('/password');
  wrapper.get('details').element.open=true;
  await wrapper.get('details').trigger('keydown',{key:'Escape'});
  expect(wrapper.get('details').element.open).toBe(false);
  expect(document.activeElement).toBe(wrapper.get('summary').element);
});
it('routes account actions through the existing handlers and closes the menu',async()=>{
  renderNavigation();
  wrapper.get('details').element.open=true;
  await wrapper.get('a[href="#/password"]').trigger('click');
  expect(wrapper.emitted('navigate')).toEqual([['/password']]);
  expect(wrapper.get('details').element.open).toBe(false);
  await wrapper.findAll('.nav-account-menu button')[1].trigger('click');
  expect(wrapper.emitted('logout-all')).toHaveLength(1);
});
it('keeps the mobile drawer open until navigation succeeds and closes on a viewport change',async()=>{
  let resize;
  vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:(_event,handler)=>{resize=handler;},removeEventListener:vi.fn()}));
  wrapper=mount(AdminHeader,{props:{route:'/posts/edit/demo'}});
  const dialog=wrapper.get('dialog').element;
  // jsdom does not implement native modal methods; browser QA covers focus trapping.
  const show=dialog.showModal=vi.fn(function(){this.open=true;});
  dialog.close=vi.fn(function(){this.open=false;this.dispatchEvent(new Event('close'));});
  expect(wrapper.findAll('.mobile-navigation a')).toHaveLength(3);
  await wrapper.get('.mobile-navigation button').trigger('click');
  expect(show).toHaveBeenCalledOnce();
  await wrapper.get('dialog a[href="#/media"]').trigger('click');
  expect(wrapper.emitted('navigate')).toEqual([['/media']]);
  expect(wrapper.get('dialog').element.open).toBe(true);
  await wrapper.setProps({route:'/media'});
  expect(wrapper.get('dialog').element.open).toBe(false);
  resize({matches:false});
  await wrapper.vm.$nextTick();
  expect(wrapper.find('.workspace-sidebar').exists()).toBe(true);
  expect(wrapper.find('dialog').exists()).toBe(false);
});
