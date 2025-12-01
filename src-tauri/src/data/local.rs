use async_trait::async_trait;
use chrono::{DateTime, Utc};
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

use super::store::DataStore;
use super::{create_sample_prompts, Prompt, PromptIndex, PromptMetadata, SearchResult};

// Search scoring constants
const SCORE_NAME_MATCH: f64 = 100.0;
const SCORE_FOLDER_MATCH: f64 = 50.0;
const SCORE_DESCRIPTION_MATCH: f64 = 30.0;
const SCORE_CONTENT_MATCH: f64 = 15.0;
const MULT_EXACT: f64 = 2.0;
const MULT_PREFIX: f64 = 1.5;
const MULT_WORD: f64 = 0.5;
const RECENCY_MAX_SCORE: f64 = 100.0;
const RECENCY_HALF_LIFE_HOURS: f64 = 720.0;
const RECENCY_TIEBREAKER_MAX: f64 = 10.0;
const NEVER_USED_PENALTY: f64 = -1000.0;
const MAX_RESULTS: usize = 15;

/// Local file-based data store implementation.
///
/// Stores prompts in ~/.prompt-launcher/ with user-keyed directories:
/// - local/: for anonymous/pre-auth usage
/// - users/{uid}/: for authenticated users
///
/// Each directory contains:
/// - index.json: metadata for all prompts and folder list
/// - prompts/<folder>/<filename>.md: individual prompt content files
pub struct LocalDataStore {
    data_dir: PathBuf,
    user_id: Option<String>,
}

impl LocalDataStore {
    /// Create a new LocalDataStore for anonymous (pre-auth) usage
    pub fn new() -> Self {
        let base_dir = dirs::home_dir()
            .expect("Could not find home directory")
            .join(".prompt-launcher");
        let data_dir = base_dir.join("local");
        Self { data_dir, user_id: None }
    }

    /// Create a LocalDataStore for a specific authenticated user
    pub fn for_user(user_id: &str) -> Self {
        let base_dir = dirs::home_dir()
            .expect("Could not find home directory")
            .join(".prompt-launcher");
        let data_dir = base_dir.join("users").join(user_id);
        Self { data_dir, user_id: Some(user_id.to_string()) }
    }

    /// Get the current user ID (None for anonymous)
    pub fn user_id(&self) -> Option<&str> {
        self.user_id.as_deref()
    }

    /// Get the data directory path
    pub fn data_dir(&self) -> &PathBuf {
        &self.data_dir
    }

    /// Create a LocalDataStore with a custom data directory (for testing)
    #[allow(dead_code)]
    pub fn with_data_dir(data_dir: PathBuf) -> Self {
        Self { data_dir, user_id: None }
    }

    /// Get the anonymous (pre-auth) data directory
    fn anonymous_data_dir() -> PathBuf {
        dirs::home_dir()
            .expect("Could not find home directory")
            .join(".prompt-launcher")
            .join("local")
    }

    /// Migrate data from anonymous storage to user's storage.
    /// Only migrates if the user's directory is empty (no index.json).
    /// This is called when a user first authenticates.
    pub fn migrate_from_anonymous(&self) -> Result<bool, String> {
        // Only migrate if this is a user store and the user's directory doesn't exist
        if self.user_id.is_none() {
            return Ok(false);
        }

        let user_index_path = self.index_path();
        if user_index_path.exists() {
            // User already has data, don't overwrite
            return Ok(false);
        }

        let anon_dir = Self::anonymous_data_dir();
        let anon_index_path = anon_dir.join("index.json");

        if !anon_index_path.exists() {
            // No anonymous data to migrate
            return Ok(false);
        }

        // Create user's data directory
        fs::create_dir_all(&self.data_dir)
            .map_err(|e| format!("Failed to create user directory: {}", e))?;

        // Copy index.json
        fs::copy(&anon_index_path, &user_index_path)
            .map_err(|e| format!("Failed to copy index: {}", e))?;

        // Copy prompts directory if it exists
        let anon_prompts_dir = anon_dir.join("prompts");
        if anon_prompts_dir.exists() {
            copy_dir_recursive(&anon_prompts_dir, &self.prompts_dir())?;
        }

        Ok(true)
    }

