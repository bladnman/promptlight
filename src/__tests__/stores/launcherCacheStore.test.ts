import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useLauncherCacheStore } from '../../stores/launcherCacheStore';
import type { SearchResult } from '../../types';

// Helper to create mock search results
function createMockResult(id: string, name: string): SearchResult {
  return {
    prompt: {
      id,
      name,
      folder: 'test',
      description: '',
      filename: `${id}.md`,
      useCount: 0,
      lastUsed: null,
      created: '2024-01-01',
      updated: '2024-01-01',
    },
    score: 1.0,
  };
}

describe('launcherCacheStore', () => {
  beforeEach(() => {
    useLauncherCacheStore.getState().invalidateAll();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have null caches initially', () => {
      const state = useLauncherCacheStore.getState();
      expect(state.launchCache).toBeNull();
      expect(state.searchCache).toBeNull();
    });
  });

  describe('launch cache (no TTL)', () => {
    it('should set and get launch cache', () => {
      const results = [createMockResult('1', 'Test 1')];
      useLauncherCacheStore.getState().setLaunchCache(results);

      const cached = useLauncherCacheStore.getState().getLaunchCache();
      expect(cached).toHaveLength(1);
      expect(cached?.[0].prompt.id).toBe('1');
    });

    it('should return null when no launch cache exists', () => {
      expect(useLauncherCacheStore.getState().getLaunchCache()).toBeNull();
    });

    it('should not expire (no TTL check)', () => {
      const results = [createMockResult('1', 'Test 1')];
      useLauncherCacheStore.getState().setLaunchCache(results);

      // Advance time significantly (e.g., 1 hour)
      vi.advanceTimersByTime(60 * 60 * 1000);

      // Launch cache should still be valid
      const cached = useLauncherCacheStore.getState().getLaunchCache();
      expect(cached).toHaveLength(1);
    });
  });

  describe('search cache (with TTL)', () => {
    it('should set and get search cache', () => {
      const results = [createMockResult('1', 'Test 1')];
      useLauncherCacheStore.getState().setSearchCache('test query', results);

      const cached = useLauncherCacheStore.getState().getSearchCache('test query');
      expect(cached).toHaveLength(1);
      expect(cached?.[0].prompt.id).toBe('1');
    });

    it('should return null when no search cache exists', () => {
      expect(useLauncherCacheStore.getState().getSearchCache('test')).toBeNull();
    });

    it('should return null for different query', () => {
      const results = [createMockResult('1', 'Test 1')];
      useLauncherCacheStore.getState().setSearchCache('query1', results);

      expect(useLauncherCacheStore.getState().getSearchCache('query2')).toBeNull();
    });

    it('should expire after TTL', () => {
      const results = [createMockResult('1', 'Test 1')];
      useLauncherCacheStore.getState().setSearchCache('test', results);

      // Should be valid immediately
      expect(useLauncherCacheStore.getState().getSearchCache('test')).not.toBeNull();

      // Advance time past TTL (default is 10000ms)
      vi.advanceTimersByTime(11000);

      // Cache should be expired
      expect(useLauncherCacheStore.getState().getSearchCache('test')).toBeNull();
    });

    it('should still be valid before TTL expires', () => {
      const results = [createMockResult('1', 'Test 1')];
      useLauncherCacheStore.getState().setSearchCache('test', results);

      // Advance time but stay under TTL
      vi.advanceTimersByTime(5000);

      // Cache should still be valid
      expect(useLauncherCacheStore.getState().getSearchCache('test')).not.toBeNull();
    });
  });

  describe('clearSearchCache', () => {
    it('should clear only search cache', () => {
      const launchResults = [createMockResult('1', 'Launch')];
      const searchResults = [createMockResult('2', 'Search')];

      useLauncherCacheStore.getState().setLaunchCache(launchResults);
      useLauncherCacheStore.getState().setSearchCache('test', searchResults);

      useLauncherCacheStore.getState().clearSearchCache();

      // Launch cache should remain
      expect(useLauncherCacheStore.getState().getLaunchCache()).not.toBeNull();
      // Search cache should be cleared
      expect(useLauncherCacheStore.getState().getSearchCache('test')).toBeNull();
    });
  });

  describe('invalidateAll', () => {
    it('should clear both caches', () => {
      const launchResults = [createMockResult('1', 'Launch')];
      const searchResults = [createMockResult('2', 'Search')];

      useLauncherCacheStore.getState().setLaunchCache(launchResults);
      useLauncherCacheStore.getState().setSearchCache('test', searchResults);

      useLauncherCacheStore.getState().invalidateAll();

      expect(useLauncherCacheStore.getState().getLaunchCache()).toBeNull();
      expect(useLauncherCacheStore.getState().getSearchCache('test')).toBeNull();
    });
  });

  describe('hasValidCache', () => {
    it('should return true when launch cache exists for empty query', () => {
      const results = [createMockResult('1', 'Test')];
      useLauncherCacheStore.getState().setLaunchCache(results);

      expect(useLauncherCacheStore.getState().hasValidCache('')).toBe(true);
    });

    it('should return false when no launch cache for empty query', () => {
      expect(useLauncherCacheStore.getState().hasValidCache('')).toBe(false);
    });

    it('should return true when search cache exists for non-empty query', () => {
      const results = [createMockResult('1', 'Test')];
      useLauncherCacheStore.getState().setSearchCache('test', results);

      expect(useLauncherCacheStore.getState().hasValidCache('test')).toBe(true);
    });

    it('should return false when no search cache for non-empty query', () => {
      expect(useLauncherCacheStore.getState().hasValidCache('test')).toBe(false);
    });

    it('should return false when search cache expired', () => {
      const results = [createMockResult('1', 'Test')];
      useLauncherCacheStore.getState().setSearchCache('test', results);

      vi.advanceTimersByTime(11000);

      expect(useLauncherCacheStore.getState().hasValidCache('test')).toBe(false);
    });
  });
});
