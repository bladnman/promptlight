import { useEffect, useRef, useCallback } from 'react';
import { Folder, X } from 'lucide-react';
import { useEditorStore } from '../../../stores/editorStore';
import { SIDEBAR_CONFIG } from '../../../config/constants';
import styles from './NewFolderInput.module.css';

export function NewFolderInput() {
  const {
    newFolderName,
    folders,
    error,
    setNewFolderName,
    createFolder,
    cancelAddingFolder,
    clearError,
  } = useEditorStore();

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear error when name changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [newFolderName]);

  const validate = useCallback(() => {
    const name = newFolderName.trim().toLowerCase();
    if (name.length < SIDEBAR_CONFIG.MIN_FOLDER_NAME_LENGTH) {
      return 'Folder name is required';
    }
    if (name.length > SIDEBAR_CONFIG.MAX_FOLDER_NAME_LENGTH) {
      return `Maximum ${SIDEBAR_CONFIG.MAX_FOLDER_NAME_LENGTH} characters`;
    }
    if (folders.includes(name)) {
      return 'Folder already exists';
    }
    return null;
  }, [newFolderName, folders]);

  const handleSubmit = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      return;
    }
    await createFolder();
  }, [validate, createFolder]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelAddingFolder();
      }
    },
    [handleSubmit, cancelAddingFolder]
  );

  const validationError = validate();
  const showError = newFolderName.length > 0 && validationError;

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <span className={styles.icon}>
          <Folder size={14} />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New folder name..."
          className={`${styles.input} ${showError ? styles.error : ''}`}
          maxLength={SIDEBAR_CONFIG.MAX_FOLDER_NAME_LENGTH}
        />
        <button
          type="button"
          onClick={cancelAddingFolder}
          className={styles.cancelButton}
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>
      {showError && <div className={styles.errorText}>{validationError}</div>}
      <div className={styles.hint}>Press Enter to create, Escape to cancel</div>
    </div>
  );
}
