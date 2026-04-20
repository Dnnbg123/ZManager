<script setup lang="ts">
/**
 * PanelToolbar - Toolbar with actions for the file panel.
 * Includes split, duplicate, close buttons and quick actions.
 */

import { useSplitViewStore } from '../stores/splitView.store';
import { useUIStore } from '../stores/ui.store';

const props = defineProps<{
  path: string;
  panelId: string;
}>();

const emit = defineEmits<{
  navigate: [path: string];
}>();

const splitViewStore = useSplitViewStore();
const uiStore = useUIStore();

function handleSplitHorizontal() {
  splitViewStore.splitPanel(props.panelId, 'horizontal');
}

function handleSplitVertical() {
  splitViewStore.splitPanel(props.panelId, 'vertical');
}

function handleDuplicate() {
  splitViewStore.duplicateActive();
}

function handleClose() {
  splitViewStore.closePanel(props.panelId);
}

function handleGoUp() {
  // Navigate to parent directory
  const parts = props.path.split(/[\\/]/).filter(Boolean);
  if (parts.length > 0) {
    parts.pop();
    let parentPath: string;

    if (props.path.startsWith('/')) {
      parentPath = '/' + parts.join('/');
    } else if (props.path.match(/^[A-Za-z]:/)) {
      const drive = props.path.charAt(0) + ':';
      parentPath = parts.length > 0 ? drive + '\\' + parts.join('\\') : drive + '\\';
    } else {
      parentPath = parts.join('/');
    }

    emit('navigate', parentPath || '/');
  }
}

function handleRefresh() {
  emit('navigate', props.path);
}
</script>

<template>
  <div class="flex items-center gap-1 border-b border-gray-700 bg-gray-800 px-2 py-1">
    <!-- Navigation -->
    <button
      class="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-700 hover:text-white"
      title="Go up (Backspace)"
      @click="handleGoUp"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <button
      class="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-700 hover:text-white"
      title="Refresh (F5)"
      @click="handleRefresh"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>

    <div class="mx-1 h-4 w-px bg-gray-700" />

    <!-- Split actions -->
    <button
      class="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-700 hover:text-white"
      title="Split horizontally"
      @click="handleSplitHorizontal"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    </button>

    <button
      class="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-700 hover:text-white"
      title="Split vertically"
      @click="handleSplitVertical"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </button>

    <button
      class="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-700 hover:text-white"
      title="Duplicate panel"
      @click="handleDuplicate"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>

    <button
      class="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-red-600 hover:text-white"
      title="Close panel"
      @click="handleClose"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* Toolbar styles */
</style>