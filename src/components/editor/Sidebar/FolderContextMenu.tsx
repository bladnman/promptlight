import { useEffect, useRef } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import styles from './FolderContextMenu.module.css';

interface FolderContextMenuProps {
  folderName: string;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function FolderContextMenu({
  folderName,
  position,
  onClose,
  onRename,
  onDelete,
}: FolderContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const isUncategorized = folderName === 'uncategorized';

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      style={{ top: position.y, left: position.x }}
    >
      <button
        type="button"
        className={styles.item}
        onClick={() => {
          onRename();
          onClose();
        }}
      >
        <Edit2 size={14} />
        <span>Rename</span>
      </button>
      {!isUncategorized && (
        <button
          type="button"
          className={`${styles.item} ${styles.danger}`}
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          <Trash2 size={14} />
          <span>Delete</span>
        </button>
      )}
    </div>
  );
}
