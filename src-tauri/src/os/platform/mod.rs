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
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AppId(pub String);

impl AppId {
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
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
