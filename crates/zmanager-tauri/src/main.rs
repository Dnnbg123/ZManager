//! ZManager Tauri Application Entry Point
//!
//! This is the binary entry point for the ZManager GUI application.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    filepilot_vue_lib::run()
}