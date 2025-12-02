import { useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useEditorStore } from '../../../stores/editorStore';
import { SIDEBAR_CONFIG } from '../../../config/constants';
import styles from './SearchInput.module.css';

export function SearchInput() {
  const { searchFilter, setSearchFilter } = useEditorStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setSearchFilter(value);
      }, SIDEBAR_CONFIG.FILTER_DEBOUNCE_MS);
    },
    [setSearchFilter]
  );

  const handleClear = useCallback(() => {
    setSearchFilter('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  }, [setSearchFilter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <span className={styles.icon}>
        <Search size={14} />
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder="Filter prompts..."
        defaultValue={searchFilter}
        onChange={handleChange}
        className={styles.input}
        data-testid="sidebar-search"
      />
      {searchFilter && (
        <button
          type="button"
          onClick={handleClear}
          className={styles.clearButton}
          aria-label="Clear filter"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