    /// Check if this store has any data (index.json exists)
    pub fn has_data(&self) -> bool {
        self.index_path().exists()
    }

    /// Get the path to the index file
    fn index_path(&self) -> PathBuf {
        self.data_dir.join("index.json")
    }

    /// Get the path to the prompts directory
    fn prompts_dir(&self) -> PathBuf {
        self.data_dir.join("prompts")
    }

    /// Read prompt content from file
    fn read_prompt_content(&self, folder: &str, filename: &str) -> Result<String, String> {
        let file_path = self.prompts_dir().join(folder).join(filename);
        if !file_path.exists() {
            return Ok(String::new());
        }
        fs::read_to_string(&file_path).map_err(|e| format!("Failed to read prompt file: {}", e))
    }

    /// Write prompt content to file
    fn write_prompt_content(
        &self,
        folder: &str,
        filename: &str,
        content: &str,
    ) -> Result<(), String> {
        let folder_path = self.prompts_dir().join(folder);
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create folder: {}", e))?;
        let file_path = folder_path.join(filename);
        fs::write(&file_path, content).map_err(|e| format!("Failed to write prompt file: {}", e))
    }

    /// Delete prompt content file
    fn delete_prompt_content(&self, folder: &str, filename: &str) -> Result<(), String> {
        let file_path = self.prompts_dir().join(folder).join(filename);
        if file_path.exists() {
            fs::remove_file(&file_path)
                .map_err(|e| format!("Failed to delete prompt file: {}", e))?;
        }
        Ok(())
    }

    /// Seed sample prompts for new users
    fn seed_sample_prompts(&self) -> Result<PromptIndex, String> {
        let (index, files) = create_sample_prompts();

        // Write prompt files to correct folder paths
        for (idx, (filename, content)) in files.iter().enumerate() {
            let folder = &index.prompts[idx].folder;
            self.write_prompt_content(folder, filename, content)?;
        }

        // Save the index
        self.save_index_sync(&index)?;

        Ok(index)
    }

    /// Synchronous index save (public for SyncService)
    pub fn save_index_sync(&self, index: &PromptIndex) -> Result<(), String> {
        fs::create_dir_all(&self.data_dir)
            .map_err(|e| format!("Failed to create data directory: {}", e))?;

        let content = serde_json::to_string_pretty(index)
            .map_err(|e| format!("Failed to serialize index: {}", e))?;

        fs::write(self.index_path(), content).map_err(|e| format!("Failed to write index: {}", e))
    }

    /// Synchronous index load (public for SyncService)
    pub fn load_index_sync(&self) -> Result<PromptIndex, String> {
        let index_path = self.index_path();

        if !index_path.exists() {
            return self.seed_sample_prompts();
        }

        let content =
            fs::read_to_string(&index_path).map_err(|e| format!("Failed to read index: {}", e))?;

        let index: PromptIndex =
            serde_json::from_str(&content).map_err(|e| format!("Failed to parse index: {}", e))?;

        // Only seed if this is a fresh install (never seeded before)
        // Don't reseed if user intentionally deleted all prompts
        if index.prompts.is_empty() && !index.seeded {
            return self.seed_sample_prompts();
        }

        Ok(index)
    }

    /// Write prompt content synchronously (public for SyncService)
    pub fn write_prompt_content_sync(
        &self,
        folder: &str,
        filename: &str,
        content: &str,
    ) -> Result<(), String> {
        let folder_path = self.prompts_dir().join(folder);
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create folder: {}", e))?;
        let file_path = folder_path.join(filename);
        fs::write(&file_path, content)
            .map_err(|e| format!("Failed to write prompt file: {}", e))
    }

    // ==================== Sync Methods for SyncService ====================

