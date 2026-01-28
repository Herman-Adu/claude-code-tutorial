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
  resetStore,
  resetStoreWithTasks,
  resetTaskIdCounter,
  createStoreTask,
  createTaskInput,
  createTaskResponse,
  mockServerSuccess,
  mockServerError,
  createMockCreateTaskSuccess,
  createMockCreateTaskError,
  createMockCreateTaskException,
  createMockUpdateTaskSuccess,
  createMockDeleteTaskSuccess,
  createMockMoveTaskSuccess,
  waitForLoadingComplete,
  getStoreState,
  getTasksByColumn,
  getTaskById,
  taskExists,
  getTaskIds,
  getColumnTaskIds,
} from './mocks/store-test-utils';

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
