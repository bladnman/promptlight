import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Prompt, PromptMetadata, PromptIndex } from '../types';

interface EditorState {
  /** All prompts for sidebar list */
  prompts: PromptMetadata[];
  /** Available folders */
  folders: string[];
  /** Currently selected prompt ID in sidebar */
  selectedPromptId: string | null;
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Currently editing prompt data */
  editedPrompt: Prompt | null;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Save in progress */
  isSaving: boolean;
  /** Loading in progress */
  isLoading: boolean;
  /** Auto-save status */
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  /** Error message */
  error: string | null;
}

interface EditorActions {
  /** Load all prompts for sidebar */
  loadPrompts: () => Promise<void>;
  /** Load a specific prompt into editor */
  loadPrompt: (id: string) => Promise<void>;
  /** Initialize new prompt form */
  createNew: () => void;
  /** Update a field in the edited prompt */
  updateField: <K extends keyof Prompt>(field: K, value: Prompt[K]) => void;
  /** Save the current prompt */
  save: () => Promise<PromptMetadata | null>;
  /** Delete the current prompt */
  deletePrompt: () => Promise<boolean>;
  /** Toggle sidebar visibility */
  toggleSidebar: () => void;
  /** Set sidebar collapsed state */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Set auto-save status */
  setAutoSaveStatus: (status: EditorState['autoSaveStatus']) => void;
  /** Clear error */
  clearError: () => void;
  /** Reset store */
  reset: () => void;
}

type EditorStore = EditorState & EditorActions;

const initialState: EditorState = {
  prompts: [],
  folders: ['uncategorized'],
  selectedPromptId: null,
  sidebarCollapsed: false,
  editedPrompt: null,
  isDirty: false,
  isSaving: false,
  isLoading: false,
  autoSaveStatus: 'idle',
  error: null,
};

const emptyPrompt: Prompt = {
  id: '',
  name: '',
  folder: 'uncategorized',
  description: '',
  filename: '',
  useCount: 0,
  lastUsed: null,
  created: '',
  updated: '',
  content: '',
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,

  loadPrompts: async () => {
    try {
      const index = await invoke<PromptIndex>('get_index');
      set({
        prompts: index.prompts,
        folders: index.folders.length > 0 ? index.folders : ['uncategorized'],
      });
    } catch (error) {
      console.error('Failed to load prompts:', error);
      set({ error: String(error) });
    }
  },

  loadPrompt: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const prompt = await invoke<Prompt>('get_prompt', { id });
      set({
        selectedPromptId: id,
        editedPrompt: prompt,
        isDirty: false,
        isLoading: false,
        autoSaveStatus: 'idle',
      });
    } catch (error) {
      console.error('Failed to load prompt:', error);
      set({
        error: String(error),
        isLoading: false,
      });
    }
  },

  createNew: () => {
    const { folders } = get();
    set({
      selectedPromptId: null,
      editedPrompt: {
        ...emptyPrompt,
        folder: folders[0] || 'uncategorized',
      },
      isDirty: false,
      autoSaveStatus: 'idle',
      error: null,
    });
  },

  updateField: (field, value) => {
    const { editedPrompt } = get();
    if (!editedPrompt) return;

    set({
      editedPrompt: { ...editedPrompt, [field]: value },
      isDirty: true,
      autoSaveStatus: 'idle',
    });
  },

  save: async () => {
    const { editedPrompt } = get();
    if (!editedPrompt) return null;

    if (!editedPrompt.name.trim()) {
      set({ error: 'Name is required' });
      return null;
    }

    set({ isSaving: true, autoSaveStatus: 'saving', error: null });

    try {
      const saved = await invoke<PromptMetadata>('save_prompt', {
        prompt: editedPrompt,
      });

      // Update the edited prompt with saved metadata
      set({
        editedPrompt: { ...editedPrompt, ...saved },
        selectedPromptId: saved.id,
        isDirty: false,
        isSaving: false,
        autoSaveStatus: 'saved',
      });

      // Refresh prompts list
      get().loadPrompts();

      // Reset auto-save status after a delay
      setTimeout(() => {
        set({ autoSaveStatus: 'idle' });
      }, 2000);

      return saved;
    } catch (error) {
      console.error('Failed to save prompt:', error);
      set({
        error: String(error),
        isSaving: false,
        autoSaveStatus: 'error',
      });
      return null;
    }
  },

  deletePrompt: async () => {
    const { editedPrompt, selectedPromptId } = get();
    const idToDelete = editedPrompt?.id || selectedPromptId;

    if (!idToDelete) return false;

    try {
      await invoke('delete_prompt', { id: idToDelete });

      // Clear editor and refresh list
      set({
        selectedPromptId: null,
        editedPrompt: null,
        isDirty: false,
      });

      // Refresh prompts list
      get().loadPrompts();

      return true;
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      set({ error: String(error) });
      return false;
    }
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },

  setAutoSaveStatus: (status) => {
    set({ autoSaveStatus: status });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
