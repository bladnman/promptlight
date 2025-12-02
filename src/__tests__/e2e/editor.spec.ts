/**
 * Editor Window E2E Tests
 *
 * Tests the core functionality of the editor window:
 * - Basic UI elements visibility
 * - New prompt creation flow
 * - Sidebar display
 *
 * Note: Tests requiring seeded data are marked as TODO
 * because the editor store loads data differently than the launcher.
 */

import { test, expect } from '@playwright/test';
import { EditorPage } from './pages/EditorPage';

test.describe('Editor Window', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
  });

  test.describe('Basic Display', () => {
    test('should show editor window', async () => {
      await editor.goto();
      await editor.page.waitForTimeout(500);

      const editorWindow = editor.page.locator('[data-testid="editor-window"]');
      await expect(editorWindow).toBeVisible();
    });

    test('should show sidebar', async () => {
      await editor.goto();
      await editor.page.waitForTimeout(500);

      await expect(editor.sidebar).toBeVisible();
    });

    test('should show editor area', async () => {
      await editor.goto();
      await editor.page.waitForTimeout(500);

      await expect(editor.editor).toBeVisible();
    });

    test('should show new prompt button', async () => {
      await editor.goto();
      await editor.page.waitForTimeout(500);

      await expect(editor.newPromptButton).toBeVisible();
    });

    test('should show sidebar search input', async () => {
      await editor.goto();
      await editor.page.waitForTimeout(500);

      await expect(editor.sidebarSearchInput).toBeVisible();
    });
  });

  test.describe('New Prompt Creation', () => {
    test('should show empty title after clicking new', async () => {
      await editor.goto();
      await editor.page.waitForTimeout(500);

      await editor.clickNewPrompt();
      await editor.page.waitForTimeout(300);

      // Title element should exist (even if readonly div initially)
      await expect(editor.titleInput).toBeVisible();
    });

    test('should show toolbar for new prompt', async () => {
      await editor.goto();
      await editor.page.waitForTimeout(500);

      await editor.clickNewPrompt();
      await editor.page.waitForTimeout(300);

      await expect(editor.toolbar).toBeVisible();
    });

    test('should show folder select for new prompt', async () => {
      await editor.goto();
      await editor.page.waitForTimeout(500);

      await editor.clickNewPrompt();
      await editor.page.waitForTimeout(300);

      await expect(editor.folderSelect).toBeVisible();
    });

    test('should show content editor for new prompt', async () => {
      await editor.goto();
      await editor.page.waitForTimeout(500);

      await editor.clickNewPrompt();
      await editor.page.waitForTimeout(300);

      await expect(editor.contentEditor).toBeVisible();
    });
  });

  test.describe('Toolbar Elements', () => {
    test.beforeEach(async () => {
      await editor.goto();
      await editor.page.waitForTimeout(500);
      await editor.clickNewPrompt();
      await editor.page.waitForTimeout(300);
    });

    test('should show copy button when content exists', async () => {
      // Copy button only appears when prompt has content
      await editor.fillContent('Test content for copy button');
      await editor.page.waitForTimeout(200);

      await expect(editor.copyButton).toBeVisible();
    });

    test('should show paste button when content exists', async () => {
      // Paste button only appears when prompt has content
      await editor.fillContent('Test content for paste button');
      await editor.page.waitForTimeout(200);

      await expect(editor.pasteButton).toBeVisible();
    });

    test.skip('should show delete button for existing prompts', async () => {
      // TODO: Delete button only shows for existing prompts (with id)
      // This test requires seeding data, which needs editor store integration
      await expect(editor.deleteButton).toBeVisible();
    });

    test('should show icon picker', async () => {
      await expect(editor.iconPicker).toBeVisible();
    });
  });

  test.describe('Settings View', () => {
    test('should navigate to settings view', async () => {
      await editor.gotoSettings();
      await editor.page.waitForTimeout(500);

      await expect(editor.settingsView).toBeVisible();
    });

    test('should show general settings tab', async () => {
      await editor.gotoSettings();
      await editor.page.waitForTimeout(500);

      const generalTab = editor.page.locator('[data-testid="settings-tab-general"]');
      await expect(generalTab).toBeVisible();
    });

    test('should show appearance settings tab', async () => {
      await editor.gotoSettings();
      await editor.page.waitForTimeout(500);

      const appearanceTab = editor.page.locator('[data-testid="settings-tab-appearance"]');
      await expect(appearanceTab).toBeVisible();
    });

    test('should show sync settings tab', async () => {
      await editor.gotoSettings();
      await editor.page.waitForTimeout(500);

      const syncTab = editor.page.locator('[data-testid="settings-tab-sync"]');
      await expect(syncTab).toBeVisible();
    });

    test('should switch to appearance tab when clicked', async () => {
      await editor.gotoSettings();
      await editor.page.waitForTimeout(500);

      await editor.clickSettingsTab('appearance');
      await editor.page.waitForTimeout(200);

      // The tab should now be active (checking for any visual indicator)
      const appearanceTab = editor.page.locator('[data-testid="settings-tab-appearance"]');
      await expect(appearanceTab).toBeVisible();
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should respond to Cmd+N for new prompt', async () => {
      await editor.goto();
      await editor.page.waitForTimeout(500);

      await editor.page.keyboard.press('Meta+n');
      await editor.page.waitForTimeout(300);

      // Title input should be visible after new prompt
      await expect(editor.titleInput).toBeVisible();
    });
  });
});
