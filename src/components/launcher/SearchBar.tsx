import { useRef, useEffect } from 'react';
import { PromptPill } from './PromptPill';
import { useLauncherStore } from '../../stores/launcherStore';
import { useWindowEvents } from '../../hooks';
import styles from './SearchBar.module.css';

export function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mode, query, promotedPrompt, riderText, setQuery, setRiderText, executeSelected } =
    useLauncherStore();

  // Handle window focus events - focuses input and reloads prompts
  useWindowEvents(inputRef);

  // Refocus after promotion
  useEffect(() => {
    if (mode === 'promoted') {
      inputRef.current?.focus();
    }
  }, [mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode === 'promoted') {
      setRiderText(e.target.value);
    } else {
      setQuery(e.target.value);
    }
  };

  // Note: Enter key is handled by useKeyboardNav at the window level
  // to avoid duplicate execution. We only need to handle special input-specific keys here.
  const handleKeyDown = (_e: React.KeyboardEvent) => {
    // Reserved for future input-specific key handling
  };

  const value = mode === 'promoted' ? riderText : query;
  const placeholder =
    mode === 'promoted' ? 'Add context...' : 'Search prompts...';

  return (
    <div className={styles.container}>
      {mode === 'promoted' && promotedPrompt && (
        <PromptPill name={promotedPrompt.name} />
      )}
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </div>
  );
}
