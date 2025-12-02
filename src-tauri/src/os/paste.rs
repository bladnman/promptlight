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

/// Convert a string to snake_case for filename
fn to_snake_case(s: &str) -> String {
    let mut result = String::new();
    let mut prev_was_lower = false;

    for c in s.chars() {
        if c.is_whitespace() || c == '-' || c == '_' {
            if !result.is_empty() && !result.ends_with('_') {
                result.push('_');
            }
            prev_was_lower = false;
        } else if c.is_uppercase() {
            if prev_was_lower && !result.ends_with('_') {
                result.push('_');
            }
            result.push(c.to_lowercase().next().unwrap_or(c));
            prev_was_lower = false;
        } else if c.is_alphanumeric() {
            result.push(c.to_lowercase().next().unwrap_or(c));
            prev_was_lower = c.is_lowercase();
        }
        // Skip non-alphanumeric characters
    }

    // Remove trailing underscores
    while result.ends_with('_') {
        result.pop();
    }

    if result.is_empty() {
        "prompt".to_string()
    } else {
        result
    }
}

/// Copy prompt as a markdown file to clipboard and dismiss
#[tauri::command]
pub async fn copy_as_markdown_file(app: AppHandle, name: String, content: String) -> Result<(), String> {
    println!("[paste] Starting copy_as_markdown_file, name: {}", name);

    // 1. Create temp file with snake_case name
    let filename = format!("{}.md", to_snake_case(&name));
    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join(&filename);

    std::fs::write(&file_path, &content)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    println!("[paste] Created temp file: {:?}", file_path);

    // 2. Copy file to clipboard using platform-specific API
    #[cfg(target_os = "macos")]
    {
        copy_file_to_clipboard_macos(&file_path)?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        // Fallback: just copy the content as text
        app.clipboard()
            .write_text(&content)
            .map_err(|e| format!("Clipboard write failed: {}", e))?;
    }

    // 3. Longer delay for file clipboard propagation (files take longer than text)
    std::thread::sleep(std::time::Duration::from_millis(50));

    // 4. Hide Promptlight window
    if let Some(window) = app.get_webview_window("launcher") {
        if let Err(e) = window.hide() {
            println!("[paste] Warning: Failed to hide window: {}", e);
        }
    }

    // 5. Small delay for window to fully hide
    std::thread::sleep(std::time::Duration::from_millis(20));

    // 6. Activate previous application (silent failure)
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

    // 7. Only simulate paste if we successfully returned focus
    if focus_succeeded {
        // Wait for activation to complete (longer for file paste)
        std::thread::sleep(std::time::Duration::from_millis(100));

        // Simulate Cmd+V paste (silent failure)
        if let Err(e) = previous_app::simulate_paste() {
            println!("[paste] Warning: paste simulation failed: {}", e);
        } else {
            println!("[paste] Paste simulation successful");
        }
    }

    // 8. Clear stored previous app
    previous_app::clear_previous_app();

    println!("[paste] copy_as_markdown_file complete");
    Ok(())
}

#[cfg(target_os = "macos")]
fn copy_file_to_clipboard_macos(file_path: &std::path::Path) -> Result<(), String> {
    use cocoa::base::{id, nil};
    use cocoa::foundation::{NSArray, NSString};
    use objc::{class, msg_send, sel, sel_impl};

    unsafe {
        // Get NSPasteboard
        let pasteboard: id = msg_send![class!(NSPasteboard), generalPasteboard];
        if pasteboard == nil {
            return Err("Failed to get NSPasteboard".to_string());
        }

        // Clear pasteboard
        let _: () = msg_send![pasteboard, clearContents];

        // Create file URL
        let path_str = file_path.to_str()
            .ok_or("Invalid file path")?;
        let ns_path: id = NSString::alloc(nil).init_str(path_str);
        let file_url: id = msg_send![class!(NSURL), fileURLWithPath: ns_path];

        if file_url == nil {
            return Err("Failed to create file URL".to_string());
        }

        // Create array with the URL
        let objects: id = NSArray::arrayWithObject(nil, file_url);

        // Write to pasteboard
        let success: bool = msg_send![pasteboard, writeObjects: objects];

        if !success {
            return Err("Failed to write file URL to pasteboard".to_string());
        }

        println!("[paste] File URL copied to clipboard: {:?}", file_path);
        Ok(())
    }
}
