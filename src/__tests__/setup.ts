import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

/**
 * Mock Tauri's invoke function for tests
 */
const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

/**
 * Helper to get the mock invoke function in tests
 */
export const getMockInvoke = () => mockInvoke;

/**
 * Reset all mocks between tests
 */
beforeEach(() => {
  mockInvoke.mockReset();
});
