import { useEffect, useState } from 'react';
import { Settings, Cloud, CloudOff, Power, LogOut, User, Keyboard, Palette, Sun, Moon, Monitor } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
import { useSettingsStore, type AppearanceSettings } from '../../../stores/settingsStore';
import { useAuthStore } from '../../../stores/authStore';
import { HotkeyInput } from './HotkeyInput';
import { ACCENT_COLORS, THEME_OPTIONS, type AccentColorName, type ThemeOption } from '../../../config/constants';
import styles from './SettingsView.module.css';

type SettingsSection = 'general' | 'appearance' | 'sync';

export function SettingsView() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [appVersion, setAppVersion] = useState<string>('');
  const {
    settings,
    systemAutoLaunch,
    isLoading,
    isSaving,
    error: settingsError,
    loadSettings,
    updateSyncSettings,
    setAutoLaunch,
    setHotkey,
    setTheme,
    setAccentColor,
  } = useSettingsStore();

  const {
    user,
    isLoading: isAuthLoading,
    isSigningIn,
    error: authError,
    checkAuth,
    signInWithGoogle,
    signOut,
  } = useAuthStore();

  useEffect(() => {
    loadSettings();
    checkAuth();
    getVersion().then(setAppVersion).catch(() => {});
  }, [loadSettings, checkAuth]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="settings-view">
      <nav className={styles.nav}>
        <h2 className={styles.navTitle}>Settings</h2>
        <button
          className={`${styles.navItem} ${activeSection === 'general' ? styles.active : ''}`}
          onClick={() => setActiveSection('general')}
          data-testid="settings-tab-general"
        >
          <Settings size={16} />
          General
        </button>
        <button
          className={`${styles.navItem} ${activeSection === 'appearance' ? styles.active : ''}`}
          onClick={() => setActiveSection('appearance')}
          data-testid="settings-tab-appearance"
        >
          <Palette size={16} />
          Appearance
        </button>
        <button
          className={`${styles.navItem} ${activeSection === 'sync' ? styles.active : ''}`}
          onClick={() => setActiveSection('sync')}
          data-testid="settings-tab-sync"
        >
          {user ? <Cloud size={16} /> : <CloudOff size={16} />}
          Sync
        </button>
        <div className={styles.version}>v{appVersion || '?'}</div>
      </nav>

      <main className={styles.content}>
        {activeSection === 'general' && (
          <GeneralSection
            autoLaunch={systemAutoLaunch}
            onAutoLaunchChange={setAutoLaunch}
            hotkey={settings.general.hotkey}
            onHotkeyChange={setHotkey}
            isSaving={isSaving}
          />
        )}
        {activeSection === 'appearance' && (
          <AppearanceSection
            appearance={settings.appearance}
            onThemeChange={setTheme}
            onAccentColorChange={setAccentColor}
            isSaving={isSaving}
          />
        )}
        {activeSection === 'sync' && (
          <SyncSection
            enabled={settings.sync.enabled}
            lastSync={settings.sync.lastSync}
            onEnabledChange={(value) => updateSyncSettings({ enabled: value })}
            user={user}
            isAuthLoading={isAuthLoading}
            isSigningIn={isSigningIn}
            isSaving={isSaving}
            authError={authError}
            syncError={settingsError}
            onSignIn={signInWithGoogle}
            onSignOut={signOut}
          />
        )}
      </main>
    </div>
  );
}

interface GeneralSectionProps {
  autoLaunch: boolean;
  onAutoLaunchChange: (value: boolean) => void;
  hotkey: string | null;
  onHotkeyChange: (value: string | null) => void;
  isSaving: boolean;
}

function GeneralSection({
  autoLaunch,
  onAutoLaunchChange,
  hotkey,
  onHotkeyChange,
  isSaving,
}: GeneralSectionProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>General</h3>
      <p className={styles.sectionDescription}>
        Configure general application behavior.
      </p>

      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <div className={styles.settingLabel}>
            <Keyboard size={16} />
            Global hotkey
            {isSaving && <span className={styles.savingIndicator}>Saving...</span>}
          </div>
          <div className={styles.settingHint}>
            Press to summon the launcher from anywhere.
          </div>
        </div>
        <HotkeyInput value={hotkey} onChange={onHotkeyChange} disabled={isSaving} />
      </div>

      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <div className={styles.settingLabel}>
            <Power size={16} />
            Launch at startup
          </div>
          <div className={styles.settingHint}>
            Automatically start PromptLight when you log in.
          </div>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={autoLaunch}
            onChange={(e) => onAutoLaunchChange(e.target.checked)}
            data-testid="auto-launch-toggle"
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>
    </section>
  );
}

interface AppearanceSectionProps {
  appearance: AppearanceSettings;
  onThemeChange: (theme: ThemeOption) => void;
  onAccentColorChange: (color: AccentColorName) => void;
  isSaving: boolean;
}

