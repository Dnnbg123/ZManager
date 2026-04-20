/**
 * Split View Store - Manages unlimited split-panel layout system.
 * Inspired by FilePilot.tech - supports infinite horizontal/vertical splits.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// ============================================================================
// Types
// ============================================================================

export type SplitDirection = 'horizontal' | 'vertical';

/** Leaf node - represents an actual file panel */
export interface PanelNode {
  type: 'panel';
  id: string;
  /** Path displayed in this panel */
  path: string;
  /** Tab state for this panel */
  tabs: PanelTab[];
  /** Index of active tab */
  activeTabIndex: number;
  /** Scroll position */
  scrollY: number;
  /** Selected file paths */
  selection: string[];
  /** Filter state */
  filter: string | null;
}

/** Tab within a panel */
export interface PanelTab {
  id: string;
  /** Display name for the tab */
  name: string;
  /** Full path */
  path: string;
  /** Scroll position for this tab */
  scrollY: number;
  /** Selection for this tab */
  selection: string[];
}

/** Split container node */
export interface SplitContainerNode {
  type: 'container';
  id: string;
  direction: SplitDirection;
  /** Children can be panels or nested containers */
  children: (PanelNode | SplitContainerNode)[];
  /** Size percentages for each child (must sum to 100) */
  sizes: number[];
}

/** Any node in the split tree */
export type SplitNode = PanelNode | SplitContainerNode;

/** Root layout is always a container */
export interface LayoutRoot {
  type: 'root';
  id: string;
  children: (PanelNode | SplitContainerNode)[];
  sizes: number[];
}

/** State for tracking focus and active panel */
export interface FocusState {
  /** ID of currently focused panel */
  activePanelId: string | null;
  /** ID of panel under drag hover (for visual feedback) */
  dragHoverPanelId: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Generate unique ID */
function generateId(): string {
  return crypto.randomUUID();
}

/** Create a new panel node */
function createPanel(path: string = ''): PanelNode {
  const tabId = generateId();
  return {
    type: 'panel',
    id: generateId(),
    path,
    tabs: [{
      id: tabId,
      name: path || 'Home',
      path,
      scrollY: 0,
      selection: [],
    }],
    activeTabIndex: 0,
    scrollY: 0,
    selection: [],
    filter: null,
  };
}

/** Create a new container node */
function createContainer(
  direction: SplitDirection,
  children: (PanelNode | SplitContainerNode)[],
): SplitContainerNode {
  const equalSize = 100 / children.length;
  return {
    type: 'container',
    id: generateId(),
    direction,
    children,
    sizes: children.map(() => equalSize),
  };
}

/** Find a node by ID in the tree */
function findNode(
  node: SplitNode | LayoutRoot,
  id: string,
  parent: SplitContainerNode | LayoutRoot | null = null,
): { node: SplitNode | null; parent: SplitContainerNode | LayoutRoot | null; index: number } {
  if (node.id === id) {
    return { node: node as SplitNode, parent, index: -1 };
  }

  if (node.type === 'container' || node.type === 'root') {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.id === id) {
        return { node: child, parent: node, index: i };
      }
      const result = findNode(child, id, node);
      if (result.node) {
        return result;
      }
    }
  }

  return { node: null, parent: null, index: -1 };
}

/** Get all panel IDs in the tree */
function getAllPanelIds(node: SplitNode | LayoutRoot): string[] {
  const ids: string[] = [];

  if (node.type === 'panel') {
    ids.push(node.id);
  } else {
    for (const child of node.children) {
      ids.push(...getAllPanelIds(child));
    }
  }

  return ids;
}

/** Normalize sizes to ensure they sum to 100 */
function normalizeSizes(sizes: number[]): number[] {
  const total = sizes.reduce((sum, s) => sum + s, 0);
  if (total === 0) {
    return sizes.map(() => 100 / sizes.length);
  }
  if (Math.abs(total - 100) < 0.001) {
    return sizes;
  }
  // Scale proportionally
  return sizes.map((s) => (s / total) * 100);
}

// ============================================================================
// Store Definition
// ============================================================================

