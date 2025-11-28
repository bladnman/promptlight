import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
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
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const isNew = !editedPrompt?.id;
  const title = isNew ? 'New Prompt' : editedPrompt?.name || 'Edit Prompt';
  const hasContent = Boolean(editedPrompt?.content?.trim());

  const handleSave = async () => {
    await save();
  };

  const handleDelete = async () => {
    const success = await deletePrompt();
    if (success) {
      setShowDeleteConfirm(false);
    }
  };

  const handleCopy = async () => {
    if (!editedPrompt?.content) return;

    try {
      await invoke('copy_to_clipboard', { text: editedPrompt.content });
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handlePaste = async () => {
    if (!editedPrompt?.content) return;

    try {
      // Record usage if this is an existing prompt
      if (editedPrompt.id) {
        await invoke('record_usage', { id: editedPrompt.id });
      }

      // This will copy to clipboard and close the editor
      await invoke('paste_from_editor', { text: editedPrompt.content });
    } catch (error) {
      console.error('Failed to paste:', error);
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
        {/* Copy/Paste buttons - only show when there's content */}
        {hasContent && (
          <div className={styles.actionGroup}>
            <button
              onClick={handleCopy}
              className={styles.actionButton}
              title="Copy to clipboard"
            >
              {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handlePaste}
              className={styles.pasteButton}
              title="Paste to target app and close"
            >
              Paste
            </button>
          </div>
        )}

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
