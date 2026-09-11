import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue';

export function useLocalDraft({key,state,apply,emit}) {
  const baseline=ref(null),pending=ref(null),status=ref('');let suspended=false;
  const storageKey=()=> 'hexo_admin_draft_'+location.origin+location.pathname+'_'+key();
  const signature=()=>JSON.stringify(state());
  const dirty=computed(()=>baseline.value!==null&&signature()!==baseline.value);
  function persist(){if(suspended||baseline.value===null)return;try{if(dirty.value){localStorage.setItem(storageKey(),JSON.stringify({savedAt:new Date().toISOString(),state:state()}));status.value='saved';}else if(!pending.value){localStorage.removeItem(storageKey());status.value='';}}catch(_){status.value='failed';}emit('dirty-change',dirty.value);}
  function loaded(){suspended=true;baseline.value=signature();try{pending.value=JSON.parse(localStorage.getItem(storageKey())||'null');}catch(_){pending.value=null;}suspended=false;emit('dirty-change',false);}
  function restore(){if(!pending.value)return;apply(pending.value.state);pending.value=null;persist();}
  function discard(){pending.value=null;try{localStorage.removeItem(storageKey());}catch(_){}status.value='';}
  function snapshot(){return JSON.parse(signature());}
  function saved(value){baseline.value=value===undefined?signature():JSON.stringify(value);pending.value=null;persist();}
  function pause(){persist();baseline.value=null;pending.value=null;}
  function leave(){persist();return !dirty.value||window.confirm('有尚未保存的修改，确定离开吗？本地自动保存会保留。');}
  function beforeUnload(event){persist();if(dirty.value){event.preventDefault();event.returnValue='';}}
  watch(state,persist,{deep:true,flush:'sync'});
  onMounted(()=>{window.addEventListener('beforeunload',beforeUnload);window.addEventListener('pagehide',persist);window.addEventListener('hexo-auth-expired',persist);});
  onBeforeUnmount(()=>{persist();window.removeEventListener('beforeunload',beforeUnload);window.removeEventListener('pagehide',persist);window.removeEventListener('hexo-auth-expired',persist);});
  return {pending,status,dirty,loaded,restore,discard,saved,snapshot,pause,leave,persist};
}
