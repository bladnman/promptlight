use tauri::{AppHandle, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;

/// Copy text to clipboard and hide window
/// User will paste manually with Cmd+V
#[tauri::command]
pub async fn paste_and_dismiss(app: AppHandle, text: String) -> Result<(), String> {
    println!("paste_and_dismiss called with text length: {}", text.len());
    println!("Text preview: {}", &text[..text.len().min(100)]);

    // 1. Copy text to clipboard using Tauri clipboard plugin
    match app.clipboard().write_text(&text) {
        Ok(_) => println!("Successfully wrote to clipboard via Tauri plugin"),
        Err(e) => {
            println!("Failed to write to clipboard: {}", e);
            return Err(format!("Failed to write to clipboard: {}", e));
        }
    }

    // Small delay to ensure clipboard write is processed by system
    std::thread::sleep(std::time::Duration::from_millis(50));

    // 2. Hide the launcher window
    if let Some(window) = app.get_webview_window("launcher") {
        window.hide().map_err(|e| format!("Failed to hide window: {}", e))?;
    }

    Ok(())
}

/// Hide the launcher window
#[tauri::command]
pub async fn dismiss_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("launcher") {
        window.hide().map_err(|e| format!("Failed to hide window: {}", e))?;
    }
    Ok(())
}

/// Copy text to clipboard only (no window action)
#[tauri::command]
pub async fn copy_to_clipboard(app: AppHandle, text: String) -> Result<(), String> {
    app.clipboard()
        .write_text(&text)
        .map_err(|e| format!("Failed to copy to clipboard: {}", e))
}

/// Copy text to clipboard and close the editor window
#[tauri::command]
pub async fn paste_from_editor(app: AppHandle, text: String) -> Result<(), String> {
    // 1. Copy text to clipboard
    app.clipboard()
        .write_text(&text)
        .map_err(|e| format!("Failed to write to clipboard: {}", e))?;

    // Small delay to ensure clipboard write is processed
    std::thread::sleep(std::time::Duration::from_millis(50));

    // 2. Close the editor window
    if let Some(window) = app.get_webview_window("editor") {
        window.close().map_err(|e| format!("Failed to close editor: {}", e))?;
    }

    Ok(())
}
