/**
 * Editor Page Object
 *
 * Provides methods for interacting with the editor window in E2E tests.
 */

import { Page, Locator, expect } from '@playwright/test';
import type { Prompt } from '../../../types';

export class EditorPage {
  readonly page: Page;

  // Sidebar locators
  readonly sidebar: Locator;
  readonly sidebarSearchInput: Locator;
  readonly sidebarPromptList: Locator;
  readonly sidebarPromptItems: Locator;
  readonly sidebarFolders: Locator;
  readonly newPromptButton: Locator;

  // Editor locators
  readonly editor: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly contentEditor: Locator;
  readonly folderSelect: Locator;

  // Toolbar locators
  readonly toolbar: Locator;
  readonly copyButton: Locator;
  readonly pasteButton: Locator;
  readonly deleteButton: Locator;
  readonly iconPicker: Locator;

  // Settings locators
  readonly settingsView: Locator;
  readonly generalSettings: Locator;
  readonly syncSettings: Locator;
  readonly appearanceSettings: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sidebar
    this.sidebar = page.locator('[data-testid="sidebar"]');
    this.sidebarSearchInput = page.locator('[data-testid="sidebar-search"]');
    this.sidebarPromptList = page.locator('[data-testid="prompt-list"]');
    this.sidebarPromptItems = page.locator('[data-testid="prompt-list-item"]');
    this.sidebarFolders = page.locator('[data-testid="folder-item"]');
    this.newPromptButton = page.locator('[data-testid="new-prompt-button"]');

    // Editor
    this.editor = page.locator('[data-testid="editor"]');
    this.titleInput = page.locator('[data-testid="prompt-title"]');
    this.descriptionInput = page.locator('[data-testid="prompt-description"]');
    this.contentEditor = page.locator('[data-testid="prompt-content"]');
    this.folderSelect = page.locator('[data-testid="folder-select"]');

    // Toolbar
    this.toolbar = page.locator('[data-testid="editor-toolbar"]');
    this.copyButton = page.locator('[data-testid="copy-button"]');
    this.pasteButton = page.locator('[data-testid="paste-button"]');
    this.deleteButton = page.locator('[data-testid="delete-button"]');
    this.iconPicker = page.locator('[data-testid="icon-picker"]');

