use super::{AuthSession, AuthTokens, User};
use super::google::GoogleTokens;
use serde::{Deserialize, Serialize};

/// Firebase Auth REST API endpoints
const FIREBASE_AUTH_URL: &str = "https://identitytoolkit.googleapis.com/v1";
const FIREBASE_TOKEN_URL: &str = "https://securetoken.googleapis.com/v1/token";

/// Response from Firebase signInWithIdp
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SignInWithIdpResponse {
    local_id: String,
    email: Option<String>,
    display_name: Option<String>,
    photo_url: Option<String>,
    id_token: String,
    refresh_token: String,
    expires_in: String,
}

/// Response from Firebase token refresh
#[derive(Debug, Deserialize)]
struct RefreshTokenResponse {
    id_token: String,
    refresh_token: String,
    expires_in: String,
    user_id: String,
}

/// Request body for signInWithIdp
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SignInWithIdpRequest {
    post_body: String,
    request_uri: String,
    return_idp_credential: bool,
    return_secure_token: bool,
}

/// Exchange Google tokens for Firebase Auth session
pub async fn sign_in_with_google_token(
    api_key: &str,
    google_tokens: &GoogleTokens,
) -> Result<AuthSession, String> {
    let client = reqwest::Client::new();

    let url = format!(
        "{}/accounts:signInWithIdp?key={}",
        FIREBASE_AUTH_URL, api_key
    );

    // Build the post_body for Google provider
    let post_body = format!(
        "id_token={}&providerId=google.com",
        google_tokens.id_token
    );

    let request = SignInWithIdpRequest {
        post_body,
        request_uri: "http://localhost".to_string(),
        return_idp_credential: true,
        return_secure_token: true,
    };

    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Firebase auth request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Firebase auth failed: {}", error_text));
    }

    let auth_response: SignInWithIdpResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Firebase response: {}", e))?;

    // Calculate expiration time
    let expires_in: i64 = auth_response
        .expires_in
        .parse()
        .unwrap_or(3600);
    let expires_at = chrono::Utc::now().timestamp() + expires_in;

    Ok(AuthSession {
        user: User {
            uid: auth_response.local_id,
            email: auth_response.email,
            display_name: auth_response.display_name,
            photo_url: auth_response.photo_url,
        },
        tokens: AuthTokens {
            id_token: auth_response.id_token,
            refresh_token: auth_response.refresh_token,
            expires_at,
        },
    })
}

/// Refresh the Firebase ID token using the refresh token
pub async fn refresh_token(api_key: &str, refresh_token: &str) -> Result<AuthSession, String> {
    let client = reqwest::Client::new();

    let url = format!("{}?key={}", FIREBASE_TOKEN_URL, api_key);

    let params = [
        ("grant_type", "refresh_token"),
        ("refresh_token", refresh_token),
    ];

    let response = client
        .post(&url)
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Token refresh request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Token refresh failed: {}", error_text));
    }

    let refresh_response: RefreshTokenResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse refresh response: {}", e))?;

    // Calculate expiration time
    let expires_in: i64 = refresh_response
        .expires_in
        .parse()
        .unwrap_or(3600);
    let expires_at = chrono::Utc::now().timestamp() + expires_in;

    // We need to fetch user info again since refresh doesn't return it
    let user = get_user_info(api_key, &refresh_response.id_token).await?;

    Ok(AuthSession {
        user,
        tokens: AuthTokens {
            id_token: refresh_response.id_token,
            refresh_token: refresh_response.refresh_token,
            expires_at,
        },
    })
}

/// Response from Firebase getAccountInfo
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GetAccountInfoResponse {
    users: Vec<UserInfo>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UserInfo {
    local_id: String,
    email: Option<String>,
    display_name: Option<String>,
    photo_url: Option<String>,
}

/// Get user info from Firebase
async fn get_user_info(api_key: &str, id_token: &str) -> Result<User, String> {
    let client = reqwest::Client::new();

    let url = format!(
        "{}/accounts:lookup?key={}",
        FIREBASE_AUTH_URL, api_key
    );

    let body = serde_json::json!({
        "idToken": id_token
    });

    let response = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Get user info failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Get user info failed: {}", error_text));
    }

    let account_response: GetAccountInfoResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse user info: {}", e))?;

    let user_info = account_response
        .users
        .into_iter()
        .next()
        .ok_or("No user found")?;

    Ok(User {
        uid: user_info.local_id,
        email: user_info.email,
        display_name: user_info.display_name,
        photo_url: user_info.photo_url,
    })
}
