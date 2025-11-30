#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

mod auth;
mod data;
mod os;

use std::sync::Arc;
use tauri::{Manager, LogicalPosition};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_autostart::MacosLauncher;

use crate::data::sync::{SyncService, SyncServiceState};
use crate::os::focus::get_key_window_screen_bounds;
use crate::os::previous_app;

const WINDOW_WIDTH: f64 = 650.0;

/// Get the Firebase project ID from environment
fn get_firebase_project_id() -> String {
    std::env::var("VITE_FIREBASE_PROJECT_ID")
        .unwrap_or_else(|_| "promptlight-bcc26".to_string())
}

/// Try to restore auth session from storage.
/// Returns (user_id, id_token) if a valid session exists.
fn try_restore_auth_session() -> Option<(String, String)> {
    use crate::auth::storage::load_auth_session;

    let session = load_auth_session()?;

    // Return user_id so we load from the correct directory.
    // If token is expired, frontend will refresh via checkAuth().
    Some((session.user.uid, session.tokens.id_token))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load environment variables from .env.local (for GOOGLE_CLIENT_ID, etc.)
    let _ = dotenvy::from_filename(".env.local");

    // Try to restore auth from keychain so we load from the correct data directory
    let restored_auth = try_restore_auth_session();

    // Initialize the sync service with restored auth (if any)
    let sync_service: SyncServiceState = Arc::new(
        SyncService::new_with_restored_auth(&get_firebase_project_id(), restored_auth)
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .manage(sync_service)
        .setup(|app| {
            // Set up transparent background for macOS
            #[cfg(target_os = "macos")]
            {
                use cocoa::appkit::NSWindow;
                use cocoa::base::{id, nil};
                use cocoa::foundation::NSString;

                if let Some(window) = app.get_webview_window("launcher") {
                    // First, disable the webview's background drawing
                    let _ = window.with_webview(|webview| {
                        unsafe {
                            let wv: id = webview.inner().cast();
                            let no: id = msg_send![class!(NSNumber), numberWithBool: false];
                            let key = NSString::alloc(nil).init_str("drawsBackground");
                            let _: () = msg_send![wv, setValue: no forKey: key];
                        }
                    });

                    // Then set the window background to clear
                    let ns_window = window.ns_window().unwrap() as id;
                    unsafe {
                        let clear_color: id = cocoa::appkit::NSColor::clearColor(nil);
                        NSWindow::setBackgroundColor_(ns_window, clear_color);
                        let _: () = msg_send![ns_window, setOpaque: false];
                    }
                }
            }

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
                        // Capture previous app before showing (for paste-back feature)
                        let _ = previous_app::capture_previous_app();

                        // Position on the screen with the key window (uses fast native NSScreen API)
                        let positioned = if let Some(bounds) = get_key_window_screen_bounds() {
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
            // Data commands (use DataStore trait via SyncService)
            data::commands::get_folders,
            data::commands::get_index,
            data::commands::add_folder,
            data::commands::rename_folder,
            data::commands::delete_folder,
            data::commands::get_prompt,
            data::commands::save_prompt,
            data::commands::delete_prompt,
            data::commands::search_prompts,
            data::commands::record_usage,
            // Sync commands
            data::commands::set_sync_auth,
            data::commands::clear_sync_auth,
            data::commands::update_sync_token,
            data::commands::sync_to_cloud,
            data::commands::sync_from_cloud,
            data::commands::is_sync_authenticated,
            // Settings (system-specific, not part of DataStore)
            data::settings::get_settings,
            data::settings::save_settings,
            data::settings::get_autostart_enabled,
            data::settings::set_autostart_enabled,
            // OS commands
            os::paste::paste_and_dismiss,
            os::paste::dismiss_window,
            os::paste::copy_to_clipboard,
            os::paste::paste_from_editor,
            os::window::open_editor_window,
            // Auth commands
            auth::sign_in_with_google,
            auth::get_current_auth,
            auth::sign_out,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
