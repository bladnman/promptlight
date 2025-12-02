//! Previous application tracking for paste-into-previous-app functionality.
//!
//! This module captures the frontmost application before Promptlight appears,
//! then provides functions to return focus and simulate paste.
//!
//! Uses native platform APIs (CGEvent + NSRunningApplication on macOS)
//! instead of AppleScript for better performance and cross-platform support.

use once_cell::sync::Lazy;
use std::sync::Mutex;

use crate::os::platform::{self, AppId};

/// Thread-safe storage for the previously-focused application
static PREVIOUS_APP: Lazy<Mutex<Option<AppId>>> = Lazy::new(|| Mutex::new(None));

/// Capture the frontmost app BEFORE showing Promptlight.
/// This must be called before the launcher window is shown.
pub fn capture_previous_app() -> Result<(), String> {
    let tracker = platform::create_focus_tracker();

    match tracker.capture_focused_app() {
        Ok(Some(app_id)) => {
            let display = match (&app_id.bundle_id, app_id.pid) {
                (Some(b), Some(p)) => format!("{} (pid: {})", b, p),
                (Some(b), None) => b.clone(),
                (None, Some(p)) => format!("pid:{}", p),
                (None, None) => "unknown".to_string(),
            };
            println!("[previous_app] Captured: {}", display);
            if let Ok(mut guard) = PREVIOUS_APP.lock() {
                *guard = Some(app_id);
            }
        }
        Ok(None) => {
            println!("[previous_app] No focused app to capture");
        }
        Err(e) => {
            println!("[previous_app] Capture failed: {}", e);
            return Err(e);
        }
    }

    Ok(())
}

/// Get the stored previous app identifier
pub fn get_previous_app() -> Option<AppId> {
    PREVIOUS_APP.lock().ok().and_then(|g| g.clone())
}

/// Clear the stored previous app
pub fn clear_previous_app() {
    if let Ok(mut guard) = PREVIOUS_APP.lock() {
        *guard = None;
    }
}

/// Activate the previously captured app using native platform APIs.
/// Returns Ok(true) if successful, Ok(false) if no previous app was stored.
pub fn activate_previous_app() -> Result<bool, String> {
    let app_id = match get_previous_app() {
        Some(id) => id,
        None => {
            println!("[previous_app] No previous app stored");
            return Ok(false);
        }
    };

    let display = match (&app_id.bundle_id, app_id.pid) {
        (Some(b), Some(p)) => format!("{} (pid: {})", b, p),
        (Some(b), None) => b.clone(),
        (None, Some(p)) => format!("pid:{}", p),
        (None, None) => "unknown".to_string(),
    };
    println!("[previous_app] Activating: {}", display);

    let tracker = platform::create_focus_tracker();
    tracker.activate_app(&app_id)
}

/// Simulate Cmd+V (macOS) or Ctrl+V (Windows/Linux) paste keystroke.
/// Requires Accessibility permission on macOS.
pub fn simulate_paste() -> Result<(), String> {
    println!("[previous_app] Simulating paste keystroke");

    let simulator = platform::create_input_simulator();
    simulator.simulate_paste()
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
            *guard = Some(AppId::new("com.apple.TextEdit"));
        }
        assert_eq!(
            get_previous_app().and_then(|a| a.bundle_id),
            Some("com.apple.TextEdit".to_string())
        );

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
            *guard = Some(AppId::new("com.apple.Safari"));
        }
        assert_eq!(
            get_previous_app().and_then(|a| a.bundle_id),
            Some("com.apple.Safari".to_string())
        );

        // Overwrite
        if let Ok(mut guard) = PREVIOUS_APP.lock() {
            *guard = Some(AppId::new("com.apple.Notes"));
        }
        assert_eq!(
            get_previous_app().and_then(|a| a.bundle_id),
            Some("com.apple.Notes".to_string())
        );

        clear_previous_app();
    }

    #[test]
    fn test_pid_only_storage() {
        clear_previous_app();

        // Store a PID-only app ID (simulating app without bundle ID)
        if let Ok(mut guard) = PREVIOUS_APP.lock() {
            *guard = Some(AppId::from_pid(12345));
        }

        let stored = get_previous_app();
        assert!(stored.is_some());
        let app_id = stored.unwrap();
        assert_eq!(app_id.bundle_id, None);
        assert_eq!(app_id.pid, Some(12345));

        clear_previous_app();
    }
}