    /// Save a prompt synchronously
    pub fn save_prompt_sync(&self, prompt: &Prompt) -> Result<PromptMetadata, String> {
        let mut index = self.load_index_sync()?;
        let now = Utc::now().to_rfc3339();

        let existing_idx = index
            .prompts
            .iter()
            .position(|p| p.id == prompt.metadata.id);

        let metadata = if let Some(idx) = existing_idx {
            let mut updated = prompt.metadata.clone();
            updated.updated = now.clone();
            updated.last_used = Some(now);
            index.prompts[idx] = updated.clone();
            updated
        } else {
            let id = if prompt.metadata.id.is_empty() {
                Uuid::new_v4().to_string()
            } else {
                prompt.metadata.id.clone()
            };

            let filename = if prompt.metadata.filename.is_empty() {
                format!("{}.md", slugify(&prompt.metadata.name))
            } else {
                prompt.metadata.filename.clone()
            };

            let new_metadata = PromptMetadata {
                id,
                name: prompt.metadata.name.clone(),
                folder: prompt.metadata.folder.clone(),
                description: prompt.metadata.description.clone(),
                filename,
                use_count: 0,
                last_used: Some(now.clone()),
                created: now.clone(),
                updated: now,
                icon: prompt.metadata.icon.clone(),
                color: prompt.metadata.color.clone(),
            };

            if !index.folders.contains(&new_metadata.folder) {
                index.folders.push(new_metadata.folder.clone());
            }

            index.prompts.push(new_metadata.clone());
            new_metadata
        };

        self.write_prompt_content(&metadata.folder, &metadata.filename, &prompt.content)?;
        self.save_index_sync(&index)?;

        Ok(metadata)
    }

    /// Delete a prompt synchronously
    pub fn delete_prompt_sync(&self, id: &str) -> Result<(), String> {
        let mut index = self.load_index_sync()?;

        let idx = index
            .prompts
            .iter()
            .position(|p| p.id == id)
            .ok_or_else(|| format!("Prompt not found: {}", id))?;

        let metadata = index.prompts.remove(idx);
        self.delete_prompt_content(&metadata.folder, &metadata.filename)?;
        self.save_index_sync(&index)?;

        Ok(())
    }

    /// Add a folder synchronously
    pub fn add_folder_sync(&self, name: &str) -> Result<(), String> {
        let mut index = self.load_index_sync()?;

        let folder_name = name.trim().to_lowercase();
        if folder_name.is_empty() {
            return Err("Folder name cannot be empty".to_string());
        }

        if index.folders.contains(&folder_name) {
            return Err("Folder already exists".to_string());
        }

        let folder_path = self.prompts_dir().join(&folder_name);
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create folder directory: {}", e))?;

        index.folders.push(folder_name);
        self.save_index_sync(&index)?;

        Ok(())
    }

    /// Rename a folder synchronously
    pub fn rename_folder_sync(&self, old_name: &str, new_name: &str) -> Result<(), String> {
        let mut index = self.load_index_sync()?;

        let old_folder = old_name.trim().to_lowercase();
        let new_folder = new_name.trim().to_lowercase();

        if new_folder.is_empty() {
            return Err("Folder name cannot be empty".to_string());
        }

        if !index.folders.contains(&old_folder) {
            return Err("Folder does not exist".to_string());
        }

        if index.folders.contains(&new_folder) {
            return Err("A folder with that name already exists".to_string());
        }

        let old_path = self.prompts_dir().join(&old_folder);
        let new_path = self.prompts_dir().join(&new_folder);

        if old_path.exists() {
            fs::rename(&old_path, &new_path)
                .map_err(|e| format!("Failed to rename folder directory: {}", e))?;
        }

        for prompt in &mut index.prompts {
            if prompt.folder == old_folder {
                prompt.folder = new_folder.clone();
            }
        }

        if let Some(pos) = index.folders.iter().position(|f| f == &old_folder) {
            index.folders[pos] = new_folder;
        }

        self.save_index_sync(&index)?;

        Ok(())
    }

