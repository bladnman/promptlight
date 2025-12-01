import { useEditorStore } from '../../../stores/editorStore';
import { InlineEdit } from '../../common/InlineEdit';
import { MarkdownEditor } from './MarkdownEditor';
import styles from './PromptForm.module.css';

export function PromptForm() {
  const { editedPrompt, updateField, selectedPromptId } = useEditorStore();

  if (!editedPrompt) return null;

  // New prompt: focus title; existing prompt: focus content
  const isNewPrompt = !selectedPromptId;

  return (
    <div className={styles.form}>
      <div className={styles.header}>
        <InlineEdit
          value={editedPrompt.name}
          onChange={(value) => updateField('name', value)}
          placeholder="Untitled prompt"
          variant="title"
          autoFocus={isNewPrompt}
        />
        <InlineEdit
          value={editedPrompt.description}
          onChange={(value) => updateField('description', value)}
          placeholder="Add a description..."
          variant="body"
        />
      </div>

      <div className={styles.contentField}>
        <MarkdownEditor
          value={editedPrompt.content}
          onChange={(content) => updateField('content', content)}
          placeholder="Enter your prompt content here..."
          autoFocus={!isNewPrompt}
        />
      </div>
    </div>
  );
}
