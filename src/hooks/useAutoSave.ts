import { useEffect, useRef } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { AUTO_SAVE_CONFIG } from '../config/constants';

/**
 * Auto-save hook for the editor
 * Debounces saves to avoid excessive API calls
 */
export function useAutoSave() {
  const { isDirty, editedPrompt, save } = useEditorStore();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Don't auto-save if not dirty or if new prompt without name
    if (!isDirty || !editedPrompt?.name?.trim()) {
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = window.setTimeout(() => {
      save();
    }, AUTO_SAVE_CONFIG.DEBOUNCE_MS);

    // Cleanup on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, editedPrompt, save]);
}
