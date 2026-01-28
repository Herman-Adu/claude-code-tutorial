'use client';

/**
 * Kanban Hook - Zustand + Server Actions Integration
 *
 * This hook provides a backward-compatible interface for the kanban board
 * while internally using Zustand for state management and Server Actions
 * for database persistence.
 *
 * Key features:
 * - Same interface as the original localStorage-based hook
 * - Optimistic updates for immediate UI feedback
 * - Automatic rollback on server errors
 * - Hydration management for SSR compatibility
 * - Efficient re-render optimization via Zustand selectors
 */

import { useCallback, useEffect, useRef } from 'react';
import { useKanbanStore, type StoreTask, type CreateTaskData, type UpdateTaskData } from '@/store/kanban';
import {
  getTasks,
  createTask,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  moveTask as moveTaskAction,
  type TaskResponse,
} from '@/app/actions/tasks';
import type { ColumnId } from '@/lib/schemas';

// ============================================================================
// Types
// ============================================================================

/**
 * Legacy Task type for backward compatibility.
 * Maps to the original useKanban interface with lowercase priority/columnId.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  columnId: 'todo' | 'in-progress' | 'completed';
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
 * Legacy ColumnId type for backward compatibility.
 */
export type LegacyColumnId = 'todo' | 'in-progress' | 'completed';

/**
 * Return type for the useKanban hook.
 * Maintains the same interface as the original implementation.
 */
interface UseKanbanReturn {
  tasks: Task[];
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  /** Adds a task synchronously (fire-and-forget, for backward compatibility) */
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  /** Adds a task and returns the new task ID (for operations that need to wait for completion) */
  addTaskAsync: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newColumnId: LegacyColumnId, targetTaskId?: string) => void;
  getTasksByColumn: (columnId: LegacyColumnId) => Task[];
  clearError: () => void;
}

// ============================================================================
// Type Conversion Utilities
// ============================================================================

/**
 * Maps between legacy lowercase values and database uppercase values.
 */
const PRIORITY_MAP = {
  toStore: {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
  } as const,
  toLegacy: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  } as const,
};

const COLUMN_MAP = {
  toStore: {
    'todo': 'TODO',
    'in-progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
  } as const,
  toLegacy: {
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
  } as const,
};

/**
 * Converts a StoreTask to legacy Task format.
 */
function toLegacyTask(storeTask: StoreTask): Task {
  return {
    id: storeTask.id,
    title: storeTask.title,
    description: storeTask.description,
    priority: PRIORITY_MAP.toLegacy[storeTask.priority],
    tags: storeTask.tags,
    columnId: COLUMN_MAP.toLegacy[storeTask.columnId],
    categories: storeTask.categories,
    createdAt: storeTask.createdAt,
    updatedAt: storeTask.updatedAt,
    ownerName: storeTask.ownerName,
    ownerEmail: storeTask.ownerEmail,
    // Calendar fields - convert null to undefined for frontend compatibility
    dueDate: storeTask.dueDate ?? undefined,
    dueTime: storeTask.dueTime ?? undefined,
    isAllDay: storeTask.isAllDay,
  };
}

/**
 * Converts legacy task data to store format.
 */
function toStoreTaskData(
  legacyData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): CreateTaskData {
  return {
    title: legacyData.title,
    description: legacyData.description,
    priority: PRIORITY_MAP.toStore[legacyData.priority],
    tags: legacyData.tags,
    columnId: COLUMN_MAP.toStore[legacyData.columnId],
    categories: legacyData.categories ?? [],
    // Calendar fields
    dueDate: legacyData.dueDate,
    dueTime: legacyData.dueTime,
    isAllDay: legacyData.isAllDay,
  };
}

/**
 * Converts legacy update data to store format.
 */
function toStoreUpdateData(
  updates: Partial<Omit<Task, 'id' | 'createdAt'>>
): UpdateTaskData {
  const storeUpdates: UpdateTaskData = {};

  if (updates.title !== undefined) {
    storeUpdates.title = updates.title;
  }
  if (updates.description !== undefined) {
    storeUpdates.description = updates.description;
  }
  if (updates.priority !== undefined) {
    storeUpdates.priority = PRIORITY_MAP.toStore[updates.priority];
  }
  if (updates.tags !== undefined) {
    storeUpdates.tags = updates.tags;
  }
  if (updates.columnId !== undefined) {
    storeUpdates.columnId = COLUMN_MAP.toStore[updates.columnId];
  }
  if (updates.categories !== undefined) {
    storeUpdates.categories = updates.categories;
  }
  // Calendar fields
  if (updates.dueDate !== undefined) {
    storeUpdates.dueDate = updates.dueDate;
  }
  if (updates.dueTime !== undefined) {
    storeUpdates.dueTime = updates.dueTime;
  }
  if (updates.isAllDay !== undefined) {
    storeUpdates.isAllDay = updates.isAllDay;
  }

  return storeUpdates;
}

