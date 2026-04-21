mod file_ops;
mod types;
use file_ops::*;
use types::{ClipboardData, FileEntry, TransferTask};
use std::sync::Mutex;
use tauri::State;
struct AppState {
    clipboard: Mutex<Option<ClipboardData>>,
    transfer_tasks: Mutex<Vec<TransferTask>>,
}
#[tauri::command]
fn read_dir(path: String) -> Result<Vec<FileEntry>, String> {
    file_ops::read_dir(&path).map_err(|e| e.to_string())
}
#[tauri::command]
fn navigate_to(path: String) -> Result<Vec<FileEntry>, String> {
    file_ops::read_dir(&path).map_err(|e| e.to_string())
}
#[tauri::command]
fn get_parent_path(path: String) -> String {
    file_ops::get_parent_path(&path)
}
#[tauri::command]
fn select_items(_paths: Vec<String>) -> Result<(), String> {
    // Selection is handled on frontend
    Ok(())
}
#[tauri::command]
fn copy_items(paths: Vec<String>, destination: String) -> Result<(), String> {
    file_ops::copy_items(&paths, &destination).map_err(|e| e.to_string())
}
#[tauri::command]
fn move_items(paths: Vec<String>, destination: String) -> Result<(), String> {
    file_ops::move_items(&paths, &destination).map_err(|e| e.to_string())
}
#[tauri::command]
fn delete_items(paths: Vec<String>) -> Result<(), String> {
    file_ops::delete_items(&paths).map_err(|e| e.to_string())
}
#[tauri::command]
fn rename_item(old_path: String, new_path: String) -> Result<(), String> {
    file_ops::rename_item(&old_path, &new_path).map_err(|e| e.to_string())
}
#[tauri::command]
fn create_folder(path: String, name: String) -> Result<(), String> {
    file_ops::create_folder(&path, &name).map_err(|e| e.to_string())
}
#[tauri::command]
fn set_clipboard(
    data: ClipboardData,
    state: State<AppState>,
) -> Result<(), String> {
    let mut clipboard = state.clipboard.lock().unwrap();
    *clipboard = Some(data);
    Ok(())
}
#[tauri::command]
fn get_clipboard(
    state: State<AppState>,
) -> Result<Option<ClipboardData>, String> {
    let clipboard = state.clipboard.lock().unwrap();
    Ok(clipboard.clone())
}
#[tauri::command]
fn paste_items(destination: String, state: State<AppState>) -> Result<(), String> {
    let clipboard = state.clipboard.lock().unwrap();
    if let Some(data) = clipboard.as_ref() {
        let paths: Vec<String> = data.items.iter().map(|item| item.path.clone()).collect();
        match data.operation.as_str() {
            "copy" => file_ops::copy_items(&paths, &destination).map_err(|e| e.to_string()),
            "move" => file_ops::move_items(&paths, &destination).map_err(|e| e.to_string()),
            _ => Err("Unknown operation".to_string()),
        }
    } else {
        Err("Clipboard is empty".to_string())
    }
}
#[tauri::command]
fn get_transfer_tasks(state: State<AppState>) -> Result<Vec<TransferTask>, String> {
    let tasks = state.transfer_tasks.lock().unwrap();
    Ok(tasks.clone())
}
#[tauri::command]
fn pause_transfer(_task_id: String) -> Result<(), String> {
    // TODO: Implement transfer pause
    Ok(())
}
#[tauri::command]
fn resume_transfer(_task_id: String) -> Result<(), String> {
    // TODO: Implement transfer resume
    Ok(())
}
#[tauri::command]
fn cancel_transfer(_task_id: String) -> Result<(), String> {
    // TODO: Implement transfer cancel
    Ok(())
}
#[tauri::command]
fn search_files(_path: String, _pattern: String) -> Result<Vec<FileEntry>, String> {
    // TODO: Implement search
    Ok(vec![])
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            clipboard: Mutex::new(None),
            transfer_tasks: Mutex::new(vec![]),
        })
        .invoke_handler(tauri::generate_handler![
            read_dir,
            navigate_to,
            get_parent_path,
            select_items,
            copy_items,
            move_items,
            delete_items,
            rename_item,
            create_folder,
            set_clipboard,
            get_clipboard,
            paste_items,
            get_transfer_tasks,
            pause_transfer,
            resume_transfer,
            cancel_transfer,
            search_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

        }