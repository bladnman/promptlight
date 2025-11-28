# Recency/Frequency Sorting Implementation

## Changes Made

### `src-tauri/src/data/prompt.rs` (1 line)
- Made `read_prompt_content` public so it can be used by search

### `src-tauri/src/data/search.rs` (full refactor)
- **Empty query**: Now sorts by recency (30-day half-life), never-used prompts at bottom
- **Search scoring**:
  - Name (100-200 pts) > Folder (50 pts) > Description (30 pts) > Content (15 pts)
  - Uses multipliers: exact (2×), prefix (1.5×), word match (0.5×)
  - Content search only runs when no metadata match (optimization)
  - Recency tiebreaker (0-10 pts) breaks ties between equal matches

## No UI Changes
The API signature is unchanged (`search_prompts(query: String) -> Result<Vec<SearchResult>, String>`), so this will merge cleanly with other branches working on the UI.

## Scoring Behavior

| Scenario | Score |
|----------|-------|
| Empty query, just used | ~100 pts |
| Empty query, used 1 week ago | ~87 pts |
| Empty query, used 1 month ago | ~50 pts |
| Empty query, never used | -1000 pts (bottom) |
| Search: exact name match | 200 + recency (0-10) |
| Search: name contains query | 100 + recency (0-10) |
| Search: only in content | 15 + recency (0-10) |

## Constants (in search.rs)

```rust
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
```

## Testing Scenarios

1. **Empty query recency**: Launch app → most recently used prompt appears first
2. **Never-used at bottom**: New prompts appear below used ones in empty query
3. **Tie-breaking**: Two prompts both contain "test" in name → recently used ranks higher
4. **Match priority**: Exact name match beats recently-used partial match
5. **Content fallback**: Search for word only in prompt body → finds it (lower score)
6. **Word matching**: Multi-word query "code review" matches prompts with those words
