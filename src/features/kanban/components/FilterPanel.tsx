'use client';

/**
 * FilterPanel Component
 *
 * Popover/panel containing all filter options for task filtering.
 * Includes priority, column, categories, and date range filters.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useKanbanStore, useFilters, useActiveFilterCount, type StoreFilterOptions } from '@/store/kanban';
import { DateRangeInput, type DateRange } from '@/components/ui/DateRangeInput';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel should close */
  onClose: () => void;
  /** Custom class name for the panel */
  className?: string;
}

/**
 * Priority options for the filter dropdown.
 */
const PRIORITY_OPTIONS = [
  { value: null, label: 'All Priorities' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
] as const;

/**
 * Column/status options for the filter dropdown.
 */
const COLUMN_OPTIONS = [
  { value: null, label: 'All Columns' },
  { value: 'TODO', label: 'To-Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
] as const;

/**
 * Common category suggestions.
 * In a real app, these would come from analyzing the user's tasks.
 */
const CATEGORY_SUGGESTIONS = [
  'Work',
  'Personal',
  'Urgent',
  'Backend',
  'Frontend',
  'Bug',
  'Feature',
  'Documentation',
];

/**
 * FilterPanel component providing advanced filter options.
 */
export function FilterPanel({ isOpen, onClose, className }: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const filters = useFilters();
  const activeFilterCount = useActiveFilterCount();
  const setFilter = useKanbanStore((state) => state.setFilter);
  const clearFilters = useKanbanStore((state) => state.clearFilters);

  // Local state for category input
  const [categoryInput, setCategoryInput] = useState('');

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Delay to prevent immediate close from the trigger click
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const handlePriorityChange = useCallback(
    (value: string) => {
      setFilter('priority', value === '' ? null : (value as StoreFilterOptions['priority']));
    },
    [setFilter]
  );

  const handleColumnChange = useCallback(
    (value: string) => {
      setFilter('columnId', value === '' ? null : (value as StoreFilterOptions['columnId']));
    },
    [setFilter]
  );

  const handleDateRangeChange = useCallback(
    (range: DateRange | undefined) => {
      if (range) {
        setFilter('dateRange', { start: range.start, end: range.end });
      } else {
        setFilter('dateRange', undefined);
      }
    },
    [setFilter]
  );

  const handleAddCategory = useCallback(
    (category: string) => {
      const trimmed = category.trim();
      if (!trimmed) return;

      const currentCategories = filters.categories || [];
      if (!currentCategories.includes(trimmed)) {
        setFilter('categories', [...currentCategories, trimmed]);
      }
      setCategoryInput('');
    },
    [filters.categories, setFilter]
  );

  const handleRemoveCategory = useCallback(
    (category: string) => {
      const currentCategories = filters.categories || [];
      const newCategories = currentCategories.filter((c) => c !== category);
      setFilter('categories', newCategories.length > 0 ? newCategories : undefined);
    },
    [filters.categories, setFilter]
  );

  const handleCategoryInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCategory(categoryInput);
      }
    },
    [categoryInput, handleAddCategory]
  );

  if (!isOpen) {
    return null;
  }

  const selectBaseStyles = cn(
    'w-full px-3 py-2 text-sm text-slate-700',
    'bg-white/60 backdrop-blur-[10px]',
    'border border-white/40 rounded-lg',
    'shadow-[inset_0_2px_4px_rgba(100,100,140,0.05)]',
    'transition-all duration-250',
    'focus:bg-white/75 focus:border-sky-200/60',
    'focus:shadow-[0_0_0_3px_rgba(180,210,240,0.25),inset_0_2px_4px_rgba(100,100,140,0.05)]',
    'focus:outline-none',
    'cursor-pointer'
  );

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Filter options"
      className={cn(
        'absolute top-full right-0 mt-2 z-50',
        'w-80 p-4 space-y-4',
        'bg-white/90 backdrop-blur-xl',
        'border border-white/40 rounded-2xl',
        'shadow-[0_8px_32px_rgba(100,100,140,0.15),0_2px_8px_rgba(100,100,140,0.1)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium text-sky-700 bg-sky-100/80 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filter panel"
          className={cn(
            'w-7 h-7 flex items-center justify-center',
            'text-slate-400 hover:text-slate-600',
            'rounded-lg hover:bg-slate-100/50',
            'transition-all duration-200'
          )}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Priority Filter */}
      <div className="space-y-1.5">
        <label htmlFor="priority-filter" className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
          Priority
        </label>
        <select
          id="priority-filter"
          value={filters.priority || ''}
          onChange={(e) => handlePriorityChange(e.target.value)}
          className={selectBaseStyles}
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.label} value={option.value || ''}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Column/Status Filter */}
      <div className="space-y-1.5">
        <label htmlFor="column-filter" className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
          Status
        </label>
        <select
          id="column-filter"
          value={filters.columnId || ''}
          onChange={(e) => handleColumnChange(e.target.value)}
          className={selectBaseStyles}
        >
          {COLUMN_OPTIONS.map((option) => (
            <option key={option.label} value={option.value || ''}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories Filter */}
      <div className="space-y-1.5">
        <label
          id="category-filter-label"
          htmlFor="category-input"
          className="block text-xs font-medium text-slate-500 uppercase tracking-wider"
        >
          Categories
        </label>
        {/* Screen reader help text */}
        <div id="category-help" className="sr-only">
          Select one or more categories to filter tasks. Tasks must match ALL selected categories.
          Type a category name and press Enter to add, or click a suggestion below.
        </div>

        {/* Selected categories */}
        {filters.categories && filters.categories.length > 0 && (
          <div
            className="flex flex-wrap gap-1.5 mb-2"
            role="list"
            aria-label="Selected category filters"
          >
            {filters.categories.map((category) => (
              <span
                key={category}
                role="listitem"
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5',
                  'text-xs font-medium text-teal-700',
                  'bg-teal-100/80 rounded-md'
                )}
              >
                {category}
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(category)}
                  aria-label={`Remove ${category} category filter`}
                  className="text-teal-500 hover:text-teal-700"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Category input with full accessibility support */}
        <input
          id="category-input"
          type="text"
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value)}
          onKeyDown={handleCategoryInputKeyDown}
          placeholder="Type and press Enter"
          aria-labelledby="category-filter-label"
          aria-describedby="category-help"
          aria-autocomplete="list"
          autoComplete="off"
          className={cn(selectBaseStyles, 'cursor-text')}
        />

        {/* Category suggestions */}
        <div
          className="flex flex-wrap gap-1 mt-1.5"
          role="group"
          aria-label="Suggested categories"
        >
          {CATEGORY_SUGGESTIONS.filter(
            (cat) => !filters.categories?.includes(cat)
          ).slice(0, 4).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleAddCategory(category)}
              aria-label={`Add ${category} category filter`}
              className={cn(
                'px-2 py-0.5 text-xs font-medium',
                'text-slate-500 hover:text-slate-700',
                'bg-slate-100/60 hover:bg-slate-200/60',
                'rounded border border-slate-200/50',
                'transition-all duration-200'
              )}
            >
              + {category}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
          Due Date Range
        </label>
        <DateRangeInput
          value={filters.dateRange ? { start: filters.dateRange.start, end: filters.dateRange.end } : undefined}
          onChange={handleDateRangeChange}
        />
      </div>

      {/* Footer with actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
        <button
          type="button"
          onClick={clearFilters}
          disabled={activeFilterCount === 0}
          className={cn(
            'text-sm font-medium text-slate-500 hover:text-rose-500',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-500',
            'transition-colors duration-200'
          )}
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'px-4 py-2 text-sm font-medium text-white',
            'bg-gradient-to-br from-sky-400 to-indigo-500',
            'rounded-lg shadow-[0_4px_16px_rgba(100,150,230,0.3)]',
            'hover:shadow-[0_6px_20px_rgba(100,150,230,0.4)]',
            'hover:-translate-y-0.5 active:translate-y-0',
            'transition-all duration-200'
          )}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
