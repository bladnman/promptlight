import { useState, useCallback, useMemo } from 'react';
import { backend } from '../../../services/backend';
import { Copy, ClipboardPaste, Trash2, Check, X } from 'lucide-react';
import { useEditorStore } from '../../../stores/editorStore';
import { useDerivedFolders } from '../../../hooks/useDerivedFolders';
import { IconColorPicker } from '../../common/IconColorPicker';
import { IconButton } from '../../common/IconButton';
import {
  DEFAULT_PROMPT_ICON,
  DEFAULT_PROMPT_COLOR,
  type PromptIconName,
  type PromptColorName,
} from '../../../config/constants';
import styles from './EditorToolbar.module.css';

const NEW_FOLDER_VALUE = '__new_folder__';

export function EditorToolbar() {
  const {
    editedPrompt,
    prompts,
    updateField,
    createFolderAndSelect,
    deletePrompt,
  } = useEditorStore();

  // Get folders that have prompts
  const existingFolders = useDerivedFolders(prompts);

  // Build dropdown options: existing folders + current prompt's folder + 'uncategorized' fallback
  const dropdownFolders = useMemo(() => {
    const folderSet = new Set(existingFolders);

    // Include current prompt's folder even if it's the only prompt there
    if (editedPrompt?.folder) {
      folderSet.add(editedPrompt.folder);
    }

    // Always include 'uncategorized' as a fallback option for new prompts
    folderSet.add('uncategorized');

    return Array.from(folderSet).sort((a, b) => {
      if (a === 'uncategorized') return 1;
      if (b === 'uncategorized') return -1;
      return a.localeCompare(b);
    });
  }, [existingFolders, editedPrompt?.folder]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const isNew = !editedPrompt?.id;
  const hasContent = Boolean(editedPrompt?.content?.trim());

  const handleDelete = async () => {
    const success = await deletePrompt();
    if (success) {
      setShowDeleteConfirm(false);
    }
  };

  const handleCopy = async () => {
    if (!editedPrompt?.content) return;

    try {
      await backend.copyToClipboard(editedPrompt.content);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handlePaste = async () => {
    if (!editedPrompt?.content) return;

    try {
      if (editedPrompt.id) {
        await backend.recordUsage(editedPrompt.id);
      }
      await backend.pasteFromEditor(editedPrompt.content);
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  const handleFolderChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === NEW_FOLDER_VALUE) {
        setIsCreatingFolder(true);
        setNewFolderName('');
      } else {
        updateField('folder', value);
      }
    },
    [updateField]
  );

  const handleNewFolderSubmit = useCallback(async () => {
    if (newFolderName.trim()) {
      await createFolderAndSelect(newFolderName);
    }
    setIsCreatingFolder(false);
    setNewFolderName('');
  }, [newFolderName, createFolderAndSelect]);

  const handleNewFolderCancel = useCallback(() => {
    setIsCreatingFolder(false);
    setNewFolderName('');
  }, []);

  const handleNewFolderKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleNewFolderSubmit();
      } else if (e.key === 'Escape') {
        handleNewFolderCancel();
      }
    },
    [handleNewFolderSubmit, handleNewFolderCancel]
  );

  if (!editedPrompt) return null;

  const icon = (editedPrompt.icon || DEFAULT_PROMPT_ICON) as PromptIconName;
  const color = (editedPrompt.color || DEFAULT_PROMPT_COLOR) as PromptColorName;

  return (
    <header className={styles.toolbar} data-testid="editor-toolbar">
      <div className={styles.left}>
        <IconColorPicker
          icon={icon}
          color={color}
          onIconChange={(newIcon) => updateField('icon', newIcon)}
          onColorChange={(newColor) => updateField('color', newColor)}
        />

        {isCreatingFolder ? (
          <div className={styles.newFolderInput}>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleNewFolderKeyDown}
              onBlur={handleNewFolderCancel}
              placeholder="New folder..."
              className={styles.folderInput}
              autoFocus
            />
          </div>
        ) : (
          <select
            value={editedPrompt.folder}
            onChange={handleFolderChange}
            className={styles.folderSelect}
            data-testid="folder-select"
          >
            {dropdownFolders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
            <option value={NEW_FOLDER_VALUE}>+ New Folder...</option>
          </select>
        )}
      </div>

      <div className={styles.right}>
        {hasContent && (
          <div className={styles.actionGroup}>
            <IconButton
              icon={copyStatus === 'copied' ? Check : Copy}
              onClick={handleCopy}
              title="Copy to clipboard"
              data-testid="copy-button"
            />
            <IconButton
              icon={ClipboardPaste}
              onClick={handlePaste}
              title="Paste to target app and close"
              data-testid="paste-button"
            />
          </div>
        )}

        {!isNew && (
          showDeleteConfirm ? (
            <div className={styles.confirmGroup}>
              <span className={styles.confirmText}>Delete?</span>
              <IconButton
                icon={Check}
                onClick={handleDelete}
                variant="danger"
                title="Confirm delete"
                data-testid="confirm-delete"
              />
              <IconButton
                icon={X}
                onClick={() => setShowDeleteConfirm(false)}
                title="Cancel"
                data-testid="cancel-delete"
              />
            </div>
          ) : (
            <IconButton
              icon={Trash2}
              onClick={() => setShowDeleteConfirm(true)}
              variant="danger"
              title="Delete prompt"
              data-testid="delete-button"
            />
          )
        )}
      </div>
    </header>
  );
}
