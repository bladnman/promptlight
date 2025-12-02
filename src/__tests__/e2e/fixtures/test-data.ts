/**
 * Test data factory for E2E tests
 *
 * Provides helper functions to create test prompts and seed the mock backend.
 */

import type { Prompt } from '../../../types';

/** Create a test prompt with sensible defaults */
export function createTestPrompt(overrides: Partial<Prompt> = {}): Prompt {
  const id = overrides.id || `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  return {
    id,
    name: 'Test Prompt',
    description: 'A test prompt for E2E testing',
    folder: 'uncategorized',
    content: 'This is test content for the prompt.',
    filename: `${id}.md`,
    useCount: 0,
    lastUsed: null,
    created: now,
    updated: now,
    ...overrides,
  };
}

/** Sample prompts for common test scenarios */
export const samplePrompts = {
  /** A simple prompt with minimal content */
  simple: () =>
    createTestPrompt({
      name: 'Simple Prompt',
      description: 'A simple test prompt',
      content: 'Hello, world!',
    }),

  /** A prompt with markdown content */
  markdown: () =>
    createTestPrompt({
      name: 'Markdown Prompt',
      description: 'Prompt with markdown formatting',
      content: `# Heading

This is a paragraph with **bold** and *italic* text.

- Item 1
- Item 2
- Item 3

\`\`\`javascript
console.log('Hello');
\`\`\`
`,
    }),

  /** A code review prompt */
  codeReview: () =>
    createTestPrompt({
      name: 'Code Review',
      folder: 'development',
      description: 'Review code for issues',
      content: `Please review this code for:
1. Bugs and errors
2. Performance issues
3. Best practices
4. Security concerns

Provide specific suggestions for improvement.`,
    }),

  /** A frequently used prompt */
  frequentlyUsed: () =>
    createTestPrompt({
      name: 'Frequently Used',
      description: 'A commonly used prompt',
      content: 'This prompt is used often.',
      useCount: 50,
      lastUsed: new Date().toISOString(),
    }),

  /** A prompt with long content */
  longContent: () =>
    createTestPrompt({
      name: 'Long Content Prompt',
      description: 'Prompt with extensive content',
      content: Array(20)
        .fill(null)
        .map(
          (_, i) => `## Section ${i + 1}

This is paragraph ${i + 1} of the long content. It contains multiple sentences to simulate real-world prompts that users might create for complex tasks.

`
        )
        .join(''),
    }),
};

/** Create a set of prompts for a complete test scenario */
export function createTestScenario(): Prompt[] {
  return [
    createTestPrompt({
      id: 'prompt-1',
      name: 'Daily Standup',
      folder: 'work',
      description: 'Generate standup update',
      content: 'What did you work on yesterday? What are you working on today? Any blockers?',
      useCount: 30,
    }),
    createTestPrompt({
      id: 'prompt-2',
      name: 'Bug Report',
      folder: 'work',
      description: 'Create bug report template',
      content: `## Bug Description
[Describe the bug]

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]`,
      useCount: 15,
    }),
    createTestPrompt({
      id: 'prompt-3',
      name: 'Email Draft',
      folder: 'personal',
      description: 'Professional email template',
      content: 'Write a professional email about [topic] to [recipient].',
      useCount: 25,
    }),
    createTestPrompt({
      id: 'prompt-4',
      name: 'Code Documentation',
      folder: 'development',
      description: 'Generate code docs',
      content: 'Generate documentation for the following code:\n\n```\n[code here]\n```',
      useCount: 10,
    }),
    createTestPrompt({
      id: 'prompt-5',
      name: 'Meeting Notes',
      folder: 'work',
      description: 'Summarize meeting notes',
      content: 'Summarize the following meeting notes into action items and key decisions:',
      useCount: 20,
    }),
  ];
}
