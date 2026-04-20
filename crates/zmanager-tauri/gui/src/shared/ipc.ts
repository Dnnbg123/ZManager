/**
 * Typed Tauri IPC client for ZManager.
 * Wraps `@tauri-apps/api/core` invoke with proper typing.
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  ClipboardState,
  ConflictPolicy,
  DirListing,
  DriveInfo,
  Favorite,
  FilterSpec,
  IpcResponse,
  JobProgress,
  JobReport,
  JobState,
  SortSpec,
  TransferItem,
  TransferMode,
} from '../types';

// ============================================================================
// IPC Error Handling
// ============================================================================

/** Custom error class for IPC failures */
export class IpcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IpcError';
  }
}

/** Unwrap IPC response, throwing on error */
function unwrap<T>(response: IpcResponse<T>): T {
  if (!response.ok || response.data === undefined) {
    throw new IpcError(response.error ?? 'Unknown IPC error');
  }
  return response.data;
}

// ============================================================================
// Directory Operations
// ============================================================================

/**
 * List directory contents with optional sorting and filtering.
 */
export async function listDir(
  path: string,
  sort?: SortSpec | null,
  filter?: FilterSpec | null,
): Promise<DirListing> {
  const response = await invoke<IpcResponse<DirListing>>('zmanager_list_dir', {
    path,
    sort: sort ?? null,
    filter: filter ?? null,
  });
  return unwrap(response);
}

/**
 * Navigate to a directory and get its contents.
 */
export async function navigate(
  path: string,
  sort?: SortSpec | null,
  filter?: FilterSpec | null,
): Promise<DirListing> {
  const response = await invoke<IpcResponse<DirListing>>('zmanager_navigate', {
    path,
    sort: sort ?? null,
    filter: filter ?? null,
  });
  return unwrap(response);
}

/**
 * Get the parent directory path.
 */
export async function getParent(path: string): Promise<string | null> {
  const response = await invoke<IpcResponse<string | null>>('zmanager_get_parent', { path });
  return unwrap(response);
}

// ============================================================================
// Drive Operations
// ============================================================================

/**
 * Get list of available drives on the system.
 */
export async function getDrives(): Promise<DriveInfo[]> {
  const response = await invoke<IpcResponse<DriveInfo[]>>('zmanager_get_drives');
  return unwrap(response);
}

// ============================================================================
// File Operations
// ============================================================================

/** Result of a delete operation */
export interface DeleteResult {
  deleted: number;
  failed: number;
  errors: string[];
}

/**
 * Delete files/folders to the Recycle Bin.
 */
export async function deleteEntries(paths: string[]): Promise<DeleteResult> {
  const response = await invoke<IpcResponse<DeleteResult>>('zmanager_delete_entries', { paths });
  return unwrap(response);
}

/**
 * Rename a file or folder.
 */
export async function renameEntry(path: string, newName: string): Promise<string> {
  const response = await invoke<IpcResponse<string>>('zmanager_rename_entry', { path, newName });
  return unwrap(response);
}

/**
 * Create a new folder.
 */
export async function createFolder(parent: string, name: string): Promise<string> {
  const response = await invoke<IpcResponse<string>>('zmanager_create_folder', { parent, name });
  return unwrap(response);
}

/**
 * Create a new empty file.
 */
export async function createFile(parent: string, name: string): Promise<string> {
  const response = await invoke<IpcResponse<string>>('zmanager_create_file', { parent, name });
  return unwrap(response);
}

/**
 * Open a file or folder with the default application.
 */
export async function openFile(path: string): Promise<void> {
  const response = await invoke<IpcResponse<null>>('zmanager_open_file', { path });
  unwrap(response);
}

/** File properties from backend */
export interface FileProperties {
  path: string;
  name: string;
  size: number;
  is_dir: boolean;
  is_readonly: boolean;
  is_hidden: boolean;
  is_system: boolean;
  created: string | null;
  modified: string | null;
  accessed: string | null;
}

/**
 * Get properties of a file or folder.
 */
export async function getProperties(path: string): Promise<FileProperties> {
  const response = await invoke<IpcResponse<FileProperties>>('zmanager_get_properties', { path });
  return unwrap(response);
}

// ============================================================================
// Favorites Management
// ============================================================================

/**
 * Get all favorites.
 */
export async function getFavorites(): Promise<Favorite[]> {
  const response = await invoke<IpcResponse<Favorite[]>>('zmanager_get_favorites');
  return unwrap(response);
}

/**
 * Add a new favorite.
 */
export async function addFavorite(
  name: string,
  path: string,
  icon?: string | null,
): Promise<Favorite> {
  const response = await invoke<IpcResponse<Favorite>>('zmanager_add_favorite', {
    name,
    path,
    icon: icon ?? null,
  });
  return unwrap(response);
}

