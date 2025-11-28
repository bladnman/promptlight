import type { PromptMetadata } from '../../../types';
import { SIDEBAR_CONFIG } from '../../../config/constants';
import { FolderHeader } from './FolderHeader';
import { PromptListItem } from './PromptListItem';
import styles from './FolderSection.module.css';

interface FolderSectionProps {
  folderName: string;
  prompts: PromptMetadata[];
  filteredCount: number;
  totalCount: number;
  isCollapsed: boolean;
  isFiltering: boolean;
  onToggleCollapse: () => void;
  selectedPromptId: string | null;
  onSelectPrompt: (id: string) => void;
  onFolderContextMenu?: (e: React.MouseEvent) => void;
}

export function FolderSection({
  folderName,
  prompts,
  filteredCount,
  totalCount,
  isCollapsed,
  isFiltering,
  onToggleCollapse,
  selectedPromptId,
  onSelectPrompt,
  onFolderContextMenu,
}: FolderSectionProps) {
  return (
    <div className={styles.section}>
      <FolderHeader
        name={folderName}
        filteredCount={filteredCount}
        totalCount={totalCount}
        isCollapsed={isCollapsed}
        isFiltering={isFiltering}
        onToggle={onToggleCollapse}
        onContextMenu={onFolderContextMenu}
      />
      <div
        className={`${styles.content} ${isCollapsed ? styles.collapsed : ''}`}
        style={{
          transitionDuration: `${SIDEBAR_CONFIG.COLLAPSE_ANIMATION_MS}ms`,
        }}
      >
        {prompts.map((prompt) => (
          <PromptListItem
            key={prompt.id}
            prompt={prompt}
            isSelected={prompt.id === selectedPromptId}
            onClick={() => onSelectPrompt(prompt.id)}
          />
        ))}
      </div>
    </div>
  );
}
