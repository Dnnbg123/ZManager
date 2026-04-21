import { invoke } from "@tauri-apps/api/core"
import type { FileEntry, ClipboardData, TransferTask } from "@/entities/types"
export async function readDir(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("read_dir", { path })
}
export async function navigateTo(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("navigate_to", { path })
}
export async function getParentPath(path: string): Promise<string> {
  return invoke<string>("get_parent_path", { path })
}
export async function selectItems(paths: string[]): Promise<void> {
  return invoke<void>("select_items", { paths })
}
export async function copyItems(
  paths: string[],
  destination: string,
): Promise<void> {
  return invoke<void>("copy_items", { paths, destination })
}
export async function moveItems(
  paths: string[],
  destination: string,
): Promise<void> {
  return invoke<void>("move_items", { paths, destination })
}
export async function deleteItems(paths: string[]): Promise<void> {
  return invoke<void>("delete_items", { paths })
}
export async function renameItem(
  oldPath: string,
  newPath: string,
): Promise<void> {
  return invoke<void>("rename_item", { oldPath, newPath })
}
export async function createFolder(path: string, name: string): Promise<void> {
  return invoke<void>("create_folder", { path, name })
}
export async function setClipboard(data: ClipboardData): Promise<void> {
  return invoke<void>("set_clipboard", { data })
}
export async function getClipboard(): Promise<ClipboardData | null> {
  return invoke<ClipboardData | null>("get_clipboard")
}
export async function pasteItems(destination: string): Promise<void> {
  return invoke<void>("paste_items", { destination })
}
export async function getTransferTasks(): Promise<TransferTask[]> {
  return invoke<TransferTask[]>("get_transfer_tasks")
}
export async function pauseTransfer(taskId: string): Promise<void> {
  return invoke<void>("pause_transfer", { taskId })
}
export async function resumeTransfer(taskId: string): Promise<void> {
  return invoke<void>("resume_transfer", { taskId })
}
export async function cancelTransfer(taskId: string): Promise<void> {
  return invoke<void>("cancel_transfer", { taskId })
}
export async function searchFiles(
  path: string,
  pattern: string,
): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("search_files", { path, pattern })
}
