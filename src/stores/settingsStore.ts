import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import {
  ACCENT_COLORS,
  type AccentColorName,
  type ThemeOption,
  DEFAULT_THEME,
  DEFAULT_ACCENT_COLOR,
} from '../config/constants';

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

/** Appearance settings */
export interface AppearanceSettings {
  theme: ThemeOption;
  accentColor: AccentColorName;
}

/** Complete application settings */
export interface AppSettings {
  general: GeneralSettings;
  sync: SyncSettings;
  appearance: AppearanceSettings;
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
  /** Update appearance settings */
  updateAppearanceSettings: (updates: Partial<AppearanceSettings>) => Promise<void>;
  /** Set auto-launch enabled/disabled */
  setAutoLaunch: (enabled: boolean) => Promise<void>;
  /** Set global hotkey (null to disable) */
  setHotkey: (hotkey: string | null) => Promise<void>;
  /** Set theme */
  setTheme: (theme: ThemeOption) => Promise<void>;
  /** Set accent color */
  setAccentColor: (accentColor: AccentColorName) => Promise<void>;
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
  appearance: {
    theme: DEFAULT_THEME,
    accentColor: DEFAULT_ACCENT_COLOR,
  },
};

/** Apply theme and accent color to document root */
function applyAppearance(theme: ThemeOption, accentColor: AccentColorName) {
  const root = document.documentElement;

  // Apply theme
  root.setAttribute('data-theme', theme);

  // Apply accent color CSS variables
  const accent = ACCENT_COLORS[accentColor];
  root.style.setProperty('--accent-primary', accent.primary);
  root.style.setProperty('--accent-secondary', accent.secondary);
  root.style.setProperty('--accent-muted', accent.muted);
  root.style.setProperty('--accent-subtle', accent.subtle);
  root.style.setProperty('--pill-bg', accent.pill);
  root.style.setProperty('--pill-text', accent.pillText);
  root.style.setProperty('--border-focus', accent.primary);
  root.style.setProperty('--text-accent', accent.primary);
  root.style.setProperty('--selection-bg', accent.subtle);
}

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
      // Ensure appearance has defaults if missing (backwards compat)
      const normalizedSettings: AppSettings = {
        ...settings,
        appearance: {
          theme: settings.appearance?.theme ?? DEFAULT_THEME,
          accentColor: settings.appearance?.accentColor ?? DEFAULT_ACCENT_COLOR,
        },
      };
      // Apply appearance immediately
      applyAppearance(normalizedSettings.appearance.theme, normalizedSettings.appearance.accentColor);
      set({
        settings: normalizedSettings,
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

  updateAppearanceSettings: async (updates) => {
    const { settings } = get();
    const newAppearance = { ...settings.appearance, ...updates };
    const newSettings: AppSettings = {
      ...settings,
      appearance: newAppearance,
    };

    // Apply appearance immediately for instant feedback
    applyAppearance(newAppearance.theme, newAppearance.accentColor);

    set({ isSaving: true, error: null });
    try {
      await invoke('save_settings', { settings: newSettings });
      set({ settings: newSettings, isSaving: false });
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Revert appearance on error
      applyAppearance(settings.appearance.theme, settings.appearance.accentColor);
      set({ error: String(error), isSaving: false });
    }
  },

  setTheme: async (theme) => {
    const { updateAppearanceSettings } = get();
    await updateAppearanceSettings({ theme });
  },

  setAccentColor: async (accentColor) => {
    const { updateAppearanceSettings } = get();
    await updateAppearanceSettings({ accentColor });
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
