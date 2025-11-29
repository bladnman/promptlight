import { create } from 'zustand';
import type { SearchResult } from '../types';
import { CACHE_CONFIG } from '../config/constants';

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

interface SearchCacheEntry extends CacheEntry {
  query: string;
}

interface LauncherCacheState {
  /** Cache for launch results (empty query) - no TTL, only invalidated by editor ops */
  launchCache: CacheEntry | null;
  /** Cache for search results (non-empty query) - has TTL */
  searchCache: SearchCacheEntry | null;
}

interface LauncherCacheActions {
  /** Get launch results if cached (no TTL check) */
  getLaunchCache: () => SearchResult[] | null;
  /** Set launch cache */
  setLaunchCache: (results: SearchResult[]) => void;
  /** Get search results if cached and within TTL */
  getSearchCache: (query: string) => SearchResult[] | null;
  /** Set search cache */
  setSearchCache: (query: string, results: SearchResult[]) => void;
  /** Clear search cache only (keeps launch cache) */
  clearSearchCache: () => void;
  /** Invalidate all caches (called when editor makes changes) */
  invalidateAll: () => void;
  /** Check if we have any valid cache for the given query */
  hasValidCache: (query: string) => boolean;
}

type LauncherCacheStore = LauncherCacheState & LauncherCacheActions;

export const useLauncherCacheStore = create<LauncherCacheStore>((set, get) => ({
  launchCache: null,
  searchCache: null,

  getLaunchCache: () => {
    const { launchCache } = get();
    // Launch cache never expires (only invalidated by editor ops)
    return launchCache?.results ?? null;
  },

  setLaunchCache: (results) => {
    set({
      launchCache: {
        results,
        timestamp: Date.now(),
      },
    });
  },

  getSearchCache: (query) => {
    const { searchCache } = get();
    if (!searchCache) return null;
    if (searchCache.query !== query) return null;

    // Check TTL
    const age = Date.now() - searchCache.timestamp;
    if (age > CACHE_CONFIG.SEARCH_RESULTS_TTL_MS) {
      // Cache expired
      return null;
    }

    return searchCache.results;
  },

  setSearchCache: (query, results) => {
    set({
      searchCache: {
        query,
        results,
        timestamp: Date.now(),
      },
    });
  },

  clearSearchCache: () => {
    set({ searchCache: null });
  },

  invalidateAll: () => {
    set({
      launchCache: null,
      searchCache: null,
    });
  },

  hasValidCache: (query) => {
    const { getLaunchCache, getSearchCache } = get();
    if (query === '' || query.length === 0) {
      return getLaunchCache() !== null;
    }
    return getSearchCache(query) !== null;
  },
}));
