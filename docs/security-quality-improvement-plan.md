# Comprehensive Security & Quality Improvement Plan

This plan addresses 5 prioritized issues in order of severity:

1. ●●●●● Sync data loss prevention
2. ●●●●○ Secure credential storage
3. ●●●●○ Rust unit tests for local.rs
4. ●●●○○ Decompose local.rs
5. ●●●○○ Folder name sanitization

## Given the following issues:

Supplied here for reference only. Plan follows.

  ●●●●● – Sync data loss prevention

  The destructive sync architecture needs defensive hardening. Add backup-before-replace, transaction logging, and
   better empty-state detection. A single corrupted cloud response could wipe all local prompts. Affects: sync.rs.

  ●●●●○ – Secure credential storage

  Move auth tokens from plaintext JSON to macOS Keychain. Current implementation at auth/storage.rs exposes tokens
   to any local process. Use security-framework crate for keychain access.

  ●●●●○ – Rust unit tests for local.rs

  The 926-line god object has zero unit tests. Add tests for prompt CRUD, folder operations, and search scoring
  before any refactoring. Critical for catching regressions in the data layer.

  ●●●○○ – Decompose local.rs

  Split into focused modules (PromptStore, FolderStore, SearchEngine) after tests are in place. The current
  monolith makes changes risky and testing difficult. Estimated ~12-16 hours with tests.

  ●●●○○ – Add folder name sanitization

  Validate folder names against path traversal patterns before file operations. Current code trusts user input for
   filesystem paths. Quick fix in add_folder_sync() and rename_folder_sync().

---

# Issue 1: Sync Data Loss Prevention (●●●●●)

## Objective
Harden the destructive sync architecture with backup-before-replace, transaction logging, and better empty-state detection.

## Critical Files
- `src-tauri/src/data/sync.rs:186-232` - `sync_from_firestore()` - main integration point
- `src-tauri/src/data/sync.rs:143-169` - `sync_to_firestore()` - logging only
- `src-tauri/src/data/mod.rs` - Add new module exports
- `src-tauri/src/data/backup.rs` - NEW: Backup module
- `src-tauri/src/data/sync_log.rs` - NEW: Transaction logging

---

## Implementation

### Step 1: Create Backup Module (`src-tauri/src/data/backup.rs`)

```rust
use std::path::{Path, PathBuf};
use std::fs;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    pub id: String,              // "2025-12-04T10-30-45_pre-sync-from-cloud"
    pub created: String,         // ISO timestamp
    pub reason: String,          // "pre-sync-from-cloud", "manual"
    pub prompt_count: usize,
}

/// Create timestamped backup of index.json and prompts/
pub fn create_backup(data_dir: &Path, reason: &str) -> Result<String, String> {
    let timestamp = Utc::now().format("%Y-%m-%dT%H-%M-%S").to_string();
    let backup_id = format!("{}_{}", timestamp, reason);
    let backup_dir = data_dir.join("backups").join(&backup_id);

    fs::create_dir_all(&backup_dir)?;

    // Copy index.json
    let src_index = data_dir.join("index.json");
    if src_index.exists() {
        fs::copy(&src_index, backup_dir.join("index.json"))?;
    }

    // Copy prompts/ directory
    let src_prompts = data_dir.join("prompts");
    if src_prompts.exists() {
        copy_dir_recursive(&src_prompts, &backup_dir.join("prompts"))?;
    }

    Ok(backup_id)
}

/// List available backups, newest first
pub fn list_backups(data_dir: &Path) -> Result<Vec<BackupInfo>, String>

/// Restore from backup (copies backup contents to data_dir)
pub fn restore_backup(data_dir: &Path, backup_id: &str) -> Result<(), String>

/// Delete old backups, keeping last N
pub fn prune_backups(data_dir: &Path, keep_count: usize) -> Result<usize, String>

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String>
```

**Backup directory structure:**
```
~/.prompt-launcher/users/{uid}/
├── index.json
├── prompts/
└── backups/
    ├── 2025-12-04T10-30-45_pre-sync-from-cloud/
    │   ├── index.json
    │   └── prompts/
    └── 2025-12-03T15-20-00_pre-sync-from-cloud/
        └── ...
```

### Step 2: Create Sync Log Module (`src-tauri/src/data/sync_log.rs`)

