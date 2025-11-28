import { useEditorStore } from '../../../stores/editorStore';
import styles from './PromptForm.module.css';

export function PromptForm() {
  const { editedPrompt, folders, updateField } = useEditorStore();

  if (!editedPrompt) return null;

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <div className={styles.row}>
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
          <select
            id="folder"
            value={editedPrompt.folder}
            onChange={(e) => updateField('folder', e.target.value)}
            className={styles.select}
          >
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
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
        <label htmlFor="content" className={styles.label}>
          Content (Markdown)
        </label>
        <textarea
          id="content"
          value={editedPrompt.content}
          onChange={(e) => updateField('content', e.target.value)}
          placeholder="Enter your prompt content here..."
          className={styles.textarea}
        />
      </div>
    </form>
  );
}
