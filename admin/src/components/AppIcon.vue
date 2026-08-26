<template>
  <svg class="app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name==='dashboard'"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></template>
    <template v-else-if="name==='posts'"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></template>
    <template v-else-if="name==='essays'"><path d="M5 19c4.5.2 8.2-2.1 10.7-6.3L20 5l-7.7 4.3C8.1 11.8 5.8 15.5 6 20"/><path d="m9 16 5-5M5 20h10"/></template>
    <template v-else-if="name==='about'"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6"/><path d="M4 4h3M17 4h3"/></template>
    <template v-else-if="name==='media'"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 4"/></template>
    <template v-else-if="name==='trash'"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></template>
    <template v-else-if="name==='config'"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/></template>
    <template v-else-if="name==='themes'"><path d="M12 3a9 9 0 1 0 0 18h1.2a1.8 1.8 0 0 0 0-3.6h-1a2 2 0 0 1 0-4H15a6 6 0 0 0 6-6C21 4.8 16.9 3 12 3Z"/><circle cx="7.5" cy="10" r=".7" fill="currentColor"/><circle cx="9" cy="6.5" r=".7" fill="currentColor"/><circle cx="14" cy="6.5" r=".7" fill="currentColor"/></template>
    <template v-else-if="name==='logout'"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"/></template>
    <template v-else-if="name==='external'"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/></template>
    <template v-else-if="name==='plus'"><path d="M12 5v14M5 12h14"/></template>
    <template v-else-if="name==='moon'"><path d="M20.4 15.1A8.3 8.3 0 0 1 8.9 3.6 8.7 8.7 0 1 0 20.4 15.1Z"/></template>
    <template v-else-if="name==='sun'"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></template>
    <template v-else-if="name==='search'"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></template>
    <template v-else><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></template>
  </svg>
</template>

<script setup>
defineProps({ name: { type: String, required: true } });
</script>
