/**
 * Kanban Integration Tests
 *
 * These tests validate complete user workflows in the kanban application,
 * ensuring multiple components work together correctly.
 *
 * Test Coverage:
 * - Create task workflow
 * - Move task workflow
 * - Edit task workflow
 * - Delete task workflow
 * - State persistence
 * - Multiple operations in sequence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanBoard } from '@/features/kanban';
import { useKanbanStore } from '@/store/kanban';
import * as taskActions from '@/app/actions/tasks';
import type { TaskResponse, ActionResponse } from '@/app/actions/tasks';

// =============================================================================
// MOCKS
// =============================================================================

// Mock the server actions module
vi.mock('@/app/actions/tasks', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  moveTask: vi.fn(),
  getTasksByColumn: vi.fn(),
}));

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Creates a mock task response with default values.
 */
function createMockTask(overrides: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id: `task-${Date.now()}-${Math.random()}`,
    title: 'Test Task',
    description: 'Test Description',
    priority: 'MEDIUM',
    columnId: 'TODO',
    tags: [],
    categories: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a successful action response.
 */
function createSuccessResponse<T>(data: T): ActionResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates a failed action response.
 */
function createErrorResponse(error: string): ActionResponse {
  return {
    success: false,
    error,
  };
}

/**
 * Resets the store to initial state before each test.
 */
function resetStore() {
  const store = useKanbanStore.getState();
  store.setTasks([]);
  store.setHydrated(false);
  store.setLoading(false);
  store.setError(null);
}

/**
 * Waits for the board to be hydrated (loaded).
 */
async function waitForHydration() {
  await waitFor(() => {
    expect(screen.queryByText('Loading Board...')).not.toBeInTheDocument();
  });
}

/**
 * Opens the add task modal by clicking the add button in a column.
 */
async function openAddTaskModal(user: ReturnType<typeof userEvent.setup>) {
  const addButton = screen.getByRole('button', { name: /add new task/i });
  await user.click(addButton);

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
}

/**
 * Fills out the task form with the provided data.
 */
async function fillTaskForm(
  user: ReturnType<typeof userEvent.setup>,
  data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string;
  }
) {
  // Get the currently open dialog
  const dialog = screen.getByRole('dialog');

  const titleInput = within(dialog).getByLabelText(/title/i);
  await user.clear(titleInput);
  await user.type(titleInput, data.title);

  if (data.description) {
    const descriptionInput = within(dialog).getByLabelText(/description/i);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, data.description);
  }

  if (data.priority) {
    // Priority uses button groups, not a select element
    const priorityButton = within(dialog).getByRole('button', {
      name: new RegExp(`set priority to ${data.priority}`, 'i'),
    });
    await user.click(priorityButton);
  }

  if (data.tags) {
    const tagsInput = within(dialog).getByLabelText(/tags/i);
    await user.clear(tagsInput);
    await user.type(tagsInput, data.tags);
  }
}

/**
 * Submits the task form.
 */
