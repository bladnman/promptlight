use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::data::settings::AppSettings;
use crate::os::focus::get_key_window_screen_bounds;

const WELCOME_WIDTH: f64 = 900.0;
const WELCOME_HEIGHT: f64 = 604.0;

/// Check if welcome screen should be shown based on settings
pub fn should_show_welcome() -> bool {
    let settings = AppSettings::load();
    !settings.general.welcome_screen_dismissed
}

/// Check if welcome window is currently visible
pub fn is_welcome_visible(app: &AppHandle) -> bool {
    app.get_webview_window("welcome")
        .map(|w| w.is_visible().unwrap_or(false))
        .unwrap_or(false)
}

/// Open the welcome screen window
#[tauri::command]
pub async fn open_welcome_window(app: AppHandle) -> Result<(), String> {
    let label = "welcome";

    // If window already exists, just show and focus it
    if let Some(window) = app.get_webview_window(label) {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create the welcome window
    let mut builder = WebviewWindowBuilder::new(
        &app,
        label,
        WebviewUrl::App("index.html?window=welcome".into()),
    )
    .title("Welcome to PromptLight")
    .inner_size(WELCOME_WIDTH, WELCOME_HEIGHT)
    .resizable(false)
    .decorations(false)
    .always_on_top(true);

    // Position on the screen with the active/key window
    if let Some(bounds) = get_key_window_screen_bounds() {
        let x = bounds.x + (bounds.width - WELCOME_WIDTH) / 2.0;
        let y = bounds.y + (bounds.height - WELCOME_HEIGHT) / 2.0;
        builder = builder.position(x, y);
    } else {
        builder = builder.center();
    }

    // Disable minimize/maximize on macOS
    #[cfg(target_os = "macos")]
    {
        builder = builder.minimizable(false).maximizable(false);
    }

    let window = builder.build().map_err(|e| e.to_string())?;

    // Apply transparent background (required for rounded corners on macOS)
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};
        use cocoa::foundation::NSString;

        // First, disable the webview's background drawing
        let _ = window.with_webview(|webview| {
            unsafe {
                let wv: id = webview.inner().cast();
                let no: id = msg_send![class!(NSNumber), numberWithBool: false];
                let key = NSString::alloc(nil).init_str("drawsBackground");
                let _: () = msg_send![wv, setValue: no forKey: key];
            }
        });

        // Then set the window background to clear
        let ns_window = window.ns_window().unwrap() as id;
        unsafe {
            let clear_color: id = NSColor::clearColor(nil);
            NSWindow::setBackgroundColor_(ns_window, clear_color);
            let _: () = msg_send![ns_window, setOpaque: false];
        }
    }

    Ok(())
}

/// Close the welcome window and optionally save the "don't show again" preference
#[tauri::command]
pub fn close_welcome_window(app: AppHandle, dont_show_again: bool) -> Result<(), String> {
    // Save preference if "Don't show again" was checked
    if dont_show_again {
        let mut settings = AppSettings::load();
        settings.general.welcome_screen_dismissed = true;
        settings.save()?;
    }

    // Close the window
    if let Some(window) = app.get_webview_window("welcome") {
        window.close().map_err(|e| e.to_string())?;
    }

    // Show the launcher window
    if let Some(launcher) = app.get_webview_window("launcher") {
        launcher.show().map_err(|e| e.to_string())?;
        launcher.set_focus().map_err(|e| e.to_string())?;
    }

    Ok(())
}
