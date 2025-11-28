import { availableMonitors, currentMonitor, getCurrentWindow } from '@tauri-apps/api/window';

export interface ScreenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get the bounds of the screen that the current window is on.
 * Uses the window's position to determine which monitor it's on.
 */
export async function getCurrentScreenBounds(): Promise<ScreenBounds | null> {
  try {
    // First try to get the current monitor directly
    const current = await currentMonitor();
    if (current) {
      const scale = current.scaleFactor;
      return {
        x: current.position.x,
        y: current.position.y,
        width: current.size.width / scale,
        height: current.size.height / scale,
      };
    }

    // Fallback: find monitor containing window position
    const window = getCurrentWindow();
    const monitors = await availableMonitors();
    const position = await window.outerPosition();

    for (const monitor of monitors) {
      const monPos = monitor.position;
      const monSize = monitor.size;
      const scale = monitor.scaleFactor;

      const monX = monPos.x;
      const monY = monPos.y;
      const monW = monSize.width / scale;
      const monH = monSize.height / scale;

      // Check if window position is within this monitor's bounds
      if (
        position.x >= monX &&
        position.x < monX + monW &&
        position.y >= monY &&
        position.y < monY + monH
      ) {
        return { x: monX, y: monY, width: monW, height: monH };
      }
    }

    // Final fallback: return primary monitor bounds
    if (monitors.length > 0) {
      const primary = monitors[0];
      const scale = primary.scaleFactor;
      return {
        x: primary.position.x,
        y: primary.position.y,
        width: primary.size.width / scale,
        height: primary.size.height / scale,
      };
    }
  } catch (e) {
    console.error('Failed to get screen bounds:', e);
  }
  return null;
}
