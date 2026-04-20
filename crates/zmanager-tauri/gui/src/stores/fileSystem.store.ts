import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { DirListing, DriveInfo, FilterSpec, SortSpec } from '@/types';
import { DEFAULT_FILTER, DEFAULT_SORT } from '../types';
import { getDrives, navigate } from '../shared/ipc';

/** Which pane is being referenced */
export type PaneId = string;

/** State for a single file pane */
export interface PaneState {
  /** Current directory path */
  path: string;
  /** Directory listing (entries + stats) */
  listing: DirListing | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Navigation history: back stack */
  historyBack: string[];
  /** Navigation history: forward stack */
  historyForward: string[];
  /** Current sort specification */
  sort: SortSpec;
  /** Current filter specification */
  filter: FilterSpec;
  /** Selected entry indices */
  selectedIndices: Set<number>;
  /** Cursor index (focused entry) */
  cursorIndex: number;
  /** Tab state for this pane */
  tabs: PaneTab[];
  /** Active tab index */
  activeTabIndex: number;
}

/** Tab within a pane */
export interface PaneTab {
  id: string;
  path: string;
  title: string;
  listing: DirListing | null;
  scrollPosition: number;
  selectedIndices: Set<number>;
  cursorIndex: number;
}

/** Global file system store state */
interface FileSystemState {
  /** Map of pane states by ID */
  panes: Map<PaneId, PaneState>;
  /** Which pane is active/focused */
  activePaneId: PaneId | null;
  /** Available drives */
  drives: DriveInfo[];
  /** Loading drives */
  drivesLoading: boolean;
}

/** Create initial pane state */
function createInitialPaneState(defaultPath: string): PaneState {
  const tabId = crypto.randomUUID();
  return {
    path: defaultPath,
    listing: null,
    isLoading: false,
    error: null,
    historyBack: [],
    historyForward: [],
    sort: DEFAULT_SORT,
    filter: DEFAULT_FILTER,
    selectedIndices: new Set(),
    cursorIndex: 0,
    tabs: [
      {
        id: tabId,
        path: defaultPath,
        title: getPathTitle(defaultPath),
        listing: null,
        scrollPosition: 0,
        selectedIndices: new Set(),
        cursorIndex: 0,
      },
    ],
    activeTabIndex: 0,
  };
}

/** Get path title for tab */
function getPathTitle(path: string): string {
  const parts = path.replace(/\\/g, '/').replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || path;
}

/** Get parent path, handling Windows drive roots */
function getParentPath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/').replace(/\/$/, '');

  // Check if we're at a drive root (e.g., "C:")
  if (/^[a-zA-Z]:$/.test(normalized)) {
    return null; // At root, no parent
  }

  // Get parent
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) {
    return null;
  }

  const parent = normalized.substring(0, lastSlash);

  // If parent is just a drive letter, return with trailing
  if (/^[a-zA-Z]:$/.test(parent)) {
    return `${parent}\\`;
  }

  return parent || null;
}

