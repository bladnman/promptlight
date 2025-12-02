/**
 * Backend Adapter Export
 *
 * This module exports the appropriate backend adapter based on the runtime environment:
 * - TauriAdapter: Used when running in full Tauri app (production)
 * - MockAdapter: Used when running in browser-only mode (E2E tests, dev:vite)
 *
 * Detection is based on whether Tauri's internals are available in the window object.
 */

import type { BackendAdapter } from './types';
import { TauriAdapter } from './tauriAdapter';
import { MockAdapter, mockBackend } from './mockAdapter';

// Re-export types for convenience
export type { BackendAdapter, ScreenBounds, TestAction } from './types';
export type {
  AppSettings,
  AuthSession,
  User,
  GeneralSettings,
  SyncSettings,
  AppearanceSettings,
} from './authTypes';
export { MockAdapter, mockBackend } from './mockAdapter';
export { TauriAdapter } from './tauriAdapter';

/**
 * Detect if we're running in Tauri or browser-only mode.
 *
 * Returns true if:
 * - __TAURI_INTERNALS__ is available (Tauri v2)
 * - AND we're not explicitly in test mode via URL param
 */
function isTauriAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for explicit test mode in URL
  const params = new URLSearchParams(window.location.search);
  if (params.get('mock') === 'true') return false;

  // Check if Tauri internals are available (Tauri v2)
  return '__TAURI_INTERNALS__' in window;
}

/**
 * The singleton backend instance.
 * Use this throughout the app for all backend operations.
 */
export const backend: BackendAdapter = isTauriAvailable()
  ? new TauriAdapter()
  : mockBackend;

/**
 * Check if we're using the mock adapter.
 * Useful for conditional behavior in tests.
 */
export function isUsingMock(): boolean {
  return backend instanceof MockAdapter;
}

/**
 * Get the mock adapter instance (for test configuration).
 * Throws if not using mock adapter.
 */
export function getMockBackend(): MockAdapter {
  if (!(backend instanceof MockAdapter)) {
    throw new Error('getMockBackend() called but not using MockAdapter');
  }
  return backend as MockAdapter;
}

/**
 * Expose mockBackend to window for E2E test access via Playwright.
 * This allows tests to seed data and verify actions.
 */
if (typeof window !== 'undefined' && backend instanceof MockAdapter) {
  // Extend window type for E2E tests
  (window as unknown as { __mockBackend: MockAdapter }).__mockBackend = mockBackend;
}
