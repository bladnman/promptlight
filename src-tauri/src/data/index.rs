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

/// Add a new folder
#[tauri::command]
pub fn add_folder(name: String) -> Result<(), String> {
    let mut index = load_index()?;

    let folder_name = name.trim().to_lowercase();
    if folder_name.is_empty() {
        return Err("Folder name cannot be empty".to_string());
    }

    if index.folders.contains(&folder_name) {
        return Err("Folder already exists".to_string());
    }

    // Create the folder directory
    let data_dir = get_data_dir();
    let folder_path = data_dir.join("prompts").join(&folder_name);
    fs::create_dir_all(&folder_path)
        .map_err(|e| format!("Failed to create folder directory: {}", e))?;

    // Add to index and save
    index.folders.push(folder_name);
    save_index(&index)?;

    Ok(())
}

/// Rename a folder
#[tauri::command]
pub fn rename_folder(old_name: String, new_name: String) -> Result<(), String> {
    let mut index = load_index()?;

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
    let data_dir = get_data_dir();
    let old_path = data_dir.join("prompts").join(&old_folder);
    let new_path = data_dir.join("prompts").join(&new_folder);

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

    save_index(&index)?;

    Ok(())
}

/// Delete a folder (moves prompts to uncategorized)
#[tauri::command]
pub fn delete_folder(name: String) -> Result<(), String> {
    let mut index = load_index()?;

    let folder_name = name.trim().to_lowercase();

    if folder_name == "uncategorized" {
        return Err("Cannot delete the uncategorized folder".to_string());
    }

    if !index.folders.contains(&folder_name) {
        return Err("Folder does not exist".to_string());
    }

    let data_dir = get_data_dir();
    let prompts_dir = data_dir.join("prompts");
    let folder_path = prompts_dir.join(&folder_name);
    let uncategorized_path = prompts_dir.join("uncategorized");

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

    save_index(&index)?;

    Ok(())
}
