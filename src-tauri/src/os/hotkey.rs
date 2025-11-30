//! Global hotkey management for the launcher
//!
//! Handles parsing hotkey strings and registering/unregistering global shortcuts.

use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

use crate::data::settings::AppSettings;
use crate::os::focus::get_key_window_screen_bounds;
use crate::os::previous_app;

const WINDOW_WIDTH: f64 = 650.0;

/// State to track the currently registered shortcut
pub struct HotkeyState {
    pub current_shortcut: Mutex<Option<Shortcut>>,
}

impl Default for HotkeyState {
    fn default() -> Self {
        Self {
            current_shortcut: Mutex::new(None),
        }
    }
}

/// Parse a hotkey string like "CommandOrControl+Shift+Space" into Tauri's Shortcut
pub fn parse_hotkey(hotkey_str: &str) -> Result<Shortcut, String> {
    let parts: Vec<&str> = hotkey_str.split('+').collect();
    if parts.is_empty() {
        return Err("Empty hotkey string".to_string());
    }

    let mut modifiers = Modifiers::empty();
    let mut key_code: Option<Code> = None;

    for part in parts {
        let part_lower = part.to_lowercase();
        match part_lower.as_str() {
            // Modifiers
            "command" | "cmd" | "meta" | "super" => modifiers |= Modifiers::META,
            "commandorcontrol" | "cmdorctrl" => {
                #[cfg(target_os = "macos")]
                {
                    modifiers |= Modifiers::META;
                }
                #[cfg(not(target_os = "macos"))]
                {
                    modifiers |= Modifiers::CONTROL;
                }
            }
            "control" | "ctrl" => modifiers |= Modifiers::CONTROL,
            "shift" => modifiers |= Modifiers::SHIFT,
            "alt" | "option" => modifiers |= Modifiers::ALT,
            // Key codes
            _ => {
                key_code = Some(parse_key_code(part)?);
            }
        }
    }

    let code = key_code.ok_or("No key code found in hotkey string")?;
    Ok(Shortcut::new(Some(modifiers), code))
}

/// Parse a key name into a Tauri Code
fn parse_key_code(key: &str) -> Result<Code, String> {
    let key_lower = key.to_lowercase();
    match key_lower.as_str() {
        // Letters
        "a" => Ok(Code::KeyA),
        "b" => Ok(Code::KeyB),
        "c" => Ok(Code::KeyC),
        "d" => Ok(Code::KeyD),
        "e" => Ok(Code::KeyE),
        "f" => Ok(Code::KeyF),
        "g" => Ok(Code::KeyG),
        "h" => Ok(Code::KeyH),
        "i" => Ok(Code::KeyI),
        "j" => Ok(Code::KeyJ),
        "k" => Ok(Code::KeyK),
        "l" => Ok(Code::KeyL),
        "m" => Ok(Code::KeyM),
        "n" => Ok(Code::KeyN),
        "o" => Ok(Code::KeyO),
        "p" => Ok(Code::KeyP),
        "q" => Ok(Code::KeyQ),
        "r" => Ok(Code::KeyR),
        "s" => Ok(Code::KeyS),
        "t" => Ok(Code::KeyT),
        "u" => Ok(Code::KeyU),
        "v" => Ok(Code::KeyV),
        "w" => Ok(Code::KeyW),
        "x" => Ok(Code::KeyX),
        "y" => Ok(Code::KeyY),
        "z" => Ok(Code::KeyZ),
        // Numbers
        "0" | "digit0" => Ok(Code::Digit0),
        "1" | "digit1" => Ok(Code::Digit1),
        "2" | "digit2" => Ok(Code::Digit2),
        "3" | "digit3" => Ok(Code::Digit3),
        "4" | "digit4" => Ok(Code::Digit4),
        "5" | "digit5" => Ok(Code::Digit5),
        "6" | "digit6" => Ok(Code::Digit6),
        "7" | "digit7" => Ok(Code::Digit7),
        "8" | "digit8" => Ok(Code::Digit8),
        "9" | "digit9" => Ok(Code::Digit9),
        // Function keys
        "f1" => Ok(Code::F1),
        "f2" => Ok(Code::F2),
        "f3" => Ok(Code::F3),
        "f4" => Ok(Code::F4),
        "f5" => Ok(Code::F5),
        "f6" => Ok(Code::F6),
        "f7" => Ok(Code::F7),
        "f8" => Ok(Code::F8),
        "f9" => Ok(Code::F9),
        "f10" => Ok(Code::F10),
        "f11" => Ok(Code::F11),
        "f12" => Ok(Code::F12),
        // Special keys
        "space" => Ok(Code::Space),
        "enter" | "return" => Ok(Code::Enter),
        "tab" => Ok(Code::Tab),
        "escape" | "esc" => Ok(Code::Escape),
        "backspace" => Ok(Code::Backspace),
        "delete" => Ok(Code::Delete),
        "insert" => Ok(Code::Insert),
        "home" => Ok(Code::Home),
        "end" => Ok(Code::End),
        "pageup" => Ok(Code::PageUp),
        "pagedown" => Ok(Code::PageDown),
        // Arrow keys
        "arrowup" | "up" => Ok(Code::ArrowUp),
        "arrowdown" | "down" => Ok(Code::ArrowDown),
        "arrowleft" | "left" => Ok(Code::ArrowLeft),
        "arrowright" | "right" => Ok(Code::ArrowRight),
        // Punctuation
        "minus" | "-" => Ok(Code::Minus),
        "equal" | "=" => Ok(Code::Equal),
        "bracketleft" | "[" => Ok(Code::BracketLeft),
        "bracketright" | "]" => Ok(Code::BracketRight),
        "backslash" | "\\" => Ok(Code::Backslash),
        "semicolon" | ";" => Ok(Code::Semicolon),
        "quote" | "'" => Ok(Code::Quote),
        "backquote" | "`" => Ok(Code::Backquote),
        "comma" | "," => Ok(Code::Comma),
        "period" | "." => Ok(Code::Period),
        "slash" | "/" => Ok(Code::Slash),
        _ => Err(format!("Unknown key code: {}", key)),
    }
}