/**
 * Converts legacy columnId to store ColumnId.
 */
function toStoreColumnId(legacyColumnId: LegacyColumnId): ColumnId {
  return COLUMN_MAP.toStore[legacyColumnId];
}

/**
 * Transforms TaskResponse array to StoreTask array.
 */
function transformTaskResponses(tasks: TaskResponse[]): StoreTask[] {
  return tasks.map((task) => ({
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
  }));
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Kanban board state management hook.
 *
 * Uses Zustand for state management and Server Actions for persistence.
 * Provides backward compatibility with the original localStorage-based interface.
 */
export function useKanban(): UseKanbanReturn {
  // Store state and actions
  const tasks = useKanbanStore((state) => state.tasks);
  const isHydrated = useKanbanStore((state) => state.isHydrated);
  const isLoading = useKanbanStore((state) => state.isLoading);
  const error = useKanbanStore((state) => state.error);
  const setTasks = useKanbanStore((state) => state.setTasks);
  const setHydrated = useKanbanStore((state) => state.setHydrated);
  const setError = useKanbanStore((state) => state.setError);
  const storeAddTask = useKanbanStore((state) => state.addTask);
  const storeUpdateTask = useKanbanStore((state) => state.updateTask);
  const storeDeleteTask = useKanbanStore((state) => state.deleteTask);
  const storeMoveTask = useKanbanStore((state) => state.moveTask);

  // Track initialization to prevent duplicate fetches
  const isInitializing = useRef(false);

  // Fetch tasks on mount
  useEffect(() => {
    async function initializeTasks() {
      // Skip if already hydrated or currently initializing
      if (isHydrated || isInitializing.current) {
        return;
      }

      isInitializing.current = true;

      try {
        const result = await getTasks();

        if (result.success && result.data) {
          setTasks(transformTaskResponses(result.data));
        } else {
          // Set empty tasks and mark as hydrated even on error
          // This allows the UI to render with empty state
          setTasks([]);
          if (result.error) {
            setError(result.error);
          }
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setTasks([]);
        setError('Failed to load tasks');
      } finally {
        setHydrated(true);
        isInitializing.current = false;
      }
    }

    initializeTasks();
  }, [isHydrated, setTasks, setHydrated, setError]);

  // ========================================================================
  // Action Handlers
  // ========================================================================

  /**
   * Adds a new task with optimistic update.
   * Fire-and-forget version for backward compatibility.
   */
  const addTask = useCallback(
    (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const storeData = toStoreTaskData(taskData);
      storeAddTask(storeData, createTask);
    },
    [storeAddTask]
  );

  /**
   * Adds a new task and returns the new task ID.
   * Use this when you need to perform operations after task creation (e.g., setting labels).
   */
  const addTaskAsync = useCallback(
    async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
      const storeData = toStoreTaskData(taskData);
      return storeAddTask(storeData, createTask);
    },
    [storeAddTask]
  );

  /**
   * Updates an existing task with optimistic update.
   */
  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      const storeUpdates = toStoreUpdateData(updates);
      storeUpdateTask(id, storeUpdates, updateTaskAction);
    },
    [storeUpdateTask]
  );

  /**
   * Deletes a task with optimistic update.
   */
  const deleteTask = useCallback(
    (id: string) => {
      storeDeleteTask(id, deleteTaskAction);
    },
    [storeDeleteTask]
  );

  /**
   * Moves a task to a new column with optional reordering.
   */
  const moveTask = useCallback(
    (taskId: string, newColumnId: LegacyColumnId, targetTaskId?: string) => {
      const storeColumnId = toStoreColumnId(newColumnId);
      storeMoveTask(taskId, storeColumnId, targetTaskId, moveTaskAction);
    },
    [storeMoveTask]
  );

  /**
   * Gets all tasks in a specific column.
   * Returns tasks in legacy format for backward compatibility.
   */
  const getTasksByColumn = useCallback(
    (columnId: LegacyColumnId): Task[] => {
      const storeColumnId = toStoreColumnId(columnId);
      return tasks
        .filter((task) => task.columnId === storeColumnId)
        .map(toLegacyTask);
    },
    [tasks]
  );

  /**
   * Clears the current error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Convert all tasks to legacy format for backward compatibility
  const legacyTasks = tasks.map(toLegacyTask);

  return {
    tasks: legacyTasks,
    isHydrated,
    isLoading,
    error,
    addTask,
    addTaskAsync,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
    clearError,
  };
}

export default useKanban;
