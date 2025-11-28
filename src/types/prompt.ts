import type { PromptIconName, PromptColorName } from '../config/constants';

/**
 * Metadata for a prompt (stored in index.json)
 */
export interface PromptMetadata {
  id: string;
  name: string;
  folder: string;
  description: string;
  filename: string;
  useCount: number;
  lastUsed: string | null;
  created: string;
  updated: string;
  icon?: PromptIconName;
  color?: PromptColorName;
}

/**
 * Full prompt with content (loaded on-demand)
 */
export interface Prompt extends PromptMetadata {
  content: string;
}

/**
 * Search result with score
 */
export interface SearchResult {
  prompt: PromptMetadata;
  score: number;
}

/**
 * Folder metadata
 */
export interface FolderMetadata {
  name: string;
  icon?: PromptIconName;
  color?: PromptColorName;
}

/**
 * The full index structure
 */
export interface PromptIndex {
  prompts: PromptMetadata[];
  folders: string[];
  folderMeta?: Record<string, FolderMetadata>;
}
