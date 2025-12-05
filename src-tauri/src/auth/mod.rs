mod google;
mod firebase;
pub mod storage;

// Re-export for use in other modules if needed
#[allow(unused_imports)]
pub use google::start_google_sign_in;
#[allow(unused_imports)]
pub use storage::{get_auth_state, clear_auth, load_auth_session, AuthState};

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

/// User information from Firebase Auth
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub uid: String,
    pub email: Option<String>,
    pub display_name: Option<String>,
    pub photo_url: Option<String>,
}

/// Authentication tokens
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthTokens {
    pub id_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
}

/// Complete auth session
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthSession {
    pub user: User,
    pub tokens: AuthTokens,
}

// ==================== Tauri Commands ====================

/// Start the Google sign-in flow
/// Opens the browser for OAuth consent and returns the auth session
#[tauri::command]
pub async fn sign_in_with_google(
    app: AppHandle,
    api_key: String,
) -> Result<AuthSession, String> {
    println!("[auth] >>>>>> sign_in_with_google COMMAND CALLED <<<<<<");
    println!("[auth] API key length: {}", api_key.len());

    // Start Google OAuth flow (uses Tauri opener for macOS compatibility)
    let google_tokens = google::start_google_sign_in(&app).await?;

    // Exchange Google tokens for Firebase Auth
    let session = firebase::sign_in_with_google_token(&api_key, &google_tokens).await?;

    // Store tokens securely
    storage::save_auth_session(&session)?;

    Ok(session)
}

/// Get the current auth state (cached or refreshed)
#[tauri::command]
pub async fn get_current_auth(api_key: String) -> Result<Option<AuthSession>, String> {
    match storage::load_auth_session() {
        Some(session) => {
            let now = chrono::Utc::now().timestamp();
            if session.tokens.expires_at <= now {
                // Token expired, try to refresh
                match firebase::refresh_token(&api_key, &session.tokens.refresh_token).await {
                    Ok(new_session) => {
                        storage::save_auth_session(&new_session)?;
                        Ok(Some(new_session))
                    }
                    Err(_) => {
                        // Refresh failed, clear auth and return None
                        storage::clear_auth()?;
                        Ok(None)
                    }
                }
            } else {
                Ok(Some(session))
            }
        }
        None => Ok(None),
    }
}

/// Sign out and clear stored tokens
#[tauri::command]
pub async fn sign_out() -> Result<(), String> {
    storage::clear_auth()
}
