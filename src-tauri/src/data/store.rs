use async_trait::async_trait;

use super::{Prompt, PromptIndex, PromptMetadata, SearchResult};

/// DataStore trait for abstracting storage backends.
///
/// This trait defines the interface for prompt storage operations.
/// Implementations can be local (file-based) or remote (Firestore).
#[async_trait]
pub trait DataStore: Send + Sync {
    // ==================== Index Operations ====================

    /// Load the full prompt index
    async fn get_index(&self) -> Result<PromptIndex, String>;

    /// Save the full prompt index
    async fn save_index(&self, index: &PromptIndex) -> Result<(), String>;

    // ==================== Prompt Operations ====================

    /// Get a prompt by ID (includes content)
    async fn get_prompt(&self, id: &str) -> Result<Prompt, String>;

    /// Save a prompt (creates or updates)
    /// Returns the updated metadata
    async fn save_prompt(&self, prompt: &Prompt) -> Result<PromptMetadata, String>;

    /// Delete a prompt by ID
    async fn delete_prompt(&self, id: &str) -> Result<(), String>;

    // ==================== Folder Operations ====================

    /// Add a new folder
    async fn add_folder(&self, name: &str) -> Result<(), String>;

    /// Rename a folder
    async fn rename_folder(&self, old_name: &str, new_name: &str) -> Result<(), String>;

    /// Delete a folder (moves prompts to uncategorized)
    async fn delete_folder(&self, name: &str) -> Result<(), String>;

    // ==================== Stats Operations ====================

    /// Record usage of a prompt (increment count, update last_used)
    async fn record_usage(&self, id: &str) -> Result<(), String>;

    // ==================== Search Operations ====================

    /// Search prompts by query
    /// Empty query returns all prompts sorted by recency
    async fn search_prompts(&self, query: &str) -> Result<Vec<SearchResult>, String>;

    // ==================== Utility Operations ====================

    /// Get all folder names
    async fn get_folders(&self) -> Result<Vec<String>, String> {
        let index = self.get_index().await?;
        Ok(index.folders)
    }
}

/// Error type for data store operations
#[derive(Debug)]
pub enum DataStoreError {
    NotFound(String),
    AlreadyExists(String),
    InvalidInput(String),
    IoError(String),
    ParseError(String),
}

impl std::fmt::Display for DataStoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DataStoreError::NotFound(msg) => write!(f, "Not found: {}", msg),
            DataStoreError::AlreadyExists(msg) => write!(f, "Already exists: {}", msg),
            DataStoreError::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
            DataStoreError::IoError(msg) => write!(f, "IO error: {}", msg),
            DataStoreError::ParseError(msg) => write!(f, "Parse error: {}", msg),
        }
    }
}

impl std::error::Error for DataStoreError {}

impl From<DataStoreError> for String {
    fn from(err: DataStoreError) -> Self {
        err.to_string()
    }
}