    /// Delete a folder synchronously
    pub fn delete_folder_sync(&self, name: &str) -> Result<(), String> {
        let mut index = self.load_index_sync()?;

        let folder_name = name.trim().to_lowercase();

        if folder_name == "uncategorized" {
            return Err("Cannot delete the uncategorized folder".to_string());
        }

        if !index.folders.contains(&folder_name) {
            return Err("Folder does not exist".to_string());
        }

        let folder_path = self.prompts_dir().join(&folder_name);
        let uncategorized_path = self.prompts_dir().join("uncategorized");

        fs::create_dir_all(&uncategorized_path)
            .map_err(|e| format!("Failed to create uncategorized folder: {}", e))?;

        for prompt in &mut index.prompts {
            if prompt.folder == folder_name {
                let old_file = folder_path.join(&prompt.filename);
                let new_file = uncategorized_path.join(&prompt.filename);

                if old_file.exists() {
                    fs::rename(&old_file, &new_file)
                        .map_err(|e| format!("Failed to move prompt file: {}", e))?;
                }

                prompt.folder = "uncategorized".to_string();
            }
        }

        if folder_path.exists() {
            fs::remove_dir_all(&folder_path)
                .map_err(|e| format!("Failed to remove folder directory: {}", e))?;
        }

        index.folders.retain(|f| f != &folder_name);
        self.save_index_sync(&index)?;

        Ok(())
    }

    /// Record usage synchronously
    pub fn record_usage_sync(&self, id: &str) -> Result<(), String> {
        let mut index = self.load_index_sync()?;

        let prompt = index
            .prompts
            .iter_mut()
            .find(|p| p.id == id)
            .ok_or_else(|| format!("Prompt not found: {}", id))?;

        prompt.use_count += 1;
        prompt.last_used = Some(Utc::now().to_rfc3339());

        self.save_index_sync(&index)?;

        Ok(())
    }

    /// Search prompts synchronously
    pub fn search_prompts_sync(&self, query: &str) -> Result<Vec<SearchResult>, String> {
        let index = self.load_index_sync()?;
        let query_lower = query.to_lowercase();

        if query_lower.is_empty() {
            let mut results: Vec<SearchResult> = index
                .prompts
                .into_iter()
                .map(|prompt| {
                    let score = calculate_recency_score(&prompt);
                    SearchResult { prompt, score }
                })
                .collect();

            results.sort_by(|a, b| {
                let score_cmp = b.score.partial_cmp(&a.score).unwrap();
                if score_cmp != std::cmp::Ordering::Equal {
                    return score_cmp;
                }
                match (&b.prompt.last_used, &a.prompt.last_used) {
                    (Some(b_ts), Some(a_ts)) => b_ts.cmp(a_ts),
                    (Some(_), None) => std::cmp::Ordering::Less,
                    (None, Some(_)) => std::cmp::Ordering::Greater,
                    (None, None) => std::cmp::Ordering::Equal,
                }
            });
            results.truncate(MAX_RESULTS);
            return Ok(results);
        }

        let mut results: Vec<SearchResult> = index
            .prompts
            .into_iter()
            .filter_map(|prompt| {
                let score = self.calculate_score(&prompt, &query_lower);
                if score > 0.0 {
                    Some(SearchResult { prompt, score })
                } else {
                    None
                }
            })
            .collect();

        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        results.truncate(MAX_RESULTS);

        Ok(results)
    }

