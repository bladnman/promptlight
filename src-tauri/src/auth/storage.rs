use super::AuthSession;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Get the auth storage file path
/// Uses Application Support directory for persistent storage
fn get_auth_file_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
    let app_support = PathBuf::from(&home).join("Library/Application Support/com.promptlight");
    fs::create_dir_all(&app_support).ok();
    app_support.join("auth_session.json")
}

/// Auth state returned to the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthState {
    pub is_signed_in: bool,
    pub user: Option<super::User>,
}

/// Save auth session to file storage
pub fn save_auth_session(session: &AuthSession) -> Result<(), String> {
    let path = get_auth_file_path();

    let json = serde_json::to_string_pretty(session)
        .map_err(|e| format!("Failed to serialize session: {}", e))?;

    fs::write(&path, &json)
        .map_err(|e| format!("Failed to save auth session: {}", e))?;

    Ok(())
}

/// Load auth session from file storage
pub fn load_auth_session() -> Option<AuthSession> {
    let path = get_auth_file_path();
    let json = fs::read_to_string(&path).ok()?;
    serde_json::from_str(&json).ok()
}

/// Clear auth session from file storage
pub fn clear_auth() -> Result<(), String> {
    let path = get_auth_file_path();
    let _ = fs::remove_file(&path);
    Ok(())
}

/// Get current auth state (for frontend)
pub fn get_auth_state() -> AuthState {
    match load_auth_session() {
        Some(session) => {
            // Check if token is expired
            let now = chrono::Utc::now().timestamp();
            if session.tokens.expires_at <= now {
                AuthState {
                    is_signed_in: false,
                    user: None,
                }
            } else {
                AuthState {
                    is_signed_in: true,
                    user: Some(session.user),
                }
            }
        }
        None => AuthState {
            is_signed_in: false,
            user: None,
        },
    }
}
