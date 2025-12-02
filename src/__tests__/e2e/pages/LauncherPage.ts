/**
 * Launcher Page Object
 *
 * Provides methods for interacting with the launcher window in E2E tests.
 */

import { Page, Locator, expect } from '@playwright/test';
import type { Prompt } from '../../../types';

export class LauncherPage {
  readonly page: Page;

  // Locators
  readonly searchInput: Locator;
  readonly resultsList: Locator;
  readonly resultItems: Locator;
  readonly emptyState: Locator;
  readonly promotedView: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main elements
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.resultsList = page.locator('[data-testid="results-list"]');
    this.resultItems = page.locator('[data-testid="result-item"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');
    this.promotedView = page.locator('[data-testid="promoted-view"]');
  }

  /** Navigate to launcher window with mock backend */
  async goto() {
    await this.page.goto('/?mock=true');
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

  /** Get action history from mock backend */
  async getActionHistory() {
    return await this.page.evaluate(() => {
      const mockBackend = (window as unknown as { __mockBackend: { actionHistory: readonly unknown[] } }).__mockBackend;
      return mockBackend ? [...mockBackend.actionHistory] : [];
    });
  }

  /** Clear action history */
  async clearActionHistory() {
    await this.page.evaluate(() => {
      const mockBackend = (window as unknown as { __mockBackend: { clearActionHistory: () => void } }).__mockBackend;
      if (mockBackend) {
        mockBackend.clearActionHistory();
      }
    });
  }

  /** Type in search input */
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  /** Clear search input */
  async clearSearch() {
    await this.searchInput.clear();
  }

  /** Get count of visible results */
  async getResultCount(): Promise<number> {
    return await this.resultItems.count();
  }

  /** Get result item by index (0-based) */
  getResultByIndex(index: number): Locator {
    return this.resultItems.nth(index);
  }

  /** Get result item by prompt name */
  getResultByName(name: string): Locator {
    return this.resultItems.filter({ hasText: name }).first();
  }

  /** Click on a result item */
  async clickResult(index: number) {
    await this.getResultByIndex(index).click();
  }

  /** Double-click on a result item (paste action) */
  async doubleClickResult(index: number) {
    await this.getResultByIndex(index).dblclick();
  }

  /** Navigate down in results list */
  async navigateDown() {
    await this.page.keyboard.press('ArrowDown');
  }

  /** Navigate up in results list */
  async navigateUp() {
    await this.page.keyboard.press('ArrowUp');
  }

  /** Press Enter to paste selected prompt */
  async pressEnter() {
    await this.page.keyboard.press('Enter');
  }

  /** Press Escape to dismiss */
  async pressEscape() {
    await this.page.keyboard.press('Escape');
  }

  /** Press Tab to promote selected prompt */
  async pressTab() {
    await this.page.keyboard.press('Tab');
  }

  /** Press Shift+Enter to edit selected prompt */
  async pressShiftEnter() {
    await this.page.keyboard.press('Shift+Enter');
  }

  /** Press Alt+Enter to copy as file */
  async pressAltEnter() {
    await this.page.keyboard.press('Alt+Enter');
  }

  /** Press Cmd+N to create new prompt */
  async pressNewPrompt() {
    await this.page.keyboard.press('Meta+n');
  }

  /** Press Cmd+, to open settings */
  async pressOpenSettings() {
    await this.page.keyboard.press('Meta+,');
  }

  /** Right-click on a result to open context menu */
  async rightClickResult(index: number) {
    await this.getResultByIndex(index).click({ button: 'right' });
  }

  /** Get context menu */
  getContextMenu(): Locator {
    return this.page.locator('[data-testid="context-menu"]');
  }

  /** Click context menu item */
  async clickContextMenuItem(label: string) {
    await this.getContextMenu().locator(`text="${label}"`).click();
  }

  /** Check if a result is selected */
  async isResultSelected(index: number): Promise<boolean> {
    const result = this.getResultByIndex(index);
    const className = await result.getAttribute('class');
    return className?.includes('selected') ?? false;
  }

  /** Verify search results match expected names */
  async expectResultNames(expectedNames: string[]) {
    const count = await this.getResultCount();
    expect(count).toBe(expectedNames.length);

    for (let i = 0; i < expectedNames.length; i++) {
      const resultName = this.getResultByIndex(i).locator('[data-testid="result-name"]');
      await expect(resultName).toHaveText(expectedNames[i]);
    }
  }

  /** Wait for results to load */
  async waitForResults() {
    await this.page.waitForSelector('[data-testid="result-item"]', { timeout: 5000 });
  }

  /** Wait for empty state */
  async waitForEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }
}
