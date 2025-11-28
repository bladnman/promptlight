//! Previous application tracking for paste-into-previous-app functionality.
//!
//! This module captures the frontmost application before Promptlight appears,
//! then provides functions to return focus and simulate paste.

use once_cell::sync::Lazy;
use std::process::Command;
use std::sync::Mutex;

/// Thread-safe storage for the previously-focused application's bundle identifier
static PREVIOUS_APP: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));

/// Capture the frontmost app BEFORE showing Promptlight.
/// This must be called before the launcher window is shown.
#[cfg(target_os = "macos")]
pub fn capture_previous_app() -> Result<(), String> {
    let script = r#"
        tell application "System Events"
            set frontApp to first application process whose frontmost is true
            return bundle identifier of frontApp
        end tell
    "#;

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .map_err(|e| format!("osascript failed: {}", e))?;

    if output.status.success() {
        let bundle_id = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !bundle_id.is_empty() && bundle_id != "missing value" {
            println!("[previous_app] Captured: {}", bundle_id);
            if let Ok(mut guard) = PREVIOUS_APP.lock() {
                *guard = Some(bundle_id);
            }
        } else {
            println!("[previous_app] No valid bundle ID captured");
        }
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        println!("[previous_app] osascript failed: {}", stderr);
    }

    Ok(())
}

#[cfg(not(target_os = "macos"))]
pub fn capture_previous_app() -> Result<(), String> {
    Ok(())
}

/// Get the stored previous app bundle identifier
pub fn get_previous_app() -> Option<String> {
    PREVIOUS_APP.lock().ok().and_then(|g| g.clone())
}

/// Clear the stored previous app
pub fn clear_previous_app() {
    if let Ok(mut guard) = PREVIOUS_APP.lock() {
        *guard = None;
    }
}

/// Activate the previously captured app using AppleScript.
/// Returns Ok(true) if successful, Ok(false) if no previous app was stored.
#[cfg(target_os = "macos")]
pub fn activate_previous_app() -> Result<bool, String> {
    let bundle_id = match get_previous_app() {
        Some(id) => id,
        None => {
            println!("[previous_app] No previous app stored");
            return Ok(false);
        }
    };

    println!("[previous_app] Activating: {}", bundle_id);

    // Escape any quotes in the bundle ID
    let escaped = bundle_id.replace("\"", "\\\"");

    let script = format!(
        r#"
        try
            tell application id "{}" to activate
            return "success"
        on error errMsg
            return "error: " & errMsg
        end try
    "#,
        escaped
    );

    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| format!("osascript failed: {}", e))?;

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if result.starts_with("error") {
        println!("[previous_app] Activation error: {}", result);
        Err(result)
    } else {
        println!("[previous_app] Activation successful");
        Ok(true)
    }
}

#[cfg(not(target_os = "macos"))]
pub fn activate_previous_app() -> Result<bool, String> {
    Ok(false)
}

/// Simulate Cmd+V paste keystroke using AppleScript.
/// Requires Accessibility permission - macOS will prompt on first use.
#[cfg(target_os = "macos")]
pub fn simulate_paste() -> Result<(), String> {
    println!("[previous_app] Simulating Cmd+V");

    let script = r#"
        try
            tell application "System Events"
                keystroke "v" using command down
            end tell
            return "success"
        on error errMsg
            return "error: " & errMsg
        end try
    "#;

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .map_err(|e| format!("osascript failed: {}", e))?;

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if result.starts_with("error") {
        println!("[previous_app] Paste simulation error: {}", result);
        Err(result)
    } else {
        println!("[previous_app] Paste simulation successful");
        Ok(())
    }
}

#[cfg(not(target_os = "macos"))]
pub fn simulate_paste() -> Result<(), String> {
    Err("Not supported on this platform".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_storage_and_clear() {
        // Start clean
        clear_previous_app();
        assert!(get_previous_app().is_none());

        // Store a value
        if let Ok(mut guard) = PREVIOUS_APP.lock() {
            *guard = Some("com.apple.TextEdit".to_string());
        }
        assert_eq!(get_previous_app(), Some("com.apple.TextEdit".to_string()));

        // Clear it
        clear_previous_app();
        assert!(get_previous_app().is_none());
    }

    #[test]
    fn test_empty_state() {
        clear_previous_app();
        assert!(get_previous_app().is_none());
    }

    #[test]
    fn test_overwrite_state() {
        clear_previous_app();

        if let Ok(mut guard) = PREVIOUS_APP.lock() {
            *guard = Some("com.apple.Safari".to_string());
        }
        assert_eq!(get_previous_app(), Some("com.apple.Safari".to_string()));

        // Overwrite
        if let Ok(mut guard) = PREVIOUS_APP.lock() {
            *guard = Some("com.apple.Notes".to_string());
        }
        assert_eq!(get_previous_app(), Some("com.apple.Notes".to_string()));

        clear_previous_app();
    }
}
