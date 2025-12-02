/**
 * MockAdapter - In-memory mock for browser-only testing
 *
 * This adapter simulates all backend operations in-memory, enabling
 * Playwright E2E tests to run without the Tauri backend.
 *
 * Features:
 * - In-memory prompt/folder storage
 * - Action tracking for test assertions
 * - Configurable via seedData() and reset()
 * - Hooks for observing operations
 */

import type { BackendAdapter, ScreenBounds, TestAction } from './types';
import type { AppSettings, AuthSession, User } from './authTypes';
import type { Prompt, PromptMetadata, PromptIndex, SearchResult } from '../../types';
import { DEFAULT_THEME, DEFAULT_ACCENT_COLOR } from '../../config/constants';

/** Generate a unique ID */
function generateId(): string {
  return `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Convert a full Prompt to PromptMetadata */
function toMetadata(prompt: Prompt): PromptMetadata {
  const { content: _content, ...metadata } = prompt;
  return metadata;
}

/** Default settings */
const defaultSettings: AppSettings = {
  general: {
    autoLaunch: false,
    hotkey: 'CommandOrControl+Shift+Space',
  },
  sync: {
    enabled: false,
    lastSync: null,
  },
  appearance: {
    theme: DEFAULT_THEME,
    accentColor: DEFAULT_ACCENT_COLOR,
  },
};

export class MockAdapter implements BackendAdapter {
  // In-memory storage
  private prompts: Map<string, Prompt> = new Map();
  private folders: Set<string> = new Set(['uncategorized']);
  private settings: AppSettings = { ...defaultSettings };
  private autoStartEnabled = false;
  private currentUser: User | null = null;
  private hotkeyPaused = false;

  // Action tracking for test assertions
  private _actionHistory: TestAction[] = [];

  // Error injection for tests (method name -> error to throw)
  private _errorInjections: Map<string, Error> = new Map();

  // Observable hooks (for test harness)
  public onPaste?: (text: string) => void;
  public onDismiss?: () => void;
  public onOpenEditor?: (promptId: string | null, view?: string) => void;
  public onCopyToClipboard?: (text: string) => void;

  /** Get action history for assertions */
  get actionHistory(): readonly TestAction[] {
    return this._actionHistory;
  }

  /** Check if hotkey is currently paused (for test assertions) */
  get isHotkeyPaused(): boolean {
    return this.hotkeyPaused;
  }

  /** Clear action history */
  clearActionHistory(): void {
    this._actionHistory = [];
  }

  /** Inject an error for a specific method (for testing error handling) */
  injectError(methodName: string, error: Error): void {
    this._errorInjections.set(methodName, error);
  }

  /** Clear a specific error injection */
  clearError(methodName: string): void {
    this._errorInjections.delete(methodName);
  }

  /** Clear all error injections */
  clearAllErrors(): void {
    this._errorInjections.clear();
  }

  /** Check if an error should be thrown for a method */
  private checkError(methodName: string): void {
    const error = this._errorInjections.get(methodName);
    if (error) {
      throw error;
    }
  }

  /** Seed the mock with test data */
  seedData(prompts: Prompt[]): void {
    this.prompts.clear();
    this.folders.clear();
    this.folders.add('uncategorized');

    for (const prompt of prompts) {
      this.prompts.set(prompt.id, prompt);
      if (prompt.folder) {
        this.folders.add(prompt.folder);
      }
    }
  }

  /** Reset to initial state */
  reset(): void {
    this.prompts.clear();
    this.folders.clear();
    this.folders.add('uncategorized');
    this.settings = { ...defaultSettings };
    this.autoStartEnabled = false;
    this.currentUser = null;
    this.hotkeyPaused = false;
    this._actionHistory = [];
    this._errorInjections.clear();
  }

  /** Set current user for auth testing */
  setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  // ============ Data Operations ============

  async getIndex(): Promise<PromptIndex> {
    this.checkError('getIndex');
    const prompts = Array.from(this.prompts.values()).map(toMetadata);
    return {
      prompts,
      folders: Array.from(this.folders),
      folderMeta: {},
    };
  }

  async getPrompt(id: string): Promise<Prompt> {
    const prompt = this.prompts.get(id);
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }
    return { ...prompt };
  }

  async savePrompt(prompt: Prompt): Promise<PromptMetadata> {
    const now = new Date().toISOString();
    const isNew = !prompt.id;

    const savedPrompt: Prompt = {
      ...prompt,
      id: prompt.id || generateId(),
      created: isNew ? now : prompt.created,
      updated: now,
      filename: prompt.filename || `${prompt.id || generateId()}.md`,
    };

    this.prompts.set(savedPrompt.id, savedPrompt);

    // Ensure folder exists
    if (savedPrompt.folder) {
      this.folders.add(savedPrompt.folder);
    }

    return toMetadata(savedPrompt);
  }

  async deletePrompt(id: string): Promise<void> {
    this.prompts.delete(id);
  }

  async searchPrompts(query: string): Promise<SearchResult[]> {
    const normalizedQuery = query.toLowerCase().trim();
    const prompts = Array.from(this.prompts.values());

    if (!normalizedQuery) {
      // Return all prompts sorted by useCount (most used first)
      return prompts
        .sort((a, b) => b.useCount - a.useCount)
        .map((p) => ({ prompt: toMetadata(p), score: 1.0 }));
    }

    // Simple fuzzy search
    return prompts
      .filter((p) => {
        const name = p.name.toLowerCase();
        const desc = p.description.toLowerCase();
        const content = p.content.toLowerCase();
        return (
          name.includes(normalizedQuery) ||
          desc.includes(normalizedQuery) ||
          content.includes(normalizedQuery)
        );
      })
      .map((p) => {
        // Calculate a simple score based on where match was found
        const name = p.name.toLowerCase();
        let score = 0.5;
        if (name.startsWith(normalizedQuery)) score = 1.0;
        else if (name.includes(normalizedQuery)) score = 0.8;
        return { prompt: toMetadata(p), score };
      })
      .sort((a, b) => b.score - a.score);
  }

  async recordUsage(id: string): Promise<void> {
    const prompt = this.prompts.get(id);
    if (prompt) {
      prompt.useCount += 1;
      prompt.lastUsed = new Date().toISOString();
    }
    this._actionHistory.push({ type: 'record_usage', id });
  }

  // ============ Folder Operations ============

  async addFolder(name: string): Promise<void> {
    this.folders.add(name.toLowerCase());
  }

  async renameFolder(oldName: string, newName: string): Promise<void> {
    this.folders.delete(oldName);
    this.folders.add(newName.toLowerCase());

    // Update all prompts in the old folder
    for (const prompt of this.prompts.values()) {
      if (prompt.folder === oldName) {
        prompt.folder = newName.toLowerCase();
      }
    }
  }

  async deleteFolder(name: string): Promise<void> {
    this.folders.delete(name);

    // Move prompts to uncategorized
    for (const prompt of this.prompts.values()) {
      if (prompt.folder === name) {
        prompt.folder = 'uncategorized';
      }
    }
  }

  // ============ Window Operations ============

  async dismissWindow(): Promise<void> {
    this._actionHistory.push({ type: 'dismiss' });
    this.onDismiss?.();
  }

  async openEditorWindow(
    promptId: string | null,
    _screenBounds: ScreenBounds | null,
    view?: string
  ): Promise<void> {
    this._actionHistory.push({ type: 'open_editor', promptId, view });
    this.onOpenEditor?.(promptId, view);
  }

  // ============ Clipboard Operations ============

  async pasteAndDismiss(text: string): Promise<void> {
    this._actionHistory.push({ type: 'paste', text });
    this.onPaste?.(text);
    this.onDismiss?.();

    // In browser, we can use the clipboard API as a fallback
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API may not be available in all contexts
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    this._actionHistory.push({ type: 'copy_to_clipboard', text });
    this.onCopyToClipboard?.(text);

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API may not be available
    }
  }

  async copyAsMarkdownFile(name: string, content: string): Promise<void> {
    this._actionHistory.push({ type: 'copy_as_file', name, content });

    // In browser, just copy the content
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Clipboard API may not be available
    }
  }

  async pasteFromEditor(text: string): Promise<void> {
    this._actionHistory.push({ type: 'paste_from_editor', text });
    this.onPaste?.(text);

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API may not be available
    }
  }

  // ============ Settings Operations ============

  async getSettings(): Promise<AppSettings> {
    this.checkError('getSettings');
    return { ...this.settings };
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    this.checkError('saveSettings');
    this.settings = { ...settings };
  }

  async getAutoStartEnabled(): Promise<boolean> {
    this.checkError('getAutoStartEnabled');
    return this.autoStartEnabled;
  }

  async setAutoStartEnabled(enabled: boolean): Promise<void> {
    this.checkError('setAutoStartEnabled');
    this.autoStartEnabled = enabled;
  }

  async setHotkey(hotkey: string | null): Promise<void> {
    this.settings.general.hotkey = hotkey;
    this._actionHistory.push({ type: 'set_hotkey', hotkey });
  }

  async pauseHotkey(): Promise<void> {
    this.hotkeyPaused = true;
  }

  async resumeHotkey(): Promise<void> {
    this.hotkeyPaused = false;
  }

  // ============ Sync Operations ============

  async syncToCloud(): Promise<void> {
    this.checkError('syncToCloud');
    this._actionHistory.push({ type: 'sync_to_cloud' });
    // No-op in mock - sync is simulated
  }

  async setSyncAuth(_userId: string, _idToken: string): Promise<void> {
    // No-op in mock
  }

  async clearSyncAuth(): Promise<void> {
    // No-op in mock
  }

  // ============ Auth Operations ============

  async getCurrentAuth(_apiKey: string): Promise<AuthSession | null> {
    this.checkError('getCurrentAuth');
    if (!this.currentUser) return null;

    return {
      user: this.currentUser,
      tokens: {
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Date.now() + 3600000,
      },
    };
  }

  async signInWithGoogle(_apiKey: string): Promise<AuthSession> {
    this.checkError('signInWithGoogle');
    this._actionHistory.push({ type: 'sign_in' });

    // Create a mock user
    this.currentUser = {
      uid: 'mock-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      photoUrl: null,
    };

    return {
      user: this.currentUser,
      tokens: {
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Date.now() + 3600000,
      },
    };
  }

  async signOut(): Promise<void> {
    this.checkError('signOut');
    this._actionHistory.push({ type: 'sign_out' });
    this.currentUser = null;
  }
}

// Export a singleton instance for use in tests
export const mockBackend = new MockAdapter();
