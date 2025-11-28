import { useState, useCallback } from 'react';
import { useEditorStore } from '../../../stores/editorStore';
import { IconColorPicker } from '../../common/IconColorPicker';
import { MarkdownEditor } from './MarkdownEditor';
import {
  DEFAULT_PROMPT_ICON,
  DEFAULT_PROMPT_COLOR,
  type PromptIconName,
  type PromptColorName,
} from '../../../config/constants';
import styles from './PromptForm.module.css';

const NEW_FOLDER_VALUE = '__new_folder__';

export function PromptForm() {
  const { editedPrompt, folders, updateField, createFolderAndSelect } = useEditorStore();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <div className={styles.row}>
        <div className={styles.iconField}>
          <IconColorPicker
            icon={icon}
            color={color}
            onIconChange={(newIcon) => updateField('icon', newIcon)}
            onColorChange={(newColor) => updateField('color', newColor)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Name <span className={styles.required}>*</span>
          </label>
          <input
            id="name"
            type="text"
            value={editedPrompt.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Enter prompt name"
            className={styles.input}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="folder" className={styles.label}>
            Folder
          </label>
          {isCreatingFolder ? (
            <div className={styles.newFolderInput}>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleNewFolderKeyDown}
                onBlur={handleNewFolderCancel}
                placeholder="New folder name..."
                className={styles.input}
                autoFocus
              />
            </div>
          ) : (
            <select
              id="folder"
              value={editedPrompt.folder}
              onChange={handleFolderChange}
              className={styles.select}
            >
              {folders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
              <option value={NEW_FOLDER_VALUE}>+ New Folder...</option>
            </select>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <input
          id="description"
          type="text"
          value={editedPrompt.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief description for search"
          className={styles.input}
        />
      </div>

      <div className={`${styles.field} ${styles.contentField}`}>
        <label className={styles.label}>Content (Markdown)</label>
        <MarkdownEditor
          value={editedPrompt.content}
          onChange={(content) => updateField('content', content)}
          placeholder="Enter your prompt content here..."
        />
      </div>
    </form>
  );
}
