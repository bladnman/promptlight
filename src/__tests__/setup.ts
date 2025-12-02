import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { mockBackend } from '../services/backend/mockAdapter';

/**
 * Mock Tauri's invoke function for tests
 * This is kept for backward compatibility but the new approach is to use mockBackend
 */
const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    isFocused: vi.fn(() => Promise.resolve(true)),
    onFocusChanged: vi.fn(() => Promise.resolve(() => {})),
  })),
}));

/**
 * Helper to get the mock invoke function in tests
 * @deprecated Use mockBackend directly for new tests
 */
export const getMockInvoke = () => mockInvoke;

/**
 * Get the mock backend adapter for test configuration
 * Use this to seed data, reset state, or check action history
 */
export const getMockBackend = () => mockBackend;

/**
 * Reset all mocks and mock backend between tests
 */
beforeEach(() => {
  mockInvoke.mockReset();
  mockBackend.reset();
});
