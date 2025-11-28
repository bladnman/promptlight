import { useRef, useEffect } from 'react';
import type { SearchResult } from '../../types';
import { useLauncherStore } from '../../stores/launcherStore';
import { Icon } from '../common/Icon';
import { PROMPT_COLORS, DEFAULT_PROMPT_ICON, DEFAULT_PROMPT_COLOR } from '../../config/constants';
import styles from './ResultItem.module.css';

interface ResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  index: number;
}

export function ResultItem({ result, isSelected, index }: ResultItemProps) {
  const { setSelectedIndex, executeSelected } = useLauncherStore();
  const { prompt } = result;
  const itemRef = useRef<HTMLDivElement>(null);

  const icon = prompt.icon || DEFAULT_PROMPT_ICON;
  const color = prompt.color || DEFAULT_PROMPT_COLOR;
  const colorValue = PROMPT_COLORS[color];

  // Scroll into view when selected
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  const handleClick = () => {
    setSelectedIndex(index);
    executeSelected();
  };

  const handleMouseEnter = () => {
    setSelectedIndex(index);
  };

  return (
    <div
      ref={itemRef}
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      role="option"
      aria-selected={isSelected}
    >
      <span className={styles.icon} style={{ color: colorValue }}>
        <Icon name={icon} size={18} />
      </span>
      <div className={styles.content}>
        <div className={styles.name}>{prompt.name}</div>
        {prompt.description && (
          <div className={styles.description}>{prompt.description}</div>
        )}
      </div>
      <div className={styles.meta}>
        <span className={styles.folder}>{prompt.folder}</span>
        {prompt.useCount > 0 && (
          <span className={styles.useCount}>{prompt.useCount}</span>
        )}
      </div>
    </div>
  );
}
