import { useCallback, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SearchBar } from './SearchBar';
import { ResultsList } from './ResultsList';
import { KeyboardHints } from './KeyboardHints';
import { ContextMenu } from './ContextMenu';
import { useLauncherStore } from '../../stores/launcherStore';
import type { Prompt } from '../../types';
import styles from './LauncherWindow.module.css';

export function LauncherWindow() {
  const { contextMenu, closeContextMenu, openContextMenu } = useLauncherStore();

  // Handle right-click on empty area
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Only trigger if clicking on the container itself, not on items
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest(`.${styles.container}`) === e.currentTarget) {
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY);
    }
  }, [openContextMenu]);

  // Get prompt content for context menu actions
  const getPromptContent = useCallback(async (): Promise<string | undefined> => {
    if (!contextMenu.promptId) return undefined;
    try {
      const prompt = await invoke<Prompt>('get_prompt', { id: contextMenu.promptId });
      return prompt.content;
    } catch {
      return undefined;
    }
  }, [contextMenu.promptId]);

  return (
    <div className={styles.container} onContextMenu={handleContextMenu}>
      <SearchBar />
      <ResultsList />
      <KeyboardHints />
      {contextMenu.isOpen && (
        <ContextMenuWrapper
          x={contextMenu.x}
          y={contextMenu.y}
          promptId={contextMenu.promptId ?? undefined}
          promptName={contextMenu.promptName ?? undefined}
          getPromptContent={getPromptContent}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

// Wrapper to async load content
function ContextMenuWrapper({
  x,
  y,
  promptId,
  promptName,
  getPromptContent,
  onClose,
}: {
  x: number;
  y: number;
  promptId?: string;
  promptName?: string;
  getPromptContent: () => Promise<string | undefined>;
  onClose: () => void;
}) {
  const [content, setContent] = useState<string | undefined>(undefined);

  useEffect(() => {
    getPromptContent().then(setContent);
  }, [getPromptContent]);

  return (
    <ContextMenu
      x={x}
      y={y}
      promptId={promptId}
      promptName={promptName}
      promptContent={content}
      onClose={onClose}
    />
  );
}
