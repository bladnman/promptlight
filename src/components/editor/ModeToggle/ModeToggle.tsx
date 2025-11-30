import { Edit, Settings } from 'lucide-react';
import { useEditorStore } from '../../../stores/editorStore';
import styles from './ModeToggle.module.css';

export function ModeToggle() {
  const { currentView, setView } = useEditorStore();

  return (
    <div className={styles.container}>
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
    </div>
  );
}
