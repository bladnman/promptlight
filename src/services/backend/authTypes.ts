/**
 * Auth and Settings types for the backend adapter
 * Re-exported from stores to avoid circular dependencies
 */

import type { AccentColorName, ThemeOption } from '../../config/constants';

/** User information from Firebase Auth */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

/** Auth tokens (managed by backend) */
export interface AuthTokens {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** Complete auth session */
export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

/** General application settings */
export interface GeneralSettings {
  autoLaunch: boolean;
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