export const useFileSystemStore = defineStore('fileSystem', () => {
  // State
  const panes = ref<Map<PaneId, PaneState>>(new Map());
  const activePaneId = ref<PaneId | null>(null);
  const drives = ref<DriveInfo[]>([]);
  const drivesLoading = ref(false);

  // Computed
  const activePane = computed(() => {
    if (!activePaneId.value) return null;
    return panes.value.get(activePaneId.value) ?? null;
  });

  const activeTab = computed(() => {
    const pane = activePane.value;
    if (!pane || pane.tabs.length === 0) return null;
    return pane.tabs[pane.activeTabIndex];
  });

  // Actions
  function createPane(id: PaneId, defaultPath: string = 'C:\\'): PaneState {
    const state = createInitialPaneState(defaultPath);
    panes.value.set(id, state);
    if (!activePaneId.value) {
      activePaneId.value = id;
    }
    return state;
  }

  function removePane(id: PaneId): void {
    panes.value.delete(id);
    if (activePaneId.value === id) {
      const remaining = Array.from(panes.value.keys());
      activePaneId.value = remaining[0] ?? null;
    }
  }

  function setActivePane(id: PaneId): void {
    if (panes.value.has(id)) {
      activePaneId.value = id;
    }
  }

  async function loadPane(paneId: PaneId, path: string): Promise<void> {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    pane.isLoading = true;
    pane.error = null;

    try {
      const listing = await navigate(path, pane.sort, pane.filter);

      // Update history
      if (pane.path !== path) {
        pane.historyBack = [...pane.historyBack, pane.path].slice(-100);
        pane.historyForward = [];
      }

      pane.path = path;
      pane.listing = listing;
      pane.isLoading = false;
      pane.selectedIndices = new Set();
      pane.cursorIndex = 0;

      // Update active tab
      const tab = pane.tabs[pane.activeTabIndex];
      if (tab) {
        tab.path = path;
        tab.title = getPathTitle(path);
        tab.listing = listing;
        tab.selectedIndices = new Set();
        tab.cursorIndex = 0;
      }
    } catch (error) {
      pane.isLoading = false;
      pane.error = error instanceof Error ? error.message : String(error);
    }
  }

  async function navigateTo(paneId: PaneId, path: string): Promise<void> {
    await loadPane(paneId, path);
  }

  async function goBack(paneId: PaneId): Promise<void> {
    const pane = panes.value.get(paneId);
    if (!pane || pane.historyBack.length === 0) return;

    const previousPath = pane.historyBack[pane.historyBack.length - 1];
    const newHistoryBack = pane.historyBack.slice(0, -1);
    const newHistoryForward = [pane.path, ...pane.historyForward];

    pane.historyBack = newHistoryBack;
    pane.historyForward = newHistoryForward;
    pane.isLoading = true;

    try {
      const listing = await navigate(previousPath, pane.sort, pane.filter);
      pane.path = previousPath;
      pane.listing = listing;
      pane.isLoading = false;
      pane.error = null;
      pane.selectedIndices = new Set();
      pane.cursorIndex = 0;
    } catch (error) {
      pane.isLoading = false;
      pane.error = error instanceof Error ? error.message : String(error);
    }
  }

  async function goForward(paneId: PaneId): Promise<void> {
    const pane = panes.value.get(paneId);
    if (!pane || pane.historyForward.length === 0) return;

    const nextPath = pane.historyForward[0];
    const newHistoryForward = pane.historyForward.slice(1);
    const newHistoryBack = [...pane.historyBack, pane.path];

    pane.historyBack = newHistoryBack;
    pane.historyForward = newHistoryForward;
    pane.isLoading = true;

    try {
      const listing = await navigate(nextPath, pane.sort, pane.filter);
      pane.path = nextPath;
      pane.listing = listing;
      pane.isLoading = false;
      pane.error = null;
      pane.selectedIndices = new Set();
      pane.cursorIndex = 0;
    } catch (error) {
      pane.isLoading = false;
      pane.error = error instanceof Error ? error.message : String(error);
    }
  }

  async function goUp(paneId: PaneId): Promise<void> {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    const parentPath = getParentPath(pane.path);
    if (parentPath) {
      await navigateTo(paneId, parentPath);
    }
  }

  async function refresh(paneId: PaneId): Promise<void> {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    await loadPane(paneId, pane.path);
  }

  async function loadDrives(): Promise<void> {
    drivesLoading.value = true;
    try {
      drives.value = await getDrives();
    } catch (_error) {
      // Ignore errors
    } finally {
      drivesLoading.value = false;
    }
  }

  function setSort(paneId: PaneId, sort: SortSpec): void {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    pane.sort = sort;
    refresh(paneId);
  }

  function setFilter(paneId: PaneId, filter: FilterSpec): void {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    pane.filter = filter;
    refresh(paneId);
  }

  function setSelection(paneId: PaneId, indices: Set<number>): void {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    pane.selectedIndices = new Set(indices);

    // Also update active tab
    const tab = pane.tabs[pane.activeTabIndex];
    if (tab) {
      tab.selectedIndices = new Set(indices);
    }
  }

  function setCursor(paneId: PaneId, index: number): void {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    pane.cursorIndex = index;

    // Also update active tab
    const tab = pane.tabs[pane.activeTabIndex];
    if (tab) {
      tab.cursorIndex = index;
    }
  }

  function clearSelection(paneId: PaneId): void {
    setSelection(paneId, new Set());
  }

  // Tab management
  function addTab(paneId: PaneId, path: string): void {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    const tabId = crypto.randomUUID();
    const newTab: PaneTab = {
      id: tabId,
      path,
      title: getPathTitle(path),
      listing: null,
      scrollPosition: 0,
      selectedIndices: new Set(),
      cursorIndex: 0,
    };

    pane.tabs.push(newTab);
    pane.activeTabIndex = pane.tabs.length - 1;
    loadPane(paneId, path);
  }

  function closeTab(paneId: PaneId, tabIndex: number): void {
    const pane = panes.value.get(paneId);
    if (!pane || pane.tabs.length <= 1) return;

    pane.tabs.splice(tabIndex, 1);

    if (pane.activeTabIndex >= pane.tabs.length) {
      pane.activeTabIndex = pane.tabs.length - 1;
    }

    // Load the new active tab's path
    const activeTab = pane.tabs[pane.activeTabIndex];
    if (activeTab && activeTab.path !== pane.path) {
      loadPane(paneId, activeTab.path);
    }
  }

  function switchTab(paneId: PaneId, tabIndex: number): void {
    const pane = panes.value.get(paneId);
    if (!pane || tabIndex < 0 || tabIndex >= pane.tabs.length) return;

    pane.activeTabIndex = tabIndex;
    const tab = pane.tabs[tabIndex];
    if (tab && tab.path !== pane.path) {
      loadPane(paneId, tab.path);
    }
  }

  // Initialize with default panes
  function initialize(): void {
    createPane('left', 'C:\\');
    createPane('right', 'D:\\');
    activePaneId.value = 'left';
    loadDrives();
  }

  return {
    // State
    panes,
    activePaneId,
    drives,
    drivesLoading,
    // Computed
    activePane,
    activeTab,
    // Actions
    createPane,
    removePane,
    setActivePane,
    navigateTo,
    goBack,
    goForward,
    goUp,
    refresh,
    loadDrives,
    setSort,
    setFilter,
    setSelection,
    setCursor,
    clearSelection,
    addTab,
    closeTab,
    switchTab,
    initialize,
  };
});

