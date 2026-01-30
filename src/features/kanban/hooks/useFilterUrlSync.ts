'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  useKanbanStore,
  useSearchQuery,
  useFilters,
  type StoreFilterOptions,
} from '@/store/kanban';

/**
 * URL Filter Sync Hook
 *
 * Manages bidirectional synchronization between URL query parameters
 * and the Zustand filter state. This enables shareable filter URLs.
 *
 * Features:
 * - Loads filters from URL on initial mount
 * - Debounced URL updates when filters change
 * - Handles URL encoding for special characters in categories
 */
export function useFilterUrlSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Get state from store
  const searchQuery = useSearchQuery();
  const filters = useFilters();
  const setSearchQuery = useKanbanStore((state) => state.setSearchQuery);
  const setFilters = useKanbanStore((state) => state.setFilters);

  // Load filters from URL on mount
  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    const urlSearch = searchParams.get('search');
    const urlPriority = searchParams.get('priority');
    const urlColumn = searchParams.get('column');
    const urlCategories = searchParams.get('categories');
    const urlStart = searchParams.get('start');
    const urlEnd = searchParams.get('end');

    const filtersFromUrl: StoreFilterOptions = {};

    if (urlSearch) {
      setSearchQuery(urlSearch);
    }

    if (urlPriority && ['LOW', 'MEDIUM', 'HIGH'].includes(urlPriority.toUpperCase())) {
      filtersFromUrl.priority = urlPriority.toUpperCase() as StoreFilterOptions['priority'];
    }

    if (urlColumn && ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(urlColumn.toUpperCase())) {
      filtersFromUrl.columnId = urlColumn.toUpperCase() as StoreFilterOptions['columnId'];
    }

    if (urlCategories) {
      // Decode URL-encoded categories to handle special characters like commas, ampersands, etc.
      filtersFromUrl.categories = urlCategories
        .split(',')
        .filter(Boolean)
        .map((cat) => decodeURIComponent(cat));
    }

    if (urlStart && urlEnd) {
      filtersFromUrl.dateRange = { start: urlStart, end: urlEnd };
    }

    if (Object.keys(filtersFromUrl).length > 0) {
      setFilters(filtersFromUrl);
    }
  }, [searchParams, setSearchQuery, setFilters]);

  // Update URL when filters change (debounced)
  useEffect(() => {
    if (isInitialMount.current) return;

    // Clear existing timeout
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }

    // Debounce URL updates
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      if (filters.priority) {
        params.set('priority', filters.priority.toLowerCase());
      }

      if (filters.columnId) {
        params.set('column', filters.columnId.toLowerCase().replace('_', '-'));
      }

      if (filters.categories && filters.categories.length > 0) {
        // Encode each category to handle special characters (commas, ampersands, equals, percent, hash, spaces, unicode)
        const encodedCategories = filters.categories
          .map((cat) => encodeURIComponent(cat))
          .join(',');
        params.set('categories', encodedCategories);
      }

      if (filters.dateRange) {
        params.set('start', filters.dateRange.start);
        params.set('end', filters.dateRange.end);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // Update URL without causing navigation
      router.replace(newUrl, { scroll: false });
    }, 500);

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [searchQuery, filters, pathname, router]);

  return {
    searchQuery,
    filters,
  };
}