```rust
use std::fs::OpenOptions;
use std::io::Write;
use chrono::Utc;

pub enum SyncOperation { FromCloud, ToCloud }
pub enum SyncResult { Success, Blocked(String), Error(String) }

/// Append to ~/.prompt-launcher/sync.log
pub fn log_sync_operation(
    op: SyncOperation,
    user_id: &str,
    local_count: usize,
    cloud_count: Option<usize>,
    result: &SyncResult,
    backup_id: Option<&str>,
) -> Result<(), String>
```

**Log format (append-only):**
```
2025-12-04T10:30:45Z | FROM_CLOUD | user:abc123 | local:15 cloud:15 | SUCCESS | backup:2025-12-04T10-30-45_pre-sync
2025-12-04T10:35:00Z | FROM_CLOUD | user:abc123 | local:15 cloud:0 | BLOCKED:empty_cloud
```

### Step 3: Enhanced Validation in sync.rs

Add validation function:

```rust
struct SyncValidation {
    valid: bool,
    issues: Vec<String>,
}

fn validate_cloud_data(index: &PromptIndex) -> SyncValidation {
    let mut issues = Vec::new();

    // Empty check (existing)
    if index.prompts.is_empty() {
        issues.push("no prompts".to_string());
    }

    // Invalid IDs
    let invalid_ids = index.prompts.iter()
        .filter(|p| p.id.is_empty())
        .count();
    if invalid_ids > 0 {
        issues.push(format!("{} prompts with empty IDs", invalid_ids));
    }

    // Duplicate IDs
    let mut seen = std::collections::HashSet::new();
    let duplicates = index.prompts.iter()
        .filter(|p| !seen.insert(&p.id))
        .count();
    if duplicates > 0 {
        issues.push(format!("{} duplicate IDs", duplicates));
    }

    SyncValidation { valid: issues.is_empty(), issues }
}
```

### Step 4: Integrate into `sync_from_firestore()` (sync.rs:186-232)

**Current flow:**
1. Get auth + local count
2. Download from Firestore
3. Empty check → skip if cloud empty & local has data
4. Save index + write prompts

**New flow:**
```rust
pub async fn sync_from_firestore(&self) -> Result<(), String> {
    let (user_id, id_token, firestore, local_prompt_count, data_dir) = {
        // ... existing auth extraction (lines 187-200)
        // ADD: get data_dir from local_store
    };

    // Download from Firestore
    let (index, prompts) = firestore.download_all(&user_id, &id_token).await?;
    let cloud_count = index.prompts.len();

    // ENHANCED: Validate cloud data
    let validation = validate_cloud_data(&index);
    if !validation.valid && local_prompt_count > 0 {
        let reason = validation.issues.join("; ");
        sync_log::log_sync_operation(
            SyncOperation::FromCloud, &user_id,
            local_prompt_count, Some(cloud_count),
            &SyncResult::Blocked(reason.clone()), None
        );
        eprintln!("[SYNC SAFETY] Cloud data invalid: {}. Skipping.", reason);
        return Ok(());
    }

    // NEW: Create backup BEFORE overwriting
    let backup_id = if local_prompt_count > 0 {
        match backup::create_backup(&data_dir, "pre-sync-from-cloud") {
            Ok(id) => Some(id),
            Err(e) => {
                eprintln!("[BACKUP] Failed to create backup: {}", e);
                None  // Continue sync even if backup fails
            }
        }
    } else {
        None
    };

    // Save to local (existing code, lines 217-228)
    {
        let state = self.state.read().unwrap();
        state.local_store.save_index_sync(&index)?;
        for prompt in prompts {
            state.local_store.write_prompt_content_sync(...)?;
        }
    }

    // NEW: Log success
    sync_log::log_sync_operation(
        SyncOperation::FromCloud, &user_id,
        local_prompt_count, Some(cloud_count),
        &SyncResult::Success, backup_id.as_deref()
    );

    // NEW: Prune old backups
    if let Err(e) = backup::prune_backups(&data_dir, 5) {
        eprintln!("[BACKUP] Prune failed: {}", e);
    }

    Ok(())
}
```

### Step 5: Add logging to `sync_to_firestore()` (sync.rs:143-169)

Add logging after the upload:

```rust
// After line 168 (firestore.upload_all)
sync_log::log_sync_operation(
    SyncOperation::ToCloud, &user_id,
    index.prompts.len(), None,
    &SyncResult::Success, None
);
```

### Step 6: Update mod.rs

Add to `src-tauri/src/data/mod.rs`:

```rust
pub mod backup;
pub mod sync_log;
```

### Step 7: Add data_dir() accessor to LocalDataStore

Need to expose data directory for backup operations. Add to `local.rs`:

```rust
impl LocalDataStore {
    /// Get the data directory path
    pub fn data_dir(&self) -> &Path {
        &self.data_dir
    }
}
```

---

## File Changes Summary

| File | Change |
|------|--------|
| `src-tauri/src/data/mod.rs:10` | Add `pub mod backup;` and `pub mod sync_log;` |
| `src-tauri/src/data/backup.rs` | NEW: ~120 lines |
| `src-tauri/src/data/sync_log.rs` | NEW: ~50 lines |
| `src-tauri/src/data/sync.rs:186-232` | Add backup + logging + validation |
| `src-tauri/src/data/sync.rs:143-169` | Add logging |
| `src-tauri/src/data/local.rs` | Add `data_dir()` accessor if needed |

**Total:** ~200 new lines of Rust code

---

## Testing Strategy

**Unit tests for backup.rs:**
- `test_create_backup` - Creates backup directory with correct structure
- `test_list_backups` - Returns backups in newest-first order
- `test_restore_backup` - Restores index.json and prompts
- `test_prune_backups` - Keeps exactly N most recent

**Unit tests for validation:**
- `test_validate_empty_index`
- `test_validate_empty_ids`
- `test_validate_duplicate_ids`

**Integration test:**
- Mock Firestore download → verify backup created → verify local updated → verify log written

---

## Decisions Made

- **Keep 5 backups** (per user preference)
- **Internal only** - no UI for backup/restore
- **No sync status indicator** - keep current silent background behavior
- **Backup even on validation failure** - safer to over-backup
- **Continue sync if backup fails** - backup failure shouldn't block sync

---

# Issue 2: Secure Credential Storage (●●●●○)

## Problem
Auth tokens are stored in plaintext JSON at `~/Library/Application Support/com.promptlight/auth_session.json`. Any local process can read these tokens.

## Critical Files
- `src-tauri/src/auth/storage.rs` - Current plaintext storage (74 lines)
- `src-tauri/Cargo.toml` - Add `security-framework` dependency

## Solution
Replace JSON file storage with macOS Keychain using the `security-framework` crate.

### Step 1: Add dependency to Cargo.toml

```toml
[target.'cfg(target_os = "macos")'.dependencies]
security-framework = "2.9"
```

### Step 2: Rewrite storage.rs

**Keychain service name:** `com.promptlight.auth`
**Keychain account:** `auth_session`

```rust
use security_framework::passwords::{set_generic_password, get_generic_password, delete_generic_password};

const SERVICE: &str = "com.promptlight.auth";
const ACCOUNT: &str = "auth_session";

/// Save auth session to macOS Keychain
pub fn save_auth_session(session: &AuthSession) -> Result<(), String> {
    let json = serde_json::to_string(session)
        .map_err(|e| format!("Failed to serialize session: {}", e))?;

    // Delete existing if any (set_generic_password doesn't overwrite)
    let _ = delete_generic_password(SERVICE, ACCOUNT);

    set_generic_password(SERVICE, ACCOUNT, json.as_bytes())
        .map_err(|e| format!("Failed to save to keychain: {}", e))
}

/// Load auth session from macOS Keychain
pub fn load_auth_session() -> Option<AuthSession> {
    let data = get_generic_password(SERVICE, ACCOUNT).ok()?;
    let json = String::from_utf8(data).ok()?;
    serde_json::from_str(&json).ok()
}

/// Clear auth session from macOS Keychain
pub fn clear_auth() -> Result<(), String> {
    delete_generic_password(SERVICE, ACCOUNT)
        .map_err(|e| format!("Failed to clear keychain: {}", e))
}

// get_auth_state() remains unchanged - it just calls load_auth_session()
```

### Step 3: Migration from old storage

On first load, check if old JSON file exists:
1. Load from JSON file
2. Save to Keychain
3. Delete JSON file

```rust
fn migrate_from_json_if_needed() {
    let old_path = get_old_auth_file_path();
    if old_path.exists() {
        if let Ok(json) = fs::read_to_string(&old_path) {
            if let Ok(session) = serde_json::from_str::<AuthSession>(&json) {
                let _ = save_auth_session(&session);
            }
        }
        let _ = fs::remove_file(&old_path);
    }
}
```

