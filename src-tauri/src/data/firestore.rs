//! Firestore REST API client for syncing prompts to the cloud.
//!
//! This module provides a client for the Firestore REST API that syncs
//! user prompts to Firebase. It uses the user's Firebase ID token for
//! authentication.
//!
//! Firestore structure:
//! ```text
//! users/{uid}/
//!   meta (document)
//!     - folders: string[]
//!     - folderMeta: map
//!   prompts/{prompt_id} (document)
//!     - all prompt fields including content
//! ```

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::{FolderMetadata, Prompt, PromptIndex, PromptMetadata};

/// Firestore REST API base URL
const FIRESTORE_BASE_URL: &str = "https://firestore.googleapis.com/v1";

/// Firestore client for syncing data
#[derive(Clone)]
pub struct FirestoreClient {
    client: Client,
    project_id: String,
}

impl FirestoreClient {
    /// Create a new Firestore client
    pub fn new(project_id: &str) -> Self {
        Self {
            client: Client::new(),
            project_id: project_id.to_string(),
        }
    }

    /// Get the project ID
    pub fn project_id(&self) -> &str {
        &self.project_id
    }

    /// Get the base documents URL for a user
    fn user_docs_url(&self, user_id: &str) -> String {
        format!(
            "{}/projects/{}/databases/(default)/documents/users/{}",
            FIRESTORE_BASE_URL, self.project_id, user_id
        )
    }

    /// Fetch all prompts for a user from Firestore
    pub async fn fetch_all_prompts(
        &self,
        user_id: &str,
        id_token: &str,
    ) -> Result<Vec<Prompt>, String> {
        let url = format!("{}/prompts", self.user_docs_url(user_id));

        let response = self
            .client
            .get(&url)
            .bearer_auth(id_token)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch prompts: {}", e))?;

        if response.status() == 404 {
            // No prompts collection yet
            return Ok(Vec::new());
        }

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(format!("Firestore error: {}", error));
        }

        let list_response: FirestoreListResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let prompts = list_response
            .documents
            .unwrap_or_default()
            .into_iter()
            .filter_map(|doc| doc.to_prompt().ok())
            .collect();

        Ok(prompts)
    }

    /// Fetch folder metadata for a user from Firestore
    /// Meta is stored directly on the user document at users/{userId}
    pub async fn fetch_meta(
        &self,
        user_id: &str,
        id_token: &str,
    ) -> Result<UserMeta, String> {
        // Store meta on the user document directly (not a subdocument)
        let url = self.user_docs_url(user_id);

        let response = self
            .client
            .get(&url)
            .bearer_auth(id_token)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch meta: {}", e))?;

        if response.status() == 404 {
            // No meta document yet, return defaults
            return Ok(UserMeta::default());
        }

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(format!("Firestore error: {}", error));
        }

        let doc: FirestoreDocument = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        doc.to_user_meta()
    }

    /// Save a prompt to Firestore
    pub async fn save_prompt(
        &self,
        user_id: &str,
        id_token: &str,
        prompt: &Prompt,
    ) -> Result<(), String> {
        let url = format!("{}/prompts/{}", self.user_docs_url(user_id), prompt.metadata.id);

        let doc = FirestoreDocument::from_prompt(prompt);

        let response = self
            .client
            .patch(&url)
            .bearer_auth(id_token)
            .json(&doc)
            .send()
            .await
            .map_err(|e| format!("Failed to save prompt: {}", e))?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(format!("Firestore error: {}", error));
        }

        Ok(())
    }

    /// Delete a prompt from Firestore
    pub async fn delete_prompt(
        &self,
        user_id: &str,
        id_token: &str,
        prompt_id: &str,
    ) -> Result<(), String> {
        let url = format!("{}/prompts/{}", self.user_docs_url(user_id), prompt_id);

        let response = self
            .client
            .delete(&url)
            .bearer_auth(id_token)
            .send()
            .await
            .map_err(|e| format!("Failed to delete prompt: {}", e))?;

        // 404 is OK - prompt might not exist in Firestore
        if !response.status().is_success() && response.status() != 404 {
            let error = response.text().await.unwrap_or_default();
            return Err(format!("Firestore error: {}", error));
        }

        Ok(())
    }

    /// Save user meta (folders) to Firestore
    /// Meta is stored directly on the user document at users/{userId}
    pub async fn save_meta(
        &self,
        user_id: &str,
        id_token: &str,
        meta: &UserMeta,
    ) -> Result<(), String> {
        // Store meta on the user document directly (not a subdocument)
        let url = self.user_docs_url(user_id);

        let doc = FirestoreDocument::from_user_meta(meta);

        let response = self
            .client
            .patch(&url)
            .bearer_auth(id_token)
            .json(&doc)
            .send()
            .await
            .map_err(|e| format!("Failed to save meta: {}", e))?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(format!("Firestore error: {}", error));
        }

        Ok(())
    }

    /// Sync local data to Firestore (upload all)
    pub async fn upload_all(
        &self,
        user_id: &str,
        id_token: &str,
        index: &PromptIndex,
        prompts: &[Prompt],
    ) -> Result<(), String> {
        // Upload meta (folders)
        let meta = UserMeta {
            folders: index.folders.clone(),
            folder_meta: index.folder_meta.clone(),
        };
        self.save_meta(user_id, id_token, &meta).await?;

        // Upload all prompts
        for prompt in prompts {
            self.save_prompt(user_id, id_token, prompt).await?;
        }

        Ok(())
    }

    /// Download all data from Firestore and build a PromptIndex
    pub async fn download_all(
        &self,
        user_id: &str,
        id_token: &str,
    ) -> Result<(PromptIndex, Vec<Prompt>), String> {
        let meta = self.fetch_meta(user_id, id_token).await?;
        let prompts = self.fetch_all_prompts(user_id, id_token).await?;

        let prompt_metadata: Vec<PromptMetadata> = prompts
            .iter()
            .map(|p| p.metadata.clone())
            .collect();

        let index = PromptIndex {
            prompts: prompt_metadata,
            folders: meta.folders,
            folder_meta: meta.folder_meta,
            seeded: true, // Cloud users have already been seeded
        };

        Ok((index, prompts))
    }
}