function AppearanceSection({
  appearance,
  onThemeChange,
  onAccentColorChange,
  isSaving,
}: AppearanceSectionProps) {
  const themeIcons: Record<ThemeOption, React.ReactNode> = {
    dark: <Moon size={16} />,
    light: <Sun size={16} />,
    auto: <Monitor size={16} />,
  };

  const themeLabels: Record<ThemeOption, string> = {
    dark: 'Dark',
    light: 'Light',
    auto: 'System',
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Appearance</h3>
      <p className={styles.sectionDescription}>
        Customize how PromptLight looks.
      </p>

      {/* Theme Selection */}
      <div className={styles.appearanceRow}>
        <div className={styles.settingInfo}>
          <div className={styles.settingLabel}>
            {themeIcons[appearance.theme]}
            Theme
            {isSaving && <span className={styles.savingIndicator}>Saving...</span>}
          </div>
          <div className={styles.settingHint}>
            Choose your preferred color scheme.
          </div>
        </div>
        <div className={styles.themeSelector}>
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme}
              className={`${styles.themeOption} ${appearance.theme === theme ? styles.active : ''}`}
              onClick={() => onThemeChange(theme)}
              disabled={isSaving}
              title={themeLabels[theme]}
              data-testid={`theme-${theme}`}
            >
              {themeIcons[theme]}
              <span>{themeLabels[theme]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color Selection */}
      <div className={styles.appearanceRow}>
        <div className={styles.settingInfo}>
          <div className={styles.settingLabel}>
            <Palette size={16} />
            Accent color
          </div>
          <div className={styles.settingHint}>
            Pick a color.
          </div>
        </div>
        <div className={styles.accentSelector}>
          {(Object.entries(ACCENT_COLORS) as [AccentColorName, typeof ACCENT_COLORS[AccentColorName]][]).map(
            ([key, color]) => (
              <button
                key={key}
                className={`${styles.accentOption} ${appearance.accentColor === key ? styles.active : ''}`}
                onClick={() => onAccentColorChange(key)}
                disabled={isSaving}
                title={color.name}
                style={{ '--accent-swatch': color.primary } as React.CSSProperties}
                data-testid={`accent-${key}`}
              >
                <span className={styles.accentSwatch} />
                <span className={styles.accentLabel}>{color.name}</span>
              </button>
            )
          )}
        </div>
      </div>
    </section>
  );
}

interface SyncSectionProps {
  enabled: boolean;
  lastSync: string | null;
  onEnabledChange: (value: boolean) => void;
  user: { uid: string; email: string | null; displayName: string | null; photoUrl: string | null } | null;
  isAuthLoading: boolean;
  isSigningIn: boolean;
  isSaving: boolean;
  authError: string | null;
  syncError: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

function SyncSection({
  enabled,
  lastSync,
  onEnabledChange,
  user,
  isAuthLoading,
  isSigningIn,
  isSaving,
  authError,
  syncError,
  onSignIn,
  onSignOut,
}: SyncSectionProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Cloud Sync</h3>
      <p className={styles.sectionDescription}>
        Sync your prompts across devices using your Google account.
      </p>

      {/* Account Status */}
      {user ? (
        <div className={styles.accountCard}>
          <div className={styles.accountInfo}>
            {user.photoUrl ? (
              <img src={user.photoUrl} alt="" className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <User size={20} />
              </div>
            )}
            <div className={styles.accountDetails}>
              <div className={styles.accountName}>
                {user.displayName || 'Google User'}
              </div>
              <div className={styles.accountEmail}>{user.email}</div>
            </div>
          </div>
          <button
            className={styles.signOutButton}
            onClick={onSignOut}
            disabled={isAuthLoading}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      ) : (
        <div className={styles.signInCard}>
          <button
            className={styles.googleButton}
            onClick={onSignIn}
            disabled={isSigningIn || isAuthLoading}
            data-testid="google-sign-in"
          >
            {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
          {authError && <p className={styles.errorText}>{authError}</p>}
        </div>
      )}

      {/* Sync Toggle (only show when signed in) */}
      {user && (
        <>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>
                {enabled ? <Cloud size={16} /> : <CloudOff size={16} />}
                Enable sync
                {isSaving && <span className={styles.savingIndicator}>Syncing...</span>}
              </div>
              <div className={styles.settingHint}>
                Your prompts will be securely stored and synced via Google.
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => onEnabledChange(e.target.checked)}
                disabled={isSaving}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          {syncError && (
            <div className={styles.errorText}>Sync error: {syncError}</div>
          )}

          {lastSync && !syncError && (
            <div className={styles.lastSync}>
              Last synced: {new Date(lastSync).toLocaleString()}
            </div>
          )}
        </>
      )}
    </section>
  );
}
