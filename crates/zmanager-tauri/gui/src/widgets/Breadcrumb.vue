<script setup lang="ts">
import { computed } from "vue"
import { useLayoutStore } from "@/app/stores/layout"
const props = defineProps<{
  path: string
  panelId: string
}>()
const layoutStore = useLayoutStore()
const segments = computed(() => {
  const parts = props.path.split(/[\\/]/).filter(Boolean)
  const result: { label: string; path: string }[] = []
  let currentPath =
    props.path.startsWith("/") || props.path.startsWith("\\") ? "/" : ""
  if (currentPath === "/") {
    result.push({ label: "Root", path: "/" })
  }
  for (const part of parts) {
    currentPath = currentPath === "/" ? `/${part}` : `${currentPath}/${part}`
    result.push({ label: part, path: currentPath })
  }
  return result
})
function navigateTo(path: string) {
  layoutStore.updatePanelPath(props.panelId, path)
}
</script>
<template>
  <div
    class="flex items-center gap-1 p-2 text-xs bg-gray-800 border-b border-panel-border"
  >
    <button
      @click="navigateTo('/')"
      class="px-2 py-1 hover:bg-gray-700 rounded text-gray-300"
    >
      🏠
    </button>
    <span class="text-gray-500">/</span>
    <template v-for="(segment, index) in segments" :key="segment.path">
      <button
        @click="navigateTo(segment.path)"
        class="px-2 py-1 hover:bg-gray-700 rounded text-primary-400 truncate max-w-[150px]"
        :class="index === segments.length - 1 ? 'font-semibold text-white' : ''"
      >
        {{ segment.label }}
      </button>
      <span v-if="index < segments.length - 1" class="text-gray-500">/</span>
    </template>
  </div>
</template>
