import { useEffect, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { useLauncherStore } from '../stores/launcherStore';
import type { SearchResult } from '../types';

/**
 * Hook for listening to window visibility events
 * Handles focus and prompt reloading when window becomes visible
 */
export function useWindowEvents(inputRef: React.RefObject<HTMLInputElement | null>) {
  const { reset, setResults } = useLauncherStore();

  const handleWindowFocus = useCallback(async () => {
    // Reset state first (clears query, mode, etc.)
    reset();

    // Immediately reload prompts before the reset state is rendered
    try {
      const results = await invoke<SearchResult[]>('search_prompts', {
        query: '',
      });
      setResults(results);
    } catch (error) {
      console.error('Failed to load prompts on focus:', error);
    }

    // Focus the input
    // Use setTimeout to ensure DOM is ready
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

    // Also handle initial focus (in case window is already focused)
    appWindow.isFocused().then((focused) => {
      if (focused) {
        handleWindowFocus();
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [handleWindowFocus]);
}
