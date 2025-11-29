import { useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { useLauncherStore } from '../stores/launcherStore';
import { useLauncherCacheStore } from '../stores/launcherCacheStore';
import type { SearchResult } from '../types';

/**
 * Hook for listening to window visibility events
 * Handles focus and prompt reloading when window becomes visible
 * Uses caching to make panel open feel instant
 */
export function useWindowEvents(inputRef: React.RefObject<HTMLInputElement | null>) {
  const { reset, setResults, setQuery } = useLauncherStore();
  // Track if we've handled initial focus to avoid re-running on dependency changes
  const hasHandledInitialFocus = useRef(false);

  const handleWindowFocus = useCallback(async () => {
    // Get current cache state at call time (not as a dependency)
    const cacheState = useLauncherCacheStore.getState();
    const { searchCache, getLaunchCache, setLaunchCache, getSearchCache, clearSearchCache } = cacheState;

    // Check if we have valid search cache (user was searching before)
    if (searchCache) {
      const cachedSearchResults = getSearchCache(searchCache.query);
      if (cachedSearchResults) {
        // Cache is still valid - restore the search state
        // Don't reset, just restore the query and results
        setQuery(searchCache.query);
        setResults(cachedSearchResults);
        setTimeout(() => {
          inputRef.current?.focus();
          // Select all text so user can easily replace the search
          inputRef.current?.select();
        }, 0);
        return;
      } else {
        // Search cache expired - clear it
        clearSearchCache();
      }
    }

    // No valid search cache - show launch results
    // Reset to search mode (clears promoted state, etc.)
    reset();

    // Check launch cache first
    const cachedLaunchResults = getLaunchCache();
    if (cachedLaunchResults) {
      setResults(cachedLaunchResults);
    } else {
      // No cache, fetch from backend
      try {
        const results = await invoke<SearchResult[]>('search_prompts', {
          query: '',
        });
        setResults(results);
        setLaunchCache(results);
      } catch (error) {
        console.error('Failed to load prompts on focus:', error);
      }
    }

    // Focus the input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [reset, setResults, setQuery, inputRef]);

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
