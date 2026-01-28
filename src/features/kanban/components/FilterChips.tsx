'use client';

/**
 * FilterChips Component
 *
 * Displays active filters as removable chips/badges.
 * Provides visual feedback and quick removal of applied filters.
 */

import { useMemo } from 'react';
import { useKanbanStore, useSearchQuery, useFilters } from '@/store/kanban';
import { cn } from '@/lib/utils';

interface FilterChipsProps {
  /** Custom class name for the container */
  className?: string;
  /** Maximum number of chips to display (shows "+N more" for overflow) */
  maxChips?: number;
}

interface FilterChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

/**
 * Maps priority values to display labels.
 */
const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

/**
 * Maps column values to display labels.
 */
const COLUMN_LABELS: Record<string, string> = {
  TODO: 'To-Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

/**
 * Formats a date string for display.
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * FilterChips component that displays active filters as removable badges.
 */
export function FilterChips({ className, maxChips = 5 }: FilterChipsProps) {
  const searchQuery = useSearchQuery();
  const filters = useFilters();
  const setSearchQuery = useKanbanStore((state) => state.setSearchQuery);
  const setFilter = useKanbanStore((state) => state.setFilter);
  const clearFilters = useKanbanStore((state) => state.clearFilters);

  // Build list of active filter chips
  const chips = useMemo<FilterChip[]>(() => {
    const result: FilterChip[] = [];

    // Search query chip
    if (searchQuery.trim()) {
      result.push({
        key: 'searchQuery',
        label: 'Search',
        value: searchQuery.length > 20 ? `${searchQuery.slice(0, 20)}...` : searchQuery,
        onRemove: () => setSearchQuery(''),
      });
    }

    // Priority chip
    if (filters.priority) {
      result.push({
        key: 'priority',
        label: 'Priority',
        value: PRIORITY_LABELS[filters.priority] || filters.priority,
        onRemove: () => setFilter('priority', null),
      });
    }

    // Column chip
    if (filters.columnId) {
      result.push({
        key: 'columnId',
        label: 'Status',
        value: COLUMN_LABELS[filters.columnId] || filters.columnId,
        onRemove: () => setFilter('columnId', null),
      });
    }

    // Categories chips (show each category as a separate chip)
    if (filters.categories && filters.categories.length > 0) {
      filters.categories.forEach((category, index) => {
        result.push({
          key: `category-${index}`,
          label: 'Category',
          value: category.length > 15 ? `${category.slice(0, 15)}...` : category,
          onRemove: () => {
            const newCategories = filters.categories!.filter((_, i) => i !== index);
            setFilter('categories', newCategories.length > 0 ? newCategories : undefined);
          },
        });
      });
    }

    // Date range chip
    if (filters.dateRange) {
      const start = formatDate(filters.dateRange.start);
      const end = formatDate(filters.dateRange.end);
      result.push({
        key: 'dateRange',
        label: 'Due Date',
        value: start === end ? start : `${start} - ${end}`,
        onRemove: () => setFilter('dateRange', undefined),
      });
    }

    return result;
  }, [searchQuery, filters, setSearchQuery, setFilter]);

  // Early return if no active filters
  if (chips.length === 0) {
    return null;
  }

  const visibleChips = chips.slice(0, maxChips);
  const overflowCount = chips.length - maxChips;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="list"
      aria-label="Active filters"
    >
      {visibleChips.map((chip) => (
        <div
          key={chip.key}
          role="listitem"
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1',
            'text-xs font-medium text-slate-600',
            'bg-white/70 backdrop-blur-sm',
            'border border-white/40 rounded-lg',
            'shadow-[0_2px_8px_rgba(100,100,140,0.08)]',
            'transition-all duration-200'
          )}
        >
          <span className="text-slate-400">{chip.label}:</span>
          <span className="text-slate-700">{chip.value}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label}: ${chip.value} filter`}
            className={cn(
              'ml-0.5 w-4 h-4 flex items-center justify-center',
              'text-slate-400 hover:text-rose-500',
              'rounded-full hover:bg-rose-50',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-rose-400/30'
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3 h-3"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      ))}

      {/* Overflow indicator */}
      {overflowCount > 0 && (
        <span className="text-xs text-slate-500 font-medium">
          +{overflowCount} more
        </span>
      )}

      {/* Clear all button */}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={clearFilters}
          className={cn(
            'text-xs font-medium text-slate-500 hover:text-rose-500',
            'underline underline-offset-2',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:rounded'
          )}
          aria-label="Clear all filters"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