### Platform Consideration
For cross-platform support later:
- Windows: Use Windows Credential Manager
- Linux: Use libsecret/Secret Service API

For now, only implement macOS (primary target). Add `#[cfg(target_os = "macos")]` guards.

---

# Issue 3: Rust Unit Tests for local.rs (●●●●○)

## Problem
The 926-line `local.rs` has zero unit tests. Changes are risky without regression protection.

## Critical File
- `src-tauri/src/data/local.rs`

## Test Plan

### Test File Location
`src-tauri/src/data/local.rs` - add `#[cfg(test)] mod tests` at bottom

### Test Categories

**1. Index Operations**
```rust
#[test] fn test_load_index_creates_sample_prompts_for_new_user()
#[test] fn test_load_index_returns_existing_index()
#[test] fn test_load_index_does_not_reseed_if_seeded_flag_set()
#[test] fn test_save_index_creates_directory_if_missing()
```

**2. Prompt CRUD**
```rust
#[test] fn test_save_prompt_creates_new_prompt()
#[test] fn test_save_prompt_generates_uuid_if_empty()
#[test] fn test_save_prompt_generates_filename_from_name()
#[test] fn test_save_prompt_updates_existing_prompt()
#[test] fn test_save_prompt_adds_folder_if_missing()
#[test] fn test_delete_prompt_removes_from_index()
#[test] fn test_delete_prompt_removes_file()
#[test] fn test_delete_prompt_returns_error_for_missing()
#[test] fn test_get_prompt_returns_metadata_and_content()
#[test] fn test_get_prompt_returns_error_for_missing()
```

**3. Folder Operations**
```rust
#[test] fn test_add_folder_creates_directory()
#[test] fn test_add_folder_rejects_empty_name()
#[test] fn test_add_folder_rejects_duplicate()
#[test] fn test_rename_folder_updates_prompts()
#[test] fn test_rename_folder_moves_directory()
#[test] fn test_delete_folder_moves_prompts_to_uncategorized()
#[test] fn test_delete_folder_rejects_uncategorized()
```

**4. Search Scoring**
```rust
#[test] fn test_search_exact_name_match_scores_highest()
#[test] fn test_search_prefix_match_scores_higher_than_contains()
#[test] fn test_search_content_fallback_when_no_metadata_match()
#[test] fn test_search_empty_query_returns_by_recency()
#[test] fn test_search_respects_max_results()
```

**5. Migration**
```rust
#[test] fn test_migrate_from_anonymous_copies_data()
#[test] fn test_migrate_from_anonymous_skips_if_user_has_data()
#[test] fn test_migrate_from_anonymous_skips_if_no_anonymous_data()
```

### Test Infrastructure

