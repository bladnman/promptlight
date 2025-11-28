import { useLauncherStore } from '../../stores/launcherStore';
import { KEYBOARD_HINT_LABELS } from '../../config/constants';
import styles from './KeyboardHints.module.css';

export function KeyboardHints() {
  const { mode, results, selectedIndex } = useLauncherStore();
  const hasSelection = results.length > 0 && selectedIndex >= 0;

  if (mode === 'promoted') {
    return (
      <div className={styles.container}>
        <span className={styles.hint}>
          <kbd>{KEYBOARD_HINT_LABELS.PASTE}</kbd> paste
        </span>
        <span className={styles.hint}>
          <kbd>{KEYBOARD_HINT_LABELS.DISMISS}</kbd> cancel
        </span>
      </div>
    );
  }

  // Always show at least Esc and new hints
  if (results.length === 0) {
    return (
      <div className={styles.container}>
        <span className={styles.hint}>
          <kbd>{KEYBOARD_HINT_LABELS.NEW_PROMPT}</kbd> new
        </span>
        <span className={styles.hint}>
          <kbd>{KEYBOARD_HINT_LABELS.DISMISS}</kbd> dismiss
        </span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <span className={styles.hint}>
        <kbd>{KEYBOARD_HINT_LABELS.NAVIGATE}</kbd> navigate
      </span>
      <span className={styles.hint}>
        <kbd>{KEYBOARD_HINT_LABELS.PROMOTE}</kbd> promote
      </span>
      <span className={styles.hint}>
        <kbd>{KEYBOARD_HINT_LABELS.PASTE}</kbd> paste
      </span>
      {hasSelection && (
        <span className={styles.hint}>
          <kbd>{KEYBOARD_HINT_LABELS.EDIT_PROMPT}</kbd> edit
        </span>
      )}
      <span className={styles.hint}>
        <kbd>{KEYBOARD_HINT_LABELS.NEW_PROMPT}</kbd> new
      </span>
      <span className={styles.hint}>
        <kbd>{KEYBOARD_HINT_LABELS.DISMISS}</kbd> dismiss
      </span>
    </div>
  );
}
