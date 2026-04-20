<script setup lang="ts">
/**
 * FileList - Virtualized file list component with high performance.
 * Uses vue-virtual-scroller for efficient rendering of large directories.
 */

import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { RecycleScroller } from "vue-virtual-scroller"
import "vue-virtual-scroller/dist/vue-virtual-scroller.css"
import { useFileSystemStore } from "../stores/fileSystem.store"
import type { EntryMeta } from "../types"

const props = defineProps<{
  path: string
  panelId: string
  isActive: boolean
}>()

const emit = defineEmits<{
  scroll: [scrollY: number]
  selectionChange: [selection: string[]]
  navigate: [path: string]
}>()

const fileSystemStore = useFileSystemStore()

const scrollerRef = ref<InstanceType<typeof RecycleScroller<EntryMeta>> | null>(
  null,
)
const containerRef = ref<HTMLElement | null>(null)

// Get directory data from store
const dirData = computed(() => fileSystemStore.getDirectoryData(props.panelId))
const entries = computed(() => dirData.value?.entries ?? [])
const loading = computed(() => fileSystemStore.isLoading(props.panelId))
const error = computed(() => fileSystemStore.getError(props.panelId))

// Selection state
const selectedPaths = ref<Set<string>>(new Set())

function handleEntryClick(entry: EntryMeta, event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) {
    // Toggle selection
    if (selectedPaths.value.has(entry.path)) {
      selectedPaths.value.delete(entry.path)
    } else {
      selectedPaths.value.add(entry.path)
    }
  } else if (event.shiftKey) {
    // Range selection (simplified)
    selectedPaths.value.clear()
    selectedPaths.value.add(entry.path)
  } else {
    // Single select
    selectedPaths.value.clear()
    selectedPaths.value.add(entry.path)
  }

  emit("selectionChange", Array.from(selectedPaths.value))
}

function handleEntryDoubleClick(entry: EntryMeta) {
  if (entry.kind === "directory") {
    emit("navigate", entry.path)
  }
  // For files, would open with default app
}

function getIconForEntry(entry: EntryMeta): string {
  if (entry.kind === "directory") {
    return "folder"
  }

  const ext = entry.extension?.toLowerCase()
  switch (ext) {
    case "txt":
    case "md":
    case "log":
      return "file-text"
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
      return "file-image"
    case "pdf":
      return "file-pdf"
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return "file-archive"
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
    case "vue":
    case "json":
      return "file-code"
    case "mp3":
    case "wav":
    case "flac":
      return "file-audio"
    case "mp4":
    case "avi":
    case "mkv":
    case "mov":
      return "file-video"
    case "exe":
    case "msi":
    case "bat":
    case "sh":
      return "file-executable"
    default:
      return "file"
  }
}

function formatSize(size: number): string {
  if (size === 0) return ""

  const units = ["B", "KB", "MB", "GB", "TB"]
  let unitIndex = 0
  let formattedSize = size

  while (formattedSize >= 1024 && unitIndex < units.length - 1) {
    formattedSize /= 1024
    unitIndex++
  }

  return `${formattedSize.toFixed(1)} ${units[unitIndex]}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ""

  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

// Scroll handling
let scrollTimeout: ReturnType<typeof setTimeout> | null = null

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  const scrollY = target.scrollTop

  // Debounce scroll updates
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  scrollTimeout = setTimeout(() => {
    emit("scroll", scrollY)
  }, 100)
}

// Watch for path changes
watch(
  () => props.path,
  () => {
    selectedPaths.value.clear()
    emit("selectionChange", [])
  },
)

onMounted(() => {
  // Restore scroll position if needed
})

onUnmounted(() => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="flex h-full flex-col overflow-hidden bg-gray-900"
  >
    <!-- Loading state -->
    <div v-if="loading" class="flex h-full items-center justify-center">
      <div class="flex flex-col items-center gap-2 text-gray-400">
        <svg class="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex h-full items-center justify-center">
      <div class="flex flex-col items-center gap-2 text-red-400">
        <svg
          class="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Empty directory -->
    <div
      v-else-if="entries.length === 0"
      class="flex h-full items-center justify-center text-gray-500"
    >
      <span>Empty directory</span>
    </div>

    <!-- File list with virtual scrolling -->
    <RecycleScroller
      v-else
      ref="scrollerRef"
      :items="entries"
      :item-size="32"
      key-field="path"
      class="h-full w-full"
      @scroll="handleScroll"
    >
      <template #default="{ item, index }">
        <div
          :class="[
            'flex cursor-pointer items-center gap-2 border-b border-gray-800 px-3 py-1.5 text-sm transition-colors',
            selectedPaths.has(item.path)
              ? 'bg-blue-600/20 text-white'
              : 'text-gray-300 hover:bg-gray-800',
            isActive && index % 2 === 0 ? 'bg-gray-900/50' : '',
          ]"
          @click="handleEntryClick(item, $event)"
          @dblclick="handleEntryDoubleClick(item)"
        >
          <!-- Icon -->
          <div
            :class="[
              'flex h-5 w-5 items-center justify-center',
              item.kind === 'directory' ? 'text-yellow-500' : 'text-gray-400',
            ]"
          >
            <svg
              v-if="getIconForEntry(item) === 'folder'"
              class="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
              />
            </svg>
            <svg
              v-else-if="getIconForEntry(item) === 'file-text'"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <svg
              v-else
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>

          <!-- Name -->
          <span class="flex-1 truncate">{{ item.name }}</span>

          <!-- Size -->
          <span class="w-20 text-right text-xs text-gray-500">
            {{ item.kind === "directory" ? "" : formatSize(item.size) }}
          </span>

          <!-- Modified date -->
          <span class="w-32 text-right text-xs text-gray-500">
            {{ formatDate(item.modified) }}
          </span>
        </div>
      </template>
    </RecycleScroller>

    <!-- Status bar -->
    <div
      class="flex items-center justify-between border-t border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-400"
    >
      <span>{{ entries.length }} items</span>
      <span v-if="selectedPaths.size > 0">
        {{ selectedPaths.size }} selected
      </span>
    </div>
  </div>
</template>

<style scoped>
/* File list styles */
</style>
