import { useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLauncherStore } from '../stores/launcherStore';
import { SEARCH_CONFIG } from '../config/constants';
import type { SearchResult } from '../types';

/**
 * Hook for debounced search functionality
 * Always fetches fresh data from backend - no caching to ensure consistency
 */
export function useSearch() {
  const { query, mode, setResults, setLoading } = useLauncherStore();
  const debounceRef = useRef<number | null>(null);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      const isEmptyQuery = searchQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH;
      const effectiveQuery = isEmptyQuery ? '' : searchQuery;

      try {
        const results = await invoke<SearchResult[]>('search_prompts', {
          query: effectiveQuery,
        });
        setResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      }
      setLoading(false);
    },
    [setResults, setLoading]
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

  // Initial load
  useEffect(() => {
    performSearch('');
  }, [performSearch]);
}