async function submitTaskForm(user: ReturnType<typeof userEvent.setup>) {
  const dialog = screen.getByRole('dialog');
  const submitButton = within(dialog).getByRole('button', { name: /save|create/i });
  await user.click(submitButton);
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Kanban Board Integration Tests', () => {
  // ---------------------------------------------------------------------------
  // Setup and Teardown
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();

    // Default mock: getTasks returns empty array
    vi.mocked(taskActions.getTasks).mockResolvedValue(
      createSuccessResponse([])
    );
  });

  // ---------------------------------------------------------------------------
  // Create Task Workflow
  // ---------------------------------------------------------------------------

  describe('Create Task Workflow', () => {
    it('should create a task and display it in the correct column', async () => {
      const user = userEvent.setup();

      // Mock successful task creation
      const newTask = createMockTask({
        id: 'task-1',
        title: 'New Feature',
        description: 'Implement new feature',
        priority: 'HIGH',
        columnId: 'TODO',
      });

      vi.mocked(taskActions.createTask).mockResolvedValue(
        createSuccessResponse(newTask)
      );

      render(<KanbanBoard />);
      await waitForHydration();

      // Open add task modal
      await openAddTaskModal(user);

      // Fill out form
      await fillTaskForm(user, {
        title: 'New Feature',
        description: 'Implement new feature',
        priority: 'high',
      });

      // Submit form
      await submitTaskForm(user);

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify task appears in TODO column
      await waitFor(() => {
        expect(screen.getByText('New Feature')).toBeInTheDocument();
      });

      // Verify the createTask action was called with correct data
      expect(taskActions.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Feature',
          description: 'Implement new feature',
          priority: 'HIGH',
          columnId: 'TODO',
        })
      );
    });

    it('should show error message when task creation fails', async () => {
      const user = userEvent.setup();

      // Mock failed task creation
      vi.mocked(taskActions.createTask).mockResolvedValue(
        createErrorResponse('Failed to create task')
      );

      render(<KanbanBoard />);
      await waitForHydration();

      await openAddTaskModal(user);
      await fillTaskForm(user, { title: 'Test Task' });
      await submitTaskForm(user);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to create task/i)).toBeInTheDocument();
      });
    });

    it('should handle optimistic update with rollback on error', async () => {
      const user = userEvent.setup();

      // Mock failed task creation
      vi.mocked(taskActions.createTask).mockResolvedValue(
        createErrorResponse('Network error')
      );

      render(<KanbanBoard />);
      await waitForHydration();

      await openAddTaskModal(user);
      await fillTaskForm(user, { title: 'Test Task' });
      await submitTaskForm(user);

      // Task should appear immediately (optimistic update)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Then disappear after server error (rollback)
      await waitFor(() => {
        expect(screen.queryByText('Test Task')).not.toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Edit Task Workflow
  // ---------------------------------------------------------------------------

  describe('Edit Task Workflow', () => {
    it('should edit a task and persist changes', async () => {
      const user = userEvent.setup();

      // Initial task
      const existingTask = createMockTask({
        id: 'task-1',
        title: 'Original Title',
        description: 'Original Description',
        priority: 'LOW',
        columnId: 'TODO',
      });

      // Updated task
      const updatedTask = createMockTask({
        ...existingTask,
        title: 'Updated Title',
        description: 'Updated Description',
        priority: 'HIGH',
      });

      vi.mocked(taskActions.getTasks).mockResolvedValue(
        createSuccessResponse([existingTask])
      );

      vi.mocked(taskActions.updateTask).mockResolvedValue(
        createSuccessResponse(updatedTask)
      );

      render(<KanbanBoard />);
      await waitForHydration();

      // Verify original task is displayed
      expect(screen.getByText('Original Title')).toBeInTheDocument();

      // Click edit button on the task card
      const editButton = screen.getByRole('button', { name: /edit task: original title/i });
      await user.click(editButton);

      // Wait for edit modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Update task details
      await fillTaskForm(user, {
        title: 'Updated Title',
        description: 'Updated Description',
        priority: 'high',
      });

      await submitTaskForm(user);

      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify updated task is displayed
      await waitFor(() => {
        expect(screen.getByText('Updated Title')).toBeInTheDocument();
        expect(screen.queryByText('Original Title')).not.toBeInTheDocument();
      });

      // Verify updateTask was called with correct data
      expect(taskActions.updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated Description',
          priority: 'HIGH',
        })
      );
    });

    it('should handle partial updates correctly', async () => {
      const user = userEvent.setup();

      const existingTask = createMockTask({
        id: 'task-1',
        title: 'Test Task',
        description: 'Test Description',
        priority: 'MEDIUM',
        columnId: 'TODO',
      });

      const updatedTask = createMockTask({
        ...existingTask,
        title: 'Updated Title',
      });

      vi.mocked(taskActions.getTasks).mockResolvedValue(
        createSuccessResponse([existingTask])
      );

      vi.mocked(taskActions.updateTask).mockResolvedValue(
        createSuccessResponse(updatedTask)
      );

      render(<KanbanBoard />);
      await waitForHydration();

      const editButton = screen.getByRole('button', { name: /edit task: test task/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Only update title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      await submitTaskForm(user);

      await waitFor(() => {
        expect(screen.getByText('Updated Title')).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Delete Task Workflow
  // ---------------------------------------------------------------------------

  describe('Delete Task Workflow', () => {
    it('should delete a task and remove it from the board', async () => {
      const user = userEvent.setup();

      const existingTask = createMockTask({
        id: 'task-1',
        title: 'Task to Delete',
        columnId: 'TODO',
      });

      vi.mocked(taskActions.getTasks).mockResolvedValue(
        createSuccessResponse([existingTask])
      );

      vi.mocked(taskActions.deleteTask).mockResolvedValue(
        createSuccessResponse(undefined)
      );

      render(<KanbanBoard />);
      await waitForHydration();

      // Verify task is present
      expect(screen.getByText('Task to Delete')).toBeInTheDocument();

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete task: task to delete/i });
      await user.click(deleteButton);

      // Confirm deletion in modal
      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
      await user.click(confirmButton);

      // Verify task is removed
      await waitFor(() => {
        expect(screen.queryByText('Task to Delete')).not.toBeInTheDocument();
      });

      // Verify deleteTask was called
      expect(taskActions.deleteTask).toHaveBeenCalledWith('task-1');
    });

    it('should allow canceling task deletion', async () => {
      const user = userEvent.setup();

      const existingTask = createMockTask({
        id: 'task-1',
        title: 'Task to Keep',
        columnId: 'TODO',
      });

      vi.mocked(taskActions.getTasks).mockResolvedValue(
        createSuccessResponse([existingTask])
      );

      render(<KanbanBoard />);
      await waitForHydration();

      const deleteButton = screen.getByRole('button', { name: /delete task: task to keep/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel deletion/i });
      await user.click(cancelButton);

      // Verify task is still present
      await waitFor(() => {
        expect(screen.getByText('Task to Keep')).toBeInTheDocument();
      });

      // Verify deleteTask was NOT called
      expect(taskActions.deleteTask).not.toHaveBeenCalled();
    });

    it('should rollback deletion on server error', async () => {
      const user = userEvent.setup();

      const existingTask = createMockTask({
        id: 'task-1',
        title: 'Protected Task',
        columnId: 'TODO',
      });

      vi.mocked(taskActions.getTasks).mockResolvedValue(
        createSuccessResponse([existingTask])
      );

      vi.mocked(taskActions.deleteTask).mockResolvedValue(
        createErrorResponse('Failed to delete task')
      );

      render(<KanbanBoard />);
      await waitForHydration();

      const deleteButton = screen.getByRole('button', { name: /delete task: protected task/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
      await user.click(confirmButton);

      // Task should reappear after error
      await waitFor(() => {
        expect(screen.getByText('Protected Task')).toBeInTheDocument();
      });

      // Error message should be shown
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Move Task Workflow
  // ---------------------------------------------------------------------------

  describe('Move Task Workflow', () => {
    it('should move a task between columns', async () => {
      const user = userEvent.setup();

      const task = createMockTask({
        id: 'task-1',
        title: 'Task to Move',
        columnId: 'TODO',
      });

      const movedTask = createMockTask({
        ...task,
        columnId: 'IN_PROGRESS',
      });

      vi.mocked(taskActions.getTasks).mockResolvedValue(
        createSuccessResponse([task])
      );

      vi.mocked(taskActions.moveTask).mockResolvedValue(
        createSuccessResponse(movedTask)
      );

      render(<KanbanBoard />);
      await waitForHydration();

      // Verify task is displayed
      expect(screen.getByText('Task to Move')).toBeInTheDocument();

      // Note: Testing actual drag-and-drop with @dnd-kit is complex
      // In a real test, you would simulate drag events or use the moveTask function directly
      // For this integration test, we'll simulate the move by calling the store method
      // Wrap async store operation in act() to handle state updates properly
      await act(async () => {
        const store = useKanbanStore.getState();
        await store.moveTask('task-1', 'IN_PROGRESS', undefined, taskActions.moveTask);

        // Verify task is still displayed (optimistically updated)
        await waitFor(() => {
          expect(screen.getByText('Task to Move')).toBeInTheDocument();
        });
      });

      // Verify moveTask was called
      expect(taskActions.moveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          newColumnId: 'IN_PROGRESS',
        })
      );
    });

    it('should rollback move on server error', async () => {
      const task = createMockTask({
        id: 'task-1',
        title: 'Stuck Task',
        columnId: 'TODO',
      });

      vi.mocked(taskActions.getTasks).mockResolvedValue(
        createSuccessResponse([task])
      );

      vi.mocked(taskActions.moveTask).mockResolvedValue(
        createErrorResponse('Failed to move task')
      );

      render(<KanbanBoard />);
      await waitForHydration();

      // Attempt to move task - wrap in act() to handle async state updates
      await act(async () => {
        const store = useKanbanStore.getState();
        await store.moveTask('task-1', 'COMPLETED', undefined, taskActions.moveTask);

        // Verify task is still displayed (should be rolled back)
        await waitFor(() => {
          expect(screen.getByText('Stuck Task')).toBeInTheDocument();
        });

        // Verify error message
        await waitFor(() => {
          expect(screen.getByRole('alert')).toBeInTheDocument();
        });
      });
    });
  });

  // ---------------------------------------------------------------------------
  // State Persistence
  // ---------------------------------------------------------------------------

  describe('State Persistence', () => {
    it('should load tasks from server on initial mount', async () => {
      const tasks = [
        createMockTask({ id: 'task-1', title: 'Task 1', columnId: 'TODO' }),
        createMockTask({ id: 'task-2', title: 'Task 2', columnId: 'IN_PROGRESS' }),
        createMockTask({ id: 'task-3', title: 'Task 3', columnId: 'COMPLETED' }),
      ];

      vi.mocked(taskActions.getTasks).mockResolvedValue(
        createSuccessResponse(tasks)
      );

      render(<KanbanBoard />);
      await waitForHydration();

      // Verify all tasks are displayed
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();

      // Verify getTasks was called
      expect(taskActions.getTasks).toHaveBeenCalledTimes(1);
    });

    it('should handle empty task list gracefully', async () => {
      vi.mocked(taskActions.getTasks).mockResolvedValue(
        createSuccessResponse([])
      );

      render(<KanbanBoard />);
      await waitForHydration();

      // Verify board is rendered with column headers
      expect(screen.getByRole('heading', { name: /to-do/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /in progress/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /completed/i })).toBeInTheDocument();
    });

    it('should handle server error during initial load', async () => {
      vi.mocked(taskActions.getTasks).mockResolvedValue(
        createErrorResponse('Failed to load tasks')
      );

      render(<KanbanBoard />);
      await waitForHydration();

      // Board should still render with error message
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Multiple Operations Workflow
  // ---------------------------------------------------------------------------

  describe('Multiple Operations Workflow', () => {
    it('should handle creating multiple tasks in sequence', async () => {
      const user = userEvent.setup();

      const task1 = createMockTask({ id: 'task-1', title: 'First Task' });
      const task2 = createMockTask({ id: 'task-2', title: 'Second Task' });

      vi.mocked(taskActions.createTask)
        .mockResolvedValueOnce(createSuccessResponse(task1))
        .mockResolvedValueOnce(createSuccessResponse(task2));

      render(<KanbanBoard />);
      await waitForHydration();

      // Create first task
      await openAddTaskModal(user);
      await fillTaskForm(user, { title: 'First Task' });
      await submitTaskForm(user);

      await waitFor(() => {
        expect(screen.getByText('First Task')).toBeInTheDocument();
      });

      // Create second task
      await openAddTaskModal(user);
      await fillTaskForm(user, { title: 'Second Task' });
      await submitTaskForm(user);

      await waitFor(() => {
        expect(screen.getByText('Second Task')).toBeInTheDocument();
      });

      // Verify both tasks are present
      expect(screen.getByText('First Task')).toBeInTheDocument();
      expect(screen.getByText('Second Task')).toBeInTheDocument();
    });

    it('should handle create, edit, and delete in sequence', async () => {
      const user = userEvent.setup();

      const newTask = createMockTask({ id: 'task-1', title: 'New Task' });
      const updatedTask = createMockTask({ id: 'task-1', title: 'Updated Task' });

      vi.mocked(taskActions.createTask).mockResolvedValue(createSuccessResponse(newTask));
      vi.mocked(taskActions.updateTask).mockResolvedValue(createSuccessResponse(updatedTask));
      vi.mocked(taskActions.deleteTask).mockResolvedValue(createSuccessResponse(undefined));

      render(<KanbanBoard />);
      await waitForHydration();

      // 1. Create task
      await openAddTaskModal(user);
      await fillTaskForm(user, { title: 'New Task' });
      await submitTaskForm(user);

      await waitFor(() => {
        expect(screen.getByText('New Task')).toBeInTheDocument();
      });

      // 2. Edit task
      const editButton = screen.getByRole('button', { name: /edit task: new task/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await fillTaskForm(user, { title: 'Updated Task' });
      await submitTaskForm(user);

      await waitFor(() => {
        expect(screen.getByText('Updated Task')).toBeInTheDocument();
      });

      // 3. Delete task
      const deleteButton = screen.getByRole('button', { name: /delete task: updated task/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText('Updated Task')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple tasks across different columns', async () => {
      const tasks = [
        createMockTask({ id: 'task-1', title: 'Todo Task', columnId: 'TODO' }),
        createMockTask({ id: 'task-2', title: 'In Progress Task', columnId: 'IN_PROGRESS' }),
        createMockTask({ id: 'task-3', title: 'Completed Task', columnId: 'COMPLETED' }),
      ];

      vi.mocked(taskActions.getTasks).mockResolvedValue(
        createSuccessResponse(tasks)
      );

      render(<KanbanBoard />);
      await waitForHydration();

      // Verify all tasks are displayed
      expect(screen.getByText('Todo Task')).toBeInTheDocument();
      expect(screen.getByText('In Progress Task')).toBeInTheDocument();
      expect(screen.getByText('Completed Task')).toBeInTheDocument();
    });

    it('should clear errors when performing new operations', async () => {
      const user = userEvent.setup();

      // First operation fails
      vi.mocked(taskActions.createTask).mockResolvedValueOnce(
        createErrorResponse('First error')
      );

      render(<KanbanBoard />);
      await waitForHydration();

      await openAddTaskModal(user);
      await fillTaskForm(user, { title: 'First Task' });
      await submitTaskForm(user);

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByText(/first error/i)).toBeInTheDocument();
      });

      // Second operation succeeds
      const newTask = createMockTask({ id: 'task-1', title: 'Second Task' });
      vi.mocked(taskActions.createTask).mockResolvedValueOnce(
        createSuccessResponse(newTask)
      );

      await openAddTaskModal(user);
      await fillTaskForm(user, { title: 'Second Task' });
      await submitTaskForm(user);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
      });

      // New task should be displayed
      await waitFor(() => {
        expect(screen.getByText('Second Task')).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('should handle rapid successive operations', async () => {
      const user = userEvent.setup();

      const task1 = createMockTask({ id: 'task-1', title: 'Task 1' });
      const task2 = createMockTask({ id: 'task-2', title: 'Task 2' });

      vi.mocked(taskActions.createTask)
        .mockResolvedValueOnce(createSuccessResponse(task1))
        .mockResolvedValueOnce(createSuccessResponse(task2));

      render(<KanbanBoard />);
      await waitForHydration();

      // Rapidly create two tasks
      await openAddTaskModal(user);
      await fillTaskForm(user, { title: 'Task 1' });
      await submitTaskForm(user);

      await openAddTaskModal(user);
      await fillTaskForm(user, { title: 'Task 2' });
      await submitTaskForm(user);

      // Both should eventually appear
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.getByText('Task 2')).toBeInTheDocument();
      });
    });

    it('should handle tasks with special characters in title', async () => {
      const user = userEvent.setup();

      const specialTask = createMockTask({
        id: 'task-1',
        title: 'Task with <script>alert("xss")</script>',
      });

      vi.mocked(taskActions.createTask).mockResolvedValue(
        createSuccessResponse(specialTask)
      );

      render(<KanbanBoard />);
      await waitForHydration();

      await openAddTaskModal(user);
      await fillTaskForm(user, { title: 'Task with <script>alert("xss")</script>' });
      await submitTaskForm(user);

      // Task should be displayed (sanitized by server)
      await waitFor(() => {
        expect(screen.getByText(/Task with/)).toBeInTheDocument();
      });
    });

    it('should display loading indicator during operations', async () => {
      const user = userEvent.setup();

      // Create a promise that we can control
      let resolveCreate: (value: ActionResponse<TaskResponse>) => void;
      const createPromise = new Promise<ActionResponse<TaskResponse>>((resolve) => {
        resolveCreate = resolve;
      });

      vi.mocked(taskActions.createTask).mockReturnValue(createPromise);

      render(<KanbanBoard />);
      await waitForHydration();

      await openAddTaskModal(user);
      await fillTaskForm(user, { title: 'Slow Task' });
      await submitTaskForm(user);

      // Verify loading indicator appears
      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });

      // Resolve the promise
      const newTask = createMockTask({ id: 'task-1', title: 'Slow Task' });
      resolveCreate!(createSuccessResponse(newTask));

      // Loading indicator should disappear
      await waitFor(() => {
        expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
      });
    });
  });
});
