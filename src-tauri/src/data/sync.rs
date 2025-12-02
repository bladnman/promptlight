//! Sync service for managing local storage with Firestore backup.
//!
//! The SyncService wraps LocalDataStore and adds Firestore synchronization.
//! It provides:
//! - Offline-first operation (local is always the source of truth)
//! - Background sync to Firestore when authenticated
//! - Migration from anonymous to user storage on first login
//! - Download/upload operations for explicit sync

use std::sync::{Arc, RwLock};
use async_trait::async_trait;

use super::firestore::{FirestoreClient, UserMeta};
use super::local::LocalDataStore;
use super::store::DataStore;
use super::{Prompt, PromptIndex, PromptMetadata, SearchResult};

/// Sync service state
struct SyncState {
    /// The current local data store (switches based on auth state)
    local_store: LocalDataStore,
    /// Firestore client (always available, but only used when authenticated)
    firestore: FirestoreClient,
    /// Current user ID (None = anonymous)
    user_id: Option<String>,
    /// Current ID token for Firestore auth
    id_token: Option<String>,
    /// Whether sync is enabled
    sync_enabled: bool,
}

/// Service for syncing data between local storage and Firestore
pub struct SyncService {
    state: RwLock<SyncState>,
}

impl SyncService {
    /// Create a new sync service (starts in anonymous mode)
    pub fn new(project_id: &str) -> Self {
        Self {
            state: RwLock::new(SyncState {
                local_store: LocalDataStore::new(),
                firestore: FirestoreClient::new(project_id),
                user_id: None,
                id_token: None,
                sync_enabled: false,
            }),
        }
    }

    /// Create a new sync service, restoring auth from keychain if available.
    /// This ensures the correct user's data directory is used from the start.
    pub fn new_with_restored_auth(project_id: &str, restored_session: Option<(String, String)>) -> Self {
        match restored_session {
            Some((user_id, id_token)) => {
                // User has a stored session - use their data directory
                let user_store = LocalDataStore::for_user(&user_id);

                // Migrate anonymous data if user's directory is empty
                if let Err(e) = user_store.migrate_from_anonymous() {
                    eprintln!("Migration warning: {}", e);
                }

                Self {
                    state: RwLock::new(SyncState {
                        local_store: user_store,
                        firestore: FirestoreClient::new(project_id),
                        user_id: Some(user_id),
                        id_token: Some(id_token),
                        sync_enabled: true,
                    }),
                }
            }
            None => {
                // No stored session - use anonymous directory
                Self::new(project_id)
            }
        }
    }

    /// Check if currently authenticated
    pub fn is_authenticated(&self) -> bool {
        self.state.read().unwrap().user_id.is_some()
    }

    /// Get the current user ID
    pub fn current_user_id(&self) -> Option<String> {
        self.state.read().unwrap().user_id.clone()
    }

    /// Set authentication state (called when user signs in)
    /// This switches to the user's local storage and optionally syncs with Firestore
    pub fn set_auth(&self, user_id: &str, id_token: &str) {
        let mut state = self.state.write().unwrap();

        // Switch to user's local store
        let user_store = LocalDataStore::for_user(user_id);

        // Migrate anonymous data if user's directory is empty
        if let Err(e) = user_store.migrate_from_anonymous() {
            eprintln!("Migration warning: {}", e);
        }

        state.local_store = user_store;
        state.user_id = Some(user_id.to_string());
        state.id_token = Some(id_token.to_string());
        state.sync_enabled = true;
    }

    /// Clear authentication state (called when user signs out)
    /// This switches back to anonymous local storage
    pub fn clear_auth(&self) {
        let mut state = self.state.write().unwrap();
        state.local_store = LocalDataStore::new();
        state.user_id = None;
        state.id_token = None;
        state.sync_enabled = false;
    }

    /// Update the ID token (called when token is refreshed)
    pub fn update_token(&self, id_token: &str) {
        let mut state = self.state.write().unwrap();
        state.id_token = Some(id_token.to_string());
    }

    /// Get sync context (user_id, id_token, firestore) if sync is enabled
    fn get_sync_context(&self) -> Option<(String, String, FirestoreClient)> {
        let state = self.state.read().unwrap();
        if !state.sync_enabled {
            return None;
        }
        Some((
            state.user_id.clone()?,
            state.id_token.clone()?,
            state.firestore.clone(),
        ))
    }