/**
 * Remove a favorite by ID.
 */
export async function removeFavorite(id: string): Promise<boolean> {
  const response = await invoke<IpcResponse<boolean>>('zmanager_remove_favorite', { id });
  return unwrap(response);
}

/**
 * Reorder favorites.
 */
export async function reorderFavorites(ids: string[]): Promise<void> {
  const response = await invoke<IpcResponse<void>>('zmanager_reorder_favorites', { ids });
  unwrap(response);
}

// ============================================================================
// Clipboard Operations
// ============================================================================

/**
 * Copy paths to clipboard.
 */
export async function clipboardCopy(paths: string[]): Promise<boolean> {
  const response = await invoke<IpcResponse<boolean>>('zmanager_clipboard_copy', { paths });
  return unwrap(response);
}

/**
 * Cut paths to clipboard.
 */
export async function clipboardCut(paths: string[]): Promise<boolean> {
  const response = await invoke<IpcResponse<boolean>>('zmanager_clipboard_cut', { paths });
  return unwrap(response);
}

/**
 * Get clipboard state.
 */
export async function clipboardGet(): Promise<ClipboardState> {
  const response = await invoke<IpcResponse<ClipboardState>>('zmanager_clipboard_get');
  return unwrap(response);
}

/**
 * Paste from clipboard to target directory.
 */
export async function clipboardPaste(targetDir: string): Promise<number> {
  const response = await invoke<IpcResponse<number>>('zmanager_clipboard_paste', { targetDir });
  return unwrap(response);
}

/**
 * Clear clipboard.
 */
export async function clipboardClear(): Promise<void> {
  const response = await invoke<IpcResponse<void>>('zmanager_clipboard_clear');
  unwrap(response);
}

// ============================================================================
// Transfer/Job Operations
// ============================================================================

/**
 * Start a transfer job.
 */
export async function transferStart(
  items: TransferItem[],
  mode: TransferMode,
  conflict: ConflictPolicy,
): Promise<string> {
  const response = await invoke<IpcResponse<string>>('zmanager_transfer_start', {
    items,
    mode,
    conflict,
  });
  return unwrap(response);
}

/**
 * Pause a transfer job.
 */
export async function transferPause(jobId: string): Promise<boolean> {
  const response = await invoke<IpcResponse<boolean>>('zmanager_transfer_pause', { jobId });
  return unwrap(response);
}

/**
 * Resume a transfer job.
 */
export async function transferResume(jobId: string): Promise<boolean> {
  const response = await invoke<IpcResponse<boolean>>('zmanager_transfer_resume', { jobId });
  return unwrap(response);
}

/**
 * Cancel a transfer job.
 */
export async function transferCancel(jobId: string): Promise<boolean> {
  const response = await invoke<IpcResponse<boolean>>('zmanager_transfer_cancel', { jobId });
  return unwrap(response);
}

/**
 * List all jobs.
 */
export async function jobsList(): Promise<Array<{ jobId: string; kind: string; state: JobState; progress?: JobProgress }>> {
  const response = await invoke<IpcResponse<Array<{ jobId: string; kind: string; state: JobState; progress?: JobProgress }>>>('zmanager_jobs_list');
  return unwrap(response);
}

/**
 * Get job report.
 */
export async function jobReport(jobId: string): Promise<JobReport> {
  const response = await invoke<IpcResponse<JobReport>>('zmanager_job_report', { jobId });
  return unwrap(response);
}

// ============================================================================
// Event Listening
// ============================================================================

import { listen, UnlistenFn } from '@tauri-apps/api/event';

/**
 * Listen for job progress events.
 */
export function onJobProgress(
  handler: (payload: JobProgress & { jobId: string }) => void,
): Promise<UnlistenFn> {
  return listen('zmanager://job-progress', (event) => {
    handler(event.payload as JobProgress & { jobId: string });
  });
}

/**
 * Listen for job state changes.
 */
export function onJobState(
  handler: (payload: { jobId: string; state: JobState; error?: string; report?: JobReport['summary'] }) => void,
): Promise<UnlistenFn> {
  return listen('zmanager://job-state', (event) => {
    handler(event.payload as { jobId: string; state: JobState; error?: string; report?: JobReport['summary'] });
  });
}

/**
 * Listen for directory change events (file watching).
 */
export function onDirChanged(
  handler: (payload: { watchId: string; path: string; kind: string; affectedPaths: string[] }) => void,
): Promise<UnlistenFn> {
  return listen('zmanager://dir-changed', (event) => {
    handler(event.payload as { watchId: string; path: string; kind: string; affectedPaths: string[] });
  });
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type { DirListing, DriveInfo, EntryMeta, FilterSpec, SortSpec } from '../types';
