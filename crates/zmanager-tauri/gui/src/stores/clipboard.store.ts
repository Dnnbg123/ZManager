/**
 * Clipboard Store - Manages clipboard state for file operations.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ClipboardOperation } from '../types';
import { clipboardCopy, clipboardCut, clipboardPaste, clipboardClear } from '../shared/ipc';

export const useClipboardStore = defineStore('clipboard', () => {
  // State
  const paths = ref<string[]>([]);
  const operation = ref<ClipboardOperation | null>(null);

  // Computed
  const hasContent = computed(() => paths.value.length > 0);
  const isCut = computed(() => operation.value === 'cut');
  const isCopy = computed(() => operation.value === 'copy');

  // Actions
  async function copy(pathsToCopy: string[]): Promise<boolean> {
    try {
      const success = await clipboardCopy(pathsToCopy);
      if (success) {
        paths.value = [...pathsToCopy];
        operation.value = 'copy';
      }
      return success;
    } catch (_error) {
      return false;
    }
  }

  async function cut(pathsToCut: string[]): Promise<boolean> {
    try {
      const success = await clipboardCut(pathsToCut);
      if (success) {
        paths.value = [...pathsToCut];
        operation.value = 'cut';
      }
      return success;
    } catch (_error) {
      return false;
    }
  }

  async function paste(targetDir: string): Promise<number> {
    try {
      const count = await clipboardPaste(targetDir);
      if (count > 0) {
        // Clear clipboard after successful paste
        paths.value = [];
        operation.value = null;
      }
      return count;
    } catch (_error) {
      return 0;
    }
  }

  function clear(): void {
    paths.value = [];
    operation.value = null;
    clipboardClear().catch(() => {
      // Ignore errors
    });
  }

  return {
    // State
    paths,
    operation,
    // Computed
    hasContent,
    isCut,
    isCopy,
    // Actions
    copy,
    cut,
    paste,
    clear,
  };
});
