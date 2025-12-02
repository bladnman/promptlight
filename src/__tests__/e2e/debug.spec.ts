/**
 * Debug test to see what's being rendered
 */

import { test } from '@playwright/test';
import { LauncherPage } from './pages/LauncherPage';
import { createTestScenario } from './fixtures/test-data';

test('debug - see what is rendered', async ({ page }) => {
  // Capture console logs
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    consoleLogs.push(`PAGE ERROR: ${err.message}`);
  });

  const launcher = new LauncherPage(page);
  await launcher.goto();

  // Wait for app to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Log initial state
  console.log('=== BEFORE SEEDING ===');
  const emptyStateVisible = await launcher.emptyState.isVisible().catch(() => false);
  console.log('Empty state visible:', emptyStateVisible);

  // Seed data
  const prompts = createTestScenario();
  console.log('Seeding prompts:', prompts.length);
  await launcher.seedPrompts(prompts);

  // Check if data was seeded
  const promptCount = await page.evaluate(() => {
    const mockBackend = (window as unknown as { __mockBackend?: { prompts?: { size: number } } }).__mockBackend;
    // Access private prompts map via any
    const adapter = mockBackend as unknown as { prompts?: Map<string, unknown> };
    return adapter.prompts?.size ?? 0;
  });
  console.log('Prompts in mock after seeding:', promptCount);

  // Now trigger search
  console.log('Triggering search...');
  await launcher.search('');
  await page.waitForTimeout(500);

  // Check what's visible
  const resultsListVisible = await launcher.resultsList.isVisible().catch(() => false);
  const resultCount = await launcher.getResultCount();
  console.log('=== AFTER SEARCH ===');
  console.log('Results list visible:', resultsListVisible);
  console.log('Result count:', resultCount);

  // Check what test IDs are present
  const testIds = await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-testid]');
    return Array.from(elements).map(el => el.getAttribute('data-testid'));
  });
  console.log('Test IDs found:', testIds);

  // Print console logs
  console.log('Console logs:', consoleLogs);
});
