import { test, expect } from '@playwright/test';

test.describe('ink-mde Whitespace Preservation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?window=test');
    // Wait for ink-mde to initialize
    await page.waitForSelector('.ink-mde');
  });

  test('should preserve trailing newlines', async ({ page }) => {
    const editor = page.locator('.ink-mde .cm-content');

    // Click to focus the editor
    await editor.click();

    // Type text with trailing newlines
    await page.keyboard.type('Hello World');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');

    // Check the JSON output shows exactly 3 trailing newlines
    const jsonOutput = page.locator('pre').nth(1);
    const content = await jsonOutput.textContent();

    // The JSON should end with \n\n\n"
    expect(content).toContain('"Hello World\\n\\n\\n"');
  });

  test('should preserve consecutive blank lines in middle of content', async ({ page }) => {
    const editor = page.locator('.ink-mde .cm-content');

    await editor.click();

    // Type: Line 1, blank, blank, Line 2
    await page.keyboard.type('Line 1');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Line 2');

    // Verify the blank lines are preserved
    const jsonOutput = page.locator('pre').nth(1);
    const content = await jsonOutput.textContent();

    // Should have Line 1\n\n\nLine 2
    expect(content).toContain('"Line 1\\n\\n\\nLine 2"');
  });

  test('should preserve whitespace after cursor leaves and returns', async ({ page }) => {
    const editor = page.locator('.ink-mde .cm-content');

    await editor.click();

    // Type content with trailing newlines
    await page.keyboard.type('Test content');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');

    // Click outside the editor (on the debug panel)
    await page.locator('h3').first().click();

    // Wait a moment
    await page.waitForTimeout(100);

    // Click back into editor
    await editor.click();

    // Verify content is still preserved
    const jsonOutput = page.locator('pre').nth(1);
    const content = await jsonOutput.textContent();

    expect(content).toContain('"Test content\\n\\n"');
  });

  test('should handle multiple paragraph breaks correctly', async ({ page }) => {
    const editor = page.locator('.ink-mde .cm-content');

    await editor.click();

    // Create multiple paragraphs with varying gaps
    await page.keyboard.type('Paragraph 1');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Paragraph 2');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Paragraph 3');

    const jsonOutput = page.locator('pre').nth(1);
    const content = await jsonOutput.textContent();

    // Should preserve: 2 newlines, then 4 newlines
    expect(content).toContain('Paragraph 1\\n\\nParagraph 2\\n\\n\\n\\nParagraph 3');
  });

  test('should count trailing newlines correctly in stats', async ({ page }) => {
    const editor = page.locator('.ink-mde .cm-content');

    await editor.click();

    await page.keyboard.type('Some text');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');

    // Check the JSON output shows 5 trailing newlines
    const jsonOutput = page.locator('pre').nth(1);
    const content = await jsonOutput.textContent();
    // Count the \n at the end
    expect(content).toMatch(/\\n\\n\\n\\n\\n"/);
  });

  test('should preserve leading spaces on lines', async ({ page }) => {
    const editor = page.locator('.ink-mde .cm-content');

    await editor.click();

    // Type indented content (using 4 spaces for indentation)
    await page.keyboard.type('Normal line');
    await page.keyboard.press('Enter');
    await page.keyboard.type('    Indented line');

    const jsonOutput = page.locator('pre').nth(1);
    const content = await jsonOutput.textContent();

    // The 4 leading spaces should be preserved
    expect(content).toContain('Normal line\\n    Indented line');
  });

  test('should handle Cmd+B for bold formatting', async ({ page }) => {
    const editor = page.locator('.ink-mde .cm-content');

    await editor.click();

    // Type some text
    await page.keyboard.type('hello');

    // Select 'hello' (Cmd+A to select all since it's the only content)
    await page.keyboard.press('Meta+a');

    // Apply bold
    await page.keyboard.press('Meta+b');

    // Check that markdown bold syntax was added
    const jsonOutput = page.locator('pre').nth(1);
    const content = await jsonOutput.textContent();

    expect(content).toContain('**hello**');
  });

  test('should handle Cmd+I for italic formatting', async ({ page }) => {
    const editor = page.locator('.ink-mde .cm-content');

    await editor.click();

    // Type some text
    await page.keyboard.type('world');

    // Select all
    await page.keyboard.press('Meta+a');

    // Apply italic
    await page.keyboard.press('Meta+i');

    // Check that markdown italic syntax was added
    const jsonOutput = page.locator('pre').nth(1);
    const content = await jsonOutput.textContent();

    expect(content).toContain('*world*');
  });
});
