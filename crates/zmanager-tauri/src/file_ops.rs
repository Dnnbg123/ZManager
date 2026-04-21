use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;
use crate::types::FileEntry;
#[derive(Error, Debug)]
pub enum FileError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Invalid path: {0}")]
    InvalidPath(String),
}
pub type Result<T> = std::result::Result<T, FileError>;
pub fn read_dir(path: &str) -> Result<Vec<FileEntry>> {
    let dir_path = Path::new(path);
    if !dir_path.exists() {
        return Err(FileError::InvalidPath(format!("Path does not exist: {}", path)));
    }
    let entries = fs::read_dir(dir_path)?;
    let mut result = Vec::new();
    for entry in entries {
        let entry = entry?;
        let metadata = entry.metadata()?;
        let file_name = entry.file_name().to_string_lossy().to_string();
        let file_path = entry.path().to_string_lossy().to_string();
        result.push(FileEntry {
            name: file_name,
            is_dir: metadata.is_dir(),
            size: if metadata.is_file() { metadata.len() } else { 0 },
            modified: metadata.modified()
                .map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis() as i64)
                .unwrap_or(0),
            path: file_path,
        });
    }
    // Sort: directories first, then files, alphabetically
    result.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });
    Ok(result)
}
pub fn get_parent_path(path: &str) -> String {
    let path_buf = PathBuf::from(path);
    path_buf.parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string())
}
pub fn create_folder(parent_path: &str, name: &str) -> Result<()> {
    let folder_path = Path::new(parent_path).join(name);
    fs::create_dir_all(&folder_path)?;
    Ok(())
}
pub fn rename_item(old_path: &str, new_path: &str) -> Result<()> {
    fs::rename(old_path, new_path)?;
    Ok(())
}
pub fn delete_items(paths: &[String]) -> Result<()> {
    for path in paths {
        let path_buf = Path::new(path);
        if path_buf.is_dir() {
            fs::remove_dir_all(path_buf)?;
        } else {
            fs::remove_file(path_buf)?;
        }
    }
    Ok(())
}
pub fn copy_items(paths: &[String], destination: &str) -> Result<()> {
    let dest_path = Path::new(destination);
    for source_path in paths {
        let source = Path::new(source_path);
        let file_name = source.file_name().ok_or_else(|| {
            FileError::InvalidPath(format!("Invalid source path: {}", source_path))
        })?;
        let target = dest_path.join(file_name);
        if source.is_dir() {
            copy_dir_all(source, &target)?;
        } else {
            fs::copy(source, &target)?;
        }
    }
    Ok(())
}
fn copy_dir_all(src: &Path, dst: &Path) -> Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let new_src = entry.path();
        let new_dst = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_dir_all(&new_src, &new_dst)?;
        } else {
            fs::copy(&new_src, &new_dst)?;
        }
    }
    Ok(())
}
pub fn move_items(paths: &[String], destination: &str) -> Result<()> {
    let dest_path = Path::new(destination);
    for source_path in paths {
        let source = Path::new(source_path);
        let file_name = source.file_name().ok_or_else(|| {
            FileError::InvalidPath(format!("Invalid source path: {}", source_path))
        })?;
        let target = dest_path.join(file_name);
        fs::rename(source, &target)?;
    }
    Ok(())
}
