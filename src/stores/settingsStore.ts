import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

/** General application settings */
export interface GeneralSettings {
  autoLaunch: boolean;
  /** Global hotkey to summon the launcher (e.g., "CommandOrControl+Shift+Space") */
  hotkey: string | null;
}

/** Cloud sync settings */
export interface SyncSettings {
  enabled: boolean;
  lastSync: string | null;
}

/** Complete application settings */
export interface AppSettings {
  general: GeneralSettings;
  sync: SyncSettings;
}

interface SettingsState {
  /** Current settings */
  settings: AppSettings;
  /** Actual system auto-launch state */
  systemAutoLaunch: boolean;
  /** Whether settings are loading */
  isLoading: boolean;
  /** Whether settings are being saved */
  isSaving: boolean;
  /** Error message */
  error: string | null;
}

interface SettingsActions {
  /** Load settings from backend */
  loadSettings: () => Promise<void>;
  /** Update general settings */
  updateGeneralSettings: (updates: Partial<GeneralSettings>) => Promise<void>;
  /** Update sync settings */
  updateSyncSettings: (updates: Partial<SyncSettings>) => Promise<void>;
  /** Set auto-launch enabled/disabled */
  setAutoLaunch: (enabled: boolean) => Promise<void>;
  /** Set global hotkey (null to disable) */
  setHotkey: (hotkey: string | null) => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const defaultSettings: AppSettings = {
  general: {
    autoLaunch: false,
    hotkey: 'CommandOrControl+Shift+Space',
  },
  sync: {
    enabled: false,
    lastSync: null,
  },
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  systemAutoLaunch: false,
  isLoading: false,
  isSaving: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const [settings, autoLaunchEnabled] = await Promise.all([
        invoke<AppSettings>('get_settings'),
        invoke<boolean>('get_autostart_enabled').catch(() => false),
      ]);
      set({
        settings,
        systemAutoLaunch: autoLaunchEnabled,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ error: String(error), isLoading: false });
    }
  },

  updateGeneralSettings: async (updates) => {
    const { settings } = get();
    const newSettings: AppSettings = {
      ...settings,
      general: { ...settings.general, ...updates },
    };

    set({ isSaving: true, error: null });
    try {
      await invoke('save_settings', { settings: newSettings });
      set({ settings: newSettings, isSaving: false });
    } catch (error) {
      console.error('Failed to save settings:', error);
      set({ error: String(error), isSaving: false });
    }
  },

  updateSyncSettings: async (updates) => {
    const { settings } = get();
    const newSettings: AppSettings = {
      ...settings,
      sync: { ...settings.sync, ...updates },
    };

    set({ isSaving: true, error: null });
    try {
      await invoke('save_settings', { settings: newSettings });

      // If sync was just enabled, trigger initial sync to cloud
      if (updates.enabled === true && !settings.sync.enabled) {
        console.log('Sync enabled - uploading prompts to cloud...');
        await invoke('sync_to_cloud');
        // Update lastSync timestamp
        const syncedSettings: AppSettings = {
          ...newSettings,
          sync: { ...newSettings.sync, lastSync: new Date().toISOString() },
        };
        await invoke('save_settings', { settings: syncedSettings });
        set({ settings: syncedSettings, isSaving: false });
      } else {
        set({ settings: newSettings, isSaving: false });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      set({ error: String(error), isSaving: false });
    }
  },

  setAutoLaunch: async (enabled) => {
    set({ isSaving: true, error: null });
    try {
      await invoke('set_autostart_enabled', { enabled });
      set({ systemAutoLaunch: enabled, isSaving: false });
    } catch (error) {
      console.error('Failed to set auto-launch:', error);
      set({ error: String(error), isSaving: false });
    }
  },

  setHotkey: async (hotkey) => {
    const { settings } = get();
    set({ isSaving: true, error: null });
    try {
      // Call the backend to register/unregister the hotkey
      await invoke('set_hotkey', { hotkey });
      // Update local state
      const newSettings: AppSettings = {
        ...settings,
        general: { ...settings.general, hotkey },
      };
      set({ settings: newSettings, isSaving: false });
    } catch (error) {
      console.error('Failed to set hotkey:', error);
      set({ error: String(error), isSaving: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
