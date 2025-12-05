/**
 * Select All (Cmd+A) E2E Tests
 *
 * Tests that Cmd+A properly selects ALL content in the markdown editor,
 * including content that is virtualized/scrolled out of view.
 *
 * This is a regression test for the CodeMirror virtualization issue where
 * Cmd+A would only select visible content instead of the full document.
 *
 * IMPORTANT: These tests load EXISTING prompts (not create new ones) because
 * the virtualization issue only occurs when content is loaded from storage,
 * not when it's typed in (typing renders all content).
 */

import { test, expect } from '@playwright/test';
import { EditorPage } from './pages/EditorPage';
import { createTestPrompt } from './fixtures/test-data';
import os from 'os';

const modifier = os.platform() === 'darwin' ? 'Meta' : 'Control';

// Generate a very large body that requires multiple scrolls
function generateLargeContent(lines: number): string {
  const content: string[] = [];
  for (let i = 1; i <= lines; i++) {
    content.push(`Line ${i}: This is paragraph ${i} of the test content. It contains enough text to make each line meaningful and help verify that all content is properly selected when using Cmd+A.`);
    content.push(''); // Empty line between paragraphs
  }
  return content.join('\n');
}

test.describe('Select All in Editor', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
  });

  test('should select ALL content including virtualized/scrolled content when pressing Cmd+A', async () => {
    // This test verifies the fix for CodeMirror virtualization issue
    // where Cmd+A only selected visible content instead of the full document
    //
    // CRITICAL: This test LOADS an existing prompt (not creates a new one)
    // because the virtualization issue only occurs with loaded content.
    // When content is typed, it's all rendered. When loaded, only visible
    // lines are rendered due to CodeMirror virtualization.

    // Generate very large content (100 lines = definitely multiple scrolls worth)
    const largeContent = generateLargeContent(100);
    expect(largeContent.length).toBeGreaterThan(10000); // Sanity check

    // Create a prompt with large content that will be loaded from "storage"
    const largePrompt = createTestPrompt({
      id: 'large-content-prompt',
      name: 'Large Content Test',
      description: 'A prompt with lots of content for select-all testing',
      content: largeContent,
    });

    // Navigate and seed the data
    await editor.goto();
    await editor.page.waitForTimeout(500);

    // Seed the prompt into mock backend
    await editor.seedPrompts([largePrompt]);
    await editor.page.waitForTimeout(300);

    // Reload prompts so the store picks up the seeded data
    await editor.reloadPrompts();
    await editor.page.waitForTimeout(500);

    // Click on the prompt in the sidebar to LOAD it (not create new)
    await editor.clickSidebarPromptByName('Large Content Test');
    await editor.page.waitForTimeout(500);

    // Click into the content editor
    const cmContent = editor.contentEditor.locator('.cm-content');
    await cmContent.click();
    await editor.page.waitForTimeout(500);

    // Leave the field by clicking on the title
    await editor.titleInput.click();
    await editor.page.waitForTimeout(500);

    // Go back to the content field
    await cmContent.click();
    await editor.page.waitForTimeout(500);

    // Press Cmd+A to select all
    await editor.page.keyboard.press(`${modifier}+a`);
    await editor.page.waitForTimeout(500);

    // Type "hello" to replace ALL selected content
    await editor.page.keyboard.type('hello');
    await editor.page.waitForTimeout(500);

    // Get the new content
    const contentAfter = await cmContent.textContent();

    // The content should be EXACTLY "hello" (no trailing text from previous content)
    // If select-all only selected visible content, there would be leftover text
    expect(contentAfter?.trim()).toBe('hello');
  });

  test('should select all with shorter content (sanity check)', async () => {
    // Sanity check with short content to ensure test mechanics work
    await editor.goto();
    await editor.page.waitForTimeout(500);

    await editor.clickNewPrompt();
    await editor.page.waitForTimeout(300);

    const shortContent = 'This is a short test message.';

    const cmContent = editor.contentEditor.locator('.cm-content');
    await cmContent.click();
    await editor.page.keyboard.type(shortContent);
    await editor.page.waitForTimeout(200);

    // Leave and return
    await editor.titleInput.click();
    await editor.page.waitForTimeout(100);
    await cmContent.click();
    await editor.page.waitForTimeout(100);

    // Select all and replace
    await editor.page.keyboard.press(`${modifier}+a`);
    await editor.page.keyboard.type('replaced');
    await editor.page.waitForTimeout(100);

    const contentAfter = await cmContent.textContent();
    expect(contentAfter?.trim()).toBe('replaced');
  });

  test('should select all content when scrolled to bottom', async () => {
    // Test that select-all works even when scrolled away from the start
    // Uses LOADED prompt (not created) to test virtualization issue

    const largeContent = generateLargeContent(50);
    const bottomPrompt = createTestPrompt({
      id: 'bottom-scroll-prompt',
      name: 'Bottom Scroll Test',
      description: 'Testing select-all when scrolled to bottom',
      content: largeContent,
    });

    await editor.goto();
    await editor.page.waitForTimeout(500);

    await editor.seedPrompts([bottomPrompt]);
    await editor.page.waitForTimeout(300);
    await editor.reloadPrompts();
    await editor.page.waitForTimeout(500);

    // Load the prompt by clicking it in sidebar
    await editor.clickSidebarPromptByName('Bottom Scroll Test');
    await editor.page.waitForTimeout(500);

    const cmContent = editor.contentEditor.locator('.cm-content');
    await cmContent.click();
    await editor.page.waitForTimeout(500);

    // Scroll to the bottom by pressing Cmd+End or just End multiple times
    await editor.page.keyboard.press(`${modifier}+End`);
    await editor.page.waitForTimeout(500);

    // Leave and re-enter the field
    await editor.titleInput.click();
    await editor.page.waitForTimeout(500);
    await cmContent.click();
    await editor.page.waitForTimeout(500);

    // Now select all from the bottom position
    await editor.page.keyboard.press(`${modifier}+a`);
    await editor.page.waitForTimeout(500);

    // Replace with "bottom-test"
    await editor.page.keyboard.type('bottom-test');
    await editor.page.waitForTimeout(500);

    const contentAfter = await cmContent.textContent();
    expect(contentAfter?.trim()).toBe('bottom-test');
  });

  test('should select all content when scrolled to middle', async () => {
    // Test that select-all works when scrolled to the middle of content
    // Uses LOADED prompt (not created) to test virtualization issue

    const largeContent = generateLargeContent(80);
    const middlePrompt = createTestPrompt({
      id: 'middle-scroll-prompt',
      name: 'Middle Scroll Test',
      description: 'Testing select-all when scrolled to middle',
      content: largeContent,
    });

    await editor.goto();
    await editor.page.waitForTimeout(500);

    await editor.seedPrompts([middlePrompt]);
    await editor.page.waitForTimeout(300);
    await editor.reloadPrompts();
    await editor.page.waitForTimeout(500);

    // Load the prompt by clicking it in sidebar
    await editor.clickSidebarPromptByName('Middle Scroll Test');
    await editor.page.waitForTimeout(500);

    const cmContent = editor.contentEditor.locator('.cm-content');
    await cmContent.click();
    await editor.page.waitForTimeout(500);

    // Go to the middle using Cmd+G or just scroll via Page Down
    await editor.page.keyboard.press('PageDown');
    await editor.page.keyboard.press('PageDown');
    await editor.page.waitForTimeout(500);

    // Leave and re-enter the field
    await editor.titleInput.click();
    await editor.page.waitForTimeout(500);
    await cmContent.click();
    await editor.page.waitForTimeout(500);

    // Select all from middle position
    await editor.page.keyboard.press(`${modifier}+a`);
    await editor.page.waitForTimeout(500);

    // Replace
    await editor.page.keyboard.type('middle-test');
    await editor.page.waitForTimeout(500);

    const contentAfter = await cmContent.textContent();
    expect(contentAfter?.trim()).toBe('middle-test');
  });
});
