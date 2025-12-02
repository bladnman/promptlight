//! Platform abstraction for OS-specific functionality.
//!
//! This module provides traits that abstract platform-specific operations,
//! allowing the same high-level code to work across macOS, Windows, and Linux.

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "linux")]
pub mod linux;

/// Represents an application identifier (platform-specific)
/// Can contain a bundle identifier, a PID, or both.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AppId {
    /// Bundle identifier (e.g., "com.apple.Safari")
    pub bundle_id: Option<String>,
    /// Process ID as a fallback
    pub pid: Option<i32>,
}

impl AppId {
    /// Create an AppId with a bundle identifier
    pub fn new(bundle_id: impl Into<String>) -> Self {
        Self {
            bundle_id: Some(bundle_id.into()),
            pid: None,
        }
    }

    /// Create an AppId with only a PID (when bundle ID not available)
    pub fn from_pid(pid: i32) -> Self {
        Self {
            bundle_id: None,
            pid: Some(pid),
        }
    }

    /// Create an AppId with both bundle ID and PID
    pub fn with_pid(bundle_id: impl Into<String>, pid: i32) -> Self {
        Self {
            bundle_id: Some(bundle_id.into()),
            pid: Some(pid),
        }
    }

    /// Get the bundle ID if available
    pub fn as_str(&self) -> &str {
        self.bundle_id.as_deref().unwrap_or("")
    }
}

/// Trait for tracking and restoring application focus.
///
/// Implementations capture the currently-focused application before
/// our window appears, then restore focus to it later.
pub trait AppFocusTracker: Send + Sync {
    /// Capture the currently focused application.
    /// Returns the app identifier, or None if no app is focused.
    fn capture_focused_app(&self) -> Result<Option<AppId>, String>;

    /// Activate (bring to front) a previously captured application.
    /// Returns Ok(true) if successful, Ok(false) if app not found.
    fn activate_app(&self, app_id: &AppId) -> Result<bool, String>;
}

/// Trait for simulating keyboard input.
///
/// Implementations send synthetic keyboard events to the system,
/// allowing us to simulate paste (Cmd+V / Ctrl+V) and other shortcuts.
pub trait InputSimulator: Send + Sync {
    /// Simulate a paste keystroke (Cmd+V on macOS, Ctrl+V on Windows/Linux).
    fn simulate_paste(&self) -> Result<(), String>;
}

/// Create the platform-specific app focus tracker.
pub fn create_focus_tracker() -> Box<dyn AppFocusTracker> {
    #[cfg(target_os = "macos")]
    {
        Box::new(macos::MacOSFocusTracker::new())
    }

    #[cfg(target_os = "windows")]
    {
        Box::new(windows::WindowsFocusTracker::new())
    }

    #[cfg(target_os = "linux")]
    {
        Box::new(linux::LinuxFocusTracker::new())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        compile_error!("Unsupported platform")
    }
}

/// Create the platform-specific input simulator.
pub fn create_input_simulator() -> Box<dyn InputSimulator> {
    #[cfg(target_os = "macos")]
    {
        Box::new(macos::MacOSInputSimulator::new())
    }

    #[cfg(target_os = "windows")]
    {
        Box::new(windows::WindowsInputSimulator::new())
    }

    #[cfg(target_os = "linux")]
    {
        Box::new(linux::LinuxInputSimulator::new())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        compile_error!("Unsupported platform")
    }
}
