/**
 * Kanban Zustand Store
 *
 * This store manages the kanban board state with optimistic updates.
 * It integrates with server actions for persistence to PostgreSQL.
 *
 * Key features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic rollback on server errors
 * - Loading and error state management
 * - Efficient selectors with shallow comparison
 * - DevTools integration for debugging
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { TaskResponse, ActionResponse } from '@/app/actions/tasks';
import type { ColumnId } from '@/lib/schemas';

// ============================================================================
// Types
// ============================================================================

/**
 * Task type used in the store.
 * Extends TaskResponse with string dates for easier manipulation.
 */
export interface StoreTask {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[];
  columnId: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  categories: string[];
  createdAt: string;
  updatedAt: string;
  // Owner fields
  ownerName?: string | null;
  ownerEmail?: string;
  // Calendar fields
  dueDate?: string;   // ISO date string
  dueTime?: string;   // HH:MM format
  isAllDay?: boolean;
}

/**
 * Input type for creating a new task.
 * Excludes auto-generated fields (id, timestamps).
 */
export type CreateTaskData = Omit<StoreTask, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating an existing task.
 * All fields are optional except id which is passed separately.
 */
export type UpdateTaskData = Partial<Omit<StoreTask, 'id' | 'createdAt'>>;

/**
 * Filter options for task search (store version).
 * Uses store-compatible types (uppercase enums, string dates).
 */
export interface StoreFilterOptions {
  /** Text search query for title and description */
  searchQuery?: string;
  /** Filter by priority level */
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  /** Filter by column/status */
  columnId?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | null;
  /** Filter by categories (tasks must have ALL specified categories) */
  categories?: string[];
  /** Filter by due date range */
  dateRange?: {
    start: string; // ISO date string
    end: string;   // ISO date string
  };
  /** Maximum number of results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Search result containing filtered tasks and pagination info.
 */
export interface StoreSearchResult {
  tasks: StoreTask[];
  total: number;
}

/**
 * Saved filter preset structure for the store.
 */
export interface StoreSavedFilterPreset {
  id: string;
  name: string;
  filters: StoreFilterOptions;
  createdAt?: string;
}

/**
 * Kanban store state interface.
 */
interface KanbanState {
  // Data
  tasks: StoreTask[];

  // Status flags
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  // Search and filter state
  searchQuery: string;
  filters: StoreFilterOptions;
  isSearching: boolean;
  searchResults: StoreSearchResult | null;
  savedFilterPresets: StoreSavedFilterPreset[];

  // Task mutations
  setTasks: (tasks: StoreTask[]) => void;
  addTask: (
    task: CreateTaskData,
    serverAction: (data: CreateTaskData) => Promise<ActionResponse<TaskResponse>>
  ) => Promise<string | null>;
  updateTask: (
    id: string,
    updates: UpdateTaskData,
    serverAction: (id: string, data: UpdateTaskData) => Promise<ActionResponse<TaskResponse>>
  ) => Promise<boolean>;
  deleteTask: (
    id: string,
    serverAction: (id: string) => Promise<ActionResponse>
  ) => Promise<boolean>;
  moveTask: (
    taskId: string,
    newColumnId: ColumnId,
    targetTaskId: string | undefined,
    serverAction: (input: {
      taskId: string;
      newColumnId: ColumnId;
      targetTaskId?: string;
    }) => Promise<ActionResponse<TaskResponse>>
  ) => Promise<boolean>;

  // Status setters
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;

  // Search and filter methods
  setSearchQuery: (query: string) => void;
  setFilter: <K extends keyof StoreFilterOptions>(key: K, value: StoreFilterOptions[K]) => void;
  setFilters: (filters: StoreFilterOptions) => void;
  clearFilters: () => void;
  setIsSearching: (searching: boolean) => void;
  setSearchResults: (results: StoreSearchResult | null) => void;
  setSavedFilterPresets: (presets: StoreSavedFilterPreset[]) => void;
  loadSavedPreset: (preset: StoreSavedFilterPreset) => void;

