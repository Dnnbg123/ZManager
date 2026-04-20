/**
 * UI Store - Manages UI state including layout, dialogs, and toasts.
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export type LayoutMode = 'single' | 'dual' | 'split';

export interface SplitNode {
  id: string;
  direction: 'horizontal' | 'vertical';
  size: number; // percentage 0-100
  children: (SplitNode | PaneRef)[];
}

export interface PaneRef {
  type: 'pane';
  paneId: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface DialogState {
  type: 'confirm' | 'rename' | 'input' | 'newFolder' | null;
  visible: boolean;
  data: Record<string, unknown>;
  resolve?: (value: unknown) => void;
}

export const useUIStore = defineStore('ui', () => {
  // State
  const layoutMode = ref<LayoutMode>('dual');
  const splitLayout = ref<SplitNode | null>(null);
  const sidebarVisible = ref(true);
  const sidebarWidth = ref(240);
  const transferPanelVisible = ref(false);
  const transferPanelHeight = ref(200);
  const propertiesPanelVisible = ref(false);
  const fullscreen = ref(false);
  const toasts = ref<ToastMessage[]>([]);
  const dialog = ref<DialogState>({
    type: null,
    visible: false,
    data: {},
  });

  // Actions
  function setLayoutMode(mode: LayoutMode): void {
    layoutMode.value = mode;
  }

  function toggleSidebar(): void {
    sidebarVisible.value = !sidebarVisible.value;
  }

  function setSidebarWidth(width: number): void {
    sidebarWidth.value = Math.max(180, Math.min(400, width));
  }

  function toggleTransferPanel(): void {
    transferPanelVisible.value = !transferPanelVisible.value;
  }

  function setTransferPanelHeight(height: number): void {
    transferPanelHeight.value = Math.max(150, Math.min(400, height));
  }

  function togglePropertiesPanel(): void {
    propertiesPanelVisible.value = !propertiesPanelVisible.value;
  }

  function toggleFullscreen(): void {
    fullscreen.value = !fullscreen.value;
  }

  // Toast actions
  function addToast(toast: Omit<ToastMessage, 'id'>): void {
    const id = crypto.randomUUID();
    const newToast: ToastMessage = { id, duration: 3000, ...toast };
    toasts.value.push(newToast);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }

  function removeToast(id: string): void {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  }

  function success(title: string, message?: string): void {
    addToast({ type: 'success', title, message });
  }

  function error(title: string, message?: string): void {
    addToast({ type: 'error', title, message, duration: 5000 });
  }

  function warning(title: string, message?: string): void {
    addToast({ type: 'warning', title, message });
  }

  function info(title: string, message?: string): void {
    addToast({ type: 'info', title, message });
  }

  // Dialog actions
  async function showConfirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      dialog.value = {
        type: 'confirm',
        visible: true,
        data: options,
        resolve: (value) => {
          resolve(value as boolean);
          dialog.value = { type: null, visible: false, data: {} };
        },
      };
    });
  }

  async function showRename(options: {
    currentName: string;
    isDirectory: boolean;
  }): Promise<string | null> {
    return new Promise((resolve) => {
      dialog.value = {
        type: 'rename',
        visible: true,
        data: options,
        resolve: (value) => {
          resolve(value as string | null);
          dialog.value = { type: null, visible: false, data: {} };
        },
      };
    });
  }

  async function showInput(options: {
    title: string;
    label: string;
    defaultValue?: string;
    placeholder?: string;
  }): Promise<string | null> {
    return new Promise((resolve) => {
      dialog.value = {
        type: 'input',
        visible: true,
        data: options,
        resolve: (value) => {
          resolve(value as string | null);
          dialog.value = { type: null, visible: false, data: {} };
        },
      };
    });
  }

  async function showNewFolder(options: { defaultName?: string }): Promise<string | null> {
    return new Promise((resolve) => {
      dialog.value = {
        type: 'newFolder',
        visible: true,
        data: options,
        resolve: (value) => {
          resolve(value as string | null);
          dialog.value = { type: null, visible: false, data: {} };
        },
      };
    });
  }

  function closeDialog(): void {
    if (dialog.value.resolve) {
      dialog.value.resolve(null);
    }
    dialog.value = { type: null, visible: false, data: {} };
  }

  function confirmDialog(confirmed: boolean): void {
    if (dialog.value.resolve) {
      dialog.value.resolve(confirmed);
    }
    dialog.value = { type: null, visible: false, data: {} };
  }

  return {
    // State
    layoutMode,
    splitLayout,
    sidebarVisible,
    sidebarWidth,
    transferPanelVisible,
    transferPanelHeight,
    propertiesPanelVisible,
    fullscreen,
    toasts,
    dialog,
    // Actions
    setLayoutMode,
    toggleSidebar,
    setSidebarWidth,
    toggleTransferPanel,
    setTransferPanelHeight,
    togglePropertiesPanel,
    toggleFullscreen,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    showConfirm,
    showRename,
    showInput,
    showNewFolder,
    closeDialog,
    confirmDialog,
  };
});
