'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LabelBadge } from '@/components/ui/LabelBadge';
import { useLabels } from '../hooks/useLabels';
import { useLabelsStore } from '@/store/labels';

interface LabelFilterProps {
  /** Currently selected label IDs for filtering */
  selectedLabelIds: string[];
  /** Callback when filter changes */
  onFilter: (labelIds: string[]) => void;
  /** Additional CSS classes */
  className?: string;
  /** IDs of tasks that match current filters (excluding label filter) */
  filteredTaskIds?: string[];
  /** Whether other filters (search, priority, etc.) are currently active */
  hasOtherFilters?: boolean;
}

/**
 * LabelFilter Component
 *
 * A popover/dropdown component for filtering tasks by labels.
 * Features:
 * - Multi-select checkboxes
 * - Clear all button
 * - Shows count of selected filters
 * - Used in KanbanBoard header
 */
export function LabelFilter({
  selectedLabelIds,
  onFilter,
  className,
  filteredTaskIds,
  hasOtherFilters = false,
}: LabelFilterProps) {
  const { labels, isHydrated } = useLabels();
  const taskLabelsMap = useLabelsStore((state) => state.taskLabels);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate filtered task counts per label when other filters are active
  const filteredLabelCounts = useMemo(() => {
    if (!hasOtherFilters || !filteredTaskIds) {
      return null; // Use default taskCount from labels
    }

    const counts = new Map<string, number>();
    labels.forEach((label) => {
      let count = 0;
      filteredTaskIds.forEach((taskId) => {
        const taskLabelIds = taskLabelsMap.get(taskId) || [];
        if (taskLabelIds.includes(label.id)) {
          count++;
        }
      });
      counts.set(label.id, count);
    });
    return counts;
  }, [hasOtherFilters, filteredTaskIds, labels, taskLabelsMap]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Toggle label filter
  const handleToggleLabel = useCallback(
    (labelId: string) => {
      const isSelected = selectedLabelIds.includes(labelId);
      const newSelection = isSelected
        ? selectedLabelIds.filter((id) => id !== labelId)
        : [...selectedLabelIds, labelId];

      onFilter(newSelection);
    },
    [selectedLabelIds, onFilter]
  );

  // Clear all filters
  const handleClearAll = useCallback(() => {
    onFilter([]);
  }, [onFilter]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, labelId?: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (labelId) {
          handleToggleLabel(labelId);
        } else {
          setIsOpen(!isOpen);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [handleToggleLabel, isOpen]
  );

  const hasActiveFilters = selectedLabelIds.length > 0;

  if (!isHydrated || labels.length === 0) {
    return null; // Don't render filter if no labels available
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Filter button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => handleKeyDown(e)}
        className={cn(
          'glass-btn px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all',
          hasActiveFilters
            ? 'bg-sky-50 text-sky-700 border-sky-200'
            : 'text-slate-600'
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Filter by labels${hasActiveFilters ? ` (${selectedLabelIds.length} active)` : ''}`}
      >
        {/* Filter icon */}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>

        <span>Labels</span>

        {/* Active filter count badge */}
        {hasActiveFilters && (
          <span className="px-1.5 py-0.5 text-xs font-semibold bg-sky-500 text-white rounded-full">
            {selectedLabelIds.length}
          </span>
        )}

        {/* Dropdown arrow */}
        <svg
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 glass-lg shadow-xl max-h-80 overflow-auto">
          {/* Header with clear button */}
          <div className="px-4 py-2 border-b border-slate-200/60 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Filter by Label
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Label options */}
          <div className="py-1">
            {labels.map((label) => {
              const isSelected = selectedLabelIds.includes(label.id);

              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => handleToggleLabel(label.id)}
                  onKeyDown={(e) => handleKeyDown(e, label.id)}
                  className={cn(
                    'w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors',
                    'hover:bg-slate-100/50 focus:bg-slate-100/50 focus:outline-none',
                    isSelected && 'bg-sky-50/50'
                  )}
                  role="menuitemcheckbox"
                  aria-checked={isSelected}
                >
                  {/* Checkbox */}
                  <span
                    className={cn(
                      'flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                      isSelected
                        ? 'bg-sky-500 border-sky-500'
                        : 'bg-white border-slate-300'
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>

                  {/* Label badge */}
                  <LabelBadge label={label} size="sm" />

                  {/* Task count - shows filtered count when other filters active */}
                  {(() => {
                    const filteredCount = filteredLabelCounts?.get(label.id);
                    const totalCount = label.taskCount;

                    // When other filters are active, show filtered count with indicator
                    if (hasOtherFilters && filteredCount !== undefined) {
                      return (
                        <span className="ml-auto text-xs text-slate-400" title={`${filteredCount} of ${totalCount || 0} total tasks`}>
                          {filteredCount > 0 ? (
                            <span className="text-sky-500">{filteredCount} filtered</span>
                          ) : (
                            <span className="text-slate-300">0 filtered</span>
                          )}
                        </span>
                      );
                    }

                    // Default: show total task count
                    if (totalCount !== undefined && totalCount > 0) {
                      return (
                        <span className="ml-auto text-xs text-slate-400">
                          {totalCount}
                        </span>
                      );
                    }

                    return null;
                  })()}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-slate-200/60">
            <p className="text-xs text-slate-500">
              Tasks matching any selected label will be shown
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Filters tasks by label IDs.
 * Returns tasks that have at least one of the specified labels.
 *
 * @param taskIds - Array of task IDs with their label associations
 * @param selectedLabelIds - Label IDs to filter by
 * @param taskLabels - Map of taskId to labelIds
 * @returns Array of task IDs that match the filter
 */
export function filterTasksByLabels(
  taskIds: string[],
  selectedLabelIds: string[],
  taskLabels: Map<string, string[]>
): string[] {
  if (selectedLabelIds.length === 0) {
    return taskIds; // No filter, return all
  }

  return taskIds.filter((taskId) => {
    const labelIds = taskLabels.get(taskId) || [];
    // Task matches if it has at least one of the selected labels
    return labelIds.some((labelId) => selectedLabelIds.includes(labelId));
  });
}
