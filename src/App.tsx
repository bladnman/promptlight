import { useEffect, useState } from 'react';
import { LauncherWindow } from './components/launcher';
import { EditorWindow } from './components/editor';
import { WelcomeWindow } from './components/welcome';
import { MarkdownEditorTest } from './components/editor/PromptEditor/MarkdownEditor/MarkdownEditorTest';
import { useLauncher, useUIScale } from './hooks';
import { useSettingsStore } from './stores/settingsStore';

type WindowType = 'launcher' | 'editor' | 'welcome' | 'test' | null;

function App() {
  const [windowType, setWindowType] = useState<WindowType>(null);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  // Enable Cmd+/Cmd- UI scaling
  useUIScale();

  // Load settings (including appearance) on app start
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    // Detect window type from URL parameters
    const params = new URLSearchParams(window.location.search);
    const windowParam = params.get('window');
    if (windowParam === 'editor') {
      setWindowType('editor');
    } else if (windowParam === 'welcome') {
      setWindowType('welcome');
    } else if (windowParam === 'test') {
      setWindowType('test');
    } else {
      setWindowType('launcher');
    }
  }, []);

  // Show nothing while detecting window type
  if (windowType === null) {
    return null;
  }

  // Route to appropriate window
  if (windowType === 'editor') {
    return <EditorWindow />;
  }

  if (windowType === 'welcome') {
    return <WelcomeWindow />;
  }

  if (windowType === 'test') {
    return <MarkdownEditorTest />;
  }

  return <LauncherApp />;
}

function LauncherApp() {
  // Initialize launcher hooks (search, keyboard navigation)
  useLauncher();

  return <LauncherWindow />;
}

export default App;
