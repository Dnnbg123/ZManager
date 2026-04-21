<script setup lang="ts">
import { computed } from "vue"
import type { LayoutNode } from "@/entities/types"
import { useLayoutStore } from "@/app/stores/layout"
import Tabs from "./Tabs.vue"
import FileList from "./FileList.vue"
import Breadcrumb from "./Breadcrumb.vue"
const props = defineProps<{
  node: LayoutNode
}>()
const layoutStore = useLayoutStore()
const panel = computed(() => props.node.panel)
const tabs = computed(() => props.node.tabs || [])
const activeTabId = computed(() => props.node.activeTabId)
function handlePanelClick() {
  if (panel.value?.id) {
    layoutStore.setActivePanel(panel.value.id)
  }
}
function handleSplit(direction: "horizontal" | "vertical") {
  layoutStore.splitPanel(direction)
}
function handleClosePanel() {
  if (panel.value?.id) {
    layoutStore.closePanel(panel.value.id)
  }
}
</script>
<template>
  <div
    class="flex flex-col h-full bg-panel-bg border border-panel-border"
    :class="{
      'ring-1 ring-primary-500': layoutStore.activePanelId === panel?.id,
    }"
    @click="handlePanelClick"
  >
    <!-- Toolbar -->
    <div
      class="flex items-center gap-2 p-1 border-b border-panel-border bg-gray-800"
    >
      <button
        @click.stop="handleSplit('horizontal')"
        class="p-1 hover:bg-gray-700 rounded text-xs"
        title="Split Horizontal"
      >
        ⬌
      </button>
      <button
        @click.stop="handleSplit('vertical')"
        class="p-1 hover:bg-gray-700 rounded text-xs"
        title="Split Vertical"
      >
        ⬍
      </button>
      <button
        @click.stop="handleClosePanel"
        class="p-1 hover:bg-red-600 rounded text-xs ml-auto"
        title="Close Panel"
      >
        ✕
      </button>
    </div>
    <!-- Tabs -->
    <Tabs
      v-if="tabs.length > 0"
      :tabs="tabs"
      :activeTabId="activeTabId || ''"
      :panelId="panel?.id || ''"
      @close-tab="layoutStore.closeTab"
      @activate-tab="layoutStore.setActiveTab"
    />
    <!-- Breadcrumb -->
    <Breadcrumb v-if="panel?.path" :path="panel.path" :panelId="panel.id" />
    <!-- File List -->
    <FileList v-if="panel?.path" :path="panel.path" :panelId="panel.id" />
  </div>
</template>
