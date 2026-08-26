<template>
  <section>
    <div class="section-heading"><div><h2>最近删除</h2><p>删除的文章和媒体会暂存在这里，永久删除后无法恢复。</p></div><button class="btn btn-outline" @click="$emit('reload')">刷新列表</button></div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="card">
      <div v-if="items.length===0" class="empty">回收站为空</div>
      <div v-else class="table-wrap"><table>
        <thead><tr><th>名称</th><th>类型</th><th>原位置</th><th>删除时间</th><th>操作</th></tr></thead>
        <tbody><tr v-for="item in items" :key="item.id">
          <td>{{ item.name }}</td><td>{{ item.kind==='post'?'文章':'媒体' }}</td><td class="text-sm">{{ item.originalPath }}</td>
          <td class="text-sm">{{ formatDate(item.deletedAt) }}</td>
          <td><div class="btn-group"><button class="btn btn-success btn-sm" @click="$emit('restore',item)">恢复</button><button class="btn btn-danger btn-sm" @click="$emit('remove',item)">永久删除</button></div></td>
        </tr></tbody>
      </table></div>
    </div>
  </section>
</template>

<script setup>
defineProps({ items: Array, loading: Boolean });
defineEmits(['reload','restore','remove']);
function formatDate(value){return value?new Date(value).toLocaleString():'-';}
</script>
