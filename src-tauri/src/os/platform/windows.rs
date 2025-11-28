//! Windows-specific implementations (stub).
//!
//! TODO: Implement using SendInput for keystrokes and
//! GetForegroundWindow/SetForegroundWindow for app focus.

use super::{AppFocusTracker, AppId, InputSimulator};

/// Windows app focus tracker (stub implementation).
pub struct WindowsFocusTracker;

impl WindowsFocusTracker {
    pub fn new() -> Self {
        Self
    }
}

impl AppFocusTracker for WindowsFocusTracker {
    fn capture_focused_app(&self) -> Result<Option<AppId>, String> {
        // TODO: Use GetForegroundWindow to get HWND
        // Store HWND as hex string in AppId
        println!("[platform:windows] capture_focused_app not implemented");
        Ok(None)
    }

    fn activate_app(&self, _app_id: &AppId) -> Result<bool, String> {
        // TODO: Use SetForegroundWindow with stored HWND
        println!("[platform:windows] activate_app not implemented");
        Ok(false)
    }
}

/// Windows input simulator (stub implementation).
pub struct WindowsInputSimulator;

impl WindowsInputSimulator {
    pub fn new() -> Self {
        Self
    }
}

impl InputSimulator for WindowsInputSimulator {
    fn simulate_paste(&self) -> Result<(), String> {
        // TODO: Use SendInput to send Ctrl+V
        // VK_CONTROL = 0x11, VK_V = 0x56
        println!("[platform:windows] simulate_paste not implemented");
        Err("Windows paste simulation not yet implemented".to_string())
    }
}
