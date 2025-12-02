import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { useEditorStore } from './editorStore';

/** User information from Firebase Auth */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

/** Auth tokens (not exposed to UI, managed by backend) */
interface AuthTokens {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** Complete auth session */
export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

interface AuthState {
  /** Current user (null if not signed in) */
  user: User | null;
  /** Whether auth is loading */
  isLoading: boolean;
  /** Whether sign-in is in progress */
  isSigningIn: boolean;
  /** Error message */
  error: string | null;
}

interface AuthActions {
  /** Check current auth state on app start */
  checkAuth: () => Promise<void>;
  /** Sign in with Google */
  signInWithGoogle: () => Promise<void>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

// Get Firebase API key from env
const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isSigningIn: false,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const session = await invoke<AuthSession | null>('get_current_auth', {
        apiKey: FIREBASE_API_KEY,
      });
      if (session) {
        // Set sync auth so SyncService can make authenticated Firestore requests
        // This also auto-syncs from cloud
        await invoke('set_sync_auth', {
          userId: session.user.uid,
          idToken: session.tokens.idToken,
        });
        // Reload prompts after sync completes (cloud data is now downloaded)
        await useEditorStore.getState().loadPrompts();
      }
      set({
        user: session?.user ?? null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to check auth:', error);
      set({ user: null, isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isSigningIn: true, error: null });
    try {
      const session = await invoke<AuthSession>('sign_in_with_google', {
        apiKey: FIREBASE_API_KEY,
      });
      // Set sync auth so SyncService can make authenticated Firestore requests
      // This also auto-syncs from cloud
      await invoke('set_sync_auth', {
        userId: session.user.uid,
        idToken: session.tokens.idToken,
      });
      // Reload prompts after sync completes (cloud data is now downloaded)
      await useEditorStore.getState().loadPrompts();
      set({
        user: session.user,
        isSigningIn: false,
      });
    } catch (error) {
      console.error('Sign in failed:', error);
      set({
        error: String(error),
        isSigningIn: false,
      });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await invoke('sign_out');
      // Clear sync auth so SyncService stops making authenticated requests
      await invoke('clear_sync_auth');
      set({ user: null, isLoading: false });
    } catch (error) {
      console.error('Sign out failed:', error);
      set({ error: String(error), isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
