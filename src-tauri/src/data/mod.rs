pub mod commands;
pub mod firestore;
pub mod index;
pub mod local;
pub mod prompt;
pub mod search;
pub mod settings;
pub mod stats;
pub mod store;
pub mod sync;

pub use local::LocalDataStore;
pub use store::DataStore;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Metadata for a prompt (stored in index.json)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptMetadata {
    pub id: String,
    pub name: String,
    pub folder: String,
    pub description: String,
    pub filename: String,
    pub use_count: u32,
    pub last_used: Option<String>,
    pub created: String,
    pub updated: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

/// Full prompt with content
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Prompt {
    #[serde(flatten)]
    pub metadata: PromptMetadata,
    pub content: String,
}

/// Search result with score
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub prompt: PromptMetadata,
    pub score: f64,
}

/// Folder metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderMetadata {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

/// The full index stored in index.json
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptIndex {
    pub prompts: Vec<PromptMetadata>,
    pub folders: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub folder_meta: Option<std::collections::HashMap<String, FolderMetadata>>,
    /// Tracks whether sample prompts have been shown to this user.
    /// Once seeded, prompts won't be re-created even if all are deleted.
    #[serde(default)]
    pub seeded: bool,
}

impl Default for PromptIndex {
    fn default() -> Self {
        Self {
            prompts: Vec::new(),
            folders: vec!["uncategorized".to_string()],
            folder_meta: None,
            seeded: false,
        }
    }
}

/// Create sample prompts for new users
pub fn create_sample_prompts() -> (PromptIndex, Vec<(String, String)>) {
    use chrono::Utc;

    let now = Utc::now().to_rfc3339();

    // Only ship with 2 essential prompts
    let samples = vec![
        ("summarize", "Summarize", "writing", "Summarize text concisely",
         "Please summarize the following text. Provide:\n\n1. A brief one-sentence summary\n2. Key points (3-5 bullet points)\n3. Any important details or nuances\n\nText to summarize:\n"),
        ("improve-writing", "Improve Writing", "writing", "Polish and improve written content",
         "Please improve the following text for clarity, conciseness, and impact. Maintain the original meaning and tone while making it more effective.\n\nText to improve:\n"),
    ];

    let mut prompts = Vec::new();
    let mut files = Vec::new();

    for (id, name, folder, description, content) in samples {
        let filename = format!("{}.md", id);
        prompts.push(PromptMetadata {
            id: id.to_string(),
            name: name.to_string(),
            folder: folder.to_string(),
            description: description.to_string(),
            filename: filename.clone(),
            use_count: 0,
            last_used: None,
            created: now.clone(),
            updated: now.clone(),
            icon: None,
            color: None,
        });
        files.push((filename, content.to_string()));
    }

    let folders = vec![
        "writing".to_string(),
        "uncategorized".to_string(),
    ];

    (PromptIndex { prompts, folders, folder_meta: None, seeded: true }, files)
}

/// Get the base data directory path (~/.prompt-launcher)
pub fn get_base_data_dir() -> PathBuf {
    dirs::home_dir()
        .expect("Could not find home directory")
        .join(".prompt-launcher")
}

/// Get the anonymous (pre-auth) data directory path
pub fn get_anonymous_data_dir() -> PathBuf {
    get_base_data_dir().join("local")
}

/// Get the data directory path for a specific user
pub fn get_user_data_dir(user_id: &str) -> PathBuf {
    get_base_data_dir().join("users").join(user_id)
}