    /// Sync local data to Firestore (upload all)
    /// This is an explicit sync operation, useful for initial upload
    ///
    /// SAFETY: Refuses to upload empty data to prevent accidental data loss
    pub async fn sync_to_firestore(&self) -> Result<(), String> {
        let (user_id, id_token, index, firestore) = {
            let state = self.state.read().unwrap();

            let user_id = state.user_id.clone()
                .ok_or("Not authenticated")?;
            let id_token = state.id_token.clone()
                .ok_or("No auth token")?;

            let index = state.local_store.load_index_sync()?;
            let firestore = state.firestore.clone();

            (user_id, id_token, index, firestore)
        };

        // SAFETY: Never upload empty data - this could wipe out cloud data
        if index.prompts.is_empty() {
            eprintln!("[SYNC SAFETY] Refusing to upload empty local data to cloud. This prevents accidental data loss.");
            return Err("Cannot sync empty local data to cloud. This is a safety measure to prevent data loss.".to_string());
        }

        // Load all prompts with content (outside the lock)
        let prompts = self.load_all_prompts_sync(&index)?;

        // Upload to Firestore
        firestore.upload_all(&user_id, &id_token, &index, &prompts).await
    }

    /// Load all prompts synchronously
    fn load_all_prompts_sync(&self, index: &PromptIndex) -> Result<Vec<Prompt>, String> {
        let state = self.state.read().unwrap();
        let mut prompts = Vec::new();
        for meta in &index.prompts {
            let prompt = state.local_store.get_prompt_sync(&meta.id)?;
            prompts.push(prompt);
        }
        Ok(prompts)
    }

    /// Sync from Firestore to local (download all)
    /// This replaces local data with Firestore data
    ///
    /// SAFETY: Refuses to replace local data with empty cloud data if local has prompts
    pub async fn sync_from_firestore(&self) -> Result<(), String> {
        let (user_id, id_token, firestore, local_prompt_count) = {
            let state = self.state.read().unwrap();

            let user_id = state.user_id.clone()
                .ok_or("Not authenticated")?;
            let id_token = state.id_token.clone()
                .ok_or("No auth token")?;
            let firestore = state.firestore.clone();

            // Check how many prompts we have locally (for safety check)
            let local_index = state.local_store.load_index_sync().ok();
            let local_prompt_count = local_index.map(|i| i.prompts.len()).unwrap_or(0);

            (user_id, id_token, firestore, local_prompt_count)
        };

        // Download from Firestore (outside the lock)
        let (index, prompts) = firestore.download_all(&user_id, &id_token).await?;

        // SAFETY: Don't replace existing local data with empty cloud data
        // This prevents accidental data loss when cloud is empty or auth fails silently
        if index.prompts.is_empty() && local_prompt_count > 0 {
            eprintln!(
                "[SYNC SAFETY] Cloud returned 0 prompts but local has {}. Skipping sync to prevent data loss.",
                local_prompt_count
            );
            return Ok(()); // Silently succeed - don't wipe local data
        }

        // Save to local (re-acquire lock)
        {
            let state = self.state.read().unwrap();
            state.local_store.save_index_sync(&index)?;

            // Write prompt content files
            for prompt in prompts {
                state.local_store.write_prompt_content_sync(
                    &prompt.metadata.folder,
                    &prompt.metadata.filename,
                    &prompt.content,
                )?;
            }
        }

        Ok(())
    }

    /// Sync a single prompt to Firestore (background operation)
    async fn sync_prompt_to_firestore(&self, prompt: &Prompt) -> Result<(), String> {
        let ctx = match self.get_sync_context() {
            Some(ctx) => ctx,
            None => return Ok(()), // Sync disabled
        };
        let (user_id, id_token, firestore) = ctx;
        firestore.save_prompt(&user_id, &id_token, prompt).await
    }

    /// Delete a prompt from Firestore (background operation)
    async fn delete_prompt_from_firestore(&self, prompt_id: &str) -> Result<(), String> {
        let ctx = match self.get_sync_context() {
            Some(ctx) => ctx,
            None => return Ok(()), // Sync disabled
        };
        let (user_id, id_token, firestore) = ctx;
        firestore.delete_prompt(&user_id, &id_token, prompt_id).await
    }

    /// Sync folder metadata to Firestore (background operation)
    async fn sync_meta_to_firestore(&self, index: &PromptIndex) -> Result<(), String> {
        let ctx = match self.get_sync_context() {
            Some(ctx) => ctx,
            None => return Ok(()), // Sync disabled
        };
        let (user_id, id_token, firestore) = ctx;

        let meta = UserMeta {
            folders: index.folders.clone(),
            folder_meta: index.folder_meta.clone(),
        };

        firestore.save_meta(&user_id, &id_token, &meta).await
    }
}

// Add sync version of get_prompt to LocalDataStore
impl LocalDataStore {
    /// Get a prompt by ID synchronously
    pub fn get_prompt_sync(&self, id: &str) -> Result<Prompt, String> {
        let index = self.load_index_sync()?;

        let metadata = index
            .prompts
            .iter()
            .find(|p| p.id == id)
            .ok_or_else(|| format!("Prompt not found: {}", id))?
            .clone();

        let content = self.read_prompt_content_sync(&metadata.folder, &metadata.filename)?;

        Ok(Prompt { metadata, content })
    }