+++ crates/zmanager-tauri/gui/src/stores/fileSystem.store.ts (修改后)
/**
 * File System Store - Manages navigation state and directory listings.
 *
 * Uses Pinia for state management with support for multiple panes.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { DirListing, DriveInfo, FilterSpec, SortSpec } from '../types';
import { DEFAULT_FILTER, DEFAULT_SORT } from '../types';
import { getDrives, navigate } from '../shared/ipc';

/** Which pane is being referenced */
export type PaneId = string;

/** State for a single file pane */
export interface PaneState {
  /** Current directory path */
  path: string;
  /** Directory listing (entries + stats) */
  listing: DirListing | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Navigation history: back stack */
  historyBack: string[];
  /** Navigation history: forward stack */
  historyForward: string[];
  /** Current sort specification */
  sort: SortSpec;
  /** Current filter specification */
  filter: FilterSpec;
  /** Selected entry indices */
  selectedIndices: Set<number>;
  /** Cursor index (focused entry) */
  cursorIndex: number;
  /** Tab state for this pane */
  tabs: PaneTab[];
  /** Active tab index */
  activeTabIndex: number;
}

/** Tab within a pane */
export interface PaneTab {
  id: string;
  path: string;
  title: string;
  listing: DirListing | null;
  scrollPosition: number;
  selectedIndices: Set<number>;
  cursorIndex: number;
}

/** Global file system store state */
interface FileSystemState {
  /** Map of pane states by ID */
  panes: Map<PaneId, PaneState>;
  /** Which pane is active/focused */
  activePaneId: PaneId | null;
  /** Available drives */
  drives: DriveInfo[];
  /** Loading drives */
  drivesLoading: boolean;
}

/** Create initial pane state */
function createInitialPaneState(defaultPath: string): PaneState {
  const tabId = crypto.randomUUID();
  return {
    path: defaultPath,
    listing: null,
    isLoading: false,
    error: null,
    historyBack: [],
    historyForward: [],
    sort: DEFAULT_SORT,
    filter: DEFAULT_FILTER,
    selectedIndices: new Set(),
    cursorIndex: 0,
    tabs: [
      {
        id: tabId,
        path: defaultPath,
        title: getPathTitle(defaultPath),
        listing: null,
        scrollPosition: 0,
        selectedIndices: new Set(),
        cursorIndex: 0,
      },
    ],
    activeTabIndex: 0,
  };
}

/** Get path title for tab */
function getPathTitle(path: string): string {
  const parts = path.replace(/\\/g, '/').replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || path;
}

