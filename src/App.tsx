import { useEffect, useState } from 'react';
import { LauncherWindow } from './components/launcher';
import { EditorWindow } from './components/editor';
import { useLauncher, useUIScale } from './hooks';

type WindowType = 'launcher' | 'editor' | null;

function App() {
  const [windowType, setWindowType] = useState<WindowType>(null);

  // Enable Cmd+/Cmd- UI scaling
  useUIScale();

  useEffect(() => {
    // Detect window type from URL parameters
    const params = new URLSearchParams(window.location.search);
    const windowParam = params.get('window');
    setWindowType(windowParam === 'editor' ? 'editor' : 'launcher');
  }, []);

  // Show nothing while detecting window type
  if (windowType === null) {
    return null;
  }

  // Route to appropriate window
  if (windowType === 'editor') {
    return <EditorWindow />;
  }

  return <LauncherApp />;
}

function LauncherApp() {
  // Initialize launcher hooks (search, keyboard navigation)
  useLauncher();

  return <LauncherWindow />;
}

export default App;