/// User metadata stored in Firestore
#[derive(Debug, Clone, Default)]
pub struct UserMeta {
    pub folders: Vec<String>,
    pub folder_meta: Option<HashMap<String, FolderMetadata>>,
}

// ==================== Firestore Document Types ====================

/// Firestore list response
#[derive(Debug, Deserialize)]
struct FirestoreListResponse {
    documents: Option<Vec<FirestoreDocument>>,
}

/// Firestore document structure
#[derive(Debug, Serialize, Deserialize)]
struct FirestoreDocument {
    #[serde(skip_serializing_if = "Option::is_none")]
    name: Option<String>,
    fields: HashMap<String, FirestoreValue>,
}

/// Firestore value types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
enum FirestoreValue {
    StringValue(String),
    IntegerValue(String), // Firestore sends integers as strings
    BooleanValue(bool),
    NullValue(()),
    ArrayValue(FirestoreArrayValue),
    MapValue(FirestoreMapValue),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct FirestoreArrayValue {
    values: Option<Vec<FirestoreValue>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct FirestoreMapValue {
    fields: HashMap<String, FirestoreValue>,
}

impl FirestoreDocument {
    /// Convert a Prompt to a Firestore document
    fn from_prompt(prompt: &Prompt) -> Self {
        let mut fields = HashMap::new();

        fields.insert("id".to_string(), FirestoreValue::StringValue(prompt.metadata.id.clone()));
        fields.insert("name".to_string(), FirestoreValue::StringValue(prompt.metadata.name.clone()));
        fields.insert("folder".to_string(), FirestoreValue::StringValue(prompt.metadata.folder.clone()));
        fields.insert("description".to_string(), FirestoreValue::StringValue(prompt.metadata.description.clone()));
        fields.insert("filename".to_string(), FirestoreValue::StringValue(prompt.metadata.filename.clone()));
        fields.insert("useCount".to_string(), FirestoreValue::IntegerValue(prompt.metadata.use_count.to_string()));
        fields.insert("created".to_string(), FirestoreValue::StringValue(prompt.metadata.created.clone()));
        fields.insert("updated".to_string(), FirestoreValue::StringValue(prompt.metadata.updated.clone()));
        fields.insert("content".to_string(), FirestoreValue::StringValue(prompt.content.clone()));

        if let Some(ref last_used) = prompt.metadata.last_used {
            fields.insert("lastUsed".to_string(), FirestoreValue::StringValue(last_used.clone()));
        }
        if let Some(ref icon) = prompt.metadata.icon {
            fields.insert("icon".to_string(), FirestoreValue::StringValue(icon.clone()));
        }
        if let Some(ref color) = prompt.metadata.color {
            fields.insert("color".to_string(), FirestoreValue::StringValue(color.clone()));
        }

        Self { name: None, fields }
    }

    /// Convert a Firestore document to a Prompt
    fn to_prompt(&self) -> Result<Prompt, String> {
        let get_string = |key: &str| -> Result<String, String> {
            match self.fields.get(key) {
                Some(FirestoreValue::StringValue(s)) => Ok(s.clone()),
                Some(_) => Err(format!("Field {} is not a string", key)),
                None => Err(format!("Missing field: {}", key)),
            }
        };

        let get_optional_string = |key: &str| -> Option<String> {
            match self.fields.get(key) {
                Some(FirestoreValue::StringValue(s)) => Some(s.clone()),
                _ => None,
            }
        };

        let get_u32 = |key: &str| -> u32 {
            match self.fields.get(key) {
                Some(FirestoreValue::IntegerValue(s)) => s.parse().unwrap_or(0),
                _ => 0,
            }
        };

        let metadata = PromptMetadata {
            id: get_string("id")?,
            name: get_string("name")?,
            folder: get_string("folder")?,
            description: get_string("description").unwrap_or_default(),
            filename: get_string("filename")?,
            use_count: get_u32("useCount"),
            last_used: get_optional_string("lastUsed"),
            created: get_string("created")?,
            updated: get_string("updated")?,
            icon: get_optional_string("icon"),
            color: get_optional_string("color"),
        };

        let content = get_string("content").unwrap_or_default();

        Ok(Prompt { metadata, content })
    }

    /// Convert UserMeta to a Firestore document
    fn from_user_meta(meta: &UserMeta) -> Self {
        let mut fields = HashMap::new();

        // Convert folders to array
        let folder_values: Vec<FirestoreValue> = meta
            .folders
            .iter()
            .map(|f| FirestoreValue::StringValue(f.clone()))
            .collect();

        fields.insert(
            "folders".to_string(),
            FirestoreValue::ArrayValue(FirestoreArrayValue {
                values: Some(folder_values),
            }),
        );

        // Convert folder_meta to map if present
        if let Some(ref folder_meta) = meta.folder_meta {
            let mut meta_fields = HashMap::new();
            for (name, fm) in folder_meta {
                let mut fm_fields = HashMap::new();
                fm_fields.insert("name".to_string(), FirestoreValue::StringValue(fm.name.clone()));
                if let Some(ref icon) = fm.icon {
                    fm_fields.insert("icon".to_string(), FirestoreValue::StringValue(icon.clone()));
                }
                if let Some(ref color) = fm.color {
                    fm_fields.insert("color".to_string(), FirestoreValue::StringValue(color.clone()));
                }
                meta_fields.insert(
                    name.clone(),
                    FirestoreValue::MapValue(FirestoreMapValue { fields: fm_fields }),
                );
            }
            fields.insert(
                "folderMeta".to_string(),
                FirestoreValue::MapValue(FirestoreMapValue { fields: meta_fields }),
            );
        }

        Self { name: None, fields }
    }

    /// Convert a Firestore document to UserMeta
    fn to_user_meta(&self) -> Result<UserMeta, String> {
        let mut folders = Vec::new();

        if let Some(FirestoreValue::ArrayValue(arr)) = self.fields.get("folders") {
            if let Some(values) = &arr.values {
                for v in values {
                    if let FirestoreValue::StringValue(s) = v {
                        folders.push(s.clone());
                    }
                }
            }
        }

        let folder_meta = if let Some(FirestoreValue::MapValue(map)) = self.fields.get("folderMeta") {
            let mut result = HashMap::new();
            for (name, value) in &map.fields {
                if let FirestoreValue::MapValue(fm_map) = value {
                    let fm = FolderMetadata {
                        name: fm_map.fields.get("name")
                            .and_then(|v| if let FirestoreValue::StringValue(s) = v { Some(s.clone()) } else { None })
                            .unwrap_or_else(|| name.clone()),
                        icon: fm_map.fields.get("icon")
                            .and_then(|v| if let FirestoreValue::StringValue(s) = v { Some(s.clone()) } else { None }),
                        color: fm_map.fields.get("color")
                            .and_then(|v| if let FirestoreValue::StringValue(s) = v { Some(s.clone()) } else { None }),
                    };
                    result.insert(name.clone(), fm);
                }
            }
            Some(result)
        } else {
            None
        };

        // Ensure default folders exist
        if folders.is_empty() {
            folders.push("uncategorized".to_string());
        }

        Ok(UserMeta { folders, folder_meta })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prompt_to_document_roundtrip() {
        let prompt = Prompt {
            metadata: PromptMetadata {
                id: "test-id".to_string(),
                name: "Test Prompt".to_string(),
                folder: "development".to_string(),
                description: "A test prompt".to_string(),
                filename: "test-prompt.md".to_string(),
                use_count: 5,
                last_used: Some("2024-01-01T00:00:00Z".to_string()),
                created: "2024-01-01T00:00:00Z".to_string(),
                updated: "2024-01-02T00:00:00Z".to_string(),
                icon: Some("code".to_string()),
                color: None,
            },
            content: "This is the prompt content.".to_string(),
        };

        let doc = FirestoreDocument::from_prompt(&prompt);
        let roundtrip = doc.to_prompt().unwrap();

        assert_eq!(roundtrip.metadata.id, prompt.metadata.id);
        assert_eq!(roundtrip.metadata.name, prompt.metadata.name);
        assert_eq!(roundtrip.metadata.folder, prompt.metadata.folder);
        assert_eq!(roundtrip.metadata.use_count, prompt.metadata.use_count);
        assert_eq!(roundtrip.content, prompt.content);
    }

    #[test]
    fn test_user_meta_to_document_roundtrip() {
        let mut folder_meta = HashMap::new();
        folder_meta.insert(
            "development".to_string(),
            FolderMetadata {
                name: "Development".to_string(),
                icon: Some("code".to_string()),
                color: Some("#ff0000".to_string()),
            },
        );

        let meta = UserMeta {
            folders: vec!["development".to_string(), "writing".to_string()],
            folder_meta: Some(folder_meta),
        };

        let doc = FirestoreDocument::from_user_meta(&meta);
        let roundtrip = doc.to_user_meta().unwrap();

        assert_eq!(roundtrip.folders, meta.folders);
        assert!(roundtrip.folder_meta.is_some());
    }
}
