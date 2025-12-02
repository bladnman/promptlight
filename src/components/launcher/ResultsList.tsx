import { ResultItem } from './ResultItem';
import { useLauncherStore } from '../../stores/launcherStore';
import styles from './ResultsList.module.css';

export function ResultsList() {
  const { mode, results, selectedIndex, query } = useLauncherStore();

  if (mode === 'promoted') {
    return (
      <div className={styles.promotedHint} data-testid="promoted-view">
        Press <kbd>Enter</kbd> to paste
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={styles.noResults} data-testid="empty-state">
        {query ? `No prompts matching "${query}"` : 'No prompts yet'}
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="results-list">
      {results.map((result, index) => (
        <ResultItem
          key={result.prompt.id}
          result={result}
          isSelected={index === selectedIndex}
          index={index}
        />
      ))}
    </div>
  );
}