    /// Calculate match score for a prompt during search
    fn calculate_score(&self, prompt: &PromptMetadata, query: &str) -> f64 {
        let mut score = 0.0;

        let name_lower = prompt.name.to_lowercase();
        let folder_lower = prompt.folder.to_lowercase();
        let desc_lower = prompt.description.to_lowercase();

        // Exact match in name (highest priority)
        if name_lower == query {
            score += SCORE_NAME_MATCH * MULT_EXACT;
        } else if name_lower.starts_with(query) {
            score += SCORE_NAME_MATCH * MULT_PREFIX;
        } else if name_lower.contains(query) {
            score += SCORE_NAME_MATCH;
        }

        // Folder match
        if folder_lower.contains(query) {
            score += SCORE_FOLDER_MATCH;
        }

        // Description match
        if desc_lower.contains(query) {
            score += SCORE_DESCRIPTION_MATCH;
        }

        // Fuzzy matching for partial word matches in metadata
        if score == 0.0 {
            let query_words: Vec<&str> = query.split_whitespace().collect();
            for word in &query_words {
                if name_lower.contains(word) {
                    score += SCORE_NAME_MATCH * MULT_WORD;
                }
                if folder_lower.contains(word) {
                    score += SCORE_FOLDER_MATCH * MULT_WORD;
                }
                if desc_lower.contains(word) {
                    score += SCORE_DESCRIPTION_MATCH * MULT_WORD;
                }
            }
        }

        // Content search as fallback (only if no metadata match)
        if score == 0.0 {
            if let Ok(content) = self.read_prompt_content(&prompt.folder, &prompt.filename) {
                let content_lower = content.to_lowercase();
                if content_lower.contains(query) {
                    score += SCORE_CONTENT_MATCH;
                } else {
                    // Try word matching in content
                    let query_words: Vec<&str> = query.split_whitespace().collect();
                    for word in &query_words {
                        if content_lower.contains(word) {
                            score += SCORE_CONTENT_MATCH * MULT_WORD;
                        }
                    }
                }
            }
        }

        // Recency tiebreaker (only if we have a match)
        if score > 0.0 {
            score += calculate_recency_tiebreaker(prompt);
        }

        score
    }
}

impl Default for LocalDataStore {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl DataStore for LocalDataStore {
    async fn get_index(&self) -> Result<PromptIndex, String> {
        self.load_index_sync()
    }

    async fn save_index(&self, index: &PromptIndex) -> Result<(), String> {
        self.save_index_sync(index)
    }

    async fn get_prompt(&self, id: &str) -> Result<Prompt, String> {
        let index = self.load_index_sync()?;

        let metadata = index
            .prompts
            .iter()
            .find(|p| p.id == id)
            .ok_or_else(|| format!("Prompt not found: {}", id))?
            .clone();

        let content = self.read_prompt_content(&metadata.folder, &metadata.filename)?;

        Ok(Prompt { metadata, content })
    }

    async fn save_prompt(&self, prompt: &Prompt) -> Result<PromptMetadata, String> {
        let mut index = self.load_index_sync()?;
        let now = Utc::now().to_rfc3339();

        // Check if this is an update or create
        let existing_idx = index
            .prompts
            .iter()
            .position(|p| p.id == prompt.metadata.id);

        let metadata = if let Some(idx) = existing_idx {
            // Update existing
            let mut updated = prompt.metadata.clone();
            updated.updated = now.clone();
            // Set last_used on edit so edited prompts appear at top of recency list
            updated.last_used = Some(now);
            index.prompts[idx] = updated.clone();
            updated
        } else {
            // Create new
            let id = if prompt.metadata.id.is_empty() {
                Uuid::new_v4().to_string()
            } else {
                prompt.metadata.id.clone()
            };

            let filename = if prompt.metadata.filename.is_empty() {
                format!("{}.md", slugify(&prompt.metadata.name))
            } else {
                prompt.metadata.filename.clone()
            };

            let new_metadata = PromptMetadata {
                id,
                name: prompt.metadata.name.clone(),
                folder: prompt.metadata.folder.clone(),
                description: prompt.metadata.description.clone(),
                filename,
                use_count: 0,
                // Set last_used on create so new prompts appear at top of recency list
                last_used: Some(now.clone()),
                created: now.clone(),
                updated: now,
                icon: prompt.metadata.icon.clone(),
                color: prompt.metadata.color.clone(),
            };

            // Ensure folder exists in index
            if !index.folders.contains(&new_metadata.folder) {
                index.folders.push(new_metadata.folder.clone());
            }

            index.prompts.push(new_metadata.clone());
            new_metadata
        };

        // Write content to file
        self.write_prompt_content(&metadata.folder, &metadata.filename, &prompt.content)?;

        // Save index
        self.save_index_sync(&index)?;

        Ok(metadata)
    }