  // Selectors (computed values)
  getTasksByColumn: (columnId: ColumnId) => StoreTask[];
  getTaskById: (id: string) => StoreTask | undefined;
  getTotalTasks: () => number;
  getFilteredTasks: () => StoreTask[];
  hasActiveFilters: () => boolean;
  getActiveFilterCount: () => number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a temporary ID for optimistic updates.
 * Uses timestamp + random string for uniqueness.
 */
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Converts a TaskResponse from server to StoreTask format.
 * Handles Date to string conversion for timestamps and calendar fields.
 */
function transformTaskResponse(task: TaskResponse): StoreTask {
  return {
    ...task,
    createdAt:
      task.createdAt instanceof Date
        ? task.createdAt.toISOString()
        : task.createdAt,
    updatedAt:
      task.updatedAt instanceof Date
        ? task.updatedAt.toISOString()
        : task.updatedAt,
    // Convert dueDate from Date to ISO string, null to undefined
    dueDate:
      task.dueDate instanceof Date
        ? task.dueDate.toISOString()
        : task.dueDate ?? undefined,
    // Convert null to undefined for dueTime
    dueTime: task.dueTime ?? undefined,
  };
}

/**
 * Gets current ISO timestamp string.
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * Kanban Zustand store with devtools middleware.
 *
 * The store follows these patterns:
 * 1. Optimistic updates: State changes immediately on user action
 * 2. Server sync: Background server action call
 * 3. Rollback: Revert to previous state on error
 * 4. Error handling: Capture and expose errors for UI feedback
 */
export const useKanbanStore = create<KanbanState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tasks: [],
      isHydrated: false,
      isLoading: false,
      error: null,

      // Search and filter initial state
      searchQuery: '',
      filters: {},
      isSearching: false,
      searchResults: null,
      savedFilterPresets: [],

      // ========================================================================
      // State Setters
      // ========================================================================

      setTasks: (tasks) => {
        set({ tasks, isHydrated: true }, false, 'setTasks');
      },

      setLoading: (loading) => {
        set({ isLoading: loading }, false, 'setLoading');
      },

