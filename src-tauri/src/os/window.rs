use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

/// Open the editor window, optionally loading a specific prompt
#[tauri::command]
pub async fn open_editor_window(app: AppHandle, prompt_id: Option<String>) -> Result<(), String> {
    let label = "editor";

    // If window already exists, show it and optionally emit event to load prompt
    if let Some(window) = app.get_webview_window(label) {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;

        // Emit event to load specific prompt if provided
        if let Some(id) = prompt_id {
            window.emit("load-prompt", id).map_err(|e| e.to_string())?;
        }
        return Ok(());
    }

    // Build URL with window type parameter and optional prompt ID
    let url = match &prompt_id {
        Some(id) => format!("index.html?window=editor&id={}", id),
        None => "index.html?window=editor".to_string(),
    };

    // Create new editor window
    WebviewWindowBuilder::new(&app, label, WebviewUrl::App(url.into()))
        .title("Promptlight Editor")
        .inner_size(1000.0, 700.0)
        .min_inner_size(800.0, 600.0)
        .center()
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}
