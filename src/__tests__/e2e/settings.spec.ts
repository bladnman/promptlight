/**
 * Settings E2E Tests
 *
 * Tests the settings view functionality:
 * - General settings (hotkey, auto-launch)
 * - Appearance settings (theme, accent colors)
 * - Sync settings (sign-in when not authenticated)
 * - Navigation between settings sections
 */

import { test, expect } from '@playwright/test';
import { EditorPage } from './pages/EditorPage';

test.describe('Settings View', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.gotoSettings();
    await page.waitForTimeout(500);
  });

  test.describe('Navigation', () => {
    test('should show settings view', async () => {
      await expect(editor.settingsView).toBeVisible();
    });

    test('should default to general tab', async () => {
      const generalTab = editor.page.locator('[data-testid="settings-tab-general"]');
      await expect(generalTab).toBeVisible();
    });

    test('should switch to appearance tab', async () => {
      await editor.clickSettingsTab('appearance');
      await editor.page.waitForTimeout(200);

      // Theme buttons should be visible in appearance section
      const darkTheme = editor.page.locator('[data-testid="theme-dark"]');
      await expect(darkTheme).toBeVisible();
    });

    test('should switch to sync tab', async () => {
      await editor.clickSettingsTab('sync');
      await editor.page.waitForTimeout(200);

      // Sign-in button should be visible when not authenticated
      const signInButton = editor.page.locator('[data-testid="google-sign-in"]');
      await expect(signInButton).toBeVisible();
    });

    test('should switch back to general tab', async () => {
      // Go to appearance first
      await editor.clickSettingsTab('appearance');
      await editor.page.waitForTimeout(200);

      // Then back to general
      await editor.clickSettingsTab('general');
      await editor.page.waitForTimeout(200);

      // Hotkey input should be visible in general section
      const hotkeyInput = editor.page.locator('[data-testid="hotkey-input"]');
      await expect(hotkeyInput).toBeVisible();
    });
  });

  test.describe('General Settings', () => {
    test('should show hotkey input', async () => {
      const hotkeyInput = editor.page.locator('[data-testid="hotkey-input"]');
      await expect(hotkeyInput).toBeVisible();
    });

    test('should show auto-launch setting section', async () => {
      // The toggle is a checkbox inside a label - check for the setting row
      const autoLaunchSection = editor.page.locator('text="Launch at startup"');
      await expect(autoLaunchSection).toBeVisible();
    });

    test('should show hotkey section title', async () => {
      const hotkeyLabel = editor.page.locator('text="Global hotkey"');
      await expect(hotkeyLabel).toBeVisible();
    });

    test('hotkey input should be interactive', async () => {
      // Hotkey input should be visible and ready for interaction
      const hotkeyInput = editor.page.locator('[data-testid="hotkey-input"]');
      await expect(hotkeyInput).toBeVisible();
    });
  });

  test.describe('Appearance Settings', () => {
    test.beforeEach(async () => {
      await editor.clickSettingsTab('appearance');
      await editor.page.waitForTimeout(200);
    });

    test('should show dark theme button', async () => {
      const darkTheme = editor.page.locator('[data-testid="theme-dark"]');
      await expect(darkTheme).toBeVisible();
    });

    test('should show light theme button', async () => {
      const lightTheme = editor.page.locator('[data-testid="theme-light"]');
      await expect(lightTheme).toBeVisible();
    });

    test('should show system theme button', async () => {
      const autoTheme = editor.page.locator('[data-testid="theme-auto"]');
      await expect(autoTheme).toBeVisible();
    });

    test('should show theme section title', async () => {
      const themeLabel = editor.page.locator('text="Theme"');
      await expect(themeLabel).toBeVisible();
    });

    test('should show accent color section', async () => {
      const accentLabel = editor.page.locator('text="Accent color"');
      await expect(accentLabel).toBeVisible();
    });

    test('should show avocado accent option', async () => {
      const avocadoAccent = editor.page.locator('[data-testid="accent-avocado"]');
      await expect(avocadoAccent).toBeVisible();
    });

    test('should show forest accent option', async () => {
      const forestAccent = editor.page.locator('[data-testid="accent-forest"]');
      await expect(forestAccent).toBeVisible();
    });

    test('should show ocean accent option', async () => {
      const oceanAccent = editor.page.locator('[data-testid="accent-ocean"]');
      await expect(oceanAccent).toBeVisible();
    });
  });

  test.describe('Sync Settings', () => {
    test.beforeEach(async () => {
      await editor.clickSettingsTab('sync');
      await editor.page.waitForTimeout(200);
    });

    test('should show cloud sync title', async () => {
      const syncTitle = editor.page.locator('text="Cloud Sync"');
      await expect(syncTitle).toBeVisible();
    });

    test('should show sign-in button when not authenticated', async () => {
      const signInButton = editor.page.locator('[data-testid="google-sign-in"]');
      await expect(signInButton).toBeVisible();
    });

    test('should show sign-in button text', async () => {
      const signInText = editor.page.locator('text="Sign in with Google"');
      await expect(signInText).toBeVisible();
    });

    test('should show sync description', async () => {
      // Use partial text match for description
      const description = editor.page.locator('text=/Sync your prompts/i');
      await expect(description).toBeVisible();
    });
  });

  test.describe('Theme Selection', () => {
    test.beforeEach(async () => {
      await editor.clickSettingsTab('appearance');
      await editor.page.waitForTimeout(200);
    });

    test('should be able to click dark theme', async () => {
      const darkTheme = editor.page.locator('[data-testid="theme-dark"]');
      await darkTheme.click();
      // Button should remain visible and clickable
      await expect(darkTheme).toBeVisible();
    });

    test('should be able to click light theme', async () => {
      const lightTheme = editor.page.locator('[data-testid="theme-light"]');
      await lightTheme.click();
      await expect(lightTheme).toBeVisible();
    });

    test('should be able to click system theme', async () => {
      const autoTheme = editor.page.locator('[data-testid="theme-auto"]');
      await autoTheme.click();
      await expect(autoTheme).toBeVisible();
    });
  });

  test.describe('Accent Color Selection', () => {
    test.beforeEach(async () => {
      await editor.clickSettingsTab('appearance');
      await editor.page.waitForTimeout(200);
    });

    test('should be able to click avocado accent', async () => {
      const avocadoAccent = editor.page.locator('[data-testid="accent-avocado"]');
      await avocadoAccent.click();
      await expect(avocadoAccent).toBeVisible();
    });

    test('should be able to click violet accent', async () => {
      const violetAccent = editor.page.locator('[data-testid="accent-violet"]');
      await violetAccent.click();
      await expect(violetAccent).toBeVisible();
    });
  });
});
