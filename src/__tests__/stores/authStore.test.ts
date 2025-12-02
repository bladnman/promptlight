import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, type User, type AuthSession } from '../../stores/authStore';
import { useEditorStore } from '../../stores/editorStore';
import { getMockInvoke } from '../setup';

// Mock user data
const mockUser: User = {
  uid: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoUrl: 'https://example.com/photo.jpg',
};

const mockSession: AuthSession = {
  user: mockUser,
  tokens: {
    idToken: 'mock-id-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000,
  },
};

describe('authStore', () => {
  beforeEach(() => {
    // Reset auth store
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isSigningIn: false,
      error: null,
    });

    // Reset related stores
    useEditorStore.getState().reset();

    getMockInvoke().mockReset();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isSigningIn).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('should set user when session exists', async () => {
      getMockInvoke()
        .mockResolvedValueOnce(mockSession) // get_current_auth
        .mockResolvedValueOnce(undefined) // set_sync_auth
        .mockResolvedValueOnce({ prompts: [], folders: ['uncategorized'] }); // get_index (from loadPrompts)

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
    });

    it('should set user to null when no session', async () => {
      getMockInvoke().mockResolvedValueOnce(null); // get_current_auth returns null

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should set isLoading during check', async () => {
      getMockInvoke().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(null), 50))
      );

      const checkPromise = useAuthStore.getState().checkAuth();
      expect(useAuthStore.getState().isLoading).toBe(true);

      await checkPromise;
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      getMockInvoke().mockRejectedValueOnce(new Error('Auth check failed'));

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      // Note: checkAuth doesn't set error, just logs and sets user to null
    });

  });

  describe('signInWithGoogle', () => {
    it('should sign in and set user', async () => {
      getMockInvoke()
        .mockResolvedValueOnce(mockSession) // sign_in_with_google
        .mockResolvedValueOnce(undefined) // set_sync_auth
        .mockResolvedValueOnce({ prompts: [], folders: ['uncategorized'] }); // get_index

      await useAuthStore.getState().signInWithGoogle();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isSigningIn).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set isSigningIn during sign in', async () => {
      getMockInvoke().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSession), 50))
      );

      const signInPromise = useAuthStore.getState().signInWithGoogle();
      expect(useAuthStore.getState().isSigningIn).toBe(true);

      // Reset mock for subsequent calls
      getMockInvoke()
        .mockResolvedValueOnce(undefined) // set_sync_auth
        .mockResolvedValueOnce({ prompts: [], folders: [] }); // get_index

      await signInPromise;
      expect(useAuthStore.getState().isSigningIn).toBe(false);
    });

    it('should set error on sign in failure', async () => {
      getMockInvoke().mockRejectedValueOnce(new Error('Sign in cancelled'));

      await useAuthStore.getState().signInWithGoogle();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.error).toBe('Error: Sign in cancelled');
      expect(state.isSigningIn).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should sign out and clear user', async () => {
      useAuthStore.setState({ user: mockUser });

      getMockInvoke()
        .mockResolvedValueOnce(undefined) // sign_out
        .mockResolvedValueOnce(undefined); // clear_sync_auth

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should set isLoading during sign out', async () => {
      useAuthStore.setState({ user: mockUser });

      getMockInvoke().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
      );

      const signOutPromise = useAuthStore.getState().signOut();
      expect(useAuthStore.getState().isLoading).toBe(true);

      await signOutPromise;
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set error on sign out failure', async () => {
      useAuthStore.setState({ user: mockUser });

      getMockInvoke().mockRejectedValueOnce(new Error('Sign out failed'));

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.error).toBe('Error: Sign out failed');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      useAuthStore.setState({ error: 'Some auth error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