Use `tempdir` for isolated test directories:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_store() -> (LocalDataStore, TempDir) {
        let temp = TempDir::new().unwrap();
        let store = LocalDataStore::with_data_dir(temp.path().to_path_buf());
        (store, temp)
    }
}
```

---

# Issue 4: Decompose local.rs (●●●○○)

## Problem
926-line monolith makes changes risky and testing difficult.

## Prerequisite
Complete Issue 3 (unit tests) first. Tests enable safe refactoring.

## Proposed Module Structure

```
src-tauri/src/data/
├── mod.rs              # Re-exports
├── local/
│   ├── mod.rs          # LocalDataStore struct + DataStore impl
│   ├── prompt.rs       # Prompt CRUD operations
│   ├── folder.rs       # Folder operations
│   ├── search.rs       # Search + scoring logic
│   └── migration.rs    # Anonymous → user migration
├── sync.rs             # (unchanged)
├── backup.rs           # (new from Issue 1)
└── ...
```

## Refactoring Steps

1. **Extract search logic** (~200 lines)
   - Move `calculate_score`, `calculate_recency_score`, `calculate_recency_tiebreaker`
   - Move scoring constants
   - `search.rs` exports `SearchEngine` or free functions

2. **Extract folder operations** (~150 lines)
   - Move `add_folder_sync`, `rename_folder_sync`, `delete_folder_sync`
   - Move async `add_folder`, `rename_folder`, `delete_folder`

3. **Extract prompt operations** (~300 lines)
   - Move `save_prompt_sync`, `delete_prompt_sync`, `record_usage_sync`
   - Move `read_prompt_content`, `write_prompt_content`, `delete_prompt_content`

4. **Extract migration** (~50 lines)
   - Move `migrate_from_anonymous`, `copy_dir_recursive`

5. **Remaining in local/mod.rs** (~200 lines)
   - `LocalDataStore` struct and constructors
   - `DataStore` trait implementation (delegates to extracted modules)
   - Index operations (`load_index_sync`, `save_index_sync`)

## Implementation Order

Each step:
1. Create new file with extracted code
2. Update imports in local.rs
3. Run tests to verify no regressions
4. Commit

---

# Issue 5: Folder Name Sanitization (●●●○○)

## Problem
User input for folder names is trusted for filesystem paths. Potential path traversal attack.

## Critical Locations
- `local.rs:311` - `add_folder_sync()`
- `local.rs:334` - `rename_folder_sync()`

## Current Code (vulnerable)

```rust
pub fn add_folder_sync(&self, name: &str) -> Result<(), String> {
    let folder_name = name.trim().to_lowercase();  // Only lowercases
    // ...
    let folder_path = self.prompts_dir().join(&folder_name);  // Path traversal possible!
    fs::create_dir_all(&folder_path)?;
}
```

## Solution

### Step 1: Add validation function

```rust
/// Validate and sanitize a folder name
/// Returns sanitized name or error if invalid
fn sanitize_folder_name(name: &str) -> Result<String, String> {
    let trimmed = name.trim().to_lowercase();

    // Reject empty
    if trimmed.is_empty() {
        return Err("Folder name cannot be empty".to_string());
    }

    // Reject path traversal patterns
    if trimmed.contains("..") || trimmed.contains('/') || trimmed.contains('\\') {
        return Err("Folder name contains invalid characters".to_string());
    }

    // Reject hidden files (Unix convention)
    if trimmed.starts_with('.') {
        return Err("Folder name cannot start with a dot".to_string());
    }

    // Reject reserved names (cross-platform safety)
    let reserved = ["con", "prn", "aux", "nul", "com1", "lpt1"];
    if reserved.contains(&trimmed.as_str()) {
        return Err("Folder name is reserved".to_string());
    }

    // Sanitize: keep only alphanumeric, dash, underscore
    let sanitized: String = trimmed
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect();

    if sanitized.is_empty() {
        return Err("Folder name must contain alphanumeric characters".to_string());
    }

    // Limit length
    if sanitized.len() > 64 {
        return Err("Folder name too long (max 64 characters)".to_string());
    }

    Ok(sanitized)
}
```

### Step 2: Update add_folder_sync()

```rust
pub fn add_folder_sync(&self, name: &str) -> Result<(), String> {
    let folder_name = sanitize_folder_name(name)?;  // Use sanitizer

    if index.folders.contains(&folder_name) {
        return Err("Folder already exists".to_string());
    }
    // ... rest unchanged
}
```

### Step 3: Update rename_folder_sync()

```rust
pub fn rename_folder_sync(&self, old_name: &str, new_name: &str) -> Result<(), String> {
    let old_folder = sanitize_folder_name(old_name)?;
    let new_folder = sanitize_folder_name(new_name)?;
    // ... rest unchanged
}
```

### Step 4: Add tests

```rust
#[test] fn test_sanitize_rejects_path_traversal()
#[test] fn test_sanitize_rejects_slashes()
#[test] fn test_sanitize_rejects_hidden_names()
#[test] fn test_sanitize_removes_special_chars()
#[test] fn test_sanitize_limits_length()
```

---

# Implementation Order

Execute in this order to minimize risk:

1. **Issue 5: Folder sanitization** (quick fix, low risk)
2. **Issue 1: Sync data loss prevention** (critical safety)
3. **Issue 2: Secure credential storage** (security improvement)
4. **Issue 3: Unit tests for local.rs** (enables Issue 4)
5. **Issue 4: Decompose local.rs** (requires tests first)

---

# Total Estimated Changes

| Issue | New Lines | Modified Lines | New Files |
|-------|-----------|----------------|-----------|
| 1. Sync backup | ~170 | ~50 | 2 (backup.rs, sync_log.rs) |
| 2. Keychain | ~60 | ~74 (rewrite) | 0 |
| 3. Unit tests | ~400 | ~10 | 0 |
| 4. Decompose | ~50 | ~900 (reorganize) | 4 (local/*.rs) |
| 5. Sanitization | ~40 | ~10 | 0 |
| **Total** | ~720 | ~1044 | 6 |
