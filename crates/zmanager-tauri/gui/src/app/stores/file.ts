import { defineStore } from "pinia"
import { ref } from "vue"
import type { FileEntry, ClipboardData } from "@/entities/types"
export const useFileStore = defineStore("file", () => {
  const selectedItems = ref<Set<string>>(new Set())
  const clipboard = ref<ClipboardData | null>(null)
  const currentPath = ref<string>("/")
  const entries = ref<FileEntry[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  function toggleSelection(path: string) {
    if (selectedItems.value.has(path)) {
      selectedItems.value.delete(path)
    } else {
      selectedItems.value.add(path)
    }
  }
  function clearSelection() {
    selectedItems.value.clear()
  }
  function selectAll(items: FileEntry[]) {
    items.forEach((item) => selectedItems.value.add(item.path))
  }
  function setClipboardData(data: ClipboardData) {
    clipboard.value = data
  }
  function clearClipboard() {
    clipboard.value = null
  }
  function setCurrentPath(path: string) {
    currentPath.value = path
  }
  function setEntries(newEntries: FileEntry[]) {
    entries.value = newEntries
  }
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }
  function setError(err: string | null) {
    error.value = err
  }
  return {
    selectedItems,
    clipboard,
    currentPath,
    entries,
    isLoading,
    error,
    toggleSelection,
    clearSelection,
    selectAll,
    setClipboardData,
    clearClipboard,
    setCurrentPath,
    setEntries,
    setLoading,
    setError,
  }
})
