import { SearchBar } from './SearchBar';
import { ResultsList } from './ResultsList';
import { KeyboardHints } from './KeyboardHints';
import styles from './LauncherWindow.module.css';

export function LauncherWindow() {
  return (
    <div className={styles.container}>
      <SearchBar />
      <ResultsList />
      <KeyboardHints />
    </div>
  );
}
