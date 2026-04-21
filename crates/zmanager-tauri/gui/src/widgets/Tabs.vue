<script setup lang="ts">
import type { TabInfo } from '@/entities/types'
defineProps<{
  tabs: TabInfo[]
  activeTabId: string
  panelId: string
}>()
const emit = defineEmits<{
  closeTab: [panelId: string, tabId: string]
  activateTab: [panelId: string, tabId: string]
}>()
</script>
<template>
  <div class="flex items-center gap-1 p-1 border-b border-panel-border bg-gray-900 overflow-x-auto">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="flex items-center gap-2 px-3 py-1 rounded-t text-xs cursor-pointer whitespace-nowrap transition-colors"
      :class="activeTabId === tab.id ? 'bg-panel-bg text-white' : 'text-gray-400 hover:bg-gray-800'"
      @click="emit('activateTab', panelId, tab.id)"
    >
      <span class="truncate max-w-[150px]">{{ tab.title }}</span>
      <button
        @click.stop="emit('closeTab', panelId, tab.id)"
        class="hover:bg-red-600 rounded p-0.5"
      >
        ✕
      </button>
    </div>
    <button
      class="p-1 hover:bg-gray-700 rounded text-gray-400"
      title="New Tab"
    >
      +
    </button>
  </div>
</template>
<style scoped>
::-webkit-scrollbar {
  height: 4px;
}
::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 2px;
}