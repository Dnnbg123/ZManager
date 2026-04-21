export interface FileEntry {
  name: string
  isDir: boolean
  size: number
  modified: number
  path: string
}
export interface ClipboardData {
  items: FileEntry[]
  operation: "copy" | "move"
}
export interface TransferTask {
  id: string
  source: string
  destination: string
  progress: number
  status: "pending" | "running" | "paused" | "completed" | "error"
  totalBytes: number
  transferredBytes: number
}
export interface PanelState {
  id: string
  path: string
  scrollPosition: number
  selectedItems: string[]
  filter: string
}
export interface TabInfo {
  id: string
  path: string
  title: string
}
export interface LayoutNode {
  id: string
  type: "leaf" | "split"
  direction?: "horizontal" | "vertical"
  children?: LayoutNode[]
  panel?: PanelState
  tabs?: TabInfo[]
  activeTabId?: string
  size?: number
}
