import { useEffect, useCallback, useRef } from 'react';
import { backend, isUsingMock } from '../services/backend';
import { useLauncherStore } from '../stores/launcherStore';

/**
 * Check if Tauri window API is available
 */
function isTauriWindowAvailable(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

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
      const results = await backend.searchPrompts('');
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
    // In browser-only mode (E2E tests), skip Tauri window events
    // but still trigger initial load
    if (isUsingMock() || !isTauriWindowAvailable()) {
      if (!hasHandledInitialFocus.current) {
        hasHandledInitialFocus.current = true;
        handleWindowFocus();
      }
      return;
    }

    // Dynamically import Tauri window API only when available
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      const appWindow = getCurrentWindow();

      const unlisten = appWindow.onFocusChanged(({ payload: focused }) => {
        if (focused) {
          handleWindowFocus();
        } else {
          // Dismiss window when focus is lost (click away)
          backend.dismissWindow().catch(console.error);
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

      // Store unlisten for cleanup
      (window as unknown as { __unlistenWindowFocus?: Promise<() => void> }).__unlistenWindowFocus = unlisten;
    });

    return () => {
      const unlisten = (window as unknown as { __unlistenWindowFocus?: Promise<() => void> }).__unlistenWindowFocus;
      if (unlisten) {
        unlisten.then((fn) => fn());
      }
    };
  }, [handleWindowFocus]);
}
