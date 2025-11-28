import { useState } from 'react';
import { useEditorStore } from '../../../stores/editorStore';
import styles from './EditorToolbar.module.css';

export function EditorToolbar() {
  const {
    editedPrompt,
    isDirty,
    isSaving,
    autoSaveStatus,
    save,
    deletePrompt,
  } = useEditorStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isNew = !editedPrompt?.id;
  const title = isNew ? 'New Prompt' : editedPrompt?.name || 'Edit Prompt';

  const handleSave = async () => {
    await save();
  };

  const handleDelete = async () => {
    const success = await deletePrompt();
    if (success) {
      setShowDeleteConfirm(false);
    }
  };

  const getStatusText = () => {
    if (isSaving || autoSaveStatus === 'saving') return 'Saving...';
    if (autoSaveStatus === 'saved') return 'Saved';
    if (autoSaveStatus === 'error') return 'Save failed';
    if (isDirty) return 'Unsaved changes';
    return '';
  };

  return (
    <header className={styles.toolbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>
          {title}
          {isDirty && <span className={styles.dirty}>*</span>}
        </h1>
        <span className={styles.status}>{getStatusText()}</span>
      </div>

      <div className={styles.right}>
        {!isNew && (
          showDeleteConfirm ? (
            <div className={styles.confirmGroup}>
              <span className={styles.confirmText}>Delete this prompt?</span>
              <button
                onClick={handleDelete}
                className={styles.dangerButton}
              >
                Confirm
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={styles.deleteButton}
            >
              Delete
            </button>
          )
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className={styles.saveButton}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </header>
  );
}
