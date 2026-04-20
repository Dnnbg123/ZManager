--- crates/zmanager-tauri/gui/src/app/App.vue (原始)


+++ crates/zmanager-tauri/gui/src/app/App.vue (修改后)
<script setup lang="ts">
/**
 * App - Root application component.
 * Sets up the main layout with split view manager.
 */

import { onMounted } from 'vue';
import { useSplitViewStore } from './stores/splitView.store';
import SplitViewManager from '@/components/split/SplitViewManager.vue';

const splitViewStore = useSplitViewStore();

onMounted(() => {
  // Initialize split view with default layout
  splitViewStore.initialize();
});
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-gray-900 text-white">
    <!-- Main content area with split view -->
    <div class="flex-1 overflow-hidden">
      <SplitViewManager />
    </div>
  </div>
</template>

<style>
/* Global app styles */
html, body, #app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* Custom scrollbar for dark theme */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1f2937;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>