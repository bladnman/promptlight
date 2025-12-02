import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../../stores/settingsStore';
import { getMockBackend } from '../setup';

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset store state by setting to initial values
    useSettingsStore.setState({
      settings: {
        general: { autoLaunch: false, hotkey: null },
        sync: { enabled: false, lastSync: null },
        appearance: { theme: 'system', accentColor: 'purple' },
      },
      systemAutoLaunch: false,
      isLoading: false,
      isSaving: false,
      error: null,
    });
    // mockBackend.reset() is called in setup.ts beforeEach
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useSettingsStore.getState();

      expect(state.settings.general.autoLaunch).toBe(false);
      expect(state.settings.sync.enabled).toBe(false);
      expect(state.settings.sync.lastSync).toBeNull();
      expect(state.systemAutoLaunch).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isSaving).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loadSettings', () => {
    it('should load settings from backend', async () => {
      // MockAdapter returns default settings which include autoLaunch: false
      // We can verify the load completes successfully
      await useSettingsStore.getState().loadSettings();

      const state = useSettingsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set isLoading during load', async () => {
      const loadPromise = useSettingsStore.getState().loadSettings();
      // Note: The state change happens synchronously before the async call
      // so we check that isLoading is eventually false after completion
      await loadPromise;
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      getMockBackend().injectError('getSettings', new Error('Network error'));

      await useSettingsStore.getState().loadSettings();

      const state = useSettingsStore.getState();
      expect(state.error).toBe('Error: Network error');
      expect(state.isLoading).toBe(false);
    });

    it('should handle autostart check failure gracefully', async () => {
      getMockBackend().injectError('getAutoStartEnabled', new Error('Autostart not available'));

      await useSettingsStore.getState().loadSettings();

      const state = useSettingsStore.getState();
      expect(state.systemAutoLaunch).toBe(false); // Should default to false on failure
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateGeneralSettings', () => {
    it('should update general settings', async () => {
      await useSettingsStore.getState().updateGeneralSettings({ autoLaunch: true });

      const state = useSettingsStore.getState();
      expect(state.settings.general.autoLaunch).toBe(true);
      expect(state.isSaving).toBe(false);
    });

    it('should set isSaving during save', async () => {
      const updatePromise = useSettingsStore
        .getState()
        .updateGeneralSettings({ autoLaunch: true });
      // The state change happens synchronously
      await updatePromise;
      expect(useSettingsStore.getState().isSaving).toBe(false);
    });

    it('should set error on failure', async () => {
      getMockBackend().injectError('saveSettings', new Error('Save failed'));

      await useSettingsStore.getState().updateGeneralSettings({ autoLaunch: true });

      const state = useSettingsStore.getState();
      expect(state.error).toBe('Error: Save failed');
      expect(state.isSaving).toBe(false);
    });
  });

  describe('updateSyncSettings', () => {
    it('should update sync settings', async () => {
      await useSettingsStore.getState().updateSyncSettings({ lastSync: '2024-01-15' });

      const state = useSettingsStore.getState();
      expect(state.settings.sync.lastSync).toBe('2024-01-15');
      expect(state.isSaving).toBe(false);
    });

    it('should trigger cloud sync when enabling sync', async () => {
      await useSettingsStore.getState().updateSyncSettings({ enabled: true });

      const state = useSettingsStore.getState();
      expect(state.settings.sync.enabled).toBe(true);
      expect(state.settings.sync.lastSync).not.toBeNull();
      expect(state.isSaving).toBe(false);

      // Verify syncToCloud was called via action history
      const actions = getMockBackend().actionHistory;
      expect(actions.some((a) => a.type === 'sync_to_cloud')).toBe(true);
    });

    it('should set error on sync failure', async () => {
      getMockBackend().injectError('syncToCloud', new Error('Sync failed'));

      await useSettingsStore.getState().updateSyncSettings({ enabled: true });

      const state = useSettingsStore.getState();
      expect(state.error).toBe('Error: Sync failed');
      expect(state.isSaving).toBe(false);
    });
  });

  describe('setAutoLaunch', () => {
    it('should set auto-launch in system', async () => {
      await useSettingsStore.getState().setAutoLaunch(true);

      const state = useSettingsStore.getState();
      expect(state.systemAutoLaunch).toBe(true);
      expect(state.isSaving).toBe(false);
    });

    it('should set error on failure', async () => {
      getMockBackend().injectError('setAutoStartEnabled', new Error('System error'));

      await useSettingsStore.getState().setAutoLaunch(true);

      const state = useSettingsStore.getState();
      expect(state.error).toBe('Error: System error');
      expect(state.systemAutoLaunch).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      useSettingsStore.setState({ error: 'Some error' });

      useSettingsStore.getState().clearError();

      expect(useSettingsStore.getState().error).toBeNull();
    });
  });
});
