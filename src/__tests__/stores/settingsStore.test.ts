import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, type AppSettings } from '../../stores/settingsStore';
import { getMockInvoke } from '../setup';

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset store state by setting to initial values
    useSettingsStore.setState({
      settings: {
        general: { autoLaunch: false },
        sync: { enabled: false, lastSync: null },
      },
      systemAutoLaunch: false,
      isLoading: false,
      isSaving: false,
      error: null,
    });
    getMockInvoke().mockReset();
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
      const mockSettings: AppSettings = {
        general: { autoLaunch: true },
        sync: { enabled: true, lastSync: '2024-01-15T10:00:00Z' },
      };

      getMockInvoke()
        .mockResolvedValueOnce(mockSettings) // get_settings
        .mockResolvedValueOnce(true); // get_autostart_enabled

      await useSettingsStore.getState().loadSettings();

      const state = useSettingsStore.getState();
      expect(state.settings.general.autoLaunch).toBe(true);
      expect(state.settings.sync.enabled).toBe(true);
      expect(state.systemAutoLaunch).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should set isLoading during load', async () => {
      getMockInvoke()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({}), 50)));

      const loadPromise = useSettingsStore.getState().loadSettings();
      expect(useSettingsStore.getState().isLoading).toBe(true);

      await loadPromise;
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      // Promise.all runs both invokes in parallel, so both need mocks
      getMockInvoke()
        .mockRejectedValueOnce(new Error('Network error')) // get_settings
        .mockResolvedValueOnce(false); // get_autostart_enabled

      await useSettingsStore.getState().loadSettings();

      const state = useSettingsStore.getState();
      expect(state.error).toBe('Error: Network error');
      expect(state.isLoading).toBe(false);
    });

    it('should handle autostart check failure gracefully', async () => {
      const mockSettings: AppSettings = {
        general: { autoLaunch: false },
        sync: { enabled: false, lastSync: null },
      };

      getMockInvoke()
        .mockResolvedValueOnce(mockSettings) // get_settings
        .mockRejectedValueOnce(new Error('Autostart not available')); // get_autostart_enabled fails

      await useSettingsStore.getState().loadSettings();

      const state = useSettingsStore.getState();
      expect(state.systemAutoLaunch).toBe(false); // Should default to false on failure
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateGeneralSettings', () => {
    it('should update general settings', async () => {
      getMockInvoke().mockResolvedValueOnce(undefined); // save_settings

      await useSettingsStore.getState().updateGeneralSettings({ autoLaunch: true });

      const state = useSettingsStore.getState();
      expect(state.settings.general.autoLaunch).toBe(true);
      expect(state.isSaving).toBe(false);
    });

    it('should set isSaving during save', async () => {
      getMockInvoke().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
      );

      const updatePromise = useSettingsStore
        .getState()
        .updateGeneralSettings({ autoLaunch: true });
      expect(useSettingsStore.getState().isSaving).toBe(true);

      await updatePromise;
      expect(useSettingsStore.getState().isSaving).toBe(false);
    });

    it('should set error on failure', async () => {
      getMockInvoke().mockRejectedValueOnce(new Error('Save failed'));

      await useSettingsStore.getState().updateGeneralSettings({ autoLaunch: true });

      const state = useSettingsStore.getState();
      expect(state.error).toBe('Error: Save failed');
      expect(state.isSaving).toBe(false);
    });
  });

  describe('updateSyncSettings', () => {
    it('should update sync settings', async () => {
      getMockInvoke().mockResolvedValueOnce(undefined); // save_settings

      await useSettingsStore.getState().updateSyncSettings({ lastSync: '2024-01-15' });

      const state = useSettingsStore.getState();
      expect(state.settings.sync.lastSync).toBe('2024-01-15');
      expect(state.isSaving).toBe(false);
    });

    it('should trigger cloud sync when enabling sync', async () => {
      getMockInvoke()
        .mockResolvedValueOnce(undefined) // save_settings (first call)
        .mockResolvedValueOnce(undefined) // sync_to_cloud
        .mockResolvedValueOnce(undefined); // save_settings (with updated lastSync)

      await useSettingsStore.getState().updateSyncSettings({ enabled: true });

      const state = useSettingsStore.getState();
      expect(state.settings.sync.enabled).toBe(true);
      expect(state.settings.sync.lastSync).not.toBeNull();
      expect(state.isSaving).toBe(false);

      // Verify sync_to_cloud was called
      expect(getMockInvoke()).toHaveBeenCalledWith('sync_to_cloud');
    });

    it('should set error on sync failure', async () => {
      getMockInvoke().mockRejectedValueOnce(new Error('Sync failed'));

      await useSettingsStore.getState().updateSyncSettings({ enabled: true });

      const state = useSettingsStore.getState();
      expect(state.error).toBe('Error: Sync failed');
      expect(state.isSaving).toBe(false);
    });
  });

  describe('setAutoLaunch', () => {
    it('should set auto-launch in system', async () => {
      getMockInvoke().mockResolvedValueOnce(undefined); // set_autostart_enabled

      await useSettingsStore.getState().setAutoLaunch(true);

      const state = useSettingsStore.getState();
      expect(state.systemAutoLaunch).toBe(true);
      expect(state.isSaving).toBe(false);
    });

    it('should set error on failure', async () => {
      getMockInvoke().mockRejectedValueOnce(new Error('System error'));

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
