import { useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { useLauncherStore } from '../stores/launcherStore';
import type { SearchResult } from '../types';

/**
 * Hook for listening to window visibility events
 * Handles focus and prompt reloading when window becomes visible
 * Always fetches fresh data - no caching to ensure consistency
 */
export function useWindowEvents(inputRef: React.RefObject<HTMLInputElement | null>) {
  const { reset, setResults } = useLauncherStore();
  // Track if we've handled initial focus to avoid re-running on dependency changes
  const hasHandledInitialFocus = useRef(false);

  const handleWindowFocus = useCallback(async () => {
    // Reset to search mode (clears promoted state, etc.)
    reset();

    // Always fetch fresh data from backend
    try {
      const results = await invoke<SearchResult[]>('search_prompts', {
        query: '',
      });
      setResults(results);
    } catch (error) {
      console.error('Failed to load prompts on focus:', error);
    }

    // Focus the input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [reset, setResults, inputRef]);

  useEffect(() => {
    const appWindow = getCurrentWindow();

    const unlisten = appWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        handleWindowFocus();
      } else {
        // Dismiss window when focus is lost (click away)
        invoke('dismiss_window').catch(console.error);
      }
    });

    // Handle initial focus only once
    if (!hasHandledInitialFocus.current) {
      hasHandledInitialFocus.current = true;
      appWindow.isFocused().then((focused) => {
        if (focused) {
          handleWindowFocus();
        }
      });
    }

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [handleWindowFocus]);
}
