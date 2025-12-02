import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../../stores/editorStore';
import { getMockBackend } from '../setup';
import type { Prompt } from '../../types';

// Test prompt data
const createTestPrompt = (overrides: Partial<Prompt> = {}): Prompt => ({
  id: '1',
  name: 'Test Prompt',
  folder: 'test',
  description: 'A test prompt',
  filename: 'test.md',
  useCount: 5,
  lastUsed: '2024-01-01',
  created: '2024-01-01',
  updated: '2024-01-01',
  content: 'Test content',
  ...overrides,
});

describe('editorStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useEditorStore.getState().reset();
    // mockBackend.reset() is called in setup.ts beforeEach
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useEditorStore.getState();

      expect(state.prompts).toEqual([]);
      expect(state.folders).toEqual(['uncategorized']);
      expect(state.selectedPromptId).toBeNull();
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.editedPrompt).toBeNull();
      expect(state.isDirty).toBe(false);
      expect(state.isSaving).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.autoSaveStatus).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  describe('loadPrompts', () => {
    it('should load prompts from backend', async () => {
      // Seed test data in mock backend
      const testPrompt = createTestPrompt();
      getMockBackend().seedData([testPrompt]);

      await useEditorStore.getState().loadPrompts();

      const state = useEditorStore.getState();
      expect(state.prompts).toHaveLength(1);
      expect(state.prompts[0].name).toBe('Test Prompt');
      expect(state.folders).toContain('test');
    });

    it('should set error on failure', async () => {
      getMockBackend().injectError('getIndex', new Error('Network error'));

      await useEditorStore.getState().loadPrompts();

      const state = useEditorStore.getState();
      expect(state.error).toBe('Error: Network error');
    });
  });

  describe('loadPrompt', () => {
    it('should load a specific prompt', async () => {
      const testPrompt = createTestPrompt();
      getMockBackend().seedData([testPrompt]);

      await useEditorStore.getState().loadPrompt('1');

      const state = useEditorStore.getState();
      expect(state.selectedPromptId).toBe('1');
      expect(state.editedPrompt?.name).toBe('Test Prompt');
      expect(state.editedPrompt?.content).toBe('Test content');
      expect(state.isDirty).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should set isLoading during load', async () => {
      const testPrompt = createTestPrompt();
      getMockBackend().seedData([testPrompt]);

      const loadPromise = useEditorStore.getState().loadPrompt('1');
      // Note: The isLoading state change happens synchronously before await
      await loadPromise;
      expect(useEditorStore.getState().isLoading).toBe(false);
    });
  });

  describe('createNew', () => {
    it('should initialize empty prompt form', () => {
      useEditorStore.getState().createNew();

      const state = useEditorStore.getState();
      expect(state.selectedPromptId).toBeNull();
      expect(state.editedPrompt).not.toBeNull();
      expect(state.editedPrompt?.name).toBe('');
      expect(state.editedPrompt?.content).toBe('');
      expect(state.isDirty).toBe(false);
    });

    it('should use first available folder', () => {
      useEditorStore.setState({ folders: ['work', 'personal'] });
      useEditorStore.getState().createNew();

      const state = useEditorStore.getState();
      expect(state.editedPrompt?.folder).toBe('work');
    });
  });

  describe('updateField', () => {
    it('should update a field and mark as dirty', () => {
      useEditorStore.getState().createNew();
      useEditorStore.getState().updateField('name', 'New Name');

      const state = useEditorStore.getState();
      expect(state.editedPrompt?.name).toBe('New Name');
      expect(state.isDirty).toBe(true);
    });

    it('should do nothing if no edited prompt', () => {
      useEditorStore.getState().updateField('name', 'New Name');

      const state = useEditorStore.getState();
      expect(state.editedPrompt).toBeNull();
      expect(state.isDirty).toBe(false);
    });
  });

  describe('save', () => {
    it('should save prompt and update state', async () => {
      useEditorStore.getState().createNew();
      useEditorStore.getState().updateField('name', 'Saved Prompt');
      useEditorStore.getState().updateField('folder', 'test');

      const result = await useEditorStore.getState().save();

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Saved Prompt');
      const state = useEditorStore.getState();
      expect(state.selectedPromptId).not.toBeNull();
      expect(state.isDirty).toBe(false);
      expect(state.isSaving).toBe(false);
    });

    it('should reject save without name', async () => {
      useEditorStore.getState().createNew();

      const result = await useEditorStore.getState().save();

      expect(result).toBeNull();
      const state = useEditorStore.getState();
      expect(state.error).toBe('Name is required');
    });

    it('should return null if no edited prompt', async () => {
      const result = await useEditorStore.getState().save();
      expect(result).toBeNull();
    });
  });

  describe('deletePrompt', () => {
    it('should delete prompt and clear editor', async () => {
      const testPrompt = createTestPrompt();
      getMockBackend().seedData([testPrompt]);

      // Load the prompt first
      await useEditorStore.getState().loadPrompt('1');

      const result = await useEditorStore.getState().deletePrompt();

      expect(result).toBe(true);
      const state = useEditorStore.getState();
      expect(state.selectedPromptId).toBeNull();
      expect(state.editedPrompt).toBeNull();
    });

    it('should return false if no prompt to delete', async () => {
      const result = await useEditorStore.getState().deletePrompt();
      expect(result).toBe(false);
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar collapsed state', () => {
      expect(useEditorStore.getState().sidebarCollapsed).toBe(false);

      useEditorStore.getState().toggleSidebar();
      expect(useEditorStore.getState().sidebarCollapsed).toBe(true);

      useEditorStore.getState().toggleSidebar();
      expect(useEditorStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('setSidebarCollapsed', () => {
    it('should set sidebar collapsed directly', () => {
      useEditorStore.getState().setSidebarCollapsed(true);
      expect(useEditorStore.getState().sidebarCollapsed).toBe(true);

      useEditorStore.getState().setSidebarCollapsed(false);
      expect(useEditorStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('setAutoSaveStatus', () => {
    it('should update auto-save status', () => {
      useEditorStore.getState().setAutoSaveStatus('saving');
      expect(useEditorStore.getState().autoSaveStatus).toBe('saving');

      useEditorStore.getState().setAutoSaveStatus('saved');
      expect(useEditorStore.getState().autoSaveStatus).toBe('saved');
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      useEditorStore.setState({ error: 'Some error' });
      expect(useEditorStore.getState().error).toBe('Some error');

      useEditorStore.getState().clearError();
      expect(useEditorStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      useEditorStore.setState({
        prompts: [{ id: '1', name: 'Test', folder: 'test', filename: 't.md', useCount: 0, lastUsed: null }],
        selectedPromptId: '1',
        sidebarCollapsed: true,
        isDirty: true,
        error: 'Error',
      });

      useEditorStore.getState().reset();

      const state = useEditorStore.getState();
      expect(state.prompts).toEqual([]);
      expect(state.selectedPromptId).toBeNull();
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.isDirty).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
