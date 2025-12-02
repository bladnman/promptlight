import { create } from 'zustand';
import type { LauncherState, SearchResult, ContextMenuState } from '../types';

interface LauncherActions {
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Set search results */
  setResults: (results: SearchResult[]) => void;
  /** Select the next result */
  selectNext: () => void;
  /** Select the previous result */
  selectPrevious: () => void;
  /** Set selected index directly */
  setSelectedIndex: (index: number) => void;
  /** Promote the selected prompt */
  promoteSelected: () => void;
  /** Unpromote and return to search mode */
  unpromote: () => void;
  /** Set rider text */
  setRiderText: (text: string) => void;
  /** Execute the selected/promoted prompt */
  executeSelected: () => void;
  /** Set the execute handler */
  setExecuteHandler: (handler: () => void) => void;
  /** Reset state */
  reset: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Get the final text to paste */
  getFinalText: () => string;
  /** Get currently selected result */
  getSelectedResult: () => SearchResult | null;
  /** Open context menu */
  openContextMenu: (x: number, y: number, promptId?: string, promptName?: string) => void;
  /** Close context menu */
  closeContextMenu: () => void;
}

type LauncherStore = LauncherState & LauncherActions;

const initialContextMenu: ContextMenuState = {
  isOpen: false,
  x: 0,
  y: 0,
  promptId: null,
  promptName: null,
};

const initialState: LauncherState = {
  mode: 'search',
  query: '',
  results: [],
  selectedIndex: 0,
  promotedPrompt: null,
  riderText: '',
  isLoading: false,
  contextMenu: initialContextMenu,
};

export const useLauncherStore = create<LauncherStore>((set, get) => ({
  ...initialState,

  setQuery: (query) => {
    set({ query, selectedIndex: 0 });
  },

  setResults: (results) => {
    set({ results, selectedIndex: 0 });
  },

  selectNext: () => {
    const { results, selectedIndex } = get();
    if (results.length === 0) return;
    set({
      selectedIndex: Math.min(selectedIndex + 1, results.length - 1),
    });
  },

  selectPrevious: () => {
    const { selectedIndex } = get();
    set({
      selectedIndex: Math.max(selectedIndex - 1, 0),
    });
  },

  setSelectedIndex: (index) => {
    set({ selectedIndex: index });
  },

  promoteSelected: () => {
    const { results, selectedIndex } = get();
    const selected = results[selectedIndex];
    if (!selected) return;

    set({
      mode: 'promoted',
      promotedPrompt: selected.prompt,
      riderText: '',
    });
  },

  unpromote: () => {
    set({
      mode: 'search',
      promotedPrompt: null,
      riderText: '',
    });
  },

  setRiderText: (riderText) => {
    set({ riderText });
  },

  _executeHandler: null as (() => void) | null,

  executeSelected: () => {
    const handler = (get() as any)._executeHandler;
    if (handler) {
      handler();
    } else {
      console.log('No execute handler set');
    }
  },

  setExecuteHandler: (handler: () => void) => {
    set({ _executeHandler: handler } as any);
  },

  reset: () => {
    set(initialState);
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  getFinalText: () => {
    const { mode, results, selectedIndex, promotedPrompt, riderText } = get();

    if (mode === 'promoted' && promotedPrompt) {
      // In promoted mode, we need to get the full content
      // For now, return the name + rider (content will be loaded)
      return riderText ? `${promotedPrompt.name} ${riderText}` : promotedPrompt.name;
    }

    const selected = results[selectedIndex];
    if (!selected) return '';

    return selected.prompt.name;
  },

  getSelectedResult: () => {
    const { results, selectedIndex } = get();
    return results[selectedIndex] ?? null;
  },

  openContextMenu: (x, y, promptId, promptName) => {
    set({
      contextMenu: {
        isOpen: true,
        x,
        y,
        promptId: promptId ?? null,
        promptName: promptName ?? null,
      },
    });
  },

  closeContextMenu: () => {
    set({ contextMenu: initialContextMenu });
  },
}));
