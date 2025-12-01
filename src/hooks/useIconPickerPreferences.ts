import { useState, useCallback } from 'react';
import type { PromptIconName, PromptColorName } from '../config/constants';
import { DEFAULT_PROMPT_COLOR } from '../config/constants';

const STORAGE_KEY = 'promptlight-icon-picker-preferences';
const MAX_RECENT_ICONS = 6;

interface IconPickerPreferences {
  recentIcons: PromptIconName[];
  lastColor: PromptColorName;
}

const DEFAULT_PREFERENCES: IconPickerPreferences = {
  recentIcons: [],
  lastColor: DEFAULT_PROMPT_COLOR,
};

function loadPreferences(): IconPickerPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        recentIcons: Array.isArray(parsed.recentIcons)
          ? parsed.recentIcons.slice(0, MAX_RECENT_ICONS)
          : [],
        lastColor: parsed.lastColor || DEFAULT_PROMPT_COLOR,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_PREFERENCES;
}

function savePreferences(prefs: IconPickerPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

export function useIconPickerPreferences() {
  const [preferences, setPreferences] =
    useState<IconPickerPreferences>(loadPreferences);

  // Add icon to recent list (moves to front if already exists)
  const addRecentIcon = useCallback((icon: PromptIconName) => {
    setPreferences((prev) => {
      const filtered = prev.recentIcons.filter((i) => i !== icon);
      const updated = [icon, ...filtered].slice(0, MAX_RECENT_ICONS);
      const newPrefs = { ...prev, recentIcons: updated };
      savePreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  // Update last used color
  const setLastColor = useCallback((color: PromptColorName) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, lastColor: color };
      savePreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  return { preferences, addRecentIcon, setLastColor };
}

/**
 * Standalone function for editorStore to read last color
 * (used when creating new prompts)
 */
export function getLastColorFromStorage(): PromptColorName {
  return loadPreferences().lastColor;
}