    /// Read prompt content synchronously
    fn read_prompt_content_sync(&self, folder: &str, filename: &str) -> Result<String, String> {
        let file_path = self.data_dir().join("prompts").join(folder).join(filename);
        if !file_path.exists() {
            return Ok(String::new());
        }
        std::fs::read_to_string(&file_path)
            .map_err(|e| format!("Failed to read prompt file: {}", e))
    }
}

#[async_trait]
impl DataStore for SyncService {
    async fn get_index(&self) -> Result<PromptIndex, String> {
        // Use sync method to avoid lock across await
        let state = self.state.read().unwrap();
        state.local_store.load_index_sync()
    }

    async fn save_index(&self, index: &PromptIndex) -> Result<(), String> {
        // Save locally (sync)
        {
            let state = self.state.read().unwrap();
            state.local_store.save_index_sync(index)?;
        }

        // Sync meta to Firestore (async, outside lock)
        let _ = self.sync_meta_to_firestore(index).await;

        Ok(())
    }

    async fn get_prompt(&self, id: &str) -> Result<Prompt, String> {
        let state = self.state.read().unwrap();
        state.local_store.get_prompt_sync(id)
    }

    async fn save_prompt(&self, prompt: &Prompt) -> Result<PromptMetadata, String> {
        // Save locally (sync)
        let metadata = {
            let state = self.state.read().unwrap();
            state.local_store.save_prompt_sync(prompt)?
        };

        // Create full prompt with updated metadata for sync
        let full_prompt = Prompt {
            metadata: metadata.clone(),
            content: prompt.content.clone(),
        };

        // Sync to Firestore (async, outside lock)
        let _ = self.sync_prompt_to_firestore(&full_prompt).await;

        Ok(metadata)
    }

    async fn delete_prompt(&self, id: &str) -> Result<(), String> {
        // Delete locally (sync)
        {
            let state = self.state.read().unwrap();
            state.local_store.delete_prompt_sync(id)?;
        }

        // Delete from Firestore (async, outside lock)
        let _ = self.delete_prompt_from_firestore(id).await;

        Ok(())
    }

    async fn add_folder(&self, name: &str) -> Result<(), String> {
        // Add locally (sync)
        {
            let state = self.state.read().unwrap();
            state.local_store.add_folder_sync(name)?;
        }

        // Sync meta to Firestore
        let index = self.get_index().await?;
        let _ = self.sync_meta_to_firestore(&index).await;

        Ok(())
    }

    async fn rename_folder(&self, old_name: &str, new_name: &str) -> Result<(), String> {
        // Rename locally (sync)
        {
            let state = self.state.read().unwrap();
            state.local_store.rename_folder_sync(old_name, new_name)?;
        }

        // Sync meta to Firestore
        let index = self.get_index().await?;
        let _ = self.sync_meta_to_firestore(&index).await;

        Ok(())
    }

    async fn delete_folder(&self, name: &str) -> Result<(), String> {
        // Delete locally (sync)
        {
            let state = self.state.read().unwrap();
            state.local_store.delete_folder_sync(name)?;
        }

        // Sync meta to Firestore
        let index = self.get_index().await?;
        let _ = self.sync_meta_to_firestore(&index).await;

        Ok(())
    }

    async fn record_usage(&self, id: &str) -> Result<(), String> {
        // Record locally (sync)
        {
            let state = self.state.read().unwrap();
            state.local_store.record_usage_sync(id)?;
        }

        // Sync the updated prompt to Firestore
        if let Ok(prompt) = self.get_prompt(id).await {
            let _ = self.sync_prompt_to_firestore(&prompt).await;
        }

        Ok(())
    }

    async fn search_prompts(&self, query: &str) -> Result<Vec<SearchResult>, String> {
        let state = self.state.read().unwrap();
        state.local_store.search_prompts_sync(query)
    }
}

/// Type alias for thread-safe SyncService
pub type SyncServiceState = Arc<SyncService>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sync_service_creation() {
        let service = SyncService::new("test-project");
        assert!(!service.is_authenticated());
        assert!(service.current_user_id().is_none());
    }

    #[test]
    fn test_set_and_clear_auth() {
        let service = SyncService::new("test-project");

        // Initially not authenticated
        assert!(!service.is_authenticated());

        // Set auth
        service.set_auth("test-user-123", "test-token");
        assert!(service.is_authenticated());
        assert_eq!(service.current_user_id(), Some("test-user-123".to_string()));

        // Clear auth
        service.clear_auth();
        assert!(!service.is_authenticated());
        assert!(service.current_user_id().is_none());
    }

    #[test]
    fn test_update_token() {
        let service = SyncService::new("test-project");

        service.set_auth("test-user", "initial-token");
        service.update_token("new-token");

        // Can't directly test the token, but should not panic
        assert!(service.is_authenticated());
    }
}
