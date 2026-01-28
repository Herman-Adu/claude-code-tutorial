'use client';

/**
 * SearchFilterBar Component
 *
 * Feature-level search bar that integrates with the Zustand store.
 * Provides real-time search filtering for tasks with debouncing.
 */

import { useCallback } from 'react';
import { SearchBar } from '@/components/ui/SearchBar';
import { useKanbanStore, useSearchQuery, useIsSearching, useHasActiveFilters } from '@/store/kanban';
import { cn } from '@/lib/utils';

interface SearchFilterBarProps {
  /** Custom class name for the container */
  className?: string;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Whether to show the active search indicator badge */
  showActiveIndicator?: boolean;
}

/**
 * SearchFilterBar component that connects to Zustand store for global search.
 * Includes debouncing and visual feedback for active searches.
 */
export function SearchFilterBar({
  className,
  placeholder = 'Search tasks...',
  showActiveIndicator = true,
}: SearchFilterBarProps) {
  const searchQuery = useSearchQuery();
  const isSearching = useIsSearching();
  const hasActiveFilters = useHasActiveFilters();
  const setSearchQuery = useKanbanStore((state) => state.setSearchQuery);

  const handleChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
    },
    [setSearchQuery]
  );

  return (
    <div className={cn('relative', className)}>
      <SearchBar
        value={searchQuery}
        onChange={handleChange}
        placeholder={placeholder}
        isLoading={isSearching}
        debounceMs={300}
        aria-label="Search tasks by title or description"
      />

      {/* Active search/filter indicator */}
      {showActiveIndicator && hasActiveFilters && !isSearching && (
        <div
          className={cn(
            'absolute -top-1 -right-1 w-3 h-3',
            'bg-gradient-to-br from-sky-400 to-indigo-500',
            'rounded-full shadow-[0_2px_8px_rgba(100,150,230,0.4)]',
            'ring-2 ring-white'
          )}
          aria-label="Filters are active"
          role="status"
        />
      )}
    </div>
  );
}
