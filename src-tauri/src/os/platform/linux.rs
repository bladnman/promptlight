//! Linux-specific implementations (stub).
//!
//! TODO: Implement using X11 (x11rb) for X11 sessions and
//! ydotool or libei for Wayland.

use super::{AppFocusTracker, AppId, InputSimulator};

/// Linux app focus tracker (stub implementation).
pub struct LinuxFocusTracker;

impl LinuxFocusTracker {
    pub fn new() -> Self {
        Self
    }
}

impl AppFocusTracker for LinuxFocusTracker {
    fn capture_focused_app(&self) -> Result<Option<AppId>, String> {
        // TODO: For X11, use XGetInputFocus to get window ID
        // For Wayland, this is more complex (wlr-foreign-toplevel)
        println!("[platform:linux] capture_focused_app not implemented");
        Ok(None)
    }

    fn activate_app(&self, _app_id: &AppId) -> Result<bool, String> {
        // TODO: For X11, use XSetInputFocus or _NET_ACTIVE_WINDOW
        // For Wayland, use wlr-foreign-toplevel-management
        println!("[platform:linux] activate_app not implemented");
        Ok(false)
    }
}

/// Linux input simulator (stub implementation).
pub struct LinuxInputSimulator;

impl LinuxInputSimulator {
    pub fn new() -> Self {
        Self
    }
}

impl InputSimulator for LinuxInputSimulator {
    fn simulate_paste(&self) -> Result<(), String> {
        // TODO: For X11, use XTest extension (fake_input)
        // For Wayland, use ydotool as fallback
        println!("[platform:linux] simulate_paste not implemented");
        Err("Linux paste simulation not yet implemented".to_string())
    }
}
