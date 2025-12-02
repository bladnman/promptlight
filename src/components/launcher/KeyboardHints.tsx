import { useLauncherStore } from '../../stores/launcherStore';
import { KEYBOARD_HINT_LABELS } from '../../config/constants';
import styles from './KeyboardHints.module.css';

export function KeyboardHints() {
  const { mode, results } = useLauncherStore();

  if (mode === 'promoted') {
    return (
      <div className={styles.container}>
        <div className={styles.group}>
          <span className={styles.hint}>
            <kbd>{KEYBOARD_HINT_LABELS.PASTE}</kbd> paste
          </span>
        </div>
        <div className={styles.group}>
          <span className={styles.hint}>
            <kbd>{KEYBOARD_HINT_LABELS.DISMISS}</kbd> cancel
          </span>
        </div>
      </div>
    );
  }

  // Always show at least Esc and new hints
  if (results.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.group} />
        <div className={styles.group}>
          <span className={styles.hint}>
            <kbd>{KEYBOARD_HINT_LABELS.NEW_PROMPT}</kbd> new
          </span>
          <span className={styles.hint}>
            <kbd>{KEYBOARD_HINT_LABELS.DISMISS}</kbd> dismiss
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <span className={styles.hint}>
          <kbd>{KEYBOARD_HINT_LABELS.PROMOTE}</kbd> promote
        </span>
        <span className={styles.hint}>
          <kbd>{KEYBOARD_HINT_LABELS.PASTE}</kbd> paste
        </span>
      </div>
      <div className={styles.group}>
        <span className={styles.hint}>
          <kbd>{KEYBOARD_HINT_LABELS.NEW_PROMPT}</kbd> new
        </span>
        <span className={styles.hint}>
          <kbd>{KEYBOARD_HINT_LABELS.DISMISS}</kbd> dismiss
        </span>
      </div>
    </div>
  );
}
