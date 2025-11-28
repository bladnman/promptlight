use super::{create_sample_prompts, get_data_dir, PromptIndex};
use std::fs;

/// Load the index from disk, seeding sample prompts if empty
pub fn load_index() -> Result<PromptIndex, String> {
    let data_dir = get_data_dir();
    let index_path = data_dir.join("index.json");

    if !index_path.exists() {
        // Seed sample prompts for new users
        return seed_sample_prompts();
    }

    let content = fs::read_to_string(&index_path)
        .map_err(|e| format!("Failed to read index: {}", e))?;

    let index: PromptIndex = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse index: {}", e))?;

    // If index exists but has no prompts, seed samples
    if index.prompts.is_empty() {
        return seed_sample_prompts();
    }

    Ok(index)
}

/// Seed sample prompts for new users
fn seed_sample_prompts() -> Result<PromptIndex, String> {
    let data_dir = get_data_dir();
    let prompts_dir = data_dir.join("prompts");

    // Create sample prompts
    let (index, files) = create_sample_prompts();

    // Write prompt files to correct folder paths
    for (idx, (filename, content)) in files.iter().enumerate() {
        let folder = &index.prompts[idx].folder;
        let folder_path = prompts_dir.join(folder);

        // Create folder if needed
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create folder {}: {}", folder, e))?;

        let file_path = folder_path.join(filename);
        fs::write(&file_path, content)
            .map_err(|e| format!("Failed to write prompt file {}: {}", filename, e))?;
    }

    // Save the index
    save_index(&index)?;

    Ok(index)
}

/// Save the index to disk
pub fn save_index(index: &PromptIndex) -> Result<(), String> {
    let data_dir = get_data_dir();
    fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create data directory: {}", e))?;

    let index_path = data_dir.join("index.json");
    let content = serde_json::to_string_pretty(index)
        .map_err(|e| format!("Failed to serialize index: {}", e))?;

    fs::write(&index_path, content)
        .map_err(|e| format!("Failed to write index: {}", e))
}

/// Get the full index
#[tauri::command]
pub fn get_index() -> Result<PromptIndex, String> {
    load_index()
}

/// Get all folders
#[tauri::command]
pub fn get_folders() -> Result<Vec<String>, String> {
    let index = load_index()?;
    Ok(index.folders)
}
