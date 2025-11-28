use serde::Deserialize;
use tauri::{AppHandle, Emitter, LogicalPosition, Manager, WebviewUrl, WebviewWindowBuilder};

/// Screen bounds passed from frontend for window positioning
#[derive(Debug, Clone, Deserialize)]
pub struct ScreenBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Open the editor window, optionally loading a specific prompt
/// If screen_bounds is provided, the window will be centered on that screen
#[tauri::command]
pub async fn open_editor_window(
    app: AppHandle,
    prompt_id: Option<String>,
    screen_bounds: Option<ScreenBounds>,
) -> Result<(), String> {
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

    let window_width = 1000.0;
    let window_height = 700.0;

    // Create new editor window
    let mut builder = WebviewWindowBuilder::new(&app, label, WebviewUrl::App(url.into()))
        .title("Promptlight Editor")
        .inner_size(window_width, window_height)
        .min_inner_size(800.0, 600.0);

    // Position on provided screen or center as fallback
    if let Some(bounds) = screen_bounds {
        let x = bounds.x + (bounds.width - window_width) / 2.0;
        let y = bounds.y + (bounds.height - window_height) / 2.0;
        builder = builder.position(x, y);
    } else {
        builder = builder.center();
    }

    builder.build().map_err(|e| e.to_string())?;

    Ok(())
}
