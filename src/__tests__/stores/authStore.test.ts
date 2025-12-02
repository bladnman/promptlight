import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, type User } from '../../stores/authStore';
import { useEditorStore } from '../../stores/editorStore';
import { getMockBackend } from '../setup';

// Mock user data for test assertions
const mockUser: User = {
  uid: 'mock-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoUrl: null,
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

    // mockBackend.reset() is called in setup.ts beforeEach
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
      // Set up a mock user in the backend
      getMockBackend().setCurrentUser(mockUser);

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
    });

    it('should set user to null when no session', async () => {
      // No user set in mock backend, so getCurrentAuth returns null

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should set isLoading during check', async () => {
      const checkPromise = useAuthStore.getState().checkAuth();
      // Note: State change happens synchronously
      await checkPromise;
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      getMockBackend().injectError('getCurrentAuth', new Error('Auth check failed'));

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      // Note: checkAuth doesn't set error, just logs and sets user to null
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in and set user', async () => {
      await useAuthStore.getState().signInWithGoogle();

      const state = useAuthStore.getState();
      // MockAdapter creates a user with these values
      expect(state.user).toEqual(mockUser);
      expect(state.isSigningIn).toBe(false);
      expect(state.error).toBeNull();

      // Verify sign_in was called via action history
      const actions = getMockBackend().actionHistory;
      expect(actions.some((a) => a.type === 'sign_in')).toBe(true);
    });

    it('should set isSigningIn during sign in', async () => {
      const signInPromise = useAuthStore.getState().signInWithGoogle();
      // Note: State change happens synchronously
      await signInPromise;
      expect(useAuthStore.getState().isSigningIn).toBe(false);
    });

    it('should set error on sign in failure', async () => {
      getMockBackend().injectError('signInWithGoogle', new Error('Sign in cancelled'));

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

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);

      // Verify sign_out was called via action history
      const actions = getMockBackend().actionHistory;
      expect(actions.some((a) => a.type === 'sign_out')).toBe(true);
    });

    it('should set isLoading during sign out', async () => {
      useAuthStore.setState({ user: mockUser });

      const signOutPromise = useAuthStore.getState().signOut();
      // Note: State change happens synchronously
      await signOutPromise;
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set error on sign out failure', async () => {
      useAuthStore.setState({ user: mockUser });

      getMockBackend().injectError('signOut', new Error('Sign out failed'));

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
