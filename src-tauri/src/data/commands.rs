use tauri::State;

use super::store::DataStore;
use super::sync::SyncServiceState;
use super::{Prompt, PromptIndex, PromptMetadata, SearchResult};

// ==================== Index Commands ====================

/// Get the full index (all prompts metadata and folders)
#[tauri::command]
pub async fn get_index(store: State<'_, SyncServiceState>) -> Result<PromptIndex, String> {
    store.get_index().await
}

/// Get all folders
#[tauri::command]
pub async fn get_folders(store: State<'_, SyncServiceState>) -> Result<Vec<String>, String> {
    store.get_folders().await
}

// ==================== Prompt Commands ====================

/// Get a prompt by ID (includes content)
#[tauri::command]
pub async fn get_prompt(
    store: State<'_, SyncServiceState>,
    id: String,
) -> Result<Prompt, String> {
    store.get_prompt(&id).await
}

/// Save a prompt (creates or updates)
#[tauri::command]
pub async fn save_prompt(
    store: State<'_, SyncServiceState>,
    prompt: Prompt,
) -> Result<PromptMetadata, String> {
    store.save_prompt(&prompt).await
}

/// Delete a prompt by ID
#[tauri::command]
pub async fn delete_prompt(
    store: State<'_, SyncServiceState>,
    id: String,
) -> Result<(), String> {
    store.delete_prompt(&id).await
}

// ==================== Folder Commands ====================

/// Add a new folder
#[tauri::command]
pub async fn add_folder(
    store: State<'_, SyncServiceState>,
    name: String,
) -> Result<(), String> {
    store.add_folder(&name).await
}

/// Rename a folder
#[tauri::command]
pub async fn rename_folder(
    store: State<'_, SyncServiceState>,
    old_name: String,
    new_name: String,
) -> Result<(), String> {
    store.rename_folder(&old_name, &new_name).await
}

/// Delete a folder (moves prompts to uncategorized)
#[tauri::command]
pub async fn delete_folder(
    store: State<'_, SyncServiceState>,
    name: String,
) -> Result<(), String> {
    store.delete_folder(&name).await
}

// ==================== Search & Stats Commands ====================

/// Search prompts by query
#[tauri::command]
pub async fn search_prompts(
    store: State<'_, SyncServiceState>,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    store.search_prompts(&query).await
}

/// Record usage of a prompt
#[tauri::command]
pub async fn record_usage(
    store: State<'_, SyncServiceState>,
    id: String,
) -> Result<(), String> {
    store.record_usage(&id).await
}

// ==================== Sync Commands ====================

/// Set the auth state for sync (called after sign-in)
/// This also triggers an automatic sync from cloud to download user's data
#[tauri::command]
pub async fn set_sync_auth(
    sync: State<'_, SyncServiceState>,
    user_id: String,
    id_token: String,
) -> Result<(), String> {
    sync.set_auth(&user_id, &id_token);

    // Auto-sync from cloud after sign-in (cloud is source of truth)
    // Ignore errors - user can manually trigger sync if needed
    let _ = sync.sync_from_firestore().await;
    Ok(())
}

/// Clear the auth state for sync (called after sign-out)
#[tauri::command]
pub fn clear_sync_auth(sync: State<'_, SyncServiceState>) {
    sync.clear_auth();
}

/// Update the ID token (called when token is refreshed)
#[tauri::command]
pub fn update_sync_token(sync: State<'_, SyncServiceState>, id_token: String) {
    sync.update_token(&id_token);
}

/// Sync local data to Firestore (upload all)
#[tauri::command]
pub async fn sync_to_cloud(sync: State<'_, SyncServiceState>) -> Result<(), String> {
    sync.sync_to_firestore().await
}

/// Sync from Firestore to local (download all)
#[tauri::command]
pub async fn sync_from_cloud(sync: State<'_, SyncServiceState>) -> Result<(), String> {
    sync.sync_from_firestore().await
}

/// Check if sync is authenticated
#[tauri::command]
pub fn is_sync_authenticated(sync: State<'_, SyncServiceState>) -> bool {
    sync.is_authenticated()
}
