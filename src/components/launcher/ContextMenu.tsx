import { useEffect, useRef } from 'react';
import { backend } from '../../services/backend';
import { KEYBOARD_HINT_LABELS } from '../../config/constants';
import { getCurrentScreenBounds } from '../../utils/screen';
import styles from './ContextMenu.module.css';

interface MenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  promptId?: string;
  promptName?: string;
  promptContent?: string;
}

export function ContextMenu({ x, y, onClose, promptId, promptName, promptContent }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  const hasPrompt = !!promptId;

  const handlePaste = async () => {
    if (!promptId || !promptContent) return;
    await backend.recordUsage(promptId);
    await backend.pasteAndDismiss(promptContent);
    onClose();
  };

  const handleCopyAsFile = async () => {
    if (!promptId || !promptName || !promptContent) return;
    await backend.recordUsage(promptId);
    await backend.copyAsMarkdownFile(promptName, promptContent);
    onClose();
  };

  const handleEdit = async () => {
    if (!promptId) return;
    const screenBounds = await getCurrentScreenBounds();
    await backend.openEditorWindow(promptId, screenBounds);
    onClose();
  };

  const handleNew = async () => {
    const screenBounds = await getCurrentScreenBounds();
    await backend.openEditorWindow(null, screenBounds);
    onClose();
  };

  const handleSettings = async () => {
    const screenBounds = await getCurrentScreenBounds();
    await backend.openEditorWindow(null, screenBounds, 'settings');
    onClose();
  };

  const handleDismiss = async () => {
    await backend.dismissWindow();
    onClose();
  };

  const promptItems: MenuItem[] = hasPrompt ? [
    { label: 'Paste', shortcut: KEYBOARD_HINT_LABELS.PASTE, action: handlePaste },
    { label: 'Copy as File', shortcut: KEYBOARD_HINT_LABELS.COPY_AS_FILE, action: handleCopyAsFile },
    { label: 'Edit', shortcut: KEYBOARD_HINT_LABELS.EDIT_PROMPT, action: handleEdit },
  ] : [];

  const appItems: MenuItem[] = [
    { label: 'New Prompt', shortcut: KEYBOARD_HINT_LABELS.NEW_PROMPT, action: handleNew },
    { label: 'Settings', shortcut: '⌘,', action: handleSettings },
  ];

  const windowItems: MenuItem[] = [
    { label: 'Dismiss', shortcut: KEYBOARD_HINT_LABELS.DISMISS, action: handleDismiss },
  ];

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      style={{ left: x, top: y }}
      data-testid="context-menu"
    >
      {promptItems.length > 0 && (
        <>
          {promptItems.map((item, i) => (
            <button
              key={i}
              className={styles.item}
              onClick={item.action}
              disabled={item.disabled}
            >
              <span className={styles.label}>{item.label}</span>
              {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
            </button>
          ))}
          <div className={styles.separator} />
        </>
      )}
      {appItems.map((item, i) => (
        <button
          key={i}
          className={styles.item}
          onClick={item.action}
          disabled={item.disabled}
        >
          <span className={styles.label}>{item.label}</span>
          {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
        </button>
      ))}
      <div className={styles.separator} />
      {windowItems.map((item, i) => (
        <button
          key={i}
          className={styles.item}
          onClick={item.action}
          disabled={item.disabled}
        >
          <span className={styles.label}>{item.label}</span>
          {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
        </button>
      ))}
    </div>
  );
}