export const useSplitViewStore = defineStore('splitView', () => {
  // State
  const layout = ref<LayoutRoot>({
    type: 'root',
    id: 'root',
    children: [createPanel()],
    sizes: [100],
  });

  const focus = ref<FocusState>({
    activePanelId: layout.value.children[0].id,
    dragHoverPanelId: null,
  });

  // Computed
  const activePanel = computed(() => {
    if (!focus.value.activePanelId) return null;
    const { node } = findNode(layout.value, focus.value.activePanelId!);
    return node?.type === 'panel' ? node : null;
  });

  const panelCount = computed(() => {
    return getAllPanelIds(layout.value).length;
  });

  const allPanelIds = computed(() => {
    return getAllPanelIds(layout.value);
  });

  // Actions

  /** Initialize with default layout */
  function initialize(): void {
    layout.value = {
      type: 'root',
      id: 'root',
      children: [createPanel()],
      sizes: [100],
    };
    focus.value = {
      activePanelId: layout.value.children[0].id,
      dragHoverPanelId: null,
    };
  }

  /** Reset to dual-pane horizontal layout */
  function resetToDual(): void {
    layout.value = {
      type: 'root',
      id: 'root',
      children: [createPanel(), createPanel()],
      sizes: [50, 50],
    };
    focus.value = {
      activePanelId: layout.value.children[0].id,
      dragHoverPanelId: null,
    };
  }

  /** Set active panel by ID */
  function setActivePanel(panelId: string): void {
    const { node } = findNode(layout.value, panelId);
    if (node?.type === 'panel') {
      focus.value.activePanelId = panelId;
    }
  }

  /** Split the active panel */
  function splitActive(direction: SplitDirection): void {
    if (!focus.value.activePanelId) return;

    const { node, parent, index } = findNode(layout.value, focus.value.activePanelId);
    if (!node || node.type !== 'panel' || !parent || index === -1) return;

    // Create new panel with same path
    const newPanel = createPanel(node.path);

    // Replace current panel with container holding both
    const container = createContainer(direction, [node, newPanel]);

    parent.children[index] = container;
    // Update sizes: split the original size between two children
    const originalSize = parent.sizes[index];
    parent.sizes.splice(index, 1, originalSize / 2, originalSize / 2);

    // Focus the new panel
    focus.value.activePanelId = newPanel.id;
  }

  /** Split a specific panel */
  function splitPanel(panelId: string, direction: SplitDirection): void {
    const previousActive = focus.value.activePanelId;
    focus.value.activePanelId = panelId;
    splitActive(direction);
    if (previousActive) {
      focus.value.activePanelId = previousActive;
    }
  }

  /** Close a panel */
  function closePanel(panelId: string): void {
    const { node, parent, index } = findNode(layout.value, panelId);
    if (!node || !parent || index === -1) return;

    // Can't close the last panel
    const panelIds = getAllPanelIds(layout.value);
    if (panelIds.length <= 1) {
      return;
    }

    // Remove the panel
    parent.children.splice(index, 1);
    parent.sizes.splice(index, 1);

    // If parent now has only one child, unwrap it
    if (parent.type === 'container' && parent.children.length === 1) {
      const grandparentResult = findNode(layout.value, parent.id);
      const grandparent = grandparentResult.parent;
      const grandparentIndex = grandparentResult.index;

      if (grandparent && grandparentIndex !== -1) {
        const singleChild = parent.children[0];
        grandparent.children[grandparentIndex] = singleChild;
        // Inherit the size
        grandparent.sizes[grandparentIndex] = parent.sizes[0];
      }
    }

    // Normalize sizes
    parent.sizes = normalizeSizes(parent.sizes);

    // Update focus if needed
    if (focus.value.activePanelId === panelId) {
      const remainingPanels = getAllPanelIds(layout.value);
      focus.value.activePanelId = remainingPanels[Math.min(0, remainingPanels.length - 1)];
    }
  }

  /** Duplicate the active panel */
  function duplicateActive(): void {
    if (!focus.value.activePanelId) return;

    const { node, parent, index } = findNode(layout.value, focus.value.activePanelId);
    if (!node || node.type !== 'panel' || !parent || index === -1) return;

    // Create a deep copy of the panel
    const duplicatedPanel: PanelNode = {
      ...structuredClone(node),
      id: generateId(),
      tabs: node.tabs.map((tab) => ({ ...tab, id: generateId() })),
    };

    // Insert after current panel
    parent.children.splice(index + 1, 0, duplicatedPanel);
    parent.sizes.splice(index + 1, 0, parent.sizes[index] / 2);
    parent.sizes[index] = parent.sizes[index] / 2;

    // Focus the duplicated panel
    focus.value.activePanelId = duplicatedPanel.id;
  }

  /** Resize a split */
  function resizeSplit(containerId: string, childIndex: number, newSize: number): void {
    const { node } = findNode(layout.value, containerId);
    if (!node || node.type !== 'container') return;

    if (childIndex < 0 || childIndex >= node.children.length - 1) return;

    const currentSize = node.sizes[childIndex];
    const nextSize = node.sizes[childIndex + 1];
    const totalSize = currentSize + nextSize;

    // Ensure minimum size (10%)
    const minSize = 10;
    const adjustedNewSize = Math.max(minSize, Math.min(totalSize - minSize, newSize));

    node.sizes[childIndex] = adjustedNewSize;
    node.sizes[childIndex + 1] = totalSize - adjustedNewSize;
  }

  /** Add a new panel to the root layout */
  function addPanel(path: string = ''): void {
    const newPanel = createPanel(path);
    layout.value.children.push(newPanel);
    layout.value.sizes.push(100 / layout.value.children.length);
    focus.value.activePanelId = newPanel.id;
  }

  /** Update panel path */
  function updatePanelPath(panelId: string, path: string): void {
    const { node } = findNode(layout.value, panelId);
    if (!node || node.type !== 'panel') return;

    node.path = path;
    // Update current tab name
    const currentTab = node.tabs[node.activeTabIndex];
    if (currentTab) {
      currentTab.name = path.split(/[\\/]/).pop() || path || 'Home';
      currentTab.path = path;
    }
  }

  /** Add a tab to a panel */
  function addTab(panelId: string, path: string): void {
    const { node } = findNode(layout.value, panelId);
    if (!node || node.type !== 'panel') return;

    const newTab: PanelTab = {
      id: generateId(),
      name: path.split(/[\\/]/).pop() || path || 'New Tab',
      path,
      scrollY: 0,
      selection: [],
    };

    node.tabs.push(newTab);
    node.activeTabIndex = node.tabs.length - 1;
    node.path = path;
  }

  /** Close a tab in a panel */
  function closeTab(panelId: string, tabIndex: number): void {
    const { node } = findNode(layout.value, panelId);
    if (!node || node.type !== 'panel') return;

    if (node.tabs.length <= 1) {
      // Don't close the last tab, close the panel instead
      closePanel(panelId);
      return;
    }

    node.tabs.splice(tabIndex, 1);

    // Adjust active tab index
    if (node.activeTabIndex >= tabIndex) {
      node.activeTabIndex = Math.max(0, node.activeTabIndex - 1);
    }

    // Update path to the new active tab
    const currentTab = node.tabs[node.activeTabIndex];
    if (currentTab) {
      node.path = currentTab.path;
    }
  }

  /** Switch to a specific tab */
  function switchTab(panelId: string, tabIndex: number): void {
    const { node } = findNode(layout.value, panelId);
    if (!node || node.type !== 'panel') return;

    if (tabIndex < 0 || tabIndex >= node.tabs.length) return;

    // Save current tab state
    const currentTab = node.tabs[node.activeTabIndex];
    if (currentTab) {
      currentTab.scrollY = node.scrollY;
      currentTab.selection = [...node.selection];
    }

    node.activeTabIndex = tabIndex;

    // Restore new tab state
    const newTab = node.tabs[tabIndex];
    if (newTab) {
      node.path = newTab.path;
      node.scrollY = newTab.scrollY;
      node.selection = [...newTab.selection];
    }
  }

  /** Update panel selection */
  function updateSelection(panelId: string, selection: string[]): void {
    const { node } = findNode(layout.value, panelId);
    if (!node || node.type !== 'panel') return;

    node.selection = selection;
    // Also update current tab
    const currentTab = node.tabs[node.activeTabIndex];
    if (currentTab) {
      currentTab.selection = [...selection];
    }
  }

  /** Update panel scroll position */
  function updateScroll(panelId: string, scrollY: number): void {
    const { node } = findNode(layout.value, panelId);
    if (!node || node.type !== 'panel') return;

    node.scrollY = scrollY;
    // Also update current tab
    const currentTab = node.tabs[node.activeTabIndex];
    if (currentTab) {
      currentTab.scrollY = scrollY;
    }
  }

  /** Set drag hover state */
  function setDragHover(panelId: string | null): void {
    focus.value.dragHoverPanelId = panelId;
  }

  /** Navigate focus to adjacent panel */
  function navigateFocus(direction: 'next' | 'prev'): void {
    const panelIds = getAllPanelIds(layout.value);
    if (panelIds.length <= 1) return;

    const currentIndex = focus.value.activePanelId
      ? panelIds.indexOf(focus.value.activePanelId)
      : -1;

    let newIndex: number;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % panelIds.length;
    } else {
      newIndex = (currentIndex - 1 + panelIds.length) % panelIds.length;
    }

    focus.value.activePanelId = panelIds[newIndex];
  }

  /** Get panel by ID */
  function getPanel(panelId: string): PanelNode | null {
    const { node } = findNode(layout.value, panelId);
    return node?.type === 'panel' ? node : null;
  }

  /** Check if a panel exists */
  function hasPanel(panelId: string): boolean {
    return getAllPanelIds(layout.value).includes(panelId);
  }

  return {
    // State
    layout,
    focus,
    // Computed
    activePanel,
    panelCount,
    allPanelIds,
    // Actions
    initialize,
    resetToDual,
    setActivePanel,
    splitActive,
    splitPanel,
    closePanel,
    duplicateActive,
    resizeSplit,
    addPanel,
    updatePanelPath,
    addTab,
    closeTab,
    switchTab,
    updateSelection,
    updateScroll,
    setDragHover,
    navigateFocus,
    getPanel,
    hasPanel,
  };
});