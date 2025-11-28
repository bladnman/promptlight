import type { PromptMetadata } from '../../../types';
import styles from './PromptListItem.module.css';

interface PromptListItemProps {
  prompt: PromptMetadata;
  isSelected: boolean;
  onClick: () => void;
}

export function PromptListItem({ prompt, isSelected, onClick }: PromptListItemProps) {
  return (
    <button
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.name}>{prompt.name}</div>
      <div className={styles.meta}>
        <span className={styles.folder}>{prompt.folder}</span>
        {prompt.useCount > 0 && (
          <span className={styles.useCount}>{prompt.useCount} uses</span>
        )}
      </div>
    </button>
  );
}
