import { useEffect, useRef, useCallback } from 'react';
import { ink, inkPlugin } from 'ink-mde';
import type { Instance } from 'ink-mde';
import { keymap, type EditorView } from '@codemirror/view';
import styles from './MarkdownEditor.module.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Focus the editor on mount */
  autoFocus?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter your prompt content here...',
  autoFocus = false,
}: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Instance | null>(null);
  const isInternalChange = useRef(false);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const autoFocusRef = useRef(autoFocus);

  // Keep refs in sync
  valueRef.current = value;
  onChangeRef.current = onChange;

  // Stable onChange callback - uses ref to avoid recreating editor on parent re-renders
  const handleChange = useCallback((doc: string) => {
    isInternalChange.current = true;
    onChangeRef.current(doc);
  }, []);

  // Initialize ink-mde editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content (handles React StrictMode double-mount)
    containerRef.current.innerHTML = '';

    // Create keyboard shortcuts for formatting and selection
    const formattingKeymap = keymap.of([
      {
        key: 'Mod-a',
        run: (view: EditorView) => {
          // Select all content in the editor
          view.dispatch({
            selection: { anchor: 0, head: view.state.doc.length },
          });
          return true;
        },
      },
      {
        key: 'Mod-b',
        run: () => {
          editorRef.current?.format('bold', {});
          return true;
        },
      },
      {
        key: 'Mod-i',
        run: () => {
          editorRef.current?.format('italic', {});
          return true;
        },
      },
    ]);

    // Wrap the keymap as an ink-mde plugin
    const keymapPlugin = inkPlugin({
      type: 'default',
      value: () => formattingKeymap,
    });

    editorRef.current = ink(containerRef.current, {
      doc: valueRef.current,
      hooks: {
        afterUpdate: handleChange,
      },
      interface: {
        toolbar: false,
        attribution: false,
        appearance: 'auto',
      },
      plugins: [keymapPlugin],
      placeholder,
    });

    // Handle focus behavior
    if (autoFocusRef.current) {
      editorRef.current.focus();
    } else {
      // Prevent ink-mde from stealing focus when autoFocus is false
      // This fixes the issue where the body gets focus instead of title on new prompts
      setTimeout(() => {
        if (editorRef.current && document.activeElement?.closest('.ink-mde')) {
          (document.activeElement as HTMLElement)?.blur();
        }
      }, 0);
    }

    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [handleChange, placeholder]);

  // Sync external value changes to editor
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.getDoc() !== value) {
      editorRef.current.update(value);
    }
  }, [value]);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.editor} />
    </div>
  );
}
