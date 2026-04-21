<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { useLayoutStore } from "@/app/stores/layout"
import type { FileEntry } from "@/entities/types"
const props = defineProps<{
  path: string
  panelId: string
}>()
const layoutStore = useLayoutStore()
const entries = ref<FileEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
async function loadFiles() {
  loading.value = true
  error.value = null
  try {
    const data = await layoutStore.loadDirectory(props.path)
    entries.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load files"
  } finally {
    loading.value = false
  }
}
watch(
  () => props.path,
  () => {
    loadFiles()
  },
  { immediate: true },
)
onMounted(() => {
  loadFiles()
})
function handleFileClick(entry: FileEntry) {
  if (entry.isDir) {
    layoutStore.updatePanelPath(props.panelId, entry.path)
  }
}
</script>
<template>
  <div class="flex-1 overflow-auto bg-panel-bg">
    <div v-if="loading" class="p-4 text-center text-gray-400">Loading...</div>
    <div v-else-if="error" class="p-4 text-center text-red-400">
      {{ error }}
    </div>
    <div v-else-if="entries.length === 0" class="p-4 text-center text-gray-500">
      Empty folder
    </div>
    <div v-else class="p-2">
      <div
        v-for="entry in entries"
        :key="entry.path"
        class="flex items-center gap-3 p-2 hover:bg-panel-hover rounded cursor-pointer transition-colors"
        @click="handleFileClick(entry)"
      >
        <span class="text-lg">
          {{ entry.isDir ? "📁" : "📄" }}
        </span>
        <span class="text-sm text-gray-200 truncate flex-1">{{
          entry.name
        }}</span>
        <span class="text-xs text-gray-500">
          {{ entry.size > 0 ? (entry.size / 1024).toFixed(1) + " KB" : "" }}
        </span>
      </div>
    </div>
  </div>
</template>
