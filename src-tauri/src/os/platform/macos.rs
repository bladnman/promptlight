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

            // Get bundle identifier
            let bundle_id: id = msg_send![frontmost_app, bundleIdentifier];
            if bundle_id == nil {
                println!("[platform:macos] Frontmost app has no bundle identifier");
                return Ok(None);
            }

            // Convert NSString to Rust String
            let cstr: *const i8 = msg_send![bundle_id, UTF8String];
            if cstr.is_null() {
                return Err("Failed to get UTF8String from bundle identifier".to_string());
            }

            let bundle_str = std::ffi::CStr::from_ptr(cstr)
                .to_string_lossy()
                .into_owned();

            println!("[platform:macos] Captured frontmost app: {}", bundle_str);
            Ok(Some(AppId::new(bundle_str)))
        }
    }

    fn activate_app(&self, app_id: &AppId) -> Result<bool, String> {
        unsafe {
            let bundle_id = app_id.as_str();
            println!("[platform:macos] Activating app: {}", bundle_id);

            // Create NSString for bundle identifier
            let bundle_nsstring: id =
                NSString::alloc(nil).init_str(bundle_id);

            // Get running applications with this bundle ID
            let workspace: id = msg_send![class!(NSWorkspace), sharedWorkspace];
            let apps: id = msg_send![class!(NSRunningApplication),
                runningApplicationsWithBundleIdentifier: bundle_nsstring];

            // Get count of matching apps
            let count: usize = msg_send![apps, count];
            if count == 0 {
                println!("[platform:macos] No running app found with bundle ID: {}", bundle_id);
                return Ok(false);
            }

            // Get the first matching app
            let app: id = msg_send![apps, objectAtIndex: 0usize];
            if app == nil {
                return Ok(false);
            }

            // Activate with NSApplicationActivateIgnoringOtherApps (1 << 1 = 2)
            let options: usize = 2; // NSApplicationActivateIgnoringOtherApps
            let success: bool = msg_send![app, activateWithOptions: options];

            if success {
                println!("[platform:macos] App activated successfully");
            } else {
                println!("[platform:macos] App activation returned false");
            }

            Ok(success)
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
    fn test_app_id() {
        let app_id = AppId::new("com.apple.Safari");
        assert_eq!(app_id.as_str(), "com.apple.Safari");
    }
}
