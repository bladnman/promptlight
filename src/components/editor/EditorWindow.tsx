import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useEditorStore, EditorView } from '../../stores/editorStore';
import { ModeToggle } from './ModeToggle';
import { Sidebar } from './Sidebar/Sidebar';
import { PromptEditor } from './PromptEditor/PromptEditor';
import { SettingsView } from './settings';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useEditorKeyboard } from '../../hooks/useEditorKeyboard';
import styles from './EditorWindow.module.css';

export function EditorWindow() {
  const { currentView, loadPrompts, loadPrompt, createNew, setSidebarCollapsed, setView } = useEditorStore();

  // Initialize auto-save and keyboard shortcuts
  useAutoSave();
  useEditorKeyboard();

  useEffect(() => {
    // Load all prompts for sidebar
    loadPrompts();

    // Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const promptId = params.get('id');
    const viewParam = params.get('view') as EditorView | null;

    // Set initial view from URL param
    if (viewParam === 'settings') {
      setView('settings');
    }

    if (promptId) {
      // Editing specific prompt - collapse sidebar
      loadPrompt(promptId);
      setSidebarCollapsed(true);
    } else if (viewParam !== 'settings') {
      // New prompt (only if not opening settings)
      createNew();
    }

    // Listen for load-prompt events (when window already open)
    const unlistenPrompt = listen<string>('load-prompt', (event) => {
      loadPrompt(event.payload);
    });

    // Listen for view switch events
    const unlistenView = listen<EditorView>('switch-view', (event) => {
      setView(event.payload);
    });

    return () => {
      unlistenPrompt.then((fn) => fn());
      unlistenView.then((fn) => fn());
    };
  }, [loadPrompts, loadPrompt, createNew, setSidebarCollapsed, setView]);

  return (
    <div className={styles.container}>
      <ModeToggle />
      <div className={styles.content}>
        {currentView === 'prompts' ? (
          <>
            <Sidebar />
            <PromptEditor />
          </>
        ) : (
          <SettingsView />
        )}
      </div>
    </div>
  );
}
