import { describe, it, expect, beforeEach } from 'vitest';
import { useLauncherStore } from '../../stores/launcherStore';
import type { SearchResult, PromptMetadata } from '../../types';

// Helper to create mock search results
function createMockResult(id: string, name: string): SearchResult {
  return {
    prompt: {
      id,
      name,
      folder: 'test',
      description: '',
      filename: `${id}.md`,
      useCount: 0,
      lastUsed: null,
      created: '2024-01-01',
      updated: '2024-01-01',
    },
    score: 1.0,
  };
}

describe('launcherStore', () => {
  beforeEach(() => {
    useLauncherStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useLauncherStore.getState();

      expect(state.mode).toBe('search');
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
      expect(state.selectedIndex).toBe(0);
      expect(state.promotedPrompt).toBeNull();
      expect(state.riderText).toBe('');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setQuery', () => {
    it('should set query and reset selected index', () => {
      useLauncherStore.setState({ selectedIndex: 5 });
      useLauncherStore.getState().setQuery('test query');

      const state = useLauncherStore.getState();
      expect(state.query).toBe('test query');
      expect(state.selectedIndex).toBe(0);
    });
  });

  describe('setResults', () => {
    it('should set results and reset selected index', () => {
      const results = [createMockResult('1', 'Test 1'), createMockResult('2', 'Test 2')];
      useLauncherStore.setState({ selectedIndex: 5 });
      useLauncherStore.getState().setResults(results);

      const state = useLauncherStore.getState();
      expect(state.results).toHaveLength(2);
      expect(state.selectedIndex).toBe(0);
    });
  });

  describe('selectNext', () => {
    it('should increment selected index', () => {
      const results = [
        createMockResult('1', 'Test 1'),
        createMockResult('2', 'Test 2'),
        createMockResult('3', 'Test 3'),
      ];
      useLauncherStore.setState({ results, selectedIndex: 0 });

      useLauncherStore.getState().selectNext();
      expect(useLauncherStore.getState().selectedIndex).toBe(1);

      useLauncherStore.getState().selectNext();
      expect(useLauncherStore.getState().selectedIndex).toBe(2);
    });

    it('should not exceed results length', () => {
      const results = [createMockResult('1', 'Test 1'), createMockResult('2', 'Test 2')];
      useLauncherStore.setState({ results, selectedIndex: 1 });

      useLauncherStore.getState().selectNext();
      expect(useLauncherStore.getState().selectedIndex).toBe(1);
    });

    it('should do nothing with empty results', () => {
      useLauncherStore.setState({ results: [], selectedIndex: 0 });

      useLauncherStore.getState().selectNext();
      expect(useLauncherStore.getState().selectedIndex).toBe(0);
    });
  });

  describe('selectPrevious', () => {
    it('should decrement selected index', () => {
      const results = [createMockResult('1', 'Test 1'), createMockResult('2', 'Test 2')];
      useLauncherStore.setState({ results, selectedIndex: 1 });

      useLauncherStore.getState().selectPrevious();
      expect(useLauncherStore.getState().selectedIndex).toBe(0);
    });

    it('should not go below zero', () => {
      const results = [createMockResult('1', 'Test 1')];
      useLauncherStore.setState({ results, selectedIndex: 0 });

      useLauncherStore.getState().selectPrevious();
      expect(useLauncherStore.getState().selectedIndex).toBe(0);
    });
  });

  describe('setSelectedIndex', () => {
    it('should set index directly', () => {
      useLauncherStore.getState().setSelectedIndex(5);
      expect(useLauncherStore.getState().selectedIndex).toBe(5);
    });
  });

  describe('promoteSelected', () => {
    it('should promote selected result', () => {
      const results = [createMockResult('1', 'Test 1'), createMockResult('2', 'Test 2')];
      useLauncherStore.setState({ results, selectedIndex: 1 });

      useLauncherStore.getState().promoteSelected();

      const state = useLauncherStore.getState();
      expect(state.mode).toBe('promoted');
      expect(state.promotedPrompt?.id).toBe('2');
      expect(state.riderText).toBe('');
    });

    it('should do nothing with no results', () => {
      useLauncherStore.setState({ results: [], selectedIndex: 0 });

      useLauncherStore.getState().promoteSelected();

      expect(useLauncherStore.getState().mode).toBe('search');
      expect(useLauncherStore.getState().promotedPrompt).toBeNull();
    });
  });

  describe('unpromote', () => {
    it('should return to search mode', () => {
      const mockPrompt: PromptMetadata = {
        id: '1',
        name: 'Test',
        folder: 'test',
        description: '',
        filename: 'test.md',
        useCount: 0,
        lastUsed: null,
        created: '2024-01-01',
        updated: '2024-01-01',
      };

      useLauncherStore.setState({
        mode: 'promoted',
        promotedPrompt: mockPrompt,
        riderText: 'some text',
      });

      useLauncherStore.getState().unpromote();

      const state = useLauncherStore.getState();
      expect(state.mode).toBe('search');
      expect(state.promotedPrompt).toBeNull();
      expect(state.riderText).toBe('');
    });
  });

  describe('setRiderText', () => {
    it('should set rider text', () => {
      useLauncherStore.getState().setRiderText('additional context');
      expect(useLauncherStore.getState().riderText).toBe('additional context');
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useLauncherStore.getState().setLoading(true);
      expect(useLauncherStore.getState().isLoading).toBe(true);

      useLauncherStore.getState().setLoading(false);
      expect(useLauncherStore.getState().isLoading).toBe(false);
    });
  });

  describe('getFinalText', () => {
    it('should return selected prompt name in search mode', () => {
      const results = [createMockResult('1', 'Test Prompt')];
      useLauncherStore.setState({ results, selectedIndex: 0 });

      expect(useLauncherStore.getState().getFinalText()).toBe('Test Prompt');
    });

    it('should return empty string with no selection', () => {
      useLauncherStore.setState({ results: [], selectedIndex: 0 });
      expect(useLauncherStore.getState().getFinalText()).toBe('');
    });

    it('should return promoted prompt name in promoted mode', () => {
      const mockPrompt: PromptMetadata = {
        id: '1',
        name: 'Promoted Prompt',
        folder: 'test',
        description: '',
        filename: 'test.md',
        useCount: 0,
        lastUsed: null,
        created: '2024-01-01',
        updated: '2024-01-01',
      };

      useLauncherStore.setState({
        mode: 'promoted',
        promotedPrompt: mockPrompt,
        riderText: '',
      });

      expect(useLauncherStore.getState().getFinalText()).toBe('Promoted Prompt');
    });

    it('should include rider text in promoted mode', () => {
      const mockPrompt: PromptMetadata = {
        id: '1',
        name: 'Promoted',
        folder: 'test',
        description: '',
        filename: 'test.md',
        useCount: 0,
        lastUsed: null,
        created: '2024-01-01',
        updated: '2024-01-01',
      };

      useLauncherStore.setState({
        mode: 'promoted',
        promotedPrompt: mockPrompt,
        riderText: 'extra context',
      });

      expect(useLauncherStore.getState().getFinalText()).toBe('Promoted extra context');
    });
  });

  describe('getSelectedResult', () => {
    it('should return selected result', () => {
      const results = [createMockResult('1', 'Test 1'), createMockResult('2', 'Test 2')];
      useLauncherStore.setState({ results, selectedIndex: 1 });

      const selected = useLauncherStore.getState().getSelectedResult();
      expect(selected?.prompt.id).toBe('2');
    });

    it('should return null with no results', () => {
      useLauncherStore.setState({ results: [], selectedIndex: 0 });
      expect(useLauncherStore.getState().getSelectedResult()).toBeNull();
    });

    it('should return null with invalid index', () => {
      const results = [createMockResult('1', 'Test')];
      useLauncherStore.setState({ results, selectedIndex: 5 });
      expect(useLauncherStore.getState().getSelectedResult()).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      useLauncherStore.setState({
        mode: 'promoted',
        query: 'test',
        results: [createMockResult('1', 'Test')],
        selectedIndex: 5,
        promotedPrompt: { id: '1', name: 'Test', folder: 'test', description: '', filename: 't.md', useCount: 0, lastUsed: null, created: '', updated: '' },
        riderText: 'rider',
        isLoading: true,
      });

      useLauncherStore.getState().reset();

      const state = useLauncherStore.getState();
      expect(state.mode).toBe('search');
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
      expect(state.selectedIndex).toBe(0);
      expect(state.promotedPrompt).toBeNull();
      expect(state.riderText).toBe('');
      expect(state.isLoading).toBe(false);
    });
  });
});
