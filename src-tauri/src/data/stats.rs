use super::index;
use chrono::Utc;

/// Record usage of a prompt (increment count and update lastUsed)
#[tauri::command]
pub fn record_usage(id: String) -> Result<(), String> {
    let mut index = index::load_index()?;

    let prompt = index
        .prompts
        .iter_mut()
        .find(|p| p.id == id)
        .ok_or_else(|| format!("Prompt not found: {}", id))?;

    prompt.use_count += 1;
    prompt.last_used = Some(Utc::now().to_rfc3339());

    index::save_index(&index)?;

    Ok(())
}
