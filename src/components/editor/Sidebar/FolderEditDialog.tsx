import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useEditorStore } from '../../../stores/editorStore';
import { SIDEBAR_CONFIG } from '../../../config/constants';
import styles from './FolderEditDialog.module.css';

interface FolderEditDialogProps {
  folderName: string;
  onClose: () => void;
}

export function FolderEditDialog({ folderName, onClose }: FolderEditDialogProps) {
  const { renameFolder, folders } = useEditorStore();
  const [newName, setNewName] = useState(folderName);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const validate = () => {
    const trimmed = newName.trim().toLowerCase();
    if (trimmed.length < SIDEBAR_CONFIG.MIN_FOLDER_NAME_LENGTH) {
      return 'Folder name is required';
    }
    if (trimmed.length > SIDEBAR_CONFIG.MAX_FOLDER_NAME_LENGTH) {
      return `Maximum ${SIDEBAR_CONFIG.MAX_FOLDER_NAME_LENGTH} characters`;
    }
    if (trimmed !== folderName.toLowerCase() && folders.includes(trimmed)) {
      return 'Folder already exists';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    const success = await renameFolder(folderName, newName);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Rename Folder</h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="folderName" className={styles.label}>
              Folder Name
            </label>
            <input
              ref={inputRef}
              id="folderName"
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              className={`${styles.input} ${error ? styles.error : ''}`}
              maxLength={SIDEBAR_CONFIG.MAX_FOLDER_NAME_LENGTH}
              disabled={isSubmitting}
            />
            {error && <div className={styles.errorText}>{error}</div>}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