/// Register the global hotkey for showing/hiding the launcher
pub fn register_hotkey(app: &AppHandle, hotkey_str: &str) -> Result<(), String> {
    let shortcut = parse_hotkey(hotkey_str)?;

    // Unregister any existing shortcut first
    unregister_current_hotkey(app)?;

    let app_handle = app.clone();

    app.global_shortcut()
        .on_shortcut(shortcut.clone(), move |_app, _shortcut, event| {
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
                        let _ = window.set_position(tauri::LogicalPosition::new(x, y));
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

                                    if cursor_pos.x >= mon_x
                                        && cursor_pos.x < mon_x + mon_w
                                        && cursor_pos.y >= mon_y
                                        && cursor_pos.y < mon_y + mon_h
                                    {
                                        let x = mon_x + (mon_w - WINDOW_WIDTH) / 2.0;
                                        let y = mon_y + mon_h / 4.0;
                                        let _ = window.set_position(tauri::LogicalPosition::new(x, y));
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
        })
        .map_err(|e| e.to_string())?;

    // Store the registered shortcut
    if let Some(state) = app.try_state::<HotkeyState>() {
        if let Ok(mut current) = state.current_shortcut.lock() {
            *current = Some(shortcut);
        }
    }

    Ok(())
}

/// Unregister the currently registered hotkey
pub fn unregister_current_hotkey(app: &AppHandle) -> Result<(), String> {
    if let Some(state) = app.try_state::<HotkeyState>() {
        if let Ok(mut current) = state.current_shortcut.lock() {
            if let Some(shortcut) = current.take() {
                app.global_shortcut()
                    .unregister(shortcut)
                    .map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}

/// Get the current hotkey from settings
#[tauri::command]
pub fn get_current_hotkey() -> Result<Option<String>, String> {
    let settings = AppSettings::load();
    Ok(settings.general.hotkey)
}

/// Set and register a new hotkey (or clear it if None)
#[tauri::command]
pub fn set_hotkey(app: AppHandle, hotkey: Option<String>) -> Result<(), String> {
    // Unregister current hotkey first
    unregister_current_hotkey(&app)?;

    // Load current settings
    let mut settings = AppSettings::load();
    settings.general.hotkey = hotkey.clone();
    settings.save()?;

    // Register new hotkey if provided
    if let Some(ref hotkey_str) = hotkey {
        register_hotkey(&app, hotkey_str)?;
    }

    Ok(())
}

/// Initialize hotkey from settings on app startup
pub fn init_hotkey_from_settings(app: &AppHandle) -> Result<(), String> {
    let settings = AppSettings::load();
    if let Some(ref hotkey_str) = settings.general.hotkey {
        register_hotkey(app, hotkey_str)?;
    }
    Ok(())
}

/// Temporarily pause the global hotkey (for recording a new one)
/// This unregisters the shortcut but doesn't change settings
#[tauri::command]
pub fn pause_hotkey(app: AppHandle) -> Result<(), String> {
    unregister_current_hotkey(&app)
}

/// Resume the global hotkey from settings (after recording)
#[tauri::command]
pub fn resume_hotkey(app: AppHandle) -> Result<(), String> {
    init_hotkey_from_settings(&app)
}
