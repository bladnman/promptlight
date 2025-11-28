import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { SearchBar } from './SearchBar';
import { ResultsList } from './ResultsList';
import { KeyboardHints } from './KeyboardHints';
import styles from './LauncherWindow.module.css';

export function LauncherWindow() {
  const handleClose = useCallback(async () => {
    try {
      await invoke('dismiss_window');
    } catch (error) {
      console.error('Failed to hide window:', error);
    }
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Only drag on left mouse button and not on close button
    if (e.button !== 0) return;

    const appWindow = getCurrentWindow();
    appWindow.startDragging().catch((error) => {
      console.error('Failed to start dragging:', error);
    });
  }, []);

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        onMouseDown={handleDragStart}
      >
        <button
          className={styles.closeButton}
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <SearchBar />
      <ResultsList />
      <KeyboardHints />
    </div>
  );
}
