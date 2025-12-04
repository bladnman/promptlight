import { useEffect } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { HOTKEYS } from '../config/constants';

/**
 * Keyboard shortcuts for the editor window
 */
export function useEditorKeyboard() {
  const { save, createNew, isDirty, currentView, setView } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Only handle Cmd/Ctrl combinations
      if (!(e.metaKey || e.ctrlKey)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 's':
          // Cmd+S - Save
          e.preventDefault();
          if (isDirty) {
            save();
          }
          break;

        case 'n':
          // Cmd+N - New prompt
          e.preventDefault();
          createNew();
          break;

        case HOTKEYS.OPEN_SETTINGS:
          // Cmd+, - Toggle settings
          e.preventDefault();
          setView(currentView === 'settings' ? 'prompts' : 'settings');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save, createNew, isDirty, currentView, setView]);
}
