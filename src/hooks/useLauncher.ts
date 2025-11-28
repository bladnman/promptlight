import { useSearch } from './useSearch';
import { useKeyboardNav } from './useKeyboardNav';

/**
 * Main orchestration hook for the launcher
 * Combines search and keyboard navigation
 */
export function useLauncher() {
  useSearch();
  useKeyboardNav();
}
