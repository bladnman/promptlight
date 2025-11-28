import type { PromptMetadata } from '../../../types';
import { Icon } from '../../common/Icon';
import { formatCompactNumber } from '../../../utils/format';
import { PROMPT_COLORS, DEFAULT_PROMPT_ICON, DEFAULT_PROMPT_COLOR } from '../../../config/constants';
import styles from './PromptListItem.module.css';

interface PromptListItemProps {
  prompt: PromptMetadata;
  isSelected: boolean;
  onClick: () => void;
}

export function PromptListItem({ prompt, isSelected, onClick }: PromptListItemProps) {
  const icon = prompt.icon || DEFAULT_PROMPT_ICON;
  const color = prompt.color || DEFAULT_PROMPT_COLOR;
  const colorValue = PROMPT_COLORS[color];

  return (
    <button
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <span className={styles.icon} style={{ color: colorValue }}>
        <Icon name={icon} size={16} />
      </span>
      <span className={styles.name}>{prompt.name}</span>
      {prompt.useCount > 0 && (
        <span className={styles.useCount}>{formatCompactNumber(prompt.useCount)}</span>
      )}
    </button>
  );
}
