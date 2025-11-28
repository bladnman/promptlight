import { LauncherWindow } from './components/launcher';
import { useLauncher } from './hooks';

function App() {
  // Initialize launcher hooks (search, keyboard navigation)
  useLauncher();

  return <LauncherWindow />;
}

export default App;
