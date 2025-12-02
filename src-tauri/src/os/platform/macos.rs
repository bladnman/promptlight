//! macOS-specific implementations using native APIs.
//!
//! Uses NSRunningApplication for app focus tracking and CGEvent for input simulation.
//! This is faster and more reliable than AppleScript (~50ms vs ~200ms).

use super::{AppFocusTracker, AppId, InputSimulator};
use cocoa::base::{id, nil};
use cocoa::foundation::NSString;
use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation, CGKeyCode};
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
use objc::{class, msg_send, sel, sel_impl};
use std::time::Duration;

/// macOS virtual key code for 'V'
const VK_V: CGKeyCode = 9;

/// macOS app focus tracker using NSRunningApplication.
pub struct MacOSFocusTracker;

impl MacOSFocusTracker {
    pub fn new() -> Self {
        Self
    }
}

impl AppFocusTracker for MacOSFocusTracker {
    fn capture_focused_app(&self) -> Result<Option<AppId>, String> {
        unsafe {
            // Get NSWorkspace.sharedWorkspace
            let workspace: id = msg_send![class!(NSWorkspace), sharedWorkspace];
            if workspace == nil {
                return Err("Failed to get NSWorkspace".to_string());
            }

            // Get the frontmost application
            let frontmost_app: id = msg_send![workspace, frontmostApplication];
            if frontmost_app == nil {
                println!("[platform:macos] No frontmost application");
                return Ok(None);
            }

            // Always get the PID first (it's always available for running apps)
            let pid: i32 = msg_send![frontmost_app, processIdentifier];

            // Try to get bundle identifier
            let bundle_id: id = msg_send![frontmost_app, bundleIdentifier];

            if bundle_id != nil {
                // Convert NSString to Rust String
                let cstr: *const i8 = msg_send![bundle_id, UTF8String];
                if !cstr.is_null() {
                    let bundle_str = std::ffi::CStr::from_ptr(cstr)
                        .to_string_lossy()
                        .into_owned();

                    println!(
                        "[platform:macos] Captured frontmost app: {} (pid: {})",
                        bundle_str, pid
                    );
                    return Ok(Some(AppId::with_pid(bundle_str, pid)));
                }
            }

            // No bundle ID available, fall back to PID only
            println!(
                "[platform:macos] Captured frontmost app by PID only: {}",
                pid
            );
            Ok(Some(AppId::from_pid(pid)))
        }
    }

    fn activate_app(&self, app_id: &AppId) -> Result<bool, String> {
        unsafe {
            // Try bundle ID first if available
            if let Some(ref bundle_id) = app_id.bundle_id {
                println!("[platform:macos] Activating app by bundle ID: {}", bundle_id);

                let bundle_nsstring: id = NSString::alloc(nil).init_str(bundle_id);

                let apps: id = msg_send![class!(NSRunningApplication),
                    runningApplicationsWithBundleIdentifier: bundle_nsstring];

                let count: usize = msg_send![apps, count];
                if count > 0 {
                    let app: id = msg_send![apps, objectAtIndex: 0usize];
                    if app != nil {
                        let options: usize = 2; // NSApplicationActivateIgnoringOtherApps
                        let success: bool = msg_send![app, activateWithOptions: options];

                        if success {
                            println!("[platform:macos] App activated successfully by bundle ID");
                            return Ok(true);
                        }
                    }
                }
                println!(
                    "[platform:macos] Bundle ID activation failed, trying PID fallback"
                );
            }

            // Fall back to PID-based activation
            if let Some(pid) = app_id.pid {
                println!("[platform:macos] Activating app by PID: {}", pid);

                let app: id = msg_send![
                    class!(NSRunningApplication),
                    runningApplicationWithProcessIdentifier: pid
                ];

                if app != nil {
                    let options: usize = 2; // NSApplicationActivateIgnoringOtherApps
                    let success: bool = msg_send![app, activateWithOptions: options];

                    if success {
                        println!("[platform:macos] App activated successfully by PID");
                        return Ok(true);
                    } else {
                        println!("[platform:macos] PID activation returned false");
                    }
                } else {
                    println!(
                        "[platform:macos] No running app found with PID: {}",
                        pid
                    );
                }
            }

            println!("[platform:macos] All activation methods failed");
            Ok(false)
        }
    }
}

