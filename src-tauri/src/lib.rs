#[macro_use]
extern crate objc;

mod data;
mod os;

use tauri::{Manager, LogicalPosition};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

use crate::os::focus::get_focused_app_screen_bounds;
use crate::os::previous_app;

const WINDOW_WIDTH: f64 = 650.0;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            // Register global shortcut: Cmd+Shift+Space
            let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::Space);
            let app_handle = app.handle().clone();

            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                // Only respond to key press, not release
                if event.state != ShortcutState::Pressed {
                    return;
                }

                if let Some(window) = app_handle.get_webview_window("launcher") {
                    // Toggle window visibility
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        // CAPTURE PREVIOUS APP BEFORE SHOWING PROMPTLIGHT
                        // This must happen while the other app is still frontmost
                        if let Err(e) = previous_app::capture_previous_app() {
                            println!("[shortcut] Warning: Failed to capture previous app: {}", e);
                        }

                        // Try to position window on the monitor with the focused application
                        let positioned = if let Some(bounds) = get_focused_app_screen_bounds() {
                            // Center horizontally on the focused app's screen, position 1/4 from top
                            let x = bounds.x + (bounds.width - WINDOW_WIDTH) / 2.0;
                            let y = bounds.y + bounds.height / 4.0;
                            let _ = window.set_position(LogicalPosition::new(x, y));
                            true
                        } else {
                            false
                        };

                        // Fallback: position on monitor with cursor
                        if !positioned {
                            if let Ok(cursor_pos) = window.cursor_position() {
                                if let Ok(monitors) = window.available_monitors() {
                                    for monitor in monitors {
                                        let mon_pos = monitor.position();
                                        let mon_size = monitor.size();
                                        let scale = monitor.scale_factor();

                                        let mon_x = mon_pos.x as f64;
                                        let mon_y = mon_pos.y as f64;
                                        let mon_w = mon_size.width as f64 / scale;
                                        let mon_h = mon_size.height as f64 / scale;

                                        if cursor_pos.x >= mon_x && cursor_pos.x < mon_x + mon_w &&
                                           cursor_pos.y >= mon_y && cursor_pos.y < mon_y + mon_h {
                                            let x = mon_x + (mon_w - WINDOW_WIDTH) / 2.0;
                                            let y = mon_y + mon_h / 4.0;
                                            let _ = window.set_position(LogicalPosition::new(x, y));
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }).expect("Failed to register global shortcut");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            data::index::get_folders,
            data::index::get_index,
            data::index::add_folder,
            data::index::rename_folder,
            data::index::delete_folder,
            data::prompt::get_prompt,
            data::prompt::save_prompt,
            data::prompt::delete_prompt,
            data::search::search_prompts,
            data::stats::record_usage,
            os::paste::paste_and_dismiss,
            os::paste::dismiss_window,
            os::paste::copy_to_clipboard,
            os::paste::paste_from_editor,
            os::window::open_editor_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
