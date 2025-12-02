/**
 * TauriAdapter - Real implementation using Tauri invoke
 *
 * This adapter calls the actual Rust backend via Tauri's invoke API.
 * Used in production when running as a full Tauri application.
 */

import { invoke } from '@tauri-apps/api/core';
import type { BackendAdapter, ScreenBounds } from './types';
import type { AppSettings, AuthSession } from './authTypes';
import type { Prompt, PromptMetadata, PromptIndex, SearchResult } from '../../types';

export class TauriAdapter implements BackendAdapter {
  // ============ Data Operations ============

  async getIndex(): Promise<PromptIndex> {
    return invoke<PromptIndex>('get_index');
  }

  async getPrompt(id: string): Promise<Prompt> {
    return invoke<Prompt>('get_prompt', { id });
  }

  async savePrompt(prompt: Prompt): Promise<PromptMetadata> {
    return invoke<PromptMetadata>('save_prompt', { prompt });
  }

  async deletePrompt(id: string): Promise<void> {
    return invoke('delete_prompt', { id });
  }

  async searchPrompts(query: string): Promise<SearchResult[]> {
    return invoke<SearchResult[]>('search_prompts', { query });
  }

  async recordUsage(id: string): Promise<void> {
    return invoke('record_usage', { id });
  }

  // ============ Folder Operations ============

  async addFolder(name: string): Promise<void> {
    return invoke('add_folder', { name });
  }

  async renameFolder(oldName: string, newName: string): Promise<void> {
    return invoke('rename_folder', { oldName, newName });
  }

  async deleteFolder(name: string): Promise<void> {
    return invoke('delete_folder', { name });
  }

  // ============ Window Operations ============

  async dismissWindow(): Promise<void> {
    return invoke('dismiss_window');
  }

  async openEditorWindow(
    promptId: string | null,
    screenBounds: ScreenBounds | null,
    view?: string
  ): Promise<void> {
    return invoke('open_editor_window', { promptId, screenBounds, view });
  }

  // ============ Clipboard Operations ============

  async pasteAndDismiss(text: string): Promise<void> {
    return invoke('paste_and_dismiss', { text });
  }

  async copyToClipboard(text: string): Promise<void> {
    return invoke('copy_to_clipboard', { text });
  }

  async copyAsMarkdownFile(name: string, content: string): Promise<void> {
    return invoke('copy_as_markdown_file', { name, content });
  }

  async pasteFromEditor(text: string): Promise<void> {
    return invoke('paste_from_editor', { text });
  }

  // ============ Settings Operations ============

  async getSettings(): Promise<AppSettings> {
    return invoke<AppSettings>('get_settings');
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    return invoke('save_settings', { settings });
  }

  async getAutoStartEnabled(): Promise<boolean> {
    return invoke<boolean>('get_autostart_enabled');
  }

  async setAutoStartEnabled(enabled: boolean): Promise<void> {
    return invoke('set_autostart_enabled', { enabled });
  }

  async setHotkey(hotkey: string | null): Promise<void> {
    return invoke('set_hotkey', { hotkey });
  }

  async pauseHotkey(): Promise<void> {
    return invoke('pause_hotkey');
  }

  async resumeHotkey(): Promise<void> {
    return invoke('resume_hotkey');
  }

  // ============ Sync Operations ============

  async syncToCloud(): Promise<void> {
    return invoke('sync_to_cloud');
  }

  async setSyncAuth(userId: string, idToken: string): Promise<void> {
    return invoke('set_sync_auth', { userId, idToken });
  }

  async clearSyncAuth(): Promise<void> {
    return invoke('clear_sync_auth');
  }

  // ============ Auth Operations ============

  async getCurrentAuth(apiKey: string): Promise<AuthSession | null> {
    return invoke<AuthSession | null>('get_current_auth', { apiKey });
  }

  async signInWithGoogle(apiKey: string): Promise<AuthSession> {
    return invoke<AuthSession>('sign_in_with_google', { apiKey });
  }

  async signOut(): Promise<void> {
    return invoke('sign_out');
  }
}