/// macOS input simulator using CGEvent.
pub struct MacOSInputSimulator;

impl MacOSInputSimulator {
    pub fn new() -> Self {
        Self
    }
}

impl InputSimulator for MacOSInputSimulator {
    fn simulate_paste(&self) -> Result<(), String> {
        println!("[platform:macos] Simulating Cmd+V with CGEvent");

        // Create event source
        let source = CGEventSource::new(CGEventSourceStateID::CombinedSessionState)
            .map_err(|_| "Failed to create CGEventSource")?;

        // Create key down event for 'V'
        let key_down = CGEvent::new_keyboard_event(source.clone(), VK_V, true)
            .map_err(|_| "Failed to create key down event")?;

        // Set Command modifier flag
        key_down.set_flags(CGEventFlags::CGEventFlagCommand);

        // Create key up event for 'V'
        let key_up = CGEvent::new_keyboard_event(source, VK_V, false)
            .map_err(|_| "Failed to create key up event")?;

        // Set Command modifier flag on key up too
        key_up.set_flags(CGEventFlags::CGEventFlagCommand);

        // Post events to the HID system (system-wide)
        key_down.post(CGEventTapLocation::HID);

        // Small delay between key down and up
        std::thread::sleep(Duration::from_millis(10));

        key_up.post(CGEventTapLocation::HID);

        println!("[platform:macos] CGEvent paste simulation complete");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_focus_tracker_creation() {
        let tracker = MacOSFocusTracker::new();
        // Just verify it can be created
        let _ = tracker;
    }

    #[test]
    fn test_input_simulator_creation() {
        let simulator = MacOSInputSimulator::new();
        // Just verify it can be created
        let _ = simulator;
    }

    #[test]
    fn test_app_id_with_bundle_id() {
        let app_id = AppId::new("com.apple.Safari");
        assert_eq!(app_id.as_str(), "com.apple.Safari");
        assert_eq!(app_id.bundle_id, Some("com.apple.Safari".to_string()));
        assert_eq!(app_id.pid, None);
    }

    #[test]
    fn test_app_id_with_pid_only() {
        let app_id = AppId::from_pid(12345);
        assert_eq!(app_id.as_str(), "");
        assert_eq!(app_id.bundle_id, None);
        assert_eq!(app_id.pid, Some(12345));
    }

    #[test]
    fn test_app_id_with_both() {
        let app_id = AppId::with_pid("com.apple.Safari", 12345);
        assert_eq!(app_id.as_str(), "com.apple.Safari");
        assert_eq!(app_id.bundle_id, Some("com.apple.Safari".to_string()));
        assert_eq!(app_id.pid, Some(12345));
    }

    /// CRITICAL: This test ensures we can always capture a focused app.
    /// Paste functionality depends on this - if this test fails, paste will break.
    #[test]
    fn test_capture_focused_app_always_returns_usable_id() {
        let tracker = MacOSFocusTracker::new();
        let result = tracker.capture_focused_app();

        // The capture should succeed (not error)
        assert!(result.is_ok(), "capture_focused_app should not return an error");

        // If there's a frontmost app, we should have SOME way to identify it
        if let Ok(Some(app_id)) = result {
            // We must have either a bundle ID or a PID - never neither
            let has_identifier = app_id.bundle_id.is_some() || app_id.pid.is_some();
            assert!(
                has_identifier,
                "CRITICAL: AppId must have either bundle_id or pid to enable paste! \
                This is a regression that will break paste functionality."
            );
        }
    }
}
