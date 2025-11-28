use super::{index, PromptMetadata, SearchResult};

/// Search configuration
const SCORE_NAME_MATCH: f64 = 100.0;
const SCORE_FOLDER_MATCH: f64 = 50.0;
const SCORE_DESCRIPTION_MATCH: f64 = 30.0;
const USAGE_BONUS_FACTOR: f64 = 0.5;
const MAX_RESULTS: usize = 15;

/// Search prompts by query
#[tauri::command]
pub fn search_prompts(query: String) -> Result<Vec<SearchResult>, String> {
    let index = index::load_index()?;
    let query_lower = query.to_lowercase();

    if query_lower.is_empty() {
        // Return all prompts sorted by usage
        let mut results: Vec<SearchResult> = index
            .prompts
            .into_iter()
            .map(|prompt| {
                let score = prompt.use_count as f64 * USAGE_BONUS_FACTOR;
                SearchResult { prompt, score }
            })
            .collect();

        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        results.truncate(MAX_RESULTS);
        return Ok(results);
    }

    let mut results: Vec<SearchResult> = index
        .prompts
        .into_iter()
        .filter_map(|prompt| {
            let score = calculate_score(&prompt, &query_lower);
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

/// Calculate match score for a prompt
fn calculate_score(prompt: &PromptMetadata, query: &str) -> f64 {
    let mut score = 0.0;

    let name_lower = prompt.name.to_lowercase();
    let folder_lower = prompt.folder.to_lowercase();
    let desc_lower = prompt.description.to_lowercase();

    // Exact match in name (highest priority)
    if name_lower == query {
        score += SCORE_NAME_MATCH * 2.0;
    } else if name_lower.starts_with(query) {
        score += SCORE_NAME_MATCH * 1.5;
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

    // Fuzzy matching for partial word matches
    if score == 0.0 {
        let query_words: Vec<&str> = query.split_whitespace().collect();
        for word in &query_words {
            if name_lower.contains(word) {
                score += SCORE_NAME_MATCH * 0.5;
            }
            if folder_lower.contains(word) {
                score += SCORE_FOLDER_MATCH * 0.5;
            }
            if desc_lower.contains(word) {
                score += SCORE_DESCRIPTION_MATCH * 0.5;
            }
        }
    }

    // Usage bonus
    if score > 0.0 {
        score += prompt.use_count as f64 * USAGE_BONUS_FACTOR;
    }

    score
}
