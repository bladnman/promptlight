/**
 * useUIScale - Manages UI scaling via Cmd+/Cmd-
 *
 * Adjusts the --ui-scale CSS variable to scale all font sizes.
 * Persists preference to localStorage.
 */

import { useEffect, useCallback } from 'react';

const STORAGE_KEY = 'promptlight-ui-scale';
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.5;
const SCALE_STEP = 0.05;
const DEFAULT_SCALE = 1.1; // 10% larger than standard for comfort

/**
 * Get the initial scale from localStorage or default
 */
function getInitialScale(): number {
  if (typeof window === 'undefined') return DEFAULT_SCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = parseFloat(stored);
    if (!isNaN(parsed) && parsed >= MIN_SCALE && parsed <= MAX_SCALE) {
      return parsed;
    }
  }
  return DEFAULT_SCALE;
}

/**
 * Apply scale to the document
 */
function applyScale(scale: number): void {
  document.documentElement.style.setProperty('--ui-scale', scale.toString());
}

/**
 * Hook to enable Cmd+/Cmd- UI scaling
 */
export function useUIScale(): void {
  // Apply initial scale on mount
  useEffect(() => {
    const initialScale = getInitialScale();
    applyScale(initialScale);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check for Cmd (Mac) or Ctrl (Windows/Linux)
    const isMod = e.metaKey || e.ctrlKey;
    if (!isMod) return;

    // Cmd+ or Cmd= (zoom in)
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      const current = getInitialScale();
      const newScale = Math.min(MAX_SCALE, current + SCALE_STEP);
      applyScale(newScale);
      localStorage.setItem(STORAGE_KEY, newScale.toString());
      return;
    }

    // Cmd- (zoom out)
    if (e.key === '-') {
      e.preventDefault();
      const current = getInitialScale();
      const newScale = Math.max(MIN_SCALE, current - SCALE_STEP);
      applyScale(newScale);
      localStorage.setItem(STORAGE_KEY, newScale.toString());
      return;
    }

    // Cmd+0 (reset zoom)
    if (e.key === '0') {
      e.preventDefault();
      applyScale(DEFAULT_SCALE);
      localStorage.setItem(STORAGE_KEY, DEFAULT_SCALE.toString());
      return;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get current scale value (for display purposes)
 */
export function getCurrentScale(): number {
  return getInitialScale();
}
