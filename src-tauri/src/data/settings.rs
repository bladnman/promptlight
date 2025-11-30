use serde::{Deserialize, Serialize};
use std::fs;

use super::get_base_data_dir;

/// General application settings
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GeneralSettings {
    pub auto_launch: bool,
    /// Global hotkey to summon the launcher (e.g., "CommandOrControl+Shift+Space")
    /// None means no hotkey is registered
    #[serde(default = "default_hotkey")]
    pub hotkey: Option<String>,
}

/// Default hotkey: Cmd/Ctrl+Shift+Space
fn default_hotkey() -> Option<String> {
    Some("CommandOrControl+Shift+Space".to_string())
}

/// Cloud sync settings
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SyncSettings {
    pub enabled: bool,
    pub last_sync: Option<String>,
}

/// Appearance settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    /// Theme: "dark", "light", or "auto"
    #[serde(default = "default_theme")]
    pub theme: String,
    /// Accent color name (e.g., "avocado", "forest", "ocean")
    #[serde(default = "default_accent_color")]
    pub accent_color: String,
}

fn default_theme() -> String {
    "dark".to_string()
}

fn default_accent_color() -> String {
    "avocado".to_string()
}

impl Default for AppearanceSettings {
    fn default() -> Self {
        Self {
            theme: default_theme(),
            accent_color: default_accent_color(),
        }
    }
}

/// Complete application settings
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub general: GeneralSettings,
    pub sync: SyncSettings,
    #[serde(default)]
    pub appearance: AppearanceSettings,
}

impl AppSettings {
    /// Load settings from disk, returns defaults if file doesn't exist
    pub fn load() -> Self {
        let path = get_base_data_dir().join("settings.json");
        if path.exists() {
            fs::read_to_string(&path)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default()
        } else {
            Self::default()
        }
    }

    /// Save settings to disk
    pub fn save(&self) -> Result<(), String> {
        let dir = get_base_data_dir();
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

        let path = dir.join("settings.json");
        let content = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(path, content).map_err(|e| e.to_string())
    }
}

/// Get current settings
#[tauri::command]
pub fn get_settings() -> Result<AppSettings, String> {
    Ok(AppSettings::load())
}

/// Save settings
#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    settings.save()
}

/// Get auto-launch status from the system
#[tauri::command]
pub fn get_autostart_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch()
        .is_enabled()
        .map_err(|e| e.to_string())
}

/// Set auto-launch status
#[tauri::command]
pub fn set_autostart_enabled(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;
    let autostart = app.autolaunch();
    if enabled {
        autostart.enable().map_err(|e| e.to_string())
    } else {
        autostart.disable().map_err(|e| e.to_string())
    }
}
