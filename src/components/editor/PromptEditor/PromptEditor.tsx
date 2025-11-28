import { useEditorStore } from '../../../stores/editorStore';
import { EditorToolbar } from './EditorToolbar';
import { PromptForm } from './PromptForm';
import styles from './PromptEditor.module.css';

export function PromptEditor() {
  const { editedPrompt, isLoading, error, clearError } = useEditorStore();

  if (isLoading) {
    return (
      <main className={styles.editor}>
        <div className={styles.loading}>Loading...</div>
      </main>
    );
  }

  if (!editedPrompt) {
    return (
      <main className={styles.editor}>
        <div className={styles.empty}>
          <p>Select a prompt or create a new one</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.editor}>
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={clearError} className={styles.dismissError}>
            ×
          </button>
        </div>
      )}
      <EditorToolbar />
      <PromptForm />
    </main>
  );
}
