use tauri::{AppHandle, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;

use crate::os::previous_app;

/// Copy text to clipboard, return focus to previous app, and paste.
/// Uses graceful degradation - each step is attempted even if previous fails.
/// Only clipboard failure returns an error; other failures are silent.
#[tauri::command]
pub async fn paste_and_dismiss(app: AppHandle, text: String) -> Result<(), String> {
    println!("[paste] Starting paste_and_dismiss, text length: {}", text.len());

    // 1. Copy text to clipboard (MUST succeed for paste to work)
    app.clipboard()
        .write_text(&text)
        .map_err(|e| format!("Clipboard write failed: {}", e))?;
    println!("[paste] Clipboard write successful");

    // 2. Small delay for clipboard propagation to system
    std::thread::sleep(std::time::Duration::from_millis(20));

    // 3. Hide Promptlight window
    if let Some(window) = app.get_webview_window("launcher") {
        if let Err(e) = window.hide() {
            println!("[paste] Warning: Failed to hide window: {}", e);
            // Continue anyway
        }
    }

    // 4. Small delay for window to fully hide
    std::thread::sleep(std::time::Duration::from_millis(20));

    // 5. Activate previous application (silent failure)
    let focus_succeeded = match previous_app::activate_previous_app() {
        Ok(true) => {
            println!("[paste] Previous app activated");
            true
        }
        Ok(false) => {
            println!("[paste] No previous app to activate");
            false
        }
        Err(e) => {
            println!("[paste] Warning: activate failed: {}", e);
            false
        }
    };

    // 6. Only simulate paste if we successfully returned focus
    if focus_succeeded {
        // Wait for activation to complete
        std::thread::sleep(std::time::Duration::from_millis(50));

        // Simulate Cmd+V paste (silent failure)
        if let Err(e) = previous_app::simulate_paste() {
            println!("[paste] Warning: paste simulation failed: {}", e);
            // Don't return error - clipboard still has content
        } else {
            println!("[paste] Paste simulation successful");
        }
    }

    // 7. Clear stored previous app
    previous_app::clear_previous_app();

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