    async fn delete_prompt(&self, id: &str) -> Result<(), String> {
        let mut index = self.load_index_sync()?;

        let idx = index
            .prompts
            .iter()
            .position(|p| p.id == id)
            .ok_or_else(|| format!("Prompt not found: {}", id))?;

        let metadata = index.prompts.remove(idx);

        // Delete the file
        self.delete_prompt_content(&metadata.folder, &metadata.filename)?;

        self.save_index_sync(&index)?;

        Ok(())
    }

    async fn add_folder(&self, name: &str) -> Result<(), String> {
        let mut index = self.load_index_sync()?;

        let folder_name = name.trim().to_lowercase();
        if folder_name.is_empty() {
            return Err("Folder name cannot be empty".to_string());
        }

        if index.folders.contains(&folder_name) {
            return Err("Folder already exists".to_string());
        }

        // Create the folder directory
        let folder_path = self.prompts_dir().join(&folder_name);
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create folder directory: {}", e))?;

        // Add to index and save
        index.folders.push(folder_name);
        self.save_index_sync(&index)?;

        Ok(())
    }

    async fn rename_folder(&self, old_name: &str, new_name: &str) -> Result<(), String> {
        let mut index = self.load_index_sync()?;

        let old_folder = old_name.trim().to_lowercase();
        let new_folder = new_name.trim().to_lowercase();

        if new_folder.is_empty() {
            return Err("Folder name cannot be empty".to_string());
        }

        if !index.folders.contains(&old_folder) {
            return Err("Folder does not exist".to_string());
        }

        if index.folders.contains(&new_folder) {
            return Err("A folder with that name already exists".to_string());
        }

        // Rename the folder directory
        let old_path = self.prompts_dir().join(&old_folder);
        let new_path = self.prompts_dir().join(&new_folder);

        if old_path.exists() {
            fs::rename(&old_path, &new_path)
                .map_err(|e| format!("Failed to rename folder directory: {}", e))?;
        }

        // Update prompts that were in this folder
        for prompt in &mut index.prompts {
            if prompt.folder == old_folder {
                prompt.folder = new_folder.clone();
            }
        }

        // Update folders list
        if let Some(pos) = index.folders.iter().position(|f| f == &old_folder) {
            index.folders[pos] = new_folder;
        }

        self.save_index_sync(&index)?;

        Ok(())
    }

    async fn delete_folder(&self, name: &str) -> Result<(), String> {
        let mut index = self.load_index_sync()?;

        let folder_name = name.trim().to_lowercase();

        if folder_name == "uncategorized" {
            return Err("Cannot delete the uncategorized folder".to_string());
        }

        if !index.folders.contains(&folder_name) {
            return Err("Folder does not exist".to_string());
        }

        let folder_path = self.prompts_dir().join(&folder_name);
        let uncategorized_path = self.prompts_dir().join("uncategorized");

        // Ensure uncategorized folder exists
        fs::create_dir_all(&uncategorized_path)
            .map_err(|e| format!("Failed to create uncategorized folder: {}", e))?;

        // Move prompts to uncategorized
        for prompt in &mut index.prompts {
            if prompt.folder == folder_name {
                let old_file = folder_path.join(&prompt.filename);
                let new_file = uncategorized_path.join(&prompt.filename);

                if old_file.exists() {
                    fs::rename(&old_file, &new_file)
                        .map_err(|e| format!("Failed to move prompt file: {}", e))?;
                }

                prompt.folder = "uncategorized".to_string();
            }
        }

        // Remove the folder directory
        if folder_path.exists() {
            fs::remove_dir_all(&folder_path)
                .map_err(|e| format!("Failed to remove folder directory: {}", e))?;
        }

        // Remove from folders list
        index.folders.retain(|f| f != &folder_name);

        self.save_index_sync(&index)?;

        Ok(())
    }

