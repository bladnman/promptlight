import { useMemo } from 'react';
import type { PromptMetadata } from '../types';

/**
 * Derives the list of folders that actually contain prompts.
 * Folders are sorted alphabetically with 'uncategorized' always last.
 *
 * @param prompts Array of prompt metadata
 * @returns Array of folder names that have at least one prompt
 */
export function useDerivedFolders(prompts: PromptMetadata[]): string[] {
  return useMemo(() => {
    // Extract unique folders from prompts
    const folderSet = new Set(prompts.map((p) => p.folder));

    // Convert to sorted array
    const folders = Array.from(folderSet).sort((a, b) => {
      // 'uncategorized' always sorts last
      if (a === 'uncategorized') return 1;
      if (b === 'uncategorized') return -1;
      return a.localeCompare(b);
    });

    return folders;
  }, [prompts]);
}
