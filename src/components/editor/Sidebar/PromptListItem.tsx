import { MoreHorizontal } from 'lucide-react';
import type { PromptMetadata } from '../../../types';
import { Icon } from '../../common/Icon';
import { formatCompactNumber } from '../../../utils/format';
import { PROMPT_COLORS, DEFAULT_PROMPT_ICON, DEFAULT_PROMPT_COLOR } from '../../../config/constants';
import styles from './PromptListItem.module.css';

interface PromptListItemProps {
  prompt: PromptMetadata;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function PromptListItem({ prompt, isSelected, onClick, onContextMenu }: PromptListItemProps) {
  const icon = prompt.icon || DEFAULT_PROMPT_ICON;
  const color = prompt.color || DEFAULT_PROMPT_COLOR;
  const colorValue = PROMPT_COLORS[color];

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Trigger context menu at click position
    if (onContextMenu) {
      onContextMenu(e);
    }
  };

  return (
    <button
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      data-testid="prompt-list-item"
    >
      <span className={styles.icon} style={{ color: colorValue }}>
        <Icon name={icon} size={16} />
      </span>
      <span className={styles.name}>{prompt.name}</span>

      {/* Use count - hidden on hover */}
      {prompt.useCount > 0 && !isSelected && (
        <span className={styles.useCount}>{formatCompactNumber(prompt.useCount)}</span>
      )}

      {/* More button - visible on hover via CSS */}
      {!isSelected && (
        <button
          className={styles.moreButton}
          onClick={handleMoreClick}
          title="More actions"
        >
          <MoreHorizontal size={14} />
        </button>
      )}
    </button>
  );
}