      setError: (error) => {
        set({ error }, false, 'setError');
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated }, false, 'setHydrated');
      },

      // ========================================================================
      // Search and Filter Methods
      // ========================================================================

      setSearchQuery: (query) => {
        // Trim and limit to 200 characters
        const trimmed = query.trim().slice(0, 200);
        set({ searchQuery: trimmed }, false, 'setSearchQuery');
      },

      setFilter: (key, value) => {
        set(
          (state) => ({
            filters: { ...state.filters, [key]: value },
          }),
          false,
          `setFilter/${String(key)}`
        );
      },

      setFilters: (filters) => {
        set({ filters }, false, 'setFilters');
      },

      clearFilters: () => {
        set(
          { searchQuery: '', filters: {}, searchResults: null },
          false,
          'clearFilters'
        );
      },

      setIsSearching: (searching) => {
        set({ isSearching: searching }, false, 'setIsSearching');
      },

      setSearchResults: (results) => {
        set({ searchResults: results }, false, 'setSearchResults');
      },

      setSavedFilterPresets: (presets) => {
        set({ savedFilterPresets: presets }, false, 'setSavedFilterPresets');
      },

      loadSavedPreset: (preset) => {
        set(
          {
            filters: preset.filters,
            searchQuery: preset.filters.searchQuery || '',
          },
          false,
          'loadSavedPreset'
        );
      },

      // ========================================================================
      // Task Mutations with Optimistic Updates
      // ========================================================================

      /**
       * Adds a new task with optimistic update.
       * Returns the new task ID on success, null on failure.
       */
      addTask: async (taskData, serverAction) => {
        const tempId = generateTempId();
        const now = getTimestamp();
        const previousTasks = get().tasks;

        // Optimistic update - add task immediately with temp ID
        const optimisticTask: StoreTask = {
          ...taskData,
          id: tempId,
          createdAt: now,
          updatedAt: now,
        };

        set(
          { tasks: [...previousTasks, optimisticTask], isLoading: true, error: null },
          false,
          'addTask/optimistic'
        );

        try {
          const result = await serverAction(taskData);

          if (result.success && result.data) {
            // Replace temp task with server response
            const serverTask = transformTaskResponse(result.data);
            set(
              (state) => ({
                tasks: state.tasks.map((t) =>
                  t.id === tempId ? serverTask : t
                ),
                isLoading: false,
              }),
              false,
              'addTask/success'
            );
            return serverTask.id;
          } else {
            // Rollback on failure
            set(
              { tasks: previousTasks, isLoading: false, error: result.error || 'Failed to add task' },
              false,
              'addTask/rollback'
            );
            return null;
          }
        } catch (error) {
          // Rollback on exception
          const errorMessage = error instanceof Error ? error.message : 'Failed to add task';
          set(
            { tasks: previousTasks, isLoading: false, error: errorMessage },
            false,
            'addTask/error'
          );
          return null;
        }
      },

      /**
       * Updates an existing task with optimistic update.
       * Returns true on success, false on failure.
       */
      updateTask: async (id, updates, serverAction) => {
        const previousTasks = get().tasks;
        const taskIndex = previousTasks.findIndex((t) => t.id === id);

        if (taskIndex === -1) {
          set({ error: 'Task not found' }, false, 'updateTask/notFound');
          return false;
        }

        // Optimistic update
        const updatedTask: StoreTask = {
          ...previousTasks[taskIndex],
          ...updates,
          updatedAt: getTimestamp(),
        };

        const optimisticTasks = [...previousTasks];
        optimisticTasks[taskIndex] = updatedTask;

        set(
          { tasks: optimisticTasks, isLoading: true, error: null },
          false,
          'updateTask/optimistic'
        );

        try {
          const result = await serverAction(id, updates);

          if (result.success && result.data) {
            // Update with server response (may have different updatedAt)
            const serverTask = transformTaskResponse(result.data);
            set(
              (state) => ({
                tasks: state.tasks.map((t) => (t.id === id ? serverTask : t)),
                isLoading: false,
              }),
              false,
              'updateTask/success'
            );
            return true;
          } else {
            // Rollback on failure
            set(
              { tasks: previousTasks, isLoading: false, error: result.error || 'Failed to update task' },
              false,
              'updateTask/rollback'
            );
            return false;
          }
        } catch (error) {
          // Rollback on exception
          const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
          set(
            { tasks: previousTasks, isLoading: false, error: errorMessage },
            false,
            'updateTask/error'
          );
          return false;
        }
      },

      /**
       * Deletes a task with optimistic update.
       * Returns true on success, false on failure.
       */
      deleteTask: async (id, serverAction) => {
        const previousTasks = get().tasks;
        const taskExists = previousTasks.some((t) => t.id === id);

        if (!taskExists) {
          set({ error: 'Task not found' }, false, 'deleteTask/notFound');
          return false;
        }

        // Optimistic update - remove immediately
        set(
          {
            tasks: previousTasks.filter((t) => t.id !== id),
            isLoading: true,
            error: null,
          },
          false,
          'deleteTask/optimistic'
        );

        try {
          const result = await serverAction(id);

          if (result.success) {
            set({ isLoading: false }, false, 'deleteTask/success');
            return true;
          } else {
            // Rollback on failure
            set(
              { tasks: previousTasks, isLoading: false, error: result.error || 'Failed to delete task' },
              false,
              'deleteTask/rollback'
            );
            return false;
          }
        } catch (error) {
          // Rollback on exception
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
          set(
            { tasks: previousTasks, isLoading: false, error: errorMessage },
            false,
            'deleteTask/error'
          );
          return false;
        }
      },

      /**
       * Moves a task to a new column with optional reordering.
       * Implements optimistic update with rollback on failure.
       */
      moveTask: async (taskId, newColumnId, targetTaskId, serverAction) => {
        const previousTasks = get().tasks;
        const taskToMove = previousTasks.find((t) => t.id === taskId);

        if (!taskToMove) {
          set({ error: 'Task not found' }, false, 'moveTask/notFound');
          return false;
        }

        // Build optimistic task list
        const withoutTask = previousTasks.filter((t) => t.id !== taskId);
        const movedTask: StoreTask = {
          ...taskToMove,
          columnId: newColumnId,
          updatedAt: getTimestamp(),
        };

        let optimisticTasks: StoreTask[];

        if (targetTaskId) {
          // Insert before target task
          const targetIndex = withoutTask.findIndex((t) => t.id === targetTaskId);
          if (targetIndex !== -1) {
            optimisticTasks = [
              ...withoutTask.slice(0, targetIndex),
              movedTask,
              ...withoutTask.slice(targetIndex),
            ];
          } else {
            // Target not found, append to end
            optimisticTasks = [...withoutTask, movedTask];
          }
        } else {
          // No target - find where to insert based on column
          // Find the last task in the target column
          let insertIndex = withoutTask.length;

          for (let i = withoutTask.length - 1; i >= 0; i--) {
            if (withoutTask[i].columnId === newColumnId) {
              insertIndex = i + 1;
              break;
            }
          }

          // If no tasks in target column, find position based on column order
          const columnTasks = withoutTask.filter((t) => t.columnId === newColumnId);
          if (columnTasks.length === 0) {
            const columnOrder: ColumnId[] = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
            const targetColumnIndex = columnOrder.indexOf(newColumnId);

            for (let i = 0; i < withoutTask.length; i++) {
              const taskColumnIndex = columnOrder.indexOf(withoutTask[i].columnId);
              if (taskColumnIndex > targetColumnIndex) {
                insertIndex = i;
                break;
              }
            }
          }

          optimisticTasks = [
            ...withoutTask.slice(0, insertIndex),
            movedTask,
            ...withoutTask.slice(insertIndex),
          ];
        }

        // Apply optimistic update
        set(
          { tasks: optimisticTasks, isLoading: true, error: null },
          false,
          'moveTask/optimistic'
        );

        try {
          const result = await serverAction({
            taskId,
            newColumnId,
            targetTaskId,
          });

          if (result.success && result.data) {
            // Update with server response
            const serverTask = transformTaskResponse(result.data);
            set(
              (state) => ({
                tasks: state.tasks.map((t) => (t.id === taskId ? serverTask : t)),
                isLoading: false,
              }),
              false,
              'moveTask/success'
            );
            return true;
          } else {
            // Rollback on failure
            set(
              { tasks: previousTasks, isLoading: false, error: result.error || 'Failed to move task' },
              false,
              'moveTask/rollback'
            );
            return false;
          }
        } catch (error) {
          // Rollback on exception
          const errorMessage = error instanceof Error ? error.message : 'Failed to move task';
          set(
            { tasks: previousTasks, isLoading: false, error: errorMessage },
            false,
            'moveTask/error'
          );
          return false;
        }
      },

      // ========================================================================
      // Selectors
      // ========================================================================

      /**
       * Gets all tasks in a specific column.
       * Maintains task order within the column.
       */
      getTasksByColumn: (columnId) => {
        return get().tasks.filter((task) => task.columnId === columnId);
      },

      /**
       * Gets a single task by ID.
       * Returns undefined if not found.
       */
      getTaskById: (id) => {
        return get().tasks.find((task) => task.id === id);
      },

      /**
       * Gets the total count of all tasks.
       */
      getTotalTasks: () => {
        return get().tasks.length;
      },

      /**
       * Gets filtered tasks based on active search query and filters.
       * Applies client-side filtering to the tasks in the store.
       */
      getFilteredTasks: () => {
        const { tasks, searchQuery, filters } = get();
        let filtered = [...tasks];

        // Filter by search query (title and description)
        if (searchQuery && searchQuery.trim().length > 0) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (task) =>
              task.title.toLowerCase().includes(query) ||
              task.description.toLowerCase().includes(query)
          );
        }

        // Filter by searchQuery in filters object (secondary search)
        if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (task) =>
              task.title.toLowerCase().includes(query) ||
              task.description.toLowerCase().includes(query)
          );
        }

        // Filter by priority
        if (filters.priority) {
          filtered = filtered.filter((task) => task.priority === filters.priority);
        }

        // Filter by column
        if (filters.columnId) {
          filtered = filtered.filter((task) => task.columnId === filters.columnId);
        }

        // Filter by categories (task must have ALL specified categories)
        if (filters.categories && filters.categories.length > 0) {
          filtered = filtered.filter((task) => {
            const taskCategories = task.categories || [];
            return filters.categories!.every((cat) => taskCategories.includes(cat));
          });
        }

        // Filter by date range
        if (filters.dateRange) {
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          filtered = filtered.filter((task) => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= startDate && dueDate <= endDate;
          });
        }

        // Apply pagination if specified
        if (filters.offset !== undefined || filters.limit !== undefined) {
          const offset = filters.offset || 0;
          const limit = filters.limit || 50;
          filtered = filtered.slice(offset, offset + limit);
        }

        return filtered;
      },

      /**
       * Checks if any filters are currently active.
       */
      hasActiveFilters: () => {
        const { searchQuery, filters } = get();
        return !!(
          searchQuery.trim() ||
          filters.searchQuery?.trim() ||
          filters.priority ||
          filters.columnId ||
          (filters.categories && filters.categories.length > 0) ||
          filters.dateRange
        );
      },

      /**
       * Gets the count of active filters for UI display.
       */
      getActiveFilterCount: () => {
        const { searchQuery, filters } = get();
        let count = 0;

        if (searchQuery.trim() || filters.searchQuery?.trim()) count++;
        if (filters.priority) count++;
        if (filters.columnId) count++;
        if (filters.categories && filters.categories.length > 0) count++;
        if (filters.dateRange) count++;

        return count;
      },
    }),
    {
      name: 'kanban-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selector Hooks
// ============================================================================

/**
 * Hook to select tasks by column ID.
 * Uses shallow comparison to prevent unnecessary re-renders.
 */
export function useTasksByColumn(columnId: ColumnId): StoreTask[] {
  return useKanbanStore(useShallow((state) => state.getTasksByColumn(columnId)));
}

/**
 * Hook to select a single task by ID.
 */
export function useTaskById(id: string): StoreTask | undefined {
  return useKanbanStore((state) => state.getTaskById(id));
}

/**
 * Hook to get the total task count.
 */
export function useTotalTasks(): number {
  return useKanbanStore((state) => state.getTotalTasks());
}

/**
 * Hook to select hydration status.
 */
export function useIsHydrated(): boolean {
  return useKanbanStore((state) => state.isHydrated);
}

/**
 * Hook to select loading status.
 */
export function useIsLoading(): boolean {
  return useKanbanStore((state) => state.isLoading);
}

/**
 * Hook to select error state.
 */
export function useError(): string | null {
  return useKanbanStore((state) => state.error);
}

/**
 * Hook to select multiple state values with shallow comparison.
 * Useful for components that need several pieces of state.
 */
export function useKanbanStatus() {
  return useKanbanStore(
    useShallow((state) => ({
      isHydrated: state.isHydrated,
      isLoading: state.isLoading,
      error: state.error,
    }))
  );
}

// ============================================================================
// Date Filtering Selectors
// ============================================================================

/**
 * Filters tasks by a date range.
 * Tasks without a dueDate are excluded.
 *
 * Note: The StoreTask type uses ISO string dates, so we compare strings directly.
 * For calendar integration, this works with the useTasksByDate hook which fetches
 * from the server. This selector is useful for client-side filtering when tasks
 * are already in the store.
 *
 * @param tasks - Array of store tasks
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns Filtered tasks within the date range
 */
export function filterTasksByDateRange(
  tasks: StoreTask[],
  startDate: Date,
  endDate: Date
): StoreTask[] {
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  return tasks.filter((task) => {
    // Tasks must have createdAt to be included in date filtering
    // For calendar view, we use the dueDate from the task resource
    // but the store doesn't currently track dueDate - that comes from the server
    // This selector filters by createdAt as a fallback
    return task.createdAt >= startIso && task.createdAt <= endIso;
  });
}

/**
 * Hook to get tasks within a specific date range from the store.
 * Uses shallow comparison for performance.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Tasks within the specified date range
 */
export function useTasksByDateRange(startDate: Date, endDate: Date): StoreTask[] {
  return useKanbanStore(
    useShallow((state) => filterTasksByDateRange(state.tasks, startDate, endDate))
  );
}

/**
 * Hook to get all tasks that have been modified today.
 * Useful for showing recent activity.
 */
export function useTasksModifiedToday(): StoreTask[] {
  return useKanbanStore(
    useShallow((state) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowIso = tomorrow.toISOString();

      return state.tasks.filter(
        (task) => task.updatedAt >= todayIso && task.updatedAt < tomorrowIso
      );
    })
  );
}

