<script setup lang="ts">
/**
 * FilePanel - Individual file browser panel with tabs.
 * Each panel displays a directory listing with full file manager functionality.
 */

import { computed, onMounted, onUnmounted } from "vue"
import { useSplitViewStore } from "../stores/splitView.store"
import { useFileSystemStore } from "../stores/fileSystem.store"
import { useUIStore } from "../stores/ui.store"
import PanelTabs from "./PanelTabs.vue"
import FileList from "./FileList.vue"
import Breadcrumb from "./Breadcrumb.vue"
import PanelToolbar from "./PanelToolbar.vue"

const props = defineProps<{
  panelId: string
}>()

const splitViewStore = useSplitViewStore()
const fileSystemStore = useFileSystemStore()
const uiStore = useUIStore()

const panel = computed(() => splitViewStore.getPanel(props.panelId))
const isActive = computed(
  () => splitViewStore.focus.activePanelId === props.panelId,
)
const currentPath = computed(() => panel.value?.path || "")

function handlePanelClick() {
  splitViewStore.setActivePanel(props.panelId)
}

function handleNavigate(path: string) {
  fileSystemStore.navigate(path, props.panelId)
  splitViewStore.updatePanelPath(props.panelId, path)
}

function handleTabChange(tabIndex: number) {
  splitViewStore.switchTab(props.panelId, tabIndex)
  const newPanel = splitViewStore.getPanel(props.panelId)
  if (newPanel) {
    fileSystemStore.loadDirectory(newPanel.path, props.panelId)
  }
}

function handleTabClose(tabIndex: number) {
  splitViewStore.closeTab(props.panelId, tabIndex)
}

function handleTabAdd() {
  const newTabPath = currentPath.value || "/"
  splitViewStore.addTab(props.panelId, newTabPath)
  fileSystemStore.loadDirectory(newTabPath, props.panelId)
}

function handleScroll(scrollY: number) {
  splitViewStore.updateScroll(props.panelId, scrollY)
}

function handleSelectionChange(selection: string[]) {
  splitViewStore.updateSelection(props.panelId, selection)
}

onMounted(() => {
  if (currentPath.value) {
    fileSystemStore.loadDirectory(currentPath.value, props.panelId)
  }
})

onUnmounted(() => {
  // Cleanup if needed
})
</script>

<template>
  <div
    :class="[
      'flex h-full w-full flex-col overflow-hidden border',
      isActive ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-700',
      'bg-gray-900',
    ]"
    @click="handlePanelClick"
  >
    <!-- Tabs -->
    <PanelTabs
      v-if="panel"
      :tabs="panel.tabs"
      :active-tab-index="panel.activeTabIndex"
      @tab-change="handleTabChange"
      @tab-close="handleTabClose"
      @tab-add="handleTabAdd"
    />

    <!-- Toolbar -->
    <PanelToolbar
      :path="currentPath"
      :panel-id="panelId"
      @navigate="handleNavigate"
    />

    <!-- Breadcrumb -->
    <Breadcrumb :path="currentPath" @navigate="handleNavigate" />

    <!-- File List -->
    <FileList
      :path="currentPath"
      :panel-id="panelId"
      :is-active="isActive"
      @scroll="handleScroll"
      @selection-change="handleSelectionChange"
      @navigate="handleNavigate"
    />
  </div>
</template>

<style scoped>
/* Panel container styles */
</style>
