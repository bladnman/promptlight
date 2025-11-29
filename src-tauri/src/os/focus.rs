#[cfg(target_os = "macos")]
use cocoa::appkit::NSScreen;
#[cfg(target_os = "macos")]
use cocoa::base::{id, nil};
#[cfg(target_os = "macos")]
use cocoa::foundation::NSRect;
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

/// Represents a monitor/screen position and size
#[derive(Debug, Clone)]
pub struct MonitorBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Get the bounds of the screen containing the key window (the window receiving keyboard input).
/// Uses NSScreen.mainScreen which is a fast native API (~0.1ms).
///
/// Note: NSScreen.mainScreen returns the screen with the key window, NOT the primary display.
/// This is exactly what we want - the screen where the user is actively typing.
#[cfg(target_os = "macos")]
pub fn get_key_window_screen_bounds() -> Option<MonitorBounds> {
    unsafe {
        // NSScreen.mainScreen returns the screen containing the window
        // that is currently receiving keyboard events
        let main_screen: id = NSScreen::mainScreen(nil);
        if main_screen == nil {
            return None;
        }

        let frame: NSRect = msg_send![main_screen, frame];

        // Get the total height for coordinate conversion
        // macOS uses bottom-left origin, we need top-left for positioning
        let total_height = get_total_display_height();

        // Convert Y from bottom-left to top-left coordinate system
        let top_y = total_height - frame.origin.y - frame.size.height;

        Some(MonitorBounds {
            x: frame.origin.x,
            y: top_y,
            width: frame.size.width,
            height: frame.size.height,
        })
    }
}

/// Get the total height of all displays (for coordinate conversion)
#[cfg(target_os = "macos")]
fn get_total_display_height() -> f64 {
    unsafe {
        use cocoa::foundation::NSArray;

        let screens: id = NSScreen::screens(nil);
        let count = NSArray::count(screens);

        // Find the primary screen (the one with origin at 0,0)
        // Its height is used as the reference for coordinate conversion
        for i in 0..count {
            let screen: id = msg_send![screens, objectAtIndex: i];
            let frame: NSRect = msg_send![screen, frame];

            // Primary screen has origin at (0, 0) in Cocoa coordinates
            if frame.origin.x == 0.0 && frame.origin.y == 0.0 {
                return frame.size.height;
            }
        }

        // Fallback: use the first screen's height
        if count > 0 {
            let screen: id = msg_send![screens, objectAtIndex: 0usize];
            let frame: NSRect = msg_send![screen, frame];
            return frame.size.height;
        }

        // Ultimate fallback
        1080.0
    }
}

#[cfg(not(target_os = "macos"))]
pub fn get_key_window_screen_bounds() -> Option<MonitorBounds> {
    None
}
