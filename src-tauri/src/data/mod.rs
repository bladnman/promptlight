pub mod index;
pub mod prompt;
pub mod search;
pub mod stats;

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

/// The full index stored in index.json
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptIndex {
    pub prompts: Vec<PromptMetadata>,
    pub folders: Vec<String>,
}

impl Default for PromptIndex {
    fn default() -> Self {
        Self {
            prompts: Vec::new(),
            folders: vec!["uncategorized".to_string()],
        }
    }
}

/// Create sample prompts for new users
pub fn create_sample_prompts() -> (PromptIndex, Vec<(String, String)>) {
    use chrono::Utc;

    let now = Utc::now().to_rfc3339();

    let samples = vec![
        ("code-review", "Code Review", "development", "Review code for bugs, performance, and best practices",
         "Please review the following code for:\n\n1. **Bugs**: Look for potential errors, edge cases, or logic issues\n2. **Performance**: Identify any inefficiencies or optimization opportunities\n3. **Best Practices**: Check for adherence to coding standards and patterns\n4. **Security**: Flag any potential security vulnerabilities\n5. **Readability**: Suggest improvements for clarity and maintainability\n\nCode to review:\n"),
        ("explain-code", "Explain Code", "development", "Get a clear explanation of how code works",
         "Please explain the following code in detail:\n\n1. What is the overall purpose of this code?\n2. Walk through the logic step by step\n3. Explain any non-obvious patterns or techniques used\n4. Note any potential issues or improvements\n\nCode:\n"),
        ("write-tests", "Write Tests", "development", "Generate unit tests for code",
         "Please write comprehensive unit tests for the following code. Include:\n\n1. Happy path tests\n2. Edge cases\n3. Error handling tests\n4. Any setup/teardown needed\n\nUse the testing framework appropriate for the language.\n\nCode to test:\n"),
        ("fix-error", "Fix Error", "development", "Help debug and fix an error",
         "I'm encountering an error. Please help me debug and fix it.\n\n**Error Message:**\n\n**Relevant Code:**\n\n**What I've tried:**\n\n"),
        ("summarize", "Summarize", "writing", "Summarize text concisely",
         "Please summarize the following text. Provide:\n\n1. A brief one-sentence summary\n2. Key points (3-5 bullet points)\n3. Any important details or nuances\n\nText to summarize:\n"),
        ("improve-writing", "Improve Writing", "writing", "Polish and improve written content",
         "Please improve the following text for clarity, conciseness, and impact. Maintain the original meaning and tone while making it more effective.\n\nText to improve:\n"),
        ("email-reply", "Email Reply", "communication", "Draft a professional email response",
         "Please help me draft a professional email reply. Keep it concise and appropriate for a business context.\n\n**Original email:**\n\n**Key points I want to address:**\n\n**Tone (formal/casual/friendly):**\n"),
        ("brainstorm", "Brainstorm Ideas", "creative", "Generate creative ideas and solutions",
         "Please help me brainstorm ideas for the following. Generate diverse options ranging from conventional to creative:\n\nTopic/Challenge:\n"),
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
        });
        files.push((filename, content.to_string()));
    }

    let folders = vec![
        "development".to_string(),
        "writing".to_string(),
        "communication".to_string(),
        "creative".to_string(),
        "uncategorized".to_string(),
    ];

    (PromptIndex { prompts, folders }, files)
}

/// Get the data directory path (~/.prompt-launcher)
pub fn get_data_dir() -> PathBuf {
    dirs::home_dir()
        .expect("Could not find home directory")
        .join(".prompt-launcher")
}

