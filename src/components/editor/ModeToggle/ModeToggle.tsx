import { Edit, Settings, Pin, PinOff } from 'lucide-react';
import { useEditorStore } from '../../../stores/editorStore';
import styles from './ModeToggle.module.css';

export function ModeToggle() {
  const { currentView, setView, isPinned, togglePin } = useEditorStore();

  return (
    <div className={styles.container}>
      <img src="/app-icon.png" alt="" className={styles.appIcon} />
      <button
        className={`${styles.tab} ${currentView === 'prompts' ? styles.active : ''}`}
        onClick={() => setView('prompts')}
      >
        <Edit size={14} />
        Editor
      </button>
      <button
        className={`${styles.tab} ${currentView === 'settings' ? styles.active : ''}`}
        onClick={() => setView('settings')}
      >
        <Settings size={14} />
        Settings
      </button>
      <div className={styles.spacer} />
      <button
        className={`${styles.pinButton} ${isPinned ? styles.pinned : ''}`}
        onClick={togglePin}
        title={isPinned ? 'Unpin window (Escape to close)' : 'Pin window (always on top)'}
      >
        {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
      </button>
    </div>
  );
}
