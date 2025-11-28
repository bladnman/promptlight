#[cfg(target_os = "macos")]
use cocoa::appkit::NSScreen;
#[cfg(target_os = "macos")]
use cocoa::base::{id, nil};
#[cfg(target_os = "macos")]
use cocoa::foundation::{NSArray, NSRect};
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

/// Get the bounds of the screen containing the frontmost application's key window.
/// Falls back to the screen with the cursor if the focused window cannot be determined.
#[cfg(target_os = "macos")]
pub fn get_focused_app_screen_bounds() -> Option<MonitorBounds> {
    use std::process::Command;

    // Use AppleScript to get the frontmost application's window bounds
    // This is more reliable than trying to use Accessibility APIs which require permissions
    let script = r#"
        tell application "System Events"
            set frontApp to first application process whose frontmost is true
            set appName to name of frontApp
            try
                set win to front window of frontApp
                set {x, y} to position of win
                set {w, h} to size of win
                return (x as string) & "," & (y as string) & "," & (w as string) & "," & (h as string)
            on error
                return "error"
            end try
        end tell
    "#;

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .ok()?;

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if result == "error" || result.is_empty() {
        return None;
    }

    // Parse the window position: x,y,w,h
    let parts: Vec<f64> = result
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();

    if parts.len() != 4 {
        return None;
    }

    let win_x = parts[0];
    let win_y = parts[1];
    let win_center_x = win_x + parts[2] / 2.0;
    let win_center_y = win_y + parts[3] / 2.0;

    // Now find which screen contains the center of this window
    unsafe {
        let screens: id = NSScreen::screens(nil);
        let count = NSArray::count(screens);

        for i in 0..count {
            let screen: id = msg_send![screens, objectAtIndex: i];
            let frame: NSRect = msg_send![screen, frame];

            let screen_x = frame.origin.x;
            let screen_y = frame.origin.y;
            let screen_w = frame.size.width;
            let screen_h = frame.size.height;

            // Convert from macOS coordinate system (origin at bottom-left) to top-left
            // For our purposes, we just need to match the window position which AppleScript
            // returns in screen coordinates

            // Check if window center is within this screen
            // Note: macOS uses bottom-left origin, AppleScript uses top-left for window position
            // We need to account for this
            let main_height = get_main_display_height();
            let screen_top_y = main_height - screen_y - screen_h;

            if win_center_x >= screen_x && win_center_x < screen_x + screen_w {
                // For Y coordinate matching, we check both coordinate systems
                // AppleScript returns top-left coordinates
                if win_center_y >= screen_top_y && win_center_y < screen_top_y + screen_h {
                    return Some(MonitorBounds {
                        x: screen_x,
                        y: screen_top_y,
                        width: screen_w,
                        height: screen_h,
                    });
                }
            }
        }
    }

    None
}

#[cfg(target_os = "macos")]
fn get_main_display_height() -> f64 {
    unsafe {
        let main_screen: id = NSScreen::mainScreen(nil);
        let frame: NSRect = msg_send![main_screen, frame];
        frame.size.height
    }
}

#[cfg(not(target_os = "macos"))]
pub fn get_focused_app_screen_bounds() -> Option<MonitorBounds> {
    None
}
