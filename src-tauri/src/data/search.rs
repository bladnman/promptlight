use super::{index, prompt, PromptMetadata, SearchResult};
use chrono::{DateTime, Utc};

// Field weights (where match found)
const SCORE_NAME_MATCH: f64 = 100.0;
const SCORE_FOLDER_MATCH: f64 = 50.0;
const SCORE_DESCRIPTION_MATCH: f64 = 30.0;
const SCORE_CONTENT_MATCH: f64 = 15.0;

// Match quality multipliers
const MULT_EXACT: f64 = 2.0;
const MULT_PREFIX: f64 = 1.5;
const MULT_WORD: f64 = 0.5;

// Recency scoring (30-day half-life)
const RECENCY_MAX_SCORE: f64 = 100.0;
const RECENCY_HALF_LIFE_HOURS: f64 = 720.0;
const RECENCY_TIEBREAKER_MAX: f64 = 10.0;
const NEVER_USED_PENALTY: f64 = -1000.0;

const MAX_RESULTS: usize = 15;

/// Search prompts by query
#[tauri::command]
pub fn search_prompts(query: String) -> Result<Vec<SearchResult>, String> {
    let index = index::load_index()?;
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

        // Sort by score descending, then by lastUsed descending (most recent first) as tiebreaker
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
        if let Ok(content) = prompt::read_prompt_content(&prompt.folder, &prompt.filename) {
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

/// Recency score for empty query (pure recency sort)
/// Returns high positive for recently used, NEVER_USED_PENALTY for never-used
fn calculate_recency_score(prompt: &PromptMetadata) -> f64 {
    match &prompt.last_used {
        Some(ts) => {
            DateTime::parse_from_rfc3339(ts)
                .map(|last| {
                    let hours = Utc::now()
                        .signed_duration_since(last.with_timezone(&Utc))
                        .num_hours() as f64;
                    let decay = 0.693 / RECENCY_HALF_LIFE_HOURS;
                    RECENCY_MAX_SCORE * (-decay * hours.max(0.0)).exp()
                })
                .unwrap_or(NEVER_USED_PENALTY)
        }
        None => NEVER_USED_PENALTY,
    }
}

/// Small recency bonus for search results (tie-breaker only)
fn calculate_recency_tiebreaker(prompt: &PromptMetadata) -> f64 {
    match &prompt.last_used {
        Some(ts) => {
            DateTime::parse_from_rfc3339(ts)
                .map(|last| {
                    let hours = Utc::now()
                        .signed_duration_since(last.with_timezone(&Utc))
                        .num_hours() as f64;
                    let decay = 0.693 / RECENCY_HALF_LIFE_HOURS;
                    RECENCY_TIEBREAKER_MAX * (-decay * hours.max(0.0)).exp()
                })
                .unwrap_or(0.0)
        }
        None => 0.0,
    }
}
