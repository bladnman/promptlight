import { ChevronRight, ChevronDown, Folder } from 'lucide-react';
import styles from './FolderHeader.module.css';

interface FolderHeaderProps {
  name: string;
  filteredCount: number;
  totalCount: number;
  isCollapsed: boolean;
  isFiltering: boolean;
  onToggle: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function FolderHeader({
  name,
  filteredCount,
  totalCount,
  isCollapsed,
  isFiltering,
  onToggle,
  onContextMenu,
}: FolderHeaderProps) {
  const countDisplay = isFiltering
    ? `${filteredCount}/${totalCount}`
    : String(totalCount);

  const isEmpty = isFiltering && filteredCount === 0;

  return (
    <button
      type="button"
      className={styles.header}
      onClick={onToggle}
      onContextMenu={onContextMenu}
      aria-expanded={!isCollapsed}
      data-testid="folder-item"
    >
      <span className={`${styles.chevron} ${isCollapsed ? styles.collapsed : ''}`}>
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </span>
      <span className={styles.folderIcon}>
        <Folder size={14} />
      </span>
      <span className={styles.name}>{name}</span>
      <span className={`${styles.count} ${isEmpty ? styles.empty : ''}`}>
        ({countDisplay})
      </span>
    </button>
  );
}
