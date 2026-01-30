'use client';

import { useCallback, useMemo } from 'react';
import { Task, ColumnId } from '@/types';
import {
  useSearchQuery,
  useFilters,
  useHasActiveFilters,
  useActiveFilterCount,
} from '@/store/kanban';
import { useLabelsStore } from '@/store/labels';

/**
 * Return type for the useTaskFiltering hook
 */
export interface TaskFilteringResult {
  /** Get filtered tasks for a specific column */
  getFilteredTasksByColumn: (columnId: ColumnId) => Task[];
  /** Count of filtered tasks per column */
  filteredTaskCounts: Record<string, number>;
  /** Whether any non-label filters are active */
  hasNonLabelFilters: boolean;
  /** Task IDs filtered by non-label filters (for label filter count calculation) */
  filteredTaskIdsWithoutLabelFilter: string[] | undefined;
  /** Current search query */
  searchQuery: string;
  /** Current filters */
  filters: ReturnType<typeof useFilters>;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Count of active filters */
  activeFilterCount: number;
}

/**
 * Task Filtering Hook
 *
 * Handles all task filtering logic including:
 * - Search query filtering by title/description
 * - Priority filtering
 * - Category filtering (must have ALL specified categories)
 * - Date range filtering
 * - Label filtering
 *
 * @param tasks - Array of all tasks
 * @param getTasksByColumn - Function to get tasks by column from useKanban
 * @param labelFilterIds - Array of label IDs to filter by
 */
export function useTaskFiltering(
  tasks: Task[],
  getTasksByColumn: (columnId: ColumnId) => Task[],
  labelFilterIds: string[],
  columns: Array<{ id: ColumnId }>
): TaskFilteringResult {
  // Search and filter state from Zustand
  const searchQuery = useSearchQuery();
  const filters = useFilters();
  const hasActiveFilters = useHasActiveFilters();
  const activeFilterCount = useActiveFilterCount();
  const taskLabelsMap = useLabelsStore((state) => state.taskLabels);

  // Filter tasks by search, filters, and labels
  const getFilteredTasksByColumn = useCallback(
    (columnId: ColumnId) => {
      let columnTasks = getTasksByColumn(columnId);

      // Apply search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        columnTasks = columnTasks.filter(
          (task) =>
            task.title.toLowerCase().includes(query) ||
            task.description.toLowerCase().includes(query)
        );
      }

      // Apply priority filter
      if (filters.priority) {
        columnTasks = columnTasks.filter(
          (task) => task.priority.toLowerCase() === filters.priority!.toLowerCase()
        );
      }

      // Apply categories filter
      if (filters.categories && filters.categories.length > 0) {
        columnTasks = columnTasks.filter((task) => {
          const taskCategories = task.categories || [];
          return filters.categories!.every((cat) =>
            taskCategories.some((tc) => tc.toLowerCase() === cat.toLowerCase())
          );
        });
      }

      // Apply date range filter
      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        columnTasks = columnTasks.filter((task) => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= startDate && dueDate <= endDate;
        });
      }

      // Apply label filter (if any labels selected)
      if (labelFilterIds.length > 0) {
        columnTasks = columnTasks.filter((task) => {
          const taskLabelIds = taskLabelsMap.get(task.id) || [];
          return taskLabelIds.some((labelId) => labelFilterIds.includes(labelId));
        });
      }

      return columnTasks;
    },
    [getTasksByColumn, searchQuery, filters, labelFilterIds, taskLabelsMap]
  );

  // Count filtered tasks for column headers
  const filteredTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    columns.forEach((column) => {
      counts[column.id] = getFilteredTasksByColumn(column.id).length;
    });
    return counts;
  }, [getFilteredTasksByColumn, columns]);

  // Check if non-label filters are active (for label filter count display)
  const hasNonLabelFilters = useMemo(() => {
    return !!(
      searchQuery.trim() ||
      filters.priority ||
      (filters.categories && filters.categories.length > 0) ||
      filters.dateRange
    );
  }, [searchQuery, filters]);

  // Get task IDs filtered by non-label filters (for label filter count calculation)
  const filteredTaskIdsWithoutLabelFilter = useMemo(() => {
    if (!hasNonLabelFilters) {
      return undefined; // No need to calculate if no filters active
    }

    const allFilteredTaskIds: string[] = [];

    tasks.forEach((task) => {
      // Apply search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (
          !task.title.toLowerCase().includes(query) &&
          !task.description.toLowerCase().includes(query)
        ) {
          return; // Skip this task
        }
      }

      // Apply priority filter
      if (filters.priority) {
        if (task.priority.toLowerCase() !== filters.priority.toLowerCase()) {
          return;
        }
      }

      // Apply categories filter
      if (filters.categories && filters.categories.length > 0) {
        const taskCategories = task.categories || [];
        const hasAllCategories = filters.categories.every((cat) =>
          taskCategories.some((tc) => tc.toLowerCase() === cat.toLowerCase())
        );
        if (!hasAllCategories) {
          return;
        }
      }

      // Apply date range filter
      if (filters.dateRange) {
        if (!task.dueDate) {
          return;
        }
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        const dueDate = new Date(task.dueDate);
        if (dueDate < startDate || dueDate > endDate) {
          return;
        }
      }

      // Task passed all filters (except label filter)
      allFilteredTaskIds.push(task.id);
    });

    return allFilteredTaskIds;
  }, [tasks, searchQuery, filters, hasNonLabelFilters]);

  return {
    getFilteredTasksByColumn,
    filteredTaskCounts,
    hasNonLabelFilters,
    filteredTaskIdsWithoutLabelFilter,
    searchQuery,
    filters,
    hasActiveFilters,
    activeFilterCount,
  };
}
