use serde::{Deserialize, Serialize};
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: i64,
    pub path: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardData {
    pub items: Vec<FileEntry>,
    pub operation: String, // "copy" or "move"
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferTask {
    pub id: String,
    pub source: String,
    pub destination: String,
    pub progress: f64,
    pub status: String,
    pub total_bytes: u64,
    pub transferred_bytes: u64,
}