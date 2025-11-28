import { useLauncherStore } from '../../stores/launcherStore';
import styles from './KeyboardHints.module.css';

export function KeyboardHints() {
  const { mode, results } = useLauncherStore();

  if (mode === 'promoted') {
    return (
      <div className={styles.container}>
        <span className={styles.hint}>
          <kbd>Enter</kbd> paste
        </span>
        <span className={styles.hint}>
          <kbd>Esc</kbd> cancel
        </span>
      </div>
    );
  }

  // Always show at least Esc hint
  if (results.length === 0) {
    return (
      <div className={styles.container}>
        <span className={styles.hint}>
          <kbd>Esc</kbd> dismiss
        </span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <span className={styles.hint}>
        <kbd>↑↓</kbd> navigate
      </span>
      <span className={styles.hint}>
        <kbd>Tab</kbd> promote
      </span>
      <span className={styles.hint}>
        <kbd>Enter</kbd> paste
      </span>
      <span className={styles.hint}>
        <kbd>Esc</kbd> dismiss
      </span>
    </div>
  );
}
