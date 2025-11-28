import { useEffect, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import styles from './MarkdownEditor.module.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Helper to get markdown from editor storage
function getMarkdown(editor: Editor): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = editor.storage as any;
  return storage?.markdown?.getMarkdown?.() || '';
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter your prompt content here...',
}: MarkdownEditorProps) {
  // Track if we're updating from external value change
  const isExternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: styles.codeBlock } },
        code: { HTMLAttributes: { class: styles.inlineCode } },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: styles.link },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: styles.isEmpty,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Skip if this update was triggered by external value change
      if (isExternalUpdate.current) {
        return;
      }
      const markdown = getMarkdown(editor);
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: styles.editor,
      },
    },
  });

  // Sync external value changes (e.g., loading different prompt)
  useEffect(() => {
    if (editor && value !== getMarkdown(editor)) {
      isExternalUpdate.current = true;
      editor.commands.setContent(value);
      isExternalUpdate.current = false;
    }
  }, [value, editor]);

  return (
    <div className={styles.wrapper}>
      <EditorContent editor={editor} />
    </div>
  );
}
