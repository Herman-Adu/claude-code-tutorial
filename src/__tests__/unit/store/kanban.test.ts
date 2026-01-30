/**
 * Kanban Store Unit Tests
 *
 * Comprehensive tests for the Kanban Zustand store covering:
 * - Error handling and rollback behavior
 * - Positioning logic for task moves
 * - Selector hooks functionality
 * - Edge cases and concurrent operations
 *
 * Target: Increase coverage from 61% to 85%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKanbanStore,
  useTasksByColumn,
  useTaskById,
  useTotalTasks,
  useIsHydrated,
  useIsLoading,
  useError,
  useKanbanStatus,
  type StoreTask,
} from '@/store/kanban';
import * as taskActions from '@/app/actions/tasks';

import {
  // Store assertions
  resetStore,
  resetStoreWithTasks,
  waitForLoadingComplete,
  getStoreState,
  getTasksByColumn,
  getTaskById,
  taskExists,
  getTaskIds,
  getColumnTaskIds,
  // Task factories
  resetTaskIdCounter,
  createStoreTask,
  createTaskInput,
  createTaskResponse,
  // Server action mocks
  mockServerSuccess,
  mockServerError,
  createMockCreateTaskSuccess,
  createMockCreateTaskError,
  createMockCreateTaskException,
  createMockUpdateTaskSuccess,
  createMockDeleteTaskSuccess,
  createMockMoveTaskSuccess,
} from '@test-utils';

import {
  createMultiColumnScenario,
  createSameColumnScenario,
  createSingleTaskScenario,
  createEmptyScenario,
  createSingleColumnScenario,
  createLargeDatasetScenario,
} from './fixtures/test-scenarios';

// ============================================================================
// Test Setup
// ============================================================================

vi.mock('@/app/actions/tasks');

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
  resetTaskIdCounter();
});

// ============================================================================
// Error Handling & Rollback Tests
// ============================================================================

describe('Error Handling & Rollback', () => {
  describe('addTask errors', () => {
    it('should rollback on server failure response', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const initialCount = store.tasks.length;

      const mockAction = createMockCreateTaskError('Database error');
      const taskData = createTaskInput({ title: 'New Task' });

      const result = await store.addTask(taskData, mockAction);

      expect(result).toBeNull();
      expect(getStoreState().error).toBe('Database error');
      expect(getStoreState().tasks.length).toBe(initialCount);
      expect(getStoreState().isLoading).toBe(false);
    });

    it('should rollback on server exception', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const initialTaskIds = store.tasks.map((t) => t.id);

      const mockAction = createMockCreateTaskException(new Error('Network error'));
      const taskData = createTaskInput();

      const result = await store.addTask(taskData, mockAction);

      expect(result).toBeNull();
      expect(getStoreState().error).toBe('Network error');
      expect(getStoreState().tasks.map((t) => t.id)).toEqual(initialTaskIds);
    });

    it('should handle non-Error exceptions', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const mockAction = vi.fn().mockRejectedValue('string error');
      const taskData = createTaskInput();

      const result = await store.addTask(taskData, mockAction);

      expect(result).toBeNull();
      expect(getStoreState().error).toBe('Failed to add task');
    });

    it('should use default error message when server returns no error', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const mockAction = vi.fn().mockResolvedValue({ success: false });
      const taskData = createTaskInput();

      const result = await store.addTask(taskData, mockAction);

      expect(result).toBeNull();
      expect(getStoreState().error).toBe('Failed to add task');
    });

    it('should restore exact previous state on rollback', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const initialSnapshot = JSON.stringify(store.tasks);

      const mockAction = createMockCreateTaskError('Error');

      await store.addTask(createTaskInput(), mockAction);

      expect(JSON.stringify(getStoreState().tasks)).toBe(initialSnapshot);
    });
  });

  describe('updateTask errors', () => {
    it('should return false and set error when task not found', async () => {
      resetStoreWithTasks(createMultiColumnScenario());
      const store = useKanbanStore.getState();

      const result = await store.updateTask(
        'non-existent-id',
        { title: 'Updated' },
        createMockUpdateTaskSuccess()
      );

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Task not found');
    });

    it('should rollback on server failure response', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const originalTask = initialTasks[0];

      const mockAction = vi.fn().mockResolvedValue(mockServerError('Update failed'));

      const result = await store.updateTask(
        originalTask.id,
        { title: 'Updated Title' },
        mockAction
      );

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Update failed');
      expect(getTaskById(originalTask.id)?.title).toBe(originalTask.title);
    });

    it('should rollback on server exception', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const originalTask = initialTasks[0];

      const mockAction = vi.fn().mockRejectedValue(new Error('Connection lost'));

      const result = await store.updateTask(
        originalTask.id,
        { title: 'Updated Title' },
        mockAction
      );

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Connection lost');
      expect(getTaskById(originalTask.id)?.title).toBe(originalTask.title);
    });

    it('should handle non-Error exceptions', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();

      const mockAction = vi.fn().mockRejectedValue({ code: 500 });

      const result = await store.updateTask(
        initialTasks[0].id,
        { title: 'Updated' },
        mockAction
      );

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Failed to update task');
    });
  });

  describe('deleteTask errors', () => {
    it('should return false and set error when task not found', async () => {
      resetStoreWithTasks(createMultiColumnScenario());
      const store = useKanbanStore.getState();

      const result = await store.deleteTask('non-existent-id', createMockDeleteTaskSuccess());

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Task not found');
    });

    it('should rollback on server failure response', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const taskToDelete = initialTasks[0];

      const mockAction = vi.fn().mockResolvedValue(mockServerError('Delete failed'));

      const result = await store.deleteTask(taskToDelete.id, mockAction);

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Delete failed');
      expect(taskExists(taskToDelete.id)).toBe(true);
    });

    it('should rollback on server exception', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const taskToDelete = initialTasks[0];

      const mockAction = vi.fn().mockRejectedValue(new Error('Network timeout'));

      const result = await store.deleteTask(taskToDelete.id, mockAction);

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Network timeout');
      expect(taskExists(taskToDelete.id)).toBe(true);
    });

    it('should handle non-Error exceptions', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();

      const mockAction = vi.fn().mockRejectedValue(null);

      const result = await store.deleteTask(initialTasks[0].id, mockAction);

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Failed to delete task');
    });
  });

  describe('moveTask errors', () => {
    it('should return false and set error when task not found', async () => {
      resetStoreWithTasks(createMultiColumnScenario());
      const store = useKanbanStore.getState();

      const result = await store.moveTask(
        'non-existent-id',
        'IN_PROGRESS',
        undefined,
        createMockMoveTaskSuccess()
      );

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Task not found');
    });

    it('should rollback on server failure response', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const taskToMove = initialTasks[0]; // TODO column
      const originalColumnId = taskToMove.columnId;

      const mockAction = vi.fn().mockResolvedValue(mockServerError('Move failed'));

      const result = await store.moveTask(
        taskToMove.id,
        'IN_PROGRESS',
        undefined,
        mockAction
      );

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Move failed');
      expect(getTaskById(taskToMove.id)?.columnId).toBe(originalColumnId);
    });

    it('should rollback on server exception', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const taskToMove = initialTasks[0];
      const originalColumnId = taskToMove.columnId;

      const mockAction = vi.fn().mockRejectedValue(new Error('Server unavailable'));

      const result = await store.moveTask(
        taskToMove.id,
        'COMPLETED',
        undefined,
        mockAction
      );

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Server unavailable');
      expect(getTaskById(taskToMove.id)?.columnId).toBe(originalColumnId);
    });

    it('should handle non-Error exceptions', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();

      const mockAction = vi.fn().mockRejectedValue(undefined);

      const result = await store.moveTask(
        initialTasks[0].id,
        'IN_PROGRESS',
        undefined,
        mockAction
      );

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Failed to move task');
    });
  });
});

// ============================================================================
// Positioning Logic Tests
// ============================================================================

describe('Positioning Logic', () => {
  describe('moveTask with targetTaskId', () => {
    it('should insert before target task in same column', async () => {
      const tasks = createSameColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      // Move reorder-5 (last) before reorder-2 (second)
      const mockAction = createMockMoveTaskSuccess();
      await store.moveTask('reorder-5', 'TODO', 'reorder-2', mockAction);

      const todoIds = getColumnTaskIds('TODO');
      const movedIndex = todoIds.indexOf('reorder-5');
      const targetIndex = todoIds.indexOf('reorder-2');

      expect(movedIndex).toBeLessThan(targetIndex);
      expect(movedIndex).toBe(targetIndex - 1);
    });

    it('should insert before target task in different column', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      // Move task-1 (TODO) before task-4 (IN_PROGRESS)
      const mockAction = createMockMoveTaskSuccess();
      await store.moveTask('task-1', 'IN_PROGRESS', 'task-4', mockAction);

      const movedTask = getTaskById('task-1');
      expect(movedTask?.columnId).toBe('IN_PROGRESS');

      const inProgressIds = getColumnTaskIds('IN_PROGRESS');
      const movedIndex = inProgressIds.indexOf('task-1');
      const targetIndex = inProgressIds.indexOf('task-4');

      expect(movedIndex).toBe(targetIndex - 1);
    });

    it('should append to end when target task not found', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();
      const initialTaskCount = store.tasks.length;

      const mockAction = createMockMoveTaskSuccess();
      await store.moveTask('task-1', 'IN_PROGRESS', 'non-existent-target', mockAction);

      const movedTask = getTaskById('task-1');
      expect(movedTask?.columnId).toBe('IN_PROGRESS');
      expect(getStoreState().tasks.length).toBe(initialTaskCount);
    });

    it('should handle moving first task with target', async () => {
      const tasks = createSameColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      // Move reorder-1 (first) before reorder-4 (fourth)
      const mockAction = createMockMoveTaskSuccess();
      await store.moveTask('reorder-1', 'TODO', 'reorder-4', mockAction);

      const todoIds = getColumnTaskIds('TODO');
      const movedIndex = todoIds.indexOf('reorder-1');
      const targetIndex = todoIds.indexOf('reorder-4');

      expect(movedIndex).toBe(targetIndex - 1);
    });
  });

  describe('moveTask without targetTaskId (cross-column)', () => {
    it('should move to empty column and maintain position based on column order', async () => {
      const tasks = createSingleColumnScenario(); // Only TODO tasks
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      const mockAction = createMockMoveTaskSuccess();
      await store.moveTask('only-todo-1', 'IN_PROGRESS', undefined, mockAction);

      const movedTask = getTaskById('only-todo-1');
      expect(movedTask?.columnId).toBe('IN_PROGRESS');
      expect(getColumnTaskIds('IN_PROGRESS')).toContain('only-todo-1');
    });

    it('should insert at end of target column when no target specified', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      const mockAction = createMockMoveTaskSuccess();
      await store.moveTask('task-1', 'IN_PROGRESS', undefined, mockAction);

      const inProgressIds = getColumnTaskIds('IN_PROGRESS');
      expect(inProgressIds[inProgressIds.length - 1]).toBe('task-1');
    });

    it('should handle moving to COMPLETED column', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      const mockAction = createMockMoveTaskSuccess();
      await store.moveTask('task-1', 'COMPLETED', undefined, mockAction);

      const movedTask = getTaskById('task-1');
      expect(movedTask?.columnId).toBe('COMPLETED');
    });

    it('should maintain column ordering for empty target column', async () => {
      // Create scenario where IN_PROGRESS is empty
      const tasks: StoreTask[] = [
        createStoreTask({ id: 'todo-1', columnId: 'TODO' }),
        createStoreTask({ id: 'completed-1', columnId: 'COMPLETED' }),
      ];
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      const mockAction = createMockMoveTaskSuccess();
      await store.moveTask('todo-1', 'IN_PROGRESS', undefined, mockAction);

      const allIds = getTaskIds();
      const todoIndex = allIds.indexOf('todo-1');
      const completedIndex = allIds.indexOf('completed-1');

      // Task moved to IN_PROGRESS should come before COMPLETED in array order
      expect(todoIndex).toBeLessThan(completedIndex);
    });
  });

  describe('moveTask same column without target', () => {
    it('should maintain position when moving within same column', async () => {
      const tasks = createSameColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      const mockAction = createMockMoveTaskSuccess();
      await store.moveTask('reorder-3', 'TODO', undefined, mockAction);

      const todoIds = getColumnTaskIds('TODO');
      expect(todoIds).toContain('reorder-3');
    });
  });

  describe('moveTask edge cases', () => {
    it('should handle moving single item from column', async () => {
      const tasks = createSingleTaskScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      const mockAction = createMockMoveTaskSuccess();
      await store.moveTask('single-1', 'IN_PROGRESS', undefined, mockAction);

      expect(getColumnTaskIds('TODO')).toHaveLength(0);
      expect(getColumnTaskIds('IN_PROGRESS')).toContain('single-1');
    });

    it('should handle moving last task to first position', async () => {
      const tasks = createSameColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      // Move reorder-5 (last) before reorder-1 (first)
      const mockAction = createMockMoveTaskSuccess();
      await store.moveTask('reorder-5', 'TODO', 'reorder-1', mockAction);

      const todoIds = getColumnTaskIds('TODO');
      expect(todoIds[0]).toBe('reorder-5');
    });
  });
});

// ============================================================================
// Selector Hooks Tests
// ============================================================================

describe('Selector Hooks', () => {
  describe('getTasksByColumn', () => {
    it('should return tasks filtered by column', () => {
      resetStoreWithTasks(createMultiColumnScenario());

      const todoTasks = useKanbanStore.getState().getTasksByColumn('TODO');

      expect(todoTasks).toHaveLength(2);
      todoTasks.forEach((task) => {
        expect(task.columnId).toBe('TODO');
      });
    });

    it('should return empty array for empty column', () => {
      resetStoreWithTasks(createSingleColumnScenario()); // Only TODO tasks

      const inProgressTasks = useKanbanStore.getState().getTasksByColumn('IN_PROGRESS');

      expect(inProgressTasks).toHaveLength(0);
      expect(Array.isArray(inProgressTasks)).toBe(true);
    });

    it('should return empty array when store is empty', () => {
      resetStoreWithTasks([]);

      const tasks = useKanbanStore.getState().getTasksByColumn('TODO');

      expect(tasks).toHaveLength(0);
    });
  });

  describe('getTaskById', () => {
    it('should return task when found', () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);

      const task = useKanbanStore.getState().getTaskById('task-1');

      expect(task).toBeDefined();
      expect(task?.id).toBe('task-1');
      expect(task?.title).toBe('Todo Task 1');
    });

    it('should return undefined for non-existent ID', () => {
      resetStoreWithTasks(createMultiColumnScenario());

      const task = useKanbanStore.getState().getTaskById('non-existent');

      expect(task).toBeUndefined();
    });
  });

  describe('getTotalTasks', () => {
    it('should return correct count', () => {
      resetStoreWithTasks(createMultiColumnScenario()); // 5 tasks

      const total = useKanbanStore.getState().getTotalTasks();

      expect(total).toBe(5);
    });

    it('should return 0 for empty store', () => {
      resetStoreWithTasks([]);

      const total = useKanbanStore.getState().getTotalTasks();

      expect(total).toBe(0);
    });
  });

  describe('useTasksByColumn hook', () => {
    it('should return filtered tasks via hook', () => {
      resetStoreWithTasks(createMultiColumnScenario());

      const { result } = renderHook(() => useTasksByColumn('IN_PROGRESS'));

      expect(result.current).toHaveLength(2);
      result.current.forEach((task) => {
        expect(task.columnId).toBe('IN_PROGRESS');
      });
    });

    it('should update when tasks change', async () => {
      resetStoreWithTasks(createMultiColumnScenario());

      const { result, rerender } = renderHook(() => useTasksByColumn('TODO'));

      expect(result.current).toHaveLength(2);

      // Add a new TODO task
      await act(async () => {
        const mockAction = createMockCreateTaskSuccess('new-todo');
        await useKanbanStore.getState().addTask(
          createTaskInput({ title: 'New Todo', columnId: 'TODO' }),
          mockAction
        );
      });

      rerender();

      expect(result.current).toHaveLength(3);
    });
  });

  describe('useTaskById hook', () => {
    it('should return task by ID via hook', () => {
      resetStoreWithTasks(createMultiColumnScenario());

      const { result } = renderHook(() => useTaskById('task-3'));

      expect(result.current).toBeDefined();
      expect(result.current?.id).toBe('task-3');
    });

    it('should return undefined for non-existent ID', () => {
      resetStoreWithTasks(createMultiColumnScenario());

      const { result } = renderHook(() => useTaskById('non-existent'));

      expect(result.current).toBeUndefined();
    });
  });

  describe('useTotalTasks hook', () => {
    it('should return total count via hook', () => {
      resetStoreWithTasks(createMultiColumnScenario());

      const { result } = renderHook(() => useTotalTasks());

      expect(result.current).toBe(5);
    });
  });

  describe('useIsHydrated hook', () => {
    it('should return hydration status', () => {
      resetStore(); // Not hydrated

      const { result, rerender } = renderHook(() => useIsHydrated());

      expect(result.current).toBe(false);

      act(() => {
        useKanbanStore.getState().setHydrated(true);
      });

      rerender();

      expect(result.current).toBe(true);
    });
  });

  describe('useIsLoading hook', () => {
    it('should return loading status', () => {
      resetStoreWithTasks([]);

      const { result, rerender } = renderHook(() => useIsLoading());

      expect(result.current).toBe(false);

      act(() => {
        useKanbanStore.getState().setLoading(true);
      });

      rerender();

      expect(result.current).toBe(true);
    });
  });

  describe('useError hook', () => {
    it('should return error state', () => {
      resetStoreWithTasks([]);

      const { result, rerender } = renderHook(() => useError());

      expect(result.current).toBeNull();

      act(() => {
        useKanbanStore.getState().setError('Test error');
      });

      rerender();

      expect(result.current).toBe('Test error');
    });
  });

  describe('useKanbanStatus hook', () => {
    it('should return combined status object', () => {
      resetStoreWithTasks([]);

      const { result, rerender } = renderHook(() => useKanbanStatus());

      expect(result.current).toEqual({
        isHydrated: true, // resetStoreWithTasks sets this to true
        isLoading: false,
        error: null,
      });
    });

    it('should update when any status changes', () => {
      resetStore();

      const { result, rerender } = renderHook(() => useKanbanStatus());

      expect(result.current.isHydrated).toBe(false);

      act(() => {
        useKanbanStore.getState().setHydrated(true);
        useKanbanStore.getState().setLoading(true);
        useKanbanStore.getState().setError('Loading error');
      });

      rerender();

      expect(result.current).toEqual({
        isHydrated: true,
        isLoading: true,
        error: 'Loading error',
      });
    });
  });
});

// ============================================================================
// Advanced Error Handling Tests
// ============================================================================

describe('Advanced Error Handling', () => {
  describe('Error state management', () => {
    it('should clear previous error when starting new addTask operation', async () => {
      resetStoreWithTasks([]);

      // Set an initial error
      act(() => {
        useKanbanStore.getState().setError('Previous error');
      });

      expect(getStoreState().error).toBe('Previous error');

      // Start a new operation that will succeed
      const store = useKanbanStore.getState();
      const mockAction = createMockCreateTaskSuccess('new-task-id');

      await store.addTask(createTaskInput(), mockAction);

      // Error should be cleared after successful operation
      expect(getStoreState().error).toBeNull();
    });

    it('should clear previous error when starting new updateTask operation', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);

      act(() => {
        useKanbanStore.getState().setError('Old error');
      });

      const store = useKanbanStore.getState();
      const mockAction = createMockUpdateTaskSuccess();

      await store.updateTask(tasks[0].id, { title: 'Updated' }, mockAction);

      expect(getStoreState().error).toBeNull();
    });

    it('should clear previous error when starting new deleteTask operation', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);

      act(() => {
        useKanbanStore.getState().setError('Stale error');
      });

      const store = useKanbanStore.getState();
      const mockAction = createMockDeleteTaskSuccess();

      await store.deleteTask(tasks[0].id, mockAction);

      expect(getStoreState().error).toBeNull();
    });

    it('should clear previous error when starting new moveTask operation', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);

      act(() => {
        useKanbanStore.getState().setError('Lingering error');
      });

      const store = useKanbanStore.getState();
      const mockAction = createMockMoveTaskSuccess();

      await store.moveTask(tasks[0].id, 'IN_PROGRESS', undefined, mockAction);

      expect(getStoreState().error).toBeNull();
    });

    it('should preserve error message from server response', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const customErrorMessage = 'Custom validation error: Title too long';
      const mockAction = createMockCreateTaskError(customErrorMessage);

      await store.addTask(createTaskInput(), mockAction);

      expect(getStoreState().error).toBe(customErrorMessage);
    });

    it('should handle undefined error from server response', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      // Server returns failure with no error message
      const mockAction = vi.fn().mockResolvedValue({ success: false, error: undefined });

      await store.addTask(createTaskInput(), mockAction);

      expect(getStoreState().error).toBe('Failed to add task');
    });
  });

  describe('Rollback data integrity', () => {
    it('should restore exact task order after failed addTask', async () => {
      const initialTasks = createSameColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const originalIds = initialTasks.map((t) => t.id);

      const mockAction = createMockCreateTaskError('Database error');
      await store.addTask(createTaskInput({ columnId: 'TODO' }), mockAction);

      // Verify exact order is preserved
      expect(getTaskIds()).toEqual(originalIds);
    });

    it('should restore all task properties after failed updateTask', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const originalTask = { ...initialTasks[0] };

      const mockAction = vi.fn().mockResolvedValue(mockServerError('Update failed'));
      await store.updateTask(originalTask.id, {
        title: 'New Title',
        description: 'New Description',
        priority: 'LOW'
      }, mockAction);

      const restoredTask = getTaskById(originalTask.id);
      expect(restoredTask?.title).toBe(originalTask.title);
      expect(restoredTask?.description).toBe(originalTask.description);
      expect(restoredTask?.priority).toBe(originalTask.priority);
    });

    it('should restore task at original position after failed deleteTask', async () => {
      const initialTasks = createSameColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const taskToDelete = initialTasks[2]; // Middle task
      const originalIds = initialTasks.map((t) => t.id);

      const mockAction = vi.fn().mockResolvedValue(mockServerError('Delete failed'));
      await store.deleteTask(taskToDelete.id, mockAction);

      // Task should be back at original position
      expect(getTaskIds()).toEqual(originalIds);
      expect(taskExists(taskToDelete.id)).toBe(true);
    });

    it('should restore column and position after failed moveTask', async () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);
      const store = useKanbanStore.getState();
      const taskToMove = initialTasks[0];
      const originalColumnId = taskToMove.columnId;
      const originalIds = initialTasks.map((t) => t.id);

      const mockAction = vi.fn().mockResolvedValue(mockServerError('Move failed'));
      await store.moveTask(taskToMove.id, 'COMPLETED', undefined, mockAction);

      // Task should be back in original column
      expect(getTaskById(taskToMove.id)?.columnId).toBe(originalColumnId);
      // Original task order should be preserved
      expect(getTaskIds()).toEqual(originalIds);
    });
  });

  describe('Multiple sequential errors', () => {
    it('should handle multiple consecutive failed operations correctly', async () => {
      resetStoreWithTasks(createMultiColumnScenario());
      const store = useKanbanStore.getState();
      const initialCount = store.tasks.length;

      // First failed add
      const mockAdd = createMockCreateTaskError('Add failed');
      await store.addTask(createTaskInput(), mockAdd);
      expect(getStoreState().error).toBe('Add failed');
      expect(getStoreState().tasks.length).toBe(initialCount);

      // Second failed add
      const mockAdd2 = createMockCreateTaskError('Add failed again');
      await store.addTask(createTaskInput(), mockAdd2);
      expect(getStoreState().error).toBe('Add failed again');
      expect(getStoreState().tasks.length).toBe(initialCount);

      // Third failed add
      const mockAdd3 = createMockCreateTaskException(new Error('Network error'));
      await store.addTask(createTaskInput(), mockAdd3);
      expect(getStoreState().error).toBe('Network error');
      expect(getStoreState().tasks.length).toBe(initialCount);
    });

    it('should recover after error with successful operation', async () => {
      resetStoreWithTasks(createMultiColumnScenario());
      const store = useKanbanStore.getState();

      // Failed operation
      const mockFail = createMockCreateTaskError('Operation failed');
      await store.addTask(createTaskInput(), mockFail);
      expect(getStoreState().error).toBe('Operation failed');

      // Successful operation
      const mockSuccess = createMockCreateTaskSuccess('recovered-task');
      const result = await store.addTask(createTaskInput({ title: 'Recovery Task' }), mockSuccess);

      expect(result).toBe('recovered-task');
      expect(getStoreState().error).toBeNull();
      expect(taskExists('recovered-task')).toBe(true);
    });
  });
});

// ============================================================================
// Concurrent Operations Tests
// ============================================================================

describe('Concurrent Operations', () => {
  describe('Simultaneous task updates', () => {
    it('should handle two updates to different tasks simultaneously', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      const mockUpdate1 = vi.fn().mockImplementation(async (id: string, updates: Partial<StoreTask>) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return mockServerSuccess({
          ...tasks.find((t) => t.id === id),
          ...updates,
          updatedAt: new Date(),
          createdAt: new Date(),
        });
      });

      const mockUpdate2 = vi.fn().mockImplementation(async (id: string, updates: Partial<StoreTask>) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return mockServerSuccess({
          ...tasks.find((t) => t.id === id),
          ...updates,
          updatedAt: new Date(),
          createdAt: new Date(),
        });
      });

      // Start both updates simultaneously
      const [result1, result2] = await Promise.all([
        store.updateTask(tasks[0].id, { title: 'Updated Task 1' }, mockUpdate1),
        store.updateTask(tasks[1].id, { title: 'Updated Task 2' }, mockUpdate2),
      ]);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(getTaskById(tasks[0].id)?.title).toBe('Updated Task 1');
      expect(getTaskById(tasks[1].id)?.title).toBe('Updated Task 2');
    });

    it('should handle add and delete operations simultaneously', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();
      const taskToDelete = tasks[0];

      const mockAdd = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return mockServerSuccess({
          id: 'new-concurrent-task',
          title: 'Concurrent Task',
          description: '',
          priority: 'MEDIUM' as const,
          tags: [],
          columnId: 'TODO' as const,
          categories: [],
          dueDate: null,
          dueTime: null,
          isAllDay: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerName: 'Test',
          ownerEmail: 'test@example.com',
        });
      });

      const mockDelete = createMockDeleteTaskSuccess();

      const [addResult, deleteResult] = await Promise.all([
        store.addTask(createTaskInput({ title: 'Concurrent Task' }), mockAdd),
        store.deleteTask(taskToDelete.id, mockDelete),
      ]);

      expect(addResult).toBe('new-concurrent-task');
      expect(deleteResult).toBe(true);
      expect(taskExists('new-concurrent-task')).toBe(true);
      expect(taskExists(taskToDelete.id)).toBe(false);
    });

    it('should handle concurrent moves to different columns', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();
      const task1 = tasks.find((t) => t.columnId === 'TODO')!;
      const task2 = tasks.find((t) => t.columnId === 'IN_PROGRESS')!;

      const mockMove = vi.fn().mockImplementation(async (input: { taskId: string; newColumnId: string }) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return mockServerSuccess({
          id: input.taskId,
          title: 'Moved Task',
          description: '',
          priority: 'MEDIUM' as const,
          tags: [],
          columnId: input.newColumnId as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
          categories: [],
          dueDate: null,
          dueTime: null,
          isAllDay: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerName: 'Test',
          ownerEmail: 'test@example.com',
        });
      });

      const [result1, result2] = await Promise.all([
        store.moveTask(task1.id, 'COMPLETED', undefined, mockMove),
        store.moveTask(task2.id, 'TODO', undefined, mockMove),
      ]);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(getTaskById(task1.id)?.columnId).toBe('COMPLETED');
      expect(getTaskById(task2.id)?.columnId).toBe('TODO');
    });
  });

  describe('Race condition handling', () => {
    it('should maintain consistency when one concurrent operation fails', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      const mockSuccess = vi.fn().mockImplementation(async (id: string, updates: Partial<StoreTask>) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return mockServerSuccess({
          ...tasks.find((t) => t.id === id),
          ...updates,
          updatedAt: new Date(),
          createdAt: new Date(),
        });
      });

      const mockFail = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return mockServerError('Server error');
      });

      const [result1, result2] = await Promise.all([
        store.updateTask(tasks[0].id, { title: 'Should Succeed' }, mockSuccess),
        store.updateTask(tasks[1].id, { title: 'Should Fail' }, mockFail),
      ]);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      // The successful update should persist
      expect(getTaskById(tasks[0].id)?.title).toBe('Should Succeed');
      // The failed update should be rolled back
      expect(getTaskById(tasks[1].id)?.title).toBe(tasks[1].title);
    });

    it('should handle rapid sequential operations on the same task', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();
      const task = tasks[0];

      const createMockUpdateWithDelay = (title: string, delay: number) => {
        return vi.fn().mockImplementation(async (id: string) => {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return mockServerSuccess({
            ...task,
            title,
            updatedAt: new Date(),
            createdAt: new Date(),
          });
        });
      };

      // Start three updates with different delays
      const results = await Promise.all([
        store.updateTask(task.id, { title: 'First Update' }, createMockUpdateWithDelay('First Update', 30)),
        store.updateTask(task.id, { title: 'Second Update' }, createMockUpdateWithDelay('Second Update', 20)),
        store.updateTask(task.id, { title: 'Third Update' }, createMockUpdateWithDelay('Third Update', 10)),
      ]);

      // All should succeed
      expect(results).toEqual([true, true, true]);
    });
  });
});

// ============================================================================
// Edge Cases & Concurrent Operations Tests
// ============================================================================

describe('Edge Cases & Concurrent Operations', () => {
  describe('Empty store operations', () => {
    it('should handle update on empty store', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const result = await store.updateTask(
        'any-id',
        { title: 'Updated' },
        createMockUpdateTaskSuccess()
      );

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Task not found');
    });

    it('should handle delete on empty store', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const result = await store.deleteTask('any-id', createMockDeleteTaskSuccess());

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Task not found');
    });

    it('should handle move on empty store', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const result = await store.moveTask(
        'any-id',
        'IN_PROGRESS',
        undefined,
        createMockMoveTaskSuccess()
      );

      expect(result).toBe(false);
      expect(getStoreState().error).toBe('Task not found');
    });
  });

  describe('Large dataset operations', () => {
    it('should handle operations on large datasets', async () => {
      const largeDataset = createLargeDatasetScenario(); // 50 tasks
      resetStoreWithTasks(largeDataset);
      const store = useKanbanStore.getState();

      expect(store.getTotalTasks()).toBe(50);

      // Test filtering performance
      const todoTasks = store.getTasksByColumn('TODO');
      expect(todoTasks.length).toBeGreaterThan(0);

      // Test update on large dataset
      const mockAction = createMockUpdateTaskSuccess();
      const result = await store.updateTask('large-25', { title: 'Updated' }, mockAction);

      expect(result).toBe(true);
    });

    it('should handle add operation on large dataset', async () => {
      resetStoreWithTasks(createLargeDatasetScenario());
      const store = useKanbanStore.getState();
      const initialCount = store.getTotalTasks();

      const mockAction = createMockCreateTaskSuccess('new-large-task');
      const result = await store.addTask(createTaskInput(), mockAction);

      expect(result).toBe('new-large-task');
      expect(getStoreState().tasks.length).toBe(initialCount + 1);
    });
  });

  describe('State setters', () => {
    it('should set tasks and mark as hydrated', () => {
      resetStore();
      const tasks = createMultiColumnScenario();

      act(() => {
        useKanbanStore.getState().setTasks(tasks);
      });

      expect(getStoreState().tasks).toEqual(tasks);
      expect(getStoreState().isHydrated).toBe(true);
    });

    it('should set loading state', () => {
      resetStore();

      act(() => {
        useKanbanStore.getState().setLoading(true);
      });

      expect(getStoreState().isLoading).toBe(true);

      act(() => {
        useKanbanStore.getState().setLoading(false);
      });

      expect(getStoreState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      resetStore();

      act(() => {
        useKanbanStore.getState().setError('Test error');
      });

      expect(getStoreState().error).toBe('Test error');

      act(() => {
        useKanbanStore.getState().setError(null);
      });

      expect(getStoreState().error).toBeNull();
    });

    it('should set hydrated state', () => {
      resetStore();

      expect(getStoreState().isHydrated).toBe(false);

      act(() => {
        useKanbanStore.getState().setHydrated(true);
      });

      expect(getStoreState().isHydrated).toBe(true);
    });
  });

  describe('Successful operations', () => {
    it('should add task successfully and return server ID', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const mockAction = createMockCreateTaskSuccess('server-generated-id');
      const result = await store.addTask(createTaskInput({ title: 'New Task' }), mockAction);

      expect(result).toBe('server-generated-id');
      expect(getStoreState().tasks).toHaveLength(1);
      expect(getStoreState().tasks[0].id).toBe('server-generated-id');
      expect(getStoreState().isLoading).toBe(false);
      expect(getStoreState().error).toBeNull();
    });

    it('should update task successfully', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();

      const mockAction = vi.fn().mockResolvedValue(
        mockServerSuccess({
          ...tasks[0],
          title: 'Updated Title',
          updatedAt: new Date(),
          createdAt: new Date(tasks[0].createdAt),
        })
      );

      const result = await store.updateTask(tasks[0].id, { title: 'Updated Title' }, mockAction);

      expect(result).toBe(true);
      expect(getTaskById(tasks[0].id)?.title).toBe('Updated Title');
    });

    it('should delete task successfully', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();
      const taskToDelete = tasks[0];

      const result = await store.deleteTask(taskToDelete.id, createMockDeleteTaskSuccess());

      expect(result).toBe(true);
      expect(taskExists(taskToDelete.id)).toBe(false);
      expect(getStoreState().tasks.length).toBe(tasks.length - 1);
    });

    it('should move task successfully', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();
      const taskToMove = tasks[0]; // TODO column

      const mockAction = vi.fn().mockResolvedValue(
        mockServerSuccess({
          ...taskToMove,
          columnId: 'IN_PROGRESS',
          updatedAt: new Date(),
          createdAt: new Date(taskToMove.createdAt),
        })
      );

      const result = await store.moveTask(
        taskToMove.id,
        'IN_PROGRESS',
        undefined,
        mockAction
      );

      expect(result).toBe(true);
      expect(getTaskById(taskToMove.id)?.columnId).toBe('IN_PROGRESS');
    });
  });

  describe('Optimistic update timing', () => {
    it('should show loading state during add operation', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      let loadingDuringOperation = false;
      const mockAction = vi.fn().mockImplementation(async () => {
        loadingDuringOperation = getStoreState().isLoading;
        return mockServerSuccess({
          id: 'new-id',
          title: 'Test',
          description: '',
          priority: 'MEDIUM' as const,
          tags: [],
          columnId: 'TODO' as const,
          categories: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await store.addTask(createTaskInput(), mockAction);

      expect(loadingDuringOperation).toBe(true);
      expect(getStoreState().isLoading).toBe(false);
    });

    it('should clear error on new operation', async () => {
      resetStoreWithTasks([]);

      // Set an existing error
      act(() => {
        useKanbanStore.getState().setError('Previous error');
      });

      expect(getStoreState().error).toBe('Previous error');

      const store = useKanbanStore.getState();
      const mockAction = createMockCreateTaskSuccess('new-id');

      await store.addTask(createTaskInput(), mockAction);

      expect(getStoreState().error).toBeNull();
    });
  });
});

// ============================================================================
// Search and Filter Tests
// ============================================================================

describe('Search and Filter Functionality', () => {
  // Helper to reset search/filter state before each search test
  function resetFiltersState() {
    const store = useKanbanStore.getState();
    store.clearFilters();
    store.setIsSearching(false);
    store.setSearchResults(null);
    store.setSavedFilterPresets([]);
  }

  describe('setSearchQuery', () => {
    it('should set search query', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setSearchQuery('test query');
      });

      expect(getStoreState().searchQuery).toBe('test query');
    });

    it('should trim search query', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setSearchQuery('  query with spaces  ');
      });

      expect(getStoreState().searchQuery).toBe('query with spaces');
    });

    it('should limit search query to 200 characters', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      const longQuery = 'a'.repeat(300);
      act(() => {
        store.setSearchQuery(longQuery);
      });

      expect(getStoreState().searchQuery).toHaveLength(200);
    });
  });

  describe('setFilter', () => {
    it('should set priority filter', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setFilter('priority', 'HIGH');
      });

      expect(getStoreState().filters.priority).toBe('HIGH');
    });

    it('should set columnId filter', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setFilter('columnId', 'IN_PROGRESS');
      });

      expect(getStoreState().filters.columnId).toBe('IN_PROGRESS');
    });

    it('should set categories filter', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setFilter('categories', ['category1', 'category2']);
      });

      expect(getStoreState().filters.categories).toEqual(['category1', 'category2']);
    });

    it('should set dateRange filter', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      const dateRange = {
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-12-31T23:59:59.999Z',
      };
      act(() => {
        store.setFilter('dateRange', dateRange);
      });

      expect(getStoreState().filters.dateRange).toEqual(dateRange);
    });
  });

  describe('setFilters', () => {
    it('should replace all filters at once', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      const newFilters = {
        priority: 'HIGH' as const,
        columnId: 'TODO' as const,
        categories: ['feature'],
      };

      act(() => {
        store.setFilters(newFilters);
      });

      expect(getStoreState().filters).toEqual(newFilters);
    });
  });

  describe('clearFilters', () => {
    it('should clear all filters and search query', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      // Set some filters
      act(() => {
        store.setSearchQuery('test');
        store.setFilter('priority', 'HIGH');
        store.setFilter('columnId', 'TODO');
      });

      expect(getStoreState().searchQuery).toBe('test');
      expect(getStoreState().filters.priority).toBe('HIGH');

      // Clear filters
      act(() => {
        store.clearFilters();
      });

      expect(getStoreState().searchQuery).toBe('');
      expect(getStoreState().filters).toEqual({});
      expect(getStoreState().searchResults).toBeNull();
    });
  });

  describe('getFilteredTasks', () => {
    it('should filter by search query in title', () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setSearchQuery('Todo');
      });

      const filtered = store.getFilteredTasks();
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((task) => {
        expect(task.title.toLowerCase()).toContain('todo');
      });
    });

    it('should filter by search query in description', () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setSearchQuery('in-progress');
      });

      const filtered = store.getFilteredTasks();
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((task) => {
        expect(task.description.toLowerCase()).toContain('in-progress');
      });
    });

    it('should filter by priority', () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setFilter('priority', 'HIGH');
      });

      const filtered = store.getFilteredTasks();
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((task) => {
        expect(task.priority).toBe('HIGH');
      });
    });

    it('should filter by columnId', () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setFilter('columnId', 'IN_PROGRESS');
      });

      const filtered = store.getFilteredTasks();
      expect(filtered.length).toBe(2);
      filtered.forEach((task) => {
        expect(task.columnId).toBe('IN_PROGRESS');
      });
    });

    it('should filter by categories (must have all specified)', () => {
      const tasks: StoreTask[] = [
        createStoreTask({ id: 'cat-1', categories: ['feature', 'auth'] }),
        createStoreTask({ id: 'cat-2', categories: ['feature'] }),
        createStoreTask({ id: 'cat-3', categories: ['bugfix', 'auth'] }),
      ];
      resetStoreWithTasks(tasks);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setFilter('categories', ['feature', 'auth']);
      });

      const filtered = store.getFilteredTasks();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('cat-1');
    });

    it('should apply pagination with offset and limit', () => {
      const tasks = createLargeDatasetScenario(); // 50 tasks
      resetStoreWithTasks(tasks);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setFilters({ offset: 10, limit: 5 });
      });

      const filtered = store.getFilteredTasks();
      expect(filtered.length).toBe(5);
    });

    it('should combine multiple filters', () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setFilter('priority', 'HIGH');
        store.setFilter('columnId', 'TODO');
      });

      const filtered = store.getFilteredTasks();
      expect(filtered.length).toBe(1);
      expect(filtered[0].priority).toBe('HIGH');
      expect(filtered[0].columnId).toBe('TODO');
    });

    it('should return empty array when no tasks match', () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setSearchQuery('nonexistent');
      });

      const filtered = store.getFilteredTasks();
      expect(filtered).toEqual([]);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters active', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      expect(store.hasActiveFilters()).toBe(false);
    });

    it('should return true when searchQuery is set', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setSearchQuery('test');
      });

      expect(store.hasActiveFilters()).toBe(true);
    });

    it('should return true when priority filter is set', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setFilter('priority', 'HIGH');
      });

      expect(store.hasActiveFilters()).toBe(true);
    });

    it('should return true when categories filter is set', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setFilter('categories', ['feature']);
      });

      expect(store.hasActiveFilters()).toBe(true);
    });
  });

  describe('getActiveFilterCount', () => {
    it('should return 0 when no filters active', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      expect(store.getActiveFilterCount()).toBe(0);
    });

    it('should count search query as one filter', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setSearchQuery('test');
      });

      expect(store.getActiveFilterCount()).toBe(1);
    });

    it('should count multiple filters correctly', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setSearchQuery('test');
        store.setFilter('priority', 'HIGH');
        store.setFilter('columnId', 'TODO');
        store.setFilter('categories', ['feature']);
      });

      expect(store.getActiveFilterCount()).toBe(4);
    });
  });

  describe('Search state management', () => {
    it('should set isSearching state', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setIsSearching(true);
      });

      expect(getStoreState().isSearching).toBe(true);

      act(() => {
        store.setIsSearching(false);
      });

      expect(getStoreState().isSearching).toBe(false);
    });

    it('should set search results', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      const results = {
        tasks: [createStoreTask({ id: 'result-1' })],
        total: 1,
      };

      act(() => {
        store.setSearchResults(results);
      });

      expect(getStoreState().searchResults).toEqual(results);
    });

    it('should clear search results', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      act(() => {
        store.setSearchResults({ tasks: [], total: 0 });
        store.setSearchResults(null);
      });

      expect(getStoreState().searchResults).toBeNull();
    });
  });

  describe('Saved filter presets', () => {
    it('should set saved filter presets', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      const presets = [
        { id: 'preset-1', name: 'High Priority', filters: { priority: 'HIGH' as const } },
        { id: 'preset-2', name: 'In Progress', filters: { columnId: 'IN_PROGRESS' as const } },
      ];

      act(() => {
        store.setSavedFilterPresets(presets);
      });

      expect(getStoreState().savedFilterPresets).toEqual(presets);
    });

    it('should load saved preset and apply filters', () => {
      resetStoreWithTasks([]);
      resetFiltersState();
      const store = useKanbanStore.getState();

      const preset = {
        id: 'preset-1',
        name: 'My Filter',
        filters: {
          priority: 'HIGH' as const,
          searchQuery: 'urgent',
        },
      };

      act(() => {
        store.loadSavedPreset(preset);
      });

      expect(getStoreState().filters).toEqual(preset.filters);
      expect(getStoreState().searchQuery).toBe('urgent');
    });
  });
});

// ============================================================================
// Store Hydration Tests
// ============================================================================

describe('Store Hydration', () => {
  describe('Initial state', () => {
    it('should start with isHydrated false', () => {
      resetStore();

      expect(getStoreState().isHydrated).toBe(false);
    });

    it('should start with empty tasks', () => {
      resetStore();

      expect(getStoreState().tasks).toEqual([]);
    });

    it('should start with no loading state', () => {
      resetStore();

      expect(getStoreState().isLoading).toBe(false);
    });

    it('should start with no error', () => {
      resetStore();

      expect(getStoreState().error).toBeNull();
    });
  });

  describe('setTasks hydration', () => {
    it('should hydrate store with tasks and set isHydrated', () => {
      resetStore();
      const tasks = createMultiColumnScenario();
      const store = useKanbanStore.getState();

      act(() => {
        store.setTasks(tasks);
      });

      expect(getStoreState().tasks).toEqual(tasks);
      expect(getStoreState().isHydrated).toBe(true);
    });

    it('should hydrate with empty array', () => {
      resetStore();
      const store = useKanbanStore.getState();

      act(() => {
        store.setTasks([]);
      });

      expect(getStoreState().tasks).toEqual([]);
      expect(getStoreState().isHydrated).toBe(true);
    });

    it('should replace existing tasks on re-hydration', () => {
      const initialTasks = createMultiColumnScenario();
      resetStoreWithTasks(initialTasks);

      const newTasks = createSingleTaskScenario();
      const store = useKanbanStore.getState();

      act(() => {
        store.setTasks(newTasks);
      });

      expect(getStoreState().tasks).toEqual(newTasks);
      expect(getStoreState().tasks.length).toBe(1);
    });
  });

  describe('Task ID replacement after server response', () => {
    it('should replace temp ID with server ID after successful add', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const mockAction = createMockCreateTaskSuccess('server-generated-id');
      await store.addTask(createTaskInput({ title: 'New Task' }), mockAction);

      expect(taskExists('server-generated-id')).toBe(true);
      // No temp IDs should remain
      const tempTasks = getStoreState().tasks.filter((t) => t.id.startsWith('temp-'));
      expect(tempTasks.length).toBe(0);
    });

    it('should preserve task data when replacing temp ID', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const taskData = createTaskInput({
        title: 'Specific Title',
        description: 'Specific Description',
        priority: 'HIGH',
        tags: ['tag1', 'tag2'],
        columnId: 'IN_PROGRESS',
        categories: ['category1'],
      });

      const mockAction = createMockCreateTaskSuccess('final-id');
      await store.addTask(taskData, mockAction);

      const task = getTaskById('final-id');
      expect(task?.title).toBe('Specific Title');
      expect(task?.description).toBe('Specific Description');
      expect(task?.priority).toBe('HIGH');
      expect(task?.columnId).toBe('IN_PROGRESS');
    });
  });
});

// ============================================================================
// Boundary Condition Tests
// ============================================================================

describe('Boundary Conditions', () => {
  describe('Task data validation', () => {
    it('should handle task with empty title', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const mockAction = createMockCreateTaskSuccess('empty-title-task');
      await store.addTask(createTaskInput({ title: '' }), mockAction);

      const task = getTaskById('empty-title-task');
      expect(task?.title).toBe('');
    });

    it('should handle task with very long title', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const longTitle = 'A'.repeat(1000);
      const mockAction = createMockCreateTaskSuccess('long-title-task');
      await store.addTask(createTaskInput({ title: longTitle }), mockAction);

      const task = getTaskById('long-title-task');
      expect(task?.title.length).toBe(1000);
    });

    it('should handle task with special characters in title', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const specialTitle = '<script>alert("xss")</script> & "quotes" \'apostrophes\'';
      const mockAction = createMockCreateTaskSuccess('special-char-task');
      await store.addTask(createTaskInput({ title: specialTitle }), mockAction);

      const task = getTaskById('special-char-task');
      expect(task?.title).toBe(specialTitle);
    });

    it('should handle task with unicode characters', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      const unicodeTitle = 'Task with emojis: \u{1F600}\u{1F389} and Japanese: \u65E5\u672C\u8A9E';
      const mockAction = createMockCreateTaskSuccess('unicode-task');
      await store.addTask(createTaskInput({ title: unicodeTitle }), mockAction);

      const task = getTaskById('unicode-task');
      expect(task?.title).toBe(unicodeTitle);
    });
  });

  describe('Column operations', () => {
    it('should handle moving task to same column', async () => {
      const tasks = createMultiColumnScenario();
      resetStoreWithTasks(tasks);
      const store = useKanbanStore.getState();
      const task = tasks[0]; // TODO task

      const mockAction = createMockMoveTaskSuccess();
      const result = await store.moveTask(task.id, 'TODO', undefined, mockAction);

      expect(result).toBe(true);
      expect(getTaskById(task.id)?.columnId).toBe('TODO');
    });

    it('should handle all three column types', async () => {
      const task = createStoreTask({ id: 'column-test', columnId: 'TODO' });
      resetStoreWithTasks([task]);
      const store = useKanbanStore.getState();

      // Move to IN_PROGRESS
      let mockAction = createMockMoveTaskSuccess();
      await store.moveTask(task.id, 'IN_PROGRESS', undefined, mockAction);
      expect(getTaskById(task.id)?.columnId).toBe('IN_PROGRESS');

      // Move to COMPLETED
      mockAction = createMockMoveTaskSuccess();
      await store.moveTask(task.id, 'COMPLETED', undefined, mockAction);
      expect(getTaskById(task.id)?.columnId).toBe('COMPLETED');

      // Move back to TODO
      mockAction = createMockMoveTaskSuccess();
      await store.moveTask(task.id, 'TODO', undefined, mockAction);
      expect(getTaskById(task.id)?.columnId).toBe('TODO');
    });
  });

  describe('Array operations', () => {
    it('should handle tasks array with many items', async () => {
      const largeTasks = createLargeDatasetScenario();
      resetStoreWithTasks(largeTasks);
      const store = useKanbanStore.getState();

      expect(store.getTotalTasks()).toBe(50);

      // Operations should still work
      const mockAction = createMockDeleteTaskSuccess();
      const result = await store.deleteTask('large-25', mockAction);

      expect(result).toBe(true);
      expect(store.getTotalTasks()).toBe(49);
    });

    it('should handle repeated add and delete cycles', async () => {
      resetStoreWithTasks([]);
      const store = useKanbanStore.getState();

      for (let i = 0; i < 10; i++) {
        // Add task
        const addAction = createMockCreateTaskSuccess(`cycle-task-${i}`);
        await store.addTask(createTaskInput(), addAction);

        // Delete task
        const deleteAction = createMockDeleteTaskSuccess();
        await store.deleteTask(`cycle-task-${i}`, deleteAction);
      }

      expect(store.getTotalTasks()).toBe(0);
    });
  });
});
