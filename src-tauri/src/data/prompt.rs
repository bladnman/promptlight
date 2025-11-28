use super::{get_data_dir, index, Prompt, PromptMetadata};
use chrono::Utc;
use std::fs;
use uuid::Uuid;

/// Get a prompt by ID (loads content from file)
#[tauri::command]
pub fn get_prompt(id: String) -> Result<Prompt, String> {
    let index = index::load_index()?;

    let metadata = index
        .prompts
        .iter()
        .find(|p| p.id == id)
        .ok_or_else(|| format!("Prompt not found: {}", id))?
        .clone();

    let content = read_prompt_content(&metadata.folder, &metadata.filename)?;

    Ok(Prompt { metadata, content })
}

/// Save a prompt (creates or updates)
#[tauri::command]
pub fn save_prompt(prompt: Prompt) -> Result<PromptMetadata, String> {
    let mut index = index::load_index()?;
    let now = Utc::now().to_rfc3339();

    // Check if this is an update or create
    let existing_idx = index.prompts.iter().position(|p| p.id == prompt.metadata.id);

    let metadata = if let Some(idx) = existing_idx {
        // Update existing
        let mut updated = prompt.metadata.clone();
        updated.updated = now;
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
            name: prompt.metadata.name,
            folder: prompt.metadata.folder.clone(),
            description: prompt.metadata.description,
            filename,
            use_count: 0,
            last_used: None,
            created: now.clone(),
            updated: now,
        };

        // Ensure folder exists in index
        if !index.folders.contains(&new_metadata.folder) {
            index.folders.push(new_metadata.folder.clone());
        }

        index.prompts.push(new_metadata.clone());
        new_metadata
    };

    // Write content to file
    write_prompt_content(&metadata.folder, &metadata.filename, &prompt.content)?;

    // Save index
    index::save_index(&index)?;

    Ok(metadata)
}

/// Delete a prompt
#[tauri::command]
pub fn delete_prompt(id: String) -> Result<(), String> {
    let mut index = index::load_index()?;

    let idx = index
        .prompts
        .iter()
        .position(|p| p.id == id)
        .ok_or_else(|| format!("Prompt not found: {}", id))?;

    let metadata = index.prompts.remove(idx);

    // Delete the file
    let file_path = get_data_dir()
        .join("prompts")
        .join(&metadata.folder)
        .join(&metadata.filename);

    if file_path.exists() {
        fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to delete prompt file: {}", e))?;
    }

    index::save_index(&index)?;

    Ok(())
}

/// Read prompt content from file
fn read_prompt_content(folder: &str, filename: &str) -> Result<String, String> {
    let file_path = get_data_dir().join("prompts").join(folder).join(filename);

    if !file_path.exists() {
        return Ok(String::new());
    }

    fs::read_to_string(&file_path).map_err(|e| format!("Failed to read prompt file: {}", e))
}

/// Write prompt content to file
fn write_prompt_content(folder: &str, filename: &str, content: &str) -> Result<(), String> {
    let folder_path = get_data_dir().join("prompts").join(folder);
    fs::create_dir_all(&folder_path)
        .map_err(|e| format!("Failed to create folder: {}", e))?;

    let file_path = folder_path.join(filename);
    fs::write(&file_path, content).map_err(|e| format!("Failed to write prompt file: {}", e))
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