    // Settings
    this.settingsView = page.locator('[data-testid="settings-view"]');
    this.generalSettings = page.locator('[data-testid="general-settings"]');
    this.syncSettings = page.locator('[data-testid="sync-settings"]');
    this.appearanceSettings = page.locator('[data-testid="appearance-settings"]');
  }

  /** Navigate to editor window with mock backend */
  async goto(promptId?: string) {
    const params = new URLSearchParams({ window: 'editor', mock: 'true' });
    if (promptId) {
      params.set('promptId', promptId);
    }
    await this.page.goto(`/?${params.toString()}`);
    await this.page.waitForLoadState('networkidle');
  }

  /** Navigate to editor window with settings view */
  async gotoSettings() {
    await this.page.goto('/?window=editor&mock=true&view=settings');
    await this.page.waitForLoadState('networkidle');
  }

  /** Seed the mock backend with test prompts */
  async seedPrompts(prompts: Prompt[]) {
    await this.page.evaluate((data) => {
      const mockBackend = (window as unknown as { __mockBackend: { seedData: (prompts: Prompt[]) => void } }).__mockBackend;
      if (mockBackend) {
        mockBackend.seedData(data);
      }
    }, prompts);
  }

  /** Reset the mock backend to initial state */
  async resetMockBackend() {
    await this.page.evaluate(() => {
      const mockBackend = (window as unknown as { __mockBackend: { reset: () => void } }).__mockBackend;
      if (mockBackend) {
        mockBackend.reset();
      }
    });
  }

  /** Trigger editor store to reload prompts from backend */
  async reloadPrompts() {
    await this.page.evaluate(() => {
      // Access the editor store via zustand's getState
      const store = (window as unknown as { __ZUSTAND_DEVTOOLS_GLOBAL__?: { stores: Map<string, { getState: () => { loadPrompts: () => Promise<void> } }> } }).__ZUSTAND_DEVTOOLS_GLOBAL__?.stores?.get('editor');
      if (store) {
        store.getState().loadPrompts();
      }
    });
    // Wait for the async load to complete
    await this.page.waitForTimeout(300);
  }

  /** Get action history from mock backend */
  async getActionHistory() {
    return await this.page.evaluate(() => {
      const mockBackend = (window as unknown as { __mockBackend: { actionHistory: readonly unknown[] } }).__mockBackend;
      return mockBackend ? [...mockBackend.actionHistory] : [];
    });
  }

  // ============ Sidebar Actions ============

  /** Click new prompt button */
  async clickNewPrompt() {
    await this.newPromptButton.click();
  }

  /** Search in sidebar */
  async sidebarSearch(query: string) {
    await this.sidebarSearchInput.fill(query);
  }

  /** Get count of prompts in sidebar */
  async getSidebarPromptCount(): Promise<number> {
    return await this.sidebarPromptItems.count();
  }

  /** Click a prompt in sidebar by index */
  async clickSidebarPrompt(index: number) {
    await this.sidebarPromptItems.nth(index).click();
  }

  /** Click a prompt in sidebar by name */
  async clickSidebarPromptByName(name: string) {
    await this.sidebarPromptItems.filter({ hasText: name }).first().click();
  }

  /** Toggle a folder in sidebar */
  async toggleFolder(folderName: string) {
    await this.sidebarFolders.filter({ hasText: folderName }).click();
  }

  // ============ Editor Actions ============

  /** Fill the title input */
  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  /** Fill the description input */
  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  /** Fill the content editor */
  async fillContent(content: string) {
    // ink-mde uses CodeMirror, so we need to interact with it properly
    const cmContent = this.contentEditor.locator('.cm-content');
    await cmContent.click();
    await this.page.keyboard.press('Meta+a'); // Select all
    await this.page.keyboard.type(content);
  }

  /** Get the current content */
  async getContent(): Promise<string> {
    // The content is stored in the state, we can get it from the debug view
    // or by reading the CodeMirror content
    const cmContent = this.contentEditor.locator('.cm-content');
    return await cmContent.textContent() ?? '';
  }

  /** Select a folder from dropdown */
  async selectFolder(folderName: string) {
    await this.folderSelect.selectOption(folderName);
  }

  /** Save the current prompt (Cmd+S) */
  async save() {
    await this.page.keyboard.press('Meta+s');
  }

  /** Wait for auto-save to complete */
  async waitForAutoSave() {
    // Auto-save indicator would show 'saved'
    await this.page.waitForTimeout(1500); // Auto-save debounce is typically 1s
  }

  // ============ Toolbar Actions ============

  /** Click copy button */
  async clickCopy() {
    await this.copyButton.click();
  }

  /** Click paste button */
  async clickPaste() {
    await this.pasteButton.click();
  }

  /** Click delete button */
  async clickDelete() {
    await this.deleteButton.click();
  }

  /** Confirm delete action */
  async confirmDelete() {
    await this.page.locator('[data-testid="confirm-delete"]').click();
  }

  /** Cancel delete action */
  async cancelDelete() {
    await this.page.locator('[data-testid="cancel-delete"]').click();
  }

  /** Open icon picker */
  async openIconPicker() {
    await this.iconPicker.click();
  }

  /** Select an icon from picker */
  async selectIcon(iconName: string) {
    await this.page.locator(`[data-testid="icon-option-${iconName}"]`).click();
  }

  /** Select a color from picker */
  async selectColor(colorName: string) {
    await this.page.locator(`[data-testid="color-option-${colorName}"]`).click();
  }

  // ============ Settings Actions ============

  /** Navigate to settings tab */
  async clickSettingsTab(tab: 'general' | 'sync' | 'appearance') {
    await this.page.locator(`[data-testid="settings-tab-${tab}"]`).click();
  }

  /** Toggle auto-launch setting */
  async toggleAutoLaunch() {
    await this.page.locator('[data-testid="auto-launch-toggle"]').click();
  }

  /** Set hotkey */
  async setHotkey() {
    await this.page.locator('[data-testid="hotkey-input"]').click();
    // User would then press their desired key combination
  }

  /** Toggle sync enabled */
  async toggleSync() {
    await this.page.locator('[data-testid="sync-toggle"]').click();
  }

  /** Select theme */
  async selectTheme(theme: 'light' | 'dark' | 'system') {
    await this.page.locator(`[data-testid="theme-${theme}"]`).click();
  }

  /** Select accent color */
  async selectAccentColor(color: string) {
    await this.page.locator(`[data-testid="accent-${color}"]`).click();
  }

  // ============ Assertions ============

  /** Verify prompt is loaded in editor */
  async expectPromptLoaded(name: string) {
    await expect(this.titleInput).toHaveValue(name);
  }

  /** Verify editor is in new prompt mode */
  async expectNewPromptMode() {
    await expect(this.titleInput).toHaveValue('');
  }

  /** Verify sidebar has specific prompt count */
  async expectSidebarPromptCount(count: number) {
    await expect(this.sidebarPromptItems).toHaveCount(count);
  }

  /** Verify settings view is visible */
  async expectSettingsVisible() {
    await expect(this.settingsView).toBeVisible();
  }
}
