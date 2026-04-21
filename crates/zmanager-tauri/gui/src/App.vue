<script setup lang="ts">
import { onMounted } from "vue"
import { useLayoutStore } from "@/app/stores/layout"
import LayoutNode from "@/widgets/LayoutNode.vue"
const layoutStore = useLayoutStore()
onMounted(() => {
  // Initialize with default path
  if (layoutStore.activePanelId && layoutStore.rootLayout.panel) {
    layoutStore.updatePanelPath(layoutStore.activePanelId, "/")
  }
})
</script>
<template>
  <div class="w-full h-full flex flex-col">
    <!-- Main Menu Bar -->
    <header
      class="flex items-center gap-4 px-4 py-2 bg-gray-900 border-b border-panel-border"
    >
      <h1 class="text-sm font-semibold text-white">FilePilot</h1>
      <nav class="flex items-center gap-2 text-xs text-gray-400">
        <button class="hover:text-white transition-colors">File</button>
        <button class="hover:text-white transition-colors">Edit</button>
        <button class="hover:text-white transition-colors">View</button>
        <button class="hover:text-white transition-colors">Help</button>
      </nav>
    </header>
    <!-- Main Content Area -->
    <main class="flex-1 overflow-hidden">
      <LayoutNode :node="layoutStore.rootLayout" />
    </main>
    <!-- Status Bar -->
    <footer
      class="flex items-center justify-between px-4 py-1 bg-gray-900 border-t border-panel-border text-xs text-gray-500"
    >
      <span>Ready</span>
      <div class="flex items-center gap-4">
        <span>{{ layoutStore.activePanel?.path || "No panel selected" }}</span>
        <span>Panel: {{ layoutStore.activePanelId ? "Active" : "None" }}</span>
      </div>
    </footer>
  </div>
</template>
