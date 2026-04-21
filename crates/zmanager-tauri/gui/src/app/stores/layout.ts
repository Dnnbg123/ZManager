import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type {
  LayoutNode,
  PanelState,
  TabInfo,
  FileEntry,
} from "@/entities/types"
import * as api from "@/shared/api"
function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}
function createInitialPanel(path: string = "/"): PanelState {
  return {
    id: generateId(),
    path,
    scrollPosition: 0,
    selectedItems: [],
    filter: "",
  }
}
function createInitialTab(path: string = "/"): TabInfo {
  const parts = path.split(/[\\/]/).filter(Boolean)
  const title = parts.length > 0 ? parts[parts.length - 1] : path
  return {
    id: generateId(),
    path,
    title: title || "Root",
  }
}
function createLeafNode(path: string = "/"): LayoutNode {
  return {
    id: generateId(),
    type: "leaf",
    panel: createInitialPanel(path),
    tabs: [createInitialTab(path)],
    activeTabId: undefined,
    size: 1,
  }
}
export const useLayoutStore = defineStore("layout", () => {
  const rootLayout = ref<LayoutNode>(createLeafNode())
  const activePanelId = ref<string | null>(null)
  const fileCache = ref<Map<string, FileEntry[]>>(new Map())
  const activePanel = computed(() => {
    if (!activePanelId.value) return null
    return findPanel(rootLayout.value, activePanelId.value)
  })
  function findPanel(node: LayoutNode, panelId: string): PanelState | null {
    if (node.type === "leaf" && node.panel?.id === panelId) {
      return node.panel
    }
    if (node.children) {
      for (const child of node.children) {
        const found = findPanel(child, panelId)
        if (found) return found
      }
    }
    return null
  }
  function findNodeById(node: LayoutNode, nodeId: string): LayoutNode | null {
    if (node.id === nodeId) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, nodeId)
        if (found) return found
      }
    }
    return null
  }
  function setActivePanel(panelId: string) {
    activePanelId.value = panelId
  }
  function splitPanel(direction: "horizontal" | "vertical") {
    if (!activePanelId.value) return
    const newPanel = createLeafNode(activePanel.value?.path || "/")
    const splitNode: LayoutNode = {
      id: generateId(),
      type: "split",
      direction,
      children: [],
      size: 1,
    }
    const replaceNodeWithSplit = (
      node: LayoutNode,
      targetId: string,
    ): LayoutNode => {
      if (node.id === targetId) {
        const existingPanel = { ...node }
        existingPanel.size = 0.5
        splitNode.children = [existingPanel, newPanel]
        return splitNode
      }
      if (node.children) {
        node.children = node.children.map((child) =>
          replaceNodeWithSplit(child, targetId),
        )
      }
      return node
    }
    if (activePanelId.value) {
      rootLayout.value = replaceNodeWithSplit(
        rootLayout.value,
        activePanelId.value,
      )
      activePanelId.value = newPanel.panel!.id
    }
  }
  function closePanel(panelId: string) {
    const removePanel = (
      node: LayoutNode,
      targetId: string,
    ): LayoutNode | null => {
      if (node.type === "leaf" && node.panel?.id === targetId) {
        return null
      }
      if (node.children) {
        node.children = node.children
          .map((child) => removePanel(child, targetId))
          .filter((child): child is LayoutNode => child !== null)
        if (node.children.length === 1 && node.type === "split") {
          return node.children[0]
        }
      }
      return node
    }
    const newLayout = removePanel(rootLayout.value, panelId)
    if (newLayout) {
      rootLayout.value = newLayout
    }
    if (activePanelId.value === panelId) {
      activePanelId.value = getFirstPanelId(rootLayout.value)
    }
  }
  function getFirstPanelId(node: LayoutNode): string | null {
    if (node.type === "leaf" && node.panel) {
      return node.panel.id
    }
    if (node.children && node.children.length > 0) {
      return getFirstPanelId(node.children[0])
    }
    return null
  }
  function updatePanelPath(panelId: string, newPath: string) {
    const updateInNode = (node: LayoutNode): void => {
      if (node.type === "leaf" && node.panel?.id === panelId) {
        node.panel.path = newPath
        const tab = node.tabs?.find((t) => t.id === node.activeTabId)
        if (tab) {
          tab.path = newPath
          const parts = newPath.split(/[\\/]/).filter(Boolean)
          tab.title = parts.length > 0 ? parts[parts.length - 1] : newPath
        }
      }
      if (node.children) {
        node.children.forEach(updateInNode)
      }
    }
    updateInNode(rootLayout.value)
  }
  function addTab(panelId: string, path: string) {
    const addInNode = (node: LayoutNode): void => {
      if (node.type === "leaf" && node.panel?.id === panelId) {
        const newTab = createInitialTab(path)
        if (!node.tabs) node.tabs = []
        node.tabs.push(newTab)
        node.activeTabId = newTab.id
        node.panel.path = path
      }
      if (node.children) {
        node.children.forEach(addInNode)
      }
    }
    addInNode(rootLayout.value)
  }
  function closeTab(panelId: string, tabId: string) {
    const closeInNode = (node: LayoutNode): void => {
      if (node.type === "leaf" && node.panel?.id === panelId && node.tabs) {
        const tabIndex = node.tabs.findIndex((t) => t.id === tabId)
        if (tabIndex > -1) {
          node.tabs.splice(tabIndex, 1)
          if (node.activeTabId === tabId && node.tabs.length > 0) {
            const newIndex = Math.min(tabIndex, node.tabs.length - 1)
            node.activeTabId = node.tabs[newIndex].id
            node.panel.path = node.tabs[newIndex].path
          }
        }
      }
      if (node.children) {
        node.children.forEach(closeInNode)
      }
    }
    closeInNode(rootLayout.value)
  }
  function setActiveTab(panelId: string, tabId: string) {
    const setInNode = (node: LayoutNode): void => {
      if (node.type === "leaf" && node.panel?.id === panelId && node.tabs) {
        const tab = node.tabs.find((t) => t.id === tabId)
        if (tab) {
          node.activeTabId = tabId
          node.panel.path = tab.path
        }
      }
      if (node.children) {
        node.children.forEach(setInNode)
      }
    }
    setInNode(rootLayout.value)
  }
  async function loadDirectory(path: string): Promise<FileEntry[]> {
    if (fileCache.value.has(path)) {
      return fileCache.value.get(path)!
    }
    try {
      const entries = await api.readDir(path)
      fileCache.value.set(path, entries)
      return entries
    } catch (error) {
      console.error("Failed to load directory:", error)
      return []
    }
  }
  function clearCache() {
    fileCache.value.clear()
  }
  return {
    rootLayout,
    activePanelId,
    activePanel,
    setActivePanel,
    splitPanel,
    closePanel,
    updatePanelPath,
    addTab,
    closeTab,
    setActiveTab,
    loadDirectory,
    clearCache,
  }
})
