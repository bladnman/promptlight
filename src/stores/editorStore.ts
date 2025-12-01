import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import type { Prompt, PromptMetadata, PromptIndex, FolderMetadata } from '../types';
import { DEFAULT_PROMPT_ICON, DEFAULT_PROMPT_COLOR } from '../config/constants';
import { useLauncherCacheStore } from './launcherCacheStore';

/** View type for the editor window */
export type EditorView = 'prompts' | 'settings';

interface EditorState {
  /** Current view in the editor window */
  currentView: EditorView;
  /** All prompts for sidebar list */
  prompts: PromptMetadata[];
  /** Available folders */
  folders: string[];
  /** Folder metadata (icon, color) */
  folderMeta: Record<string, FolderMetadata>;
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
  /** Search filter text for sidebar */
  searchFilter: string;
  /** Folder collapsed states - key is folder name */
  collapsedFolders: Record<string, boolean>;
  /** Whether the new folder input is visible */
  isAddingFolder: boolean;
  /** New folder name being typed */
  newFolderName: string;
  /** Folder being edited (for rename dialog) */
  editingFolder: string | null;
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
  /** Set the search filter */
  setSearchFilter: (filter: string) => void;
  /** Toggle folder collapsed state */
  toggleFolderCollapsed: (folder: string) => void;
  /** Start adding a new folder */
  startAddingFolder: () => void;
  /** Cancel adding a new folder */
  cancelAddingFolder: () => void;
  /** Set new folder name */
  setNewFolderName: (name: string) => void;
  /** Create the new folder */
  createFolder: () => Promise<boolean>;
  /** Create folder and select it in the editor */
  createFolderAndSelect: (name: string) => Promise<boolean>;
  /** Start editing a folder */
  startEditingFolder: (folder: string) => void;
  /** Cancel editing folder */
  cancelEditingFolder: () => void;
  /** Rename a folder */
  renameFolder: (oldName: string, newName: string) => Promise<boolean>;
  /** Delete a folder */
  deleteFolder: (name: string) => Promise<boolean>;
  /** Set the current view */
  setView: (view: EditorView) => void;
}

type EditorStore = EditorState & EditorActions;

const initialState: EditorState = {
  currentView: 'prompts',
  prompts: [],
  folders: ['uncategorized'],
  folderMeta: {},
  selectedPromptId: null,
  sidebarCollapsed: false,
  editedPrompt: null,
  isDirty: false,
  isSaving: false,
  isLoading: false,
  autoSaveStatus: 'idle',
  error: null,
  searchFilter: '',
  collapsedFolders: {},
  isAddingFolder: false,
  newFolderName: '',
  editingFolder: null,
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
  icon: DEFAULT_PROMPT_ICON,
  color: DEFAULT_PROMPT_COLOR,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,

  loadPrompts: async () => {
    try {
      const index = await invoke<PromptIndex>('get_index');
      set({
        prompts: index.prompts,
        folders: index.folders.length > 0 ? index.folders : ['uncategorized'],
        folderMeta: index.folderMeta || {},
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
      // ink-mde preserves whitespace natively, so save content as-is
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

      // Invalidate launcher cache so next panel open shows updated data
      useLauncherCacheStore.getState().invalidateAll();
      // Emit event for cross-window cache invalidation (launcher is separate webview)
      emit('cache-invalidate');

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

      // Invalidate launcher cache so next panel open shows updated data
      useLauncherCacheStore.getState().invalidateAll();
      // Emit event for cross-window cache invalidation (launcher is separate webview)
      emit('cache-invalidate');

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

  setSearchFilter: (filter) => {
    set({ searchFilter: filter });
  },

  toggleFolderCollapsed: (folder) => {
    set((state) => ({
      collapsedFolders: {
        ...state.collapsedFolders,
        [folder]: !state.collapsedFolders[folder],
      },
    }));
  },

  startAddingFolder: () => {
    set({ isAddingFolder: true, newFolderName: '' });
  },

  cancelAddingFolder: () => {
    set({ isAddingFolder: false, newFolderName: '' });
  },

  setNewFolderName: (name) => {
    set({ newFolderName: name });
  },

  createFolder: async () => {
    const { newFolderName, folders } = get();
    const folderName = newFolderName.trim().toLowerCase();

    if (!folderName) {
      set({ error: 'Folder name cannot be empty' });
      return false;
    }

    if (folders.includes(folderName)) {
      set({ error: 'Folder already exists' });
      return false;
    }

    try {
      await invoke('add_folder', { name: folderName });
      set({
        folders: [...folders, folderName],
        isAddingFolder: false,
        newFolderName: '',
      });
      return true;
    } catch (error) {
      console.error('Failed to create folder:', error);
      set({ error: String(error) });
      return false;
    }
  },

  createFolderAndSelect: async (name: string) => {
    const { folders, editedPrompt } = get();
    const folderName = name.trim().toLowerCase();

    if (!folderName) {
      set({ error: 'Folder name cannot be empty' });
      return false;
    }

    if (folders.includes(folderName)) {
      // Folder already exists, just select it
      if (editedPrompt) {
        set({
          editedPrompt: { ...editedPrompt, folder: folderName },
          isDirty: true,
        });
      }
      return true;
    }

    try {
      await invoke('add_folder', { name: folderName });
      const newFolders = [...folders, folderName];
      set({ folders: newFolders });

      // Also select the folder in the current prompt
      if (editedPrompt) {
        set({
          editedPrompt: { ...editedPrompt, folder: folderName },
          isDirty: true,
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to create folder:', error);
      set({ error: String(error) });
      return false;
    }
  },

  startEditingFolder: (folder: string) => {
    set({ editingFolder: folder });
  },

  cancelEditingFolder: () => {
    set({ editingFolder: null });
  },

  renameFolder: async (oldName: string, newName: string) => {
    const newFolder = newName.trim().toLowerCase();

    if (!newFolder) {
      set({ error: 'Folder name cannot be empty' });
      return false;
    }

    try {
      await invoke('rename_folder', { oldName, newName: newFolder });
      // Invalidate launcher cache since folder names affect display
      useLauncherCacheStore.getState().invalidateAll();
      // Emit event for cross-window cache invalidation (launcher is separate webview)
      emit('cache-invalidate');
      await get().loadPrompts();
      set({ editingFolder: null });
      return true;
    } catch (error) {
      console.error('Failed to rename folder:', error);
      set({ error: String(error) });
      return false;
    }
  },

  deleteFolder: async (name: string) => {
    try {
      await invoke('delete_folder', { name });
      // Invalidate launcher cache since prompts may have moved
      useLauncherCacheStore.getState().invalidateAll();
      // Emit event for cross-window cache invalidation (launcher is separate webview)
      emit('cache-invalidate');
      await get().loadPrompts();
      return true;
    } catch (error) {
      console.error('Failed to delete folder:', error);
      set({ error: String(error) });
      return false;
    }
  },

  setView: (view) => {
    set({ currentView: view });
  },
}));