    async fn record_usage(&self, id: &str) -> Result<(), String> {
        let mut index = self.load_index_sync()?;

        let prompt = index
            .prompts
            .iter_mut()
            .find(|p| p.id == id)
            .ok_or_else(|| format!("Prompt not found: {}", id))?;

        prompt.use_count += 1;
        prompt.last_used = Some(Utc::now().to_rfc3339());

        self.save_index_sync(&index)?;

        Ok(())
    }

    async fn search_prompts(&self, query: &str) -> Result<Vec<SearchResult>, String> {
        let index = self.load_index_sync()?;
        let query_lower = query.to_lowercase();

        if query_lower.is_empty() {
            // Return all prompts sorted by recency (never-used at bottom)
            let mut results: Vec<SearchResult> = index
                .prompts
                .into_iter()
                .map(|prompt| {
                    let score = calculate_recency_score(&prompt);
                    SearchResult { prompt, score }
                })
                .collect();

            // Sort by score descending, then by lastUsed descending as tiebreaker
            results.sort_by(|a, b| {
                let score_cmp = b.score.partial_cmp(&a.score).unwrap();
                if score_cmp != std::cmp::Ordering::Equal {
                    return score_cmp;
                }
                // Tiebreaker: compare lastUsed timestamps (more recent first)
                match (&b.prompt.last_used, &a.prompt.last_used) {
                    (Some(b_ts), Some(a_ts)) => b_ts.cmp(a_ts),
                    (Some(_), None) => std::cmp::Ordering::Less,
                    (None, Some(_)) => std::cmp::Ordering::Greater,
                    (None, None) => std::cmp::Ordering::Equal,
                }
            });
            results.truncate(MAX_RESULTS);
            return Ok(results);
        }

        let mut results: Vec<SearchResult> = index
            .prompts
            .into_iter()
            .filter_map(|prompt| {
                let score = self.calculate_score(&prompt, &query_lower);
                if score > 0.0 {
                    Some(SearchResult { prompt, score })
                } else {
                    None
                }
            })
            .collect();

        // Sort by score descending
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        results.truncate(MAX_RESULTS);

        Ok(results)
    }
}

/// Recency score for empty query (pure recency sort)
fn calculate_recency_score(prompt: &PromptMetadata) -> f64 {
    match &prompt.last_used {
        Some(ts) => DateTime::parse_from_rfc3339(ts)
            .map(|last| {
                let hours = Utc::now()
                    .signed_duration_since(last.with_timezone(&Utc))
                    .num_hours() as f64;
                let decay = 0.693 / RECENCY_HALF_LIFE_HOURS;
                RECENCY_MAX_SCORE * (-decay * hours.max(0.0)).exp()
            })
            .unwrap_or(NEVER_USED_PENALTY),
        None => NEVER_USED_PENALTY,
    }
}

/// Small recency bonus for search results (tie-breaker only)
fn calculate_recency_tiebreaker(prompt: &PromptMetadata) -> f64 {
    match &prompt.last_used {
        Some(ts) => DateTime::parse_from_rfc3339(ts)
            .map(|last| {
                let hours = Utc::now()
                    .signed_duration_since(last.with_timezone(&Utc))
                    .num_hours() as f64;
                let decay = 0.693 / RECENCY_HALF_LIFE_HOURS;
                RECENCY_TIEBREAKER_MAX * (-decay * hours.max(0.0)).exp()
            })
            .unwrap_or(0.0),
        None => 0.0,
    }
}

/// Convert a name to a filename-safe slug
fn slugify(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

/// Recursively copy a directory and its contents
fn copy_dir_recursive(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dst)
        .map_err(|e| format!("Failed to create directory {:?}: {}", dst, e))?;

    for entry in fs::read_dir(src)
        .map_err(|e| format!("Failed to read directory {:?}: {}", src, e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)
                .map_err(|e| format!("Failed to copy {:?} to {:?}: {}", src_path, dst_path, e))?;
        }
    }

    Ok(())
}
