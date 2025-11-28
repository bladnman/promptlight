import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useEditorStore } from '../../stores/editorStore';
import { Sidebar } from './Sidebar/Sidebar';
import { PromptEditor } from './PromptEditor/PromptEditor';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useEditorKeyboard } from '../../hooks/useEditorKeyboard';
import styles from './EditorWindow.module.css';

export function EditorWindow() {
  const { loadPrompts, loadPrompt, createNew, setSidebarCollapsed } = useEditorStore();

  // Initialize auto-save and keyboard shortcuts
  useAutoSave();
  useEditorKeyboard();

  useEffect(() => {
    // Load all prompts for sidebar
    loadPrompts();

    // Check URL for prompt ID
    const params = new URLSearchParams(window.location.search);
    const promptId = params.get('id');

    if (promptId) {
      // Editing specific prompt - collapse sidebar
      loadPrompt(promptId);
      setSidebarCollapsed(true);
    } else {
      // New prompt
      createNew();
    }

    // Listen for load-prompt events (when window already open)
    const unlisten = listen<string>('load-prompt', (event) => {
      loadPrompt(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [loadPrompts, loadPrompt, createNew, setSidebarCollapsed]);

  return (
    <div className={styles.container}>
      <Sidebar />
      <PromptEditor />
    </div>
  );
}