// ============================================================================
// Search and Filter Selector Hooks
// ============================================================================

/**
 * Hook to get the current search query.
 */
export function useSearchQuery(): string {
  return useKanbanStore((state) => state.searchQuery);
}

/**
 * Hook to get the current filters.
 */
export function useFilters(): StoreFilterOptions {
  return useKanbanStore(useShallow((state) => state.filters));
}

/**
 * Hook to get filtered tasks based on active search/filters.
 * Uses shallow comparison to prevent unnecessary re-renders.
 */
export function useFilteredTasks(): StoreTask[] {
  return useKanbanStore(useShallow((state) => state.getFilteredTasks()));
}

/**
 * Hook to check if search is in progress.
 */
export function useIsSearching(): boolean {
  return useKanbanStore((state) => state.isSearching);
}

/**
 * Hook to get search results (for server-side search).
 */
export function useSearchResults(): StoreSearchResult | null {
  return useKanbanStore(useShallow((state) => state.searchResults));
}

/**
 * Hook to get saved filter presets.
 */
export function useSavedFilterPresets(): StoreSavedFilterPreset[] {
  return useKanbanStore(useShallow((state) => state.savedFilterPresets));
}

/**
 * Hook to check if any filters are active.
 */
export function useHasActiveFilters(): boolean {
  return useKanbanStore((state) => state.hasActiveFilters());
}

/**
 * Hook to get the count of active filters.
 */
export function useActiveFilterCount(): number {
  return useKanbanStore((state) => state.getActiveFilterCount());
}

/**
 * Hook to get all search/filter related state and actions.
 * Useful for components that need multiple filter-related values.
 */
export function useSearchFilterState() {
  return useKanbanStore(
    useShallow((state) => ({
      searchQuery: state.searchQuery,
      filters: state.filters,
      isSearching: state.isSearching,
      searchResults: state.searchResults,
      savedFilterPresets: state.savedFilterPresets,
      hasActiveFilters: state.hasActiveFilters(),
      activeFilterCount: state.getActiveFilterCount(),
      filteredTasks: state.getFilteredTasks(),
      // Actions
      setSearchQuery: state.setSearchQuery,
      setFilter: state.setFilter,
      setFilters: state.setFilters,
      clearFilters: state.clearFilters,
      setIsSearching: state.setIsSearching,
      setSearchResults: state.setSearchResults,
      setSavedFilterPresets: state.setSavedFilterPresets,
      loadSavedPreset: state.loadSavedPreset,
    }))
  );
}

// Export store for direct access (useful for testing and devtools)
export default useKanbanStore;
