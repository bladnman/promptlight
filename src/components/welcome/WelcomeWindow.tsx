import { useState, useCallback, useEffect } from 'react';
import { backend } from '../../services/backend';
import styles from './WelcomeWindow.module.css';

export function WelcomeWindow() {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleLetsGo = useCallback(async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      await backend.closeWelcomeWindow(dontShowAgain);
    } catch (error) {
      console.error('Failed to close welcome window:', error);
      setIsClosing(false);
    }
  }, [dontShowAgain, isClosing]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleLetsGo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLetsGo]);

  return (
    <div className={styles.container} data-testid="welcome-window">
      <img
        src="/welcome-artwork.png"
        alt="PromptLight"
        className={styles.artwork}
      />
      <div className={styles.controls}>
        <button
          className={styles.letsGoButton}
          onClick={handleLetsGo}
          disabled={isClosing}
          data-testid="lets-go-button"
        >
          {isClosing ? 'Starting...' : "Let's Go!"}
        </button>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className={styles.checkbox}
            data-testid="dont-show-checkbox"
          />
          <span>Don't show again</span>
        </label>
      </div>
    </div>
  );
}