/** Get parent path, handling Windows drive roots */
function getParentPath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/').replace(/\/$/, '');

  // Check if we're at a drive root (e.g., "C:")
  if (/^[a-zA-Z]:$/.test(normalized)) {
    return null; // At root, no parent
  }

  // Get parent
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) {
    return null;
  }

  const parent = normalized.substring(0, lastSlash);

  // If parent is just a drive letter, return with trailing
  if (/^[a-zA-Z]:$/.test(parent)) {
    return `${parent}\\`;
  }

  return parent || null;
}

export const useFileSystemStore = defineStore('fileSystem', () => {
  // State
  const panes = ref<Map<PaneId, PaneState>>(new Map());
  const activePaneId = ref<PaneId | null>(null);
  const drives = ref<DriveInfo[]>([]);
  const drivesLoading = ref(false);

  // Computed
  const activePane = computed(() => {
    if (!activePaneId.value) return null;
    return panes.value.get(activePaneId.value) ?? null;
  });

  const activeTab = computed(() => {
    const pane = activePane.value;
    if (!pane || pane.tabs.length === 0) return null;
    return pane.tabs[pane.activeTabIndex];
  });

  // Actions
  function createPane(id: PaneId, defaultPath: string = 'C:\\'): PaneState {
    const state = createInitialPaneState(defaultPath);
    panes.value.set(id, state);
    if (!activePaneId.value) {
      activePaneId.value = id;
    }
    return state;
  }

  function removePane(id: PaneId): void {
    panes.value.delete(id);
    if (activePaneId.value === id) {
      const remaining = Array.from(panes.value.keys());
      activePaneId.value = remaining[0] ?? null;
    }
  }

  function setActivePane(id: PaneId): void {
    if (panes.value.has(id)) {
      activePaneId.value = id;
    }
  }

  async function loadPane(paneId: PaneId, path: string): Promise<void> {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    pane.isLoading = true;
    pane.error = null;

    try {
      const listing = await navigate(path, pane.sort, pane.filter);

      // Update history
      if (pane.path !== path) {
        pane.historyBack = [...pane.historyBack, pane.path].slice(-100);
        pane.historyForward = [];
      }

      pane.path = path;
      pane.listing = listing;
      pane.isLoading = false;
      pane.selectedIndices = new Set();
      pane.cursorIndex = 0;

      // Update active tab
      const tab = pane.tabs[pane.activeTabIndex];
      if (tab) {
        tab.path = path;
        tab.title = getPathTitle(path);
        tab.listing = listing;
        tab.selectedIndices = new Set();
        tab.cursorIndex = 0;
      }
    } catch (error) {
      pane.isLoading = false;
      pane.error = error instanceof Error ? error.message : String(error);
    }
  }

  async function navigateTo(paneId: PaneId, path: string): Promise<void> {
    await loadPane(paneId, path);
  }

  async function goBack(paneId: PaneId): Promise<void> {
    const pane = panes.value.get(paneId);
    if (!pane || pane.historyBack.length === 0) return;

    const previousPath = pane.historyBack[pane.historyBack.length - 1];
    const newHistoryBack = pane.historyBack.slice(0, -1);
    const newHistoryForward = [pane.path, ...pane.historyForward];

    pane.historyBack = newHistoryBack;
    pane.historyForward = newHistoryForward;
    pane.isLoading = true;

    try {
      const listing = await navigate(previousPath, pane.sort, pane.filter);
      pane.path = previousPath;
      pane.listing = listing;
      pane.isLoading = false;
      pane.error = null;
      pane.selectedIndices = new Set();
      pane.cursorIndex = 0;
    } catch (error) {
      pane.isLoading = false;
      pane.error = error instanceof Error ? error.message : String(error);
    }
  }

  async function goForward(paneId: PaneId): Promise<void> {
    const pane = panes.value.get(paneId);
    if (!pane || pane.historyForward.length === 0) return;

    const nextPath = pane.historyForward[0];
    const newHistoryForward = pane.historyForward.slice(1);
    const newHistoryBack = [...pane.historyBack, pane.path];

    pane.historyBack = newHistoryBack;
    pane.historyForward = newHistoryForward;
    pane.isLoading = true;

    try {
      const listing = await navigate(nextPath, pane.sort, pane.filter);
      pane.path = nextPath;
      pane.listing = listing;
      pane.isLoading = false;
      pane.error = null;
      pane.selectedIndices = new Set();
      pane.cursorIndex = 0;
    } catch (error) {
      pane.isLoading = false;
      pane.error = error instanceof Error ? error.message : String(error);
    }
  }

  async function goUp(paneId: PaneId): Promise<void> {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    const parentPath = getParentPath(pane.path);
    if (parentPath) {
      await navigateTo(paneId, parentPath);
    }
  }

  async function refresh(paneId: PaneId): Promise<void> {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    await loadPane(paneId, pane.path);
  }

  async function loadDrives(): Promise<void> {
    drivesLoading.value = true;
    try {
      drives.value = await getDrives();
    } catch (_error) {
      // Ignore errors
    } finally {
      drivesLoading.value = false;
    }
  }

  function setSort(paneId: PaneId, sort: SortSpec): void {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    pane.sort = sort;
    refresh(paneId);
  }

  function setFilter(paneId: PaneId, filter: FilterSpec): void {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    pane.filter = filter;
    refresh(paneId);
  }

  function setSelection(paneId: PaneId, indices: Set<number>): void {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    pane.selectedIndices = new Set(indices);

    // Also update active tab
    const tab = pane.tabs[pane.activeTabIndex];
    if (tab) {
      tab.selectedIndices = new Set(indices);
    }
  }

  function setCursor(paneId: PaneId, index: number): void {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    pane.cursorIndex = index;

    // Also update active tab
    const tab = pane.tabs[pane.activeTabIndex];
    if (tab) {
      tab.cursorIndex = index;
    }
  }

  function clearSelection(paneId: PaneId): void {
    setSelection(paneId, new Set());
  }

  // Tab management
  function addTab(paneId: PaneId, path: string): void {
    const pane = panes.value.get(paneId);
    if (!pane) return;

    const tabId = crypto.randomUUID();
    const newTab: PaneTab = {
      id: tabId,
      path,
      title: getPathTitle(path),
      listing: null,
      scrollPosition: 0,
      selectedIndices: new Set(),
      cursorIndex: 0,
    };

    pane.tabs.push(newTab);
    pane.activeTabIndex = pane.tabs.length - 1;
    loadPane(paneId, path);
  }

  function closeTab(paneId: PaneId, tabIndex: number): void {
    const pane = panes.value.get(paneId);
    if (!pane || pane.tabs.length <= 1) return;

    pane.tabs.splice(tabIndex, 1);

    if (pane.activeTabIndex >= pane.tabs.length) {
      pane.activeTabIndex = pane.tabs.length - 1;
    }

    // Load the new active tab's path
    const activeTab = pane.tabs[pane.activeTabIndex];
    if (activeTab && activeTab.path !== pane.path) {
      loadPane(paneId, activeTab.path);
    }
  }

  function switchTab(paneId: PaneId, tabIndex: number): void {
    const pane = panes.value.get(paneId);
    if (!pane || tabIndex < 0 || tabIndex >= pane.tabs.length) return;

    pane.activeTabIndex = tabIndex;
    const tab = pane.tabs[tabIndex];
    if (tab && tab.path !== pane.path) {
      loadPane(paneId, tab.path);
    }
  }

  // Helper methods for FileList component
  function getDirectoryData(paneId: string): DirListing | null {
    const pane = panes.value.get(paneId);
    return pane?.listing ?? null;
  }

  function isLoading(paneId: string): boolean {
    const pane = panes.value.get(paneId);
    return pane?.isLoading ?? false;
  }

  function getError(paneId: string): string | null {
    const pane = panes.value.get(paneId);
    return pane?.error ?? null;
  }

  // Initialize with default panes
  function initialize(): void {
    createPane('left', 'C:\\');
    createPane('right', 'D:\\');
    activePaneId.value = 'left';
    loadDrives();
  }

  return {
    // State
    panes,
    activePaneId,
    drives,
    drivesLoading,
    // Computed
    activePane,
    activeTab,
    // Actions
    createPane,
    removePane,
    setActivePane,
    navigateTo,
    goBack,
    goForward,
    goUp,
    refresh,
    loadDrives,
    setSort,
    setFilter,
    setSelection,
    setCursor,
    clearSelection,
    addTab,
    closeTab,
    switchTab,
    initialize,
    // Helper methods for FileList
    getDirectoryData,
    isLoading,
    getError,
    // Aliases for compatibility
    navigate: navigateTo,
    loadDirectory: loadPane,
  };
});