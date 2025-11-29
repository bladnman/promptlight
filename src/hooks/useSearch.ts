import { useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLauncherStore } from '../stores/launcherStore';
import { useLauncherCacheStore } from '../stores/launcherCacheStore';
import { SEARCH_CONFIG } from '../config/constants';
import type { SearchResult } from '../types';

/**
 * Hook for debounced search functionality with caching
 */
export function useSearch() {
  const { query, mode, setResults, setLoading } = useLauncherStore();
  const {
    getLaunchCache,
    setLaunchCache,
    getSearchCache,
    setSearchCache,
  } = useLauncherCacheStore();
  const debounceRef = useRef<number | null>(null);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      const isEmptyQuery = searchQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH;
      const effectiveQuery = isEmptyQuery ? '' : searchQuery;

      // Check cache first
      if (isEmptyQuery) {
        const cached = getLaunchCache();
        if (cached) {
          setResults(cached);
          setLoading(false);
          return;
        }
      } else {
        const cached = getSearchCache(effectiveQuery);
        if (cached) {
          setResults(cached);
          setLoading(false);
          return;
        }
      }

      // No cache hit, fetch from backend
      try {
        const results = await invoke<SearchResult[]>('search_prompts', {
          query: effectiveQuery,
        });
        setResults(results);

        // Cache the results
        if (isEmptyQuery) {
          setLaunchCache(results);
        } else {
          setSearchCache(effectiveQuery, results);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      }
      setLoading(false);
    },
    [setResults, setLoading, getLaunchCache, setLaunchCache, getSearchCache, setSearchCache]
  );

  useEffect(() => {
    // Don't search in promoted mode
    if (mode === 'promoted') return;

    setLoading(true);

    // Clear previous debounce
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    // Debounce the search
    debounceRef.current = window.setTimeout(() => {
      performSearch(query);
    }, SEARCH_CONFIG.DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query, mode, performSearch, setLoading]);

  // Initial load (will use cache if available)
  useEffect(() => {
    performSearch('');
  }, [performSearch]);
}
