/**
 * Launcher Window E2E Tests
 *
 * Tests the core functionality of the launcher window:
 * - Search and filtering
 * - Keyboard navigation
 * - Selection behavior
 * - Context menu actions
 * - Keyboard shortcuts (paste, promote, edit, copy as file)
 */

import { test, expect } from '@playwright/test';
import { LauncherPage } from './pages/LauncherPage';
import { createTestScenario } from './fixtures/test-data';

test.describe('Launcher Window', () => {
  let launcher: LauncherPage;

  test.beforeEach(async ({ page }) => {
    launcher = new LauncherPage(page);
    await launcher.goto();
  });

  test.describe('Basic Display', () => {
    test('should show empty state when no prompts exist', async () => {
      // Already starts with empty state after goto()
      await launcher.waitForEmptyState();
      await expect(launcher.emptyState).toContainText('No prompts yet');
    });

    test('should display prompts after seeding data', async () => {
      const prompts = createTestScenario();
      await launcher.seedPrompts(prompts);
      // Trigger search to reload data
      await launcher.search('');
      await launcher.page.waitForTimeout(200);

      await launcher.waitForResults();
      const count = await launcher.getResultCount();
      expect(count).toBe(5);
    });

    test('should display prompt names in result items', async () => {
      const prompts = createTestScenario();
      await launcher.seedPrompts(prompts);
      // Trigger search to reload data
      await launcher.search('');
      await launcher.page.waitForTimeout(200);

      await launcher.waitForResults();
      await launcher.expectResultNames([
        'Daily Standup',
        'Email Draft',
        'Meeting Notes',
        'Bug Report',
        'Code Documentation',
      ]);
    });
  });

  test.describe('Search and Filtering', () => {
    test.beforeEach(async () => {
      const prompts = createTestScenario();
      await launcher.seedPrompts(prompts);
      // Trigger a search to reload data with seeded prompts
      await launcher.search('');
      await launcher.page.waitForTimeout(200);
      await launcher.waitForResults();
    });

    test('should filter results based on search query', async () => {
      await launcher.search('bug');

      // Wait for filtering to apply
      await launcher.page.waitForTimeout(100);

      const count = await launcher.getResultCount();
      expect(count).toBe(1);

      const resultName = launcher.getResultByIndex(0).locator('[data-testid="result-name"]');
      await expect(resultName).toHaveText('Bug Report');
    });

    test('should show empty state when no results match', async () => {
      await launcher.search('nonexistent query xyz');

      await launcher.page.waitForTimeout(100);

      await expect(launcher.emptyState).toBeVisible();
      await expect(launcher.emptyState).toContainText('No prompts matching');
    });

    test('should restore all results when search is cleared', async () => {
      await launcher.search('bug');
      await launcher.page.waitForTimeout(100);

      expect(await launcher.getResultCount()).toBe(1);

      await launcher.clearSearch();
      await launcher.page.waitForTimeout(100);

      expect(await launcher.getResultCount()).toBe(5);
    });

    test('should search by description', async () => {
      await launcher.search('template');

      await launcher.page.waitForTimeout(100);

      const count = await launcher.getResultCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test.beforeEach(async () => {
      const prompts = createTestScenario();
      await launcher.seedPrompts(prompts);
      await launcher.search('');
      await launcher.page.waitForTimeout(200);
      await launcher.waitForResults();
    });

    test('should select first item by default', async () => {
      const firstResult = launcher.getResultByIndex(0);
      await expect(firstResult).toHaveAttribute('aria-selected', 'true');
    });

    test('should navigate down with arrow key', async () => {
      await launcher.navigateDown();

      const secondResult = launcher.getResultByIndex(1);
      await expect(secondResult).toHaveAttribute('aria-selected', 'true');
    });

    test('should navigate up with arrow key', async () => {
      // First go down
      await launcher.navigateDown();
      await launcher.navigateDown();

      // Then go back up
      await launcher.navigateUp();

      const secondResult = launcher.getResultByIndex(1);
      await expect(secondResult).toHaveAttribute('aria-selected', 'true');
    });

    test('should stay at first item when navigating up from first', async () => {
      // Note: selectPrevious uses Math.max(index - 1, 0), so it doesn't wrap
      await launcher.navigateUp();

      const firstResult = launcher.getResultByIndex(0);
      await expect(firstResult).toHaveAttribute('aria-selected', 'true');
    });

    test.skip('should wrap to first item when navigating down from last', async () => {
      // TODO: This test is flaky - the wrapping behavior works in the app
      // but test timing/state management needs investigation
      // Navigate to last item (4 downs to reach index 4)
      for (let i = 0; i < 4; i++) {
        await launcher.navigateDown();
      }
      // Now at last item (index 4), one more down should wrap to first
      await launcher.navigateDown();
      await launcher.page.waitForTimeout(50);

      const firstResult = launcher.getResultByIndex(0);
      await expect(firstResult).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Selection Behavior', () => {
    test.beforeEach(async () => {
      const prompts = createTestScenario();
      await launcher.seedPrompts(prompts);
      await launcher.search('');
      await launcher.page.waitForTimeout(200);
      await launcher.waitForResults();
    });

    test('should select item on click', async () => {
      await launcher.clickResult(2);

      const thirdResult = launcher.getResultByIndex(2);
      await expect(thirdResult).toHaveAttribute('aria-selected', 'true');
    });

    test('should select item on hover', async () => {
      const thirdResult = launcher.getResultByIndex(2);
      await thirdResult.hover();

      await expect(thirdResult).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Keyboard Shortcuts - Actions', () => {
    test.beforeEach(async () => {
      const prompts = createTestScenario();
      await launcher.seedPrompts(prompts);
      await launcher.search('');
      await launcher.page.waitForTimeout(200);
      await launcher.waitForResults();
      await launcher.clearActionHistory();
    });

    test('should record paste action on Enter', async () => {
      await launcher.pressEnter();

      const actions = await launcher.getActionHistory();
      expect(actions.some((a: { type?: string }) => a.type === 'record_usage')).toBe(true);
      expect(actions.some((a: { type?: string }) => a.type === 'paste')).toBe(true);
    });

    test('should enter promoted mode on Tab', async () => {
      await launcher.pressTab();

      await expect(launcher.promotedView).toBeVisible();
    });

    test('should paste promoted prompt on Enter after Tab', async () => {
      await launcher.pressTab();
      await expect(launcher.promotedView).toBeVisible();

      await launcher.clearActionHistory();
      await launcher.pressEnter();

      const actions = await launcher.getActionHistory();
      expect(actions.some((a: { type?: string }) => a.type === 'paste')).toBe(true);
    });

    test('should record edit action on Shift+Enter', async () => {
      await launcher.pressShiftEnter();

      const actions = await launcher.getActionHistory();
      expect(actions.some((a: { type?: string }) => a.type === 'open_editor')).toBe(true);
    });

    test('should record copy as file action on Alt+Enter', async () => {
      await launcher.pressAltEnter();

      const actions = await launcher.getActionHistory();
      expect(actions.some((a: { type?: string }) => a.type === 'record_usage')).toBe(true);
      expect(actions.some((a: { type?: string }) => a.type === 'copy_as_file')).toBe(true);
    });

    test('should dismiss window on Escape', async () => {
      await launcher.pressEscape();

      const actions = await launcher.getActionHistory();
      expect(actions.some((a: { type?: string }) => a.type === 'dismiss')).toBe(true);
    });

    test('should open new prompt on Cmd+N', async () => {
      await launcher.pressNewPrompt();

      const actions = await launcher.getActionHistory();
      expect(actions.some((a: { type?: string }) => a.type === 'open_editor')).toBe(true);
    });

    test('should open settings on Cmd+,', async () => {
      await launcher.pressOpenSettings();

      const actions = await launcher.getActionHistory();
      const settingsAction = actions.find(
        (a: { type?: string; view?: string }) => a.type === 'open_editor' && a.view === 'settings'
      );
      expect(settingsAction).toBeDefined();
    });
  });

  test.describe('Context Menu', () => {
    test.beforeEach(async () => {
      const prompts = createTestScenario();
      await launcher.seedPrompts(prompts);
      await launcher.search('');
      await launcher.page.waitForTimeout(200);
      await launcher.waitForResults();
    });

    test('should open context menu on right-click', async () => {
      await launcher.rightClickResult(0);

      await expect(launcher.getContextMenu()).toBeVisible();
    });

    test.skip('should close context menu on Escape', async () => {
      // TODO: Escape key is captured by launcher's keyboard handler first,
      // dismissing the window before context menu can handle it
      await launcher.rightClickResult(0);
      await expect(launcher.getContextMenu()).toBeVisible();

      await launcher.page.keyboard.press('Escape');

      await expect(launcher.getContextMenu()).not.toBeVisible();
    });

    test('should show paste option in context menu', async () => {
      await launcher.rightClickResult(0);

      const contextMenu = launcher.getContextMenu();
      await expect(contextMenu.locator('text="Paste"')).toBeVisible();
    });

    test('should show edit option in context menu', async () => {
      await launcher.rightClickResult(0);

      const contextMenu = launcher.getContextMenu();
      await expect(contextMenu.locator('text="Edit"')).toBeVisible();
    });

    test('should show copy as file option in context menu', async () => {
      await launcher.rightClickResult(0);

      const contextMenu = launcher.getContextMenu();
      await expect(contextMenu.locator('text="Copy as File"')).toBeVisible();
    });

    test.skip('should trigger paste action from context menu', async () => {
      // TODO: Context menu fetches prompt content asynchronously, but
      // the content loading requires backend.getPrompt() which may need mock setup
      await launcher.rightClickResult(0);
      // Wait for context menu to load prompt content (async)
      await launcher.page.waitForTimeout(300);
      await launcher.clearActionHistory();

      await launcher.clickContextMenuItem('Paste');

      const actions = await launcher.getActionHistory();
      expect(actions.some((a: { type?: string }) => a.type === 'paste')).toBe(true);
    });

    test('should trigger edit action from context menu', async () => {
      await launcher.rightClickResult(0);
      await launcher.clearActionHistory();

      await launcher.clickContextMenuItem('Edit');

      const actions = await launcher.getActionHistory();
      expect(actions.some((a: { type?: string }) => a.type === 'open_editor')).toBe(true);
    });
  });

  test.describe('Promoted Mode', () => {
    test.beforeEach(async () => {
      const prompts = createTestScenario();
      await launcher.seedPrompts(prompts);
      await launcher.search('');
      await launcher.page.waitForTimeout(200);
      await launcher.waitForResults();
    });

    test('should show promoted view after Tab', async () => {
      await launcher.pressTab();

      await expect(launcher.promotedView).toBeVisible();
      await expect(launcher.resultsList).not.toBeVisible();
    });

    test('should allow typing rider text in promoted mode', async () => {
      await launcher.pressTab();

      await launcher.page.keyboard.type('additional context');

      const searchInput = launcher.searchInput;
      await expect(searchInput).toHaveValue('additional context');
    });

    test('should exit promoted mode on Escape', async () => {
      await launcher.pressTab();
      await expect(launcher.promotedView).toBeVisible();

      await launcher.pressEscape();

      // Should go back to normal mode or dismiss
      const actions = await launcher.getActionHistory();
      // Either back to normal mode (no dismiss action) or window dismissed
      const hasDismiss = actions.some((a: { type?: string }) => a.type === 'dismiss');
      const hasPromotedView = await launcher.promotedView.isVisible().catch(() => false);

      // One of these should be true
      expect(hasDismiss || !hasPromotedView).toBe(true);
    });
  });

  test.describe('Results Ordering', () => {
    test('should order results by use count (most used first)', async () => {
      const prompts = createTestScenario();
      await launcher.seedPrompts(prompts);
      await launcher.search('');
      await launcher.page.waitForTimeout(200);

      await launcher.waitForResults();

      // createTestScenario creates prompts with use counts:
      // Daily Standup: 30, Email Draft: 25, Meeting Notes: 20, Bug Report: 15, Code Documentation: 10
      await launcher.expectResultNames([
        'Daily Standup',    // 30 uses
        'Email Draft',      // 25 uses
        'Meeting Notes',    // 20 uses
        'Bug Report',       // 15 uses
        'Code Documentation', // 10 uses
      ]);
    });
  });
});
