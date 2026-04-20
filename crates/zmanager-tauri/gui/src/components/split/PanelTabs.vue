<script setup lang="ts">
/**
 * PanelTabs - Tab bar component for file panels.
 * Supports multiple tabs per panel with lazy loading.
 */

import { computed } from 'vue';
import type { PanelTab } from '../stores/splitView.store';

const props = defineProps<{
  tabs: PanelTab[];
  activeTabIndex: number;
}>();

const emit = defineEmits<{
  tabChange: [index: number];
  tabClose: [index: number];
  tabAdd: [];
}>();

function handleTabClick(index: number) {
  emit('tabChange', index);
}

function handleCloseClick(event: MouseEvent, index: number) {
  event.stopPropagation();
  emit('tabClose', index);
}

function handleAddClick() {
  emit('tabAdd');
}

function getTabName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts.pop() || path || 'Home';
}
</script>

<template>
  <div class="flex items-center border-b border-gray-700 bg-gray-800 px-1">
    <!-- Tabs -->
    <div class="flex flex-1 overflow-x-auto">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        :class="[
          'flex items-center gap-1.5 border-r border-gray-700 px-3 py-1.5 text-xs transition-colors',
          'hover:bg-gray-700',
          index === activeTabIndex ? 'bg-gray-900 text-white' : 'text-gray-400',
        ]"
        @click="handleTabClick(index)"
      >
        <!-- Folder icon -->
        <svg class="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>

        <!-- Tab name (truncated) -->
        <span class="max-w-[120px] truncate">{{ tab.name || getTabName(tab.path) }}</span>

        <!-- Close button -->
        <span
          v-if="tabs.length > 1"
          class="flex h-4 w-4 items-center justify-center rounded hover:bg-gray-600"
          @click="handleCloseClick($event, index)"
        >
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      </button>
    </div>

    <!-- Add tab button -->
    <button
      class="flex h-7 w-7 items-center justify-center rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
      title="New tab"
      @click="handleAddClick"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* Tab bar styles */
</style>