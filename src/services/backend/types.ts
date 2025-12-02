/**
 * Backend Adapter Interface
 *
 * This abstraction layer enables browser-only testing by allowing
 * us to swap between TauriAdapter (real backend) and MockAdapter (in-memory mock).
 */

import type { Prompt, PromptMetadata, PromptIndex, SearchResult } from '../../types';
import type { AppSettings, AuthSession } from './authTypes';

export interface ScreenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Backend adapter interface defining all operations that interact with
 * the Tauri backend or require mocking for browser-only testing.
 */
export interface BackendAdapter {
  // ============ Data Operations ============

  /** Get the full prompt index (all prompts and folders) */
  getIndex(): Promise<PromptIndex>;

  /** Get a single prompt by ID with full content */
  getPrompt(id: string): Promise<Prompt>;

  /** Save a prompt (create or update) */
  savePrompt(prompt: Prompt): Promise<PromptMetadata>;

  /** Delete a prompt by ID */
  deletePrompt(id: string): Promise<void>;

  /** Search prompts by query string */
  searchPrompts(query: string): Promise<SearchResult[]>;

  /** Record usage of a prompt (increments useCount) */
  recordUsage(id: string): Promise<void>;

  // ============ Folder Operations ============

  /** Add a new folder */
  addFolder(name: string): Promise<void>;

  /** Rename a folder */
  renameFolder(oldName: string, newName: string): Promise<void>;

  /** Delete a folder */
  deleteFolder(name: string): Promise<void>;

  // ============ Window Operations ============

  /** Dismiss/hide the launcher window */
  dismissWindow(): Promise<void>;

  /** Open the editor window */
  openEditorWindow(
    promptId: string | null,
    screenBounds: ScreenBounds | null,
    view?: string
  ): Promise<void>;

  // ============ Clipboard Operations ============

  /** Paste text to the previously focused app and dismiss window */
  pasteAndDismiss(text: string): Promise<void>;

  /** Copy text to clipboard */
  copyToClipboard(text: string): Promise<void>;

  /** Copy content as a markdown file to clipboard */
  copyAsMarkdownFile(name: string, content: string): Promise<void>;

  /** Paste text from editor (doesn't dismiss, different behavior) */
  pasteFromEditor(text: string): Promise<void>;

  // ============ Settings Operations ============

  /** Get current application settings */
  getSettings(): Promise<AppSettings>;

  /** Save application settings */
  saveSettings(settings: AppSettings): Promise<void>;

  /** Get whether auto-launch is enabled */
  getAutoStartEnabled(): Promise<boolean>;

  /** Set auto-launch enabled/disabled */
  setAutoStartEnabled(enabled: boolean): Promise<void>;

  /** Set the global hotkey */
  setHotkey(hotkey: string | null): Promise<void>;

  /** Pause the global hotkey (for recording new hotkey) */
  pauseHotkey(): Promise<void>;

  /** Resume the global hotkey */
  resumeHotkey(): Promise<void>;

  // ============ Sync Operations ============

  /** Sync prompts to cloud */
  syncToCloud(): Promise<void>;

  /** Set sync authentication */
  setSyncAuth(userId: string, idToken: string): Promise<void>;

  /** Clear sync authentication */
  clearSyncAuth(): Promise<void>;

  // ============ Auth Operations ============

  /** Get current authentication state */
  getCurrentAuth(apiKey: string): Promise<AuthSession | null>;

  /** Sign in with Google */
  signInWithGoogle(apiKey: string): Promise<AuthSession>;

  /** Sign out */
  signOut(): Promise<void>;
}

/**
 * Test action types for tracking what operations were called
 * (used by MockAdapter for assertions)
 */
export type TestAction =
  | { type: 'paste'; text: string }
  | { type: 'paste_from_editor'; text: string }
  | { type: 'dismiss' }
  | { type: 'open_editor'; promptId: string | null; view?: string }
  | { type: 'copy_to_clipboard'; text: string }
  | { type: 'copy_as_file'; name: string; content: string }
  | { type: 'record_usage'; id: string }
  | { type: 'set_hotkey'; hotkey: string | null }
  | { type: 'sync_to_cloud' }
  | { type: 'sign_in' }
  | { type: 'sign_out' };
