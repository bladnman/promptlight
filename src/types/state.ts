import type { PromptMetadata, SearchResult } from './prompt';

/**
 * Launcher mode - either searching or promoted
 */
export type LauncherMode = 'search' | 'promoted';

/**
 * State for the launcher window
 */
export interface LauncherState {
  /** Current mode */
  mode: LauncherMode;
  /** Search query text */
  query: string;
  /** Filtered search results */
  results: SearchResult[];
  /** Currently selected result index */
  selectedIndex: number;
  /** Promoted prompt (when mode is 'promoted') */
  promotedPrompt: PromptMetadata | null;
  /** Rider text to append to promoted prompt */
  riderText: string;
  /** Loading state for search */
  isLoading: boolean;
}

/**
 * State for the editor window
 */
export interface EditorState {
  /** ID of the currently active prompt */
  activePromptId: string | null;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Current content in the editor */
  content: string;
}
