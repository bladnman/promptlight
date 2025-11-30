import { useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLauncherStore } from '../stores/launcherStore';
import { HOTKEYS } from '../config/constants';
import { getCurrentScreenBounds } from '../utils/screen';
import type { Prompt } from '../types';

/**
 * Hook for keyboard navigation and actions
 */
export function useKeyboardNav() {
  const {
    mode,
    results,
    selectedIndex,
    selectNext,
    selectPrevious,
    promoteSelected,
    setExecuteHandler,
  } = useLauncherStore();

  const dismiss = useCallback(async () => {
    // Don't reset here - the window focus handler will reset and reload when shown again
    // This prevents the "No prompts" flash
    try {
      await invoke('dismiss_window');
    } catch (error) {
      console.error('Failed to hide window:', error);
    }
  }, []);

  const paste = useCallback(async () => {
    // Get fresh state directly from store
    const state = useLauncherStore.getState();
    const { mode: currentMode, results: currentResults, selectedIndex: currentIndex, promotedPrompt: currentPromoted, riderText: currentRider } = state;

    console.log('Paste called - mode:', currentMode, 'results:', currentResults.length, 'index:', currentIndex);

    try {
      let textToPaste = '';

      if (currentMode === 'promoted' && currentPromoted) {
        // Get the full prompt content
        const prompt = await invoke<Prompt>('get_prompt', {
          id: currentPromoted.id,
        });
        textToPaste = currentRider
          ? `${prompt.content} ${currentRider}`
          : prompt.content;

        // Record usage
        await invoke('record_usage', { id: currentPromoted.id });
      } else {
        const selected = currentResults[currentIndex];
        if (!selected) {
          console.error('No prompt selected, selectedIndex:', currentIndex, 'results:', currentResults.length);
          return;
        }

        console.log('Getting prompt:', selected.prompt.id);

        // Get the full prompt content
        const prompt = await invoke<Prompt>('get_prompt', {
          id: selected.prompt.id,
        });

        console.log('Got prompt content, length:', prompt.content.length);
        textToPaste = prompt.content;

        // Record usage
        await invoke('record_usage', { id: selected.prompt.id });
      }

      console.log('Copying to clipboard, text length:', textToPaste.length);
      // Paste and dismiss - reset will happen when window is shown again via focus handler
      await invoke('paste_and_dismiss', { text: textToPaste });
      console.log('Copied to clipboard successfully');
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  }, []);

  // Register paste handler for click events
  useEffect(() => {
    setExecuteHandler(paste);
  }, [paste, setExecuteHandler]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape always dismisses, regardless of focus
      if (e.key === HOTKEYS.DISMISS) {
        e.preventDefault();
        e.stopPropagation();
        dismiss();
        return;
      }

      // Cmd+N - Open editor for new prompt
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        getCurrentScreenBounds().then((screenBounds) => {
          invoke('open_editor_window', { promptId: null, screenBounds });
        });
        return;
      }

      // Cmd+, - Open settings
      if ((e.metaKey || e.ctrlKey) && e.key === HOTKEYS.OPEN_SETTINGS) {
        e.preventDefault();
        getCurrentScreenBounds().then((screenBounds) => {
          invoke('open_editor_window', { promptId: null, screenBounds, view: 'settings' });
        });
        return;
      }

      // Shift+Enter - Open editor for selected prompt
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        const selected = useLauncherStore.getState().getSelectedResult();
        if (selected) {
          getCurrentScreenBounds().then((screenBounds) => {
            invoke('open_editor_window', { promptId: selected.prompt.id, screenBounds });
          });
        }
        return;
      }

      switch (e.key) {
        case HOTKEYS.NAVIGATE_DOWN:
          e.preventDefault();
          if (mode === 'search') {
            selectNext();
          }
          break;

        case HOTKEYS.NAVIGATE_UP:
          e.preventDefault();
          if (mode === 'search') {
            selectPrevious();
          }
          break;

        case HOTKEYS.SELECT:
          e.preventDefault();
          paste();
          break;

        case ' ': // Space
        case 'Tab':
          // Only promote in search mode when there are results
          if (mode === 'search' && results.length > 0 && selectedIndex >= 0) {
            // Space should only promote if we're navigating (not typing)
            // Tab always promotes
            if (e.key === 'Tab' || (e.key === ' ' && e.target === document.body)) {
              e.preventDefault();
              promoteSelected();
            }
          }
          break;
      }
    };

    // Use capture phase to handle Escape before input elements
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    mode,
    results,
    selectedIndex,
    selectNext,
    selectPrevious,
    promoteSelected,
    paste,
    dismiss,
  ]);
}
