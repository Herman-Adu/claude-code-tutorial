/**
 * KanbanBoard Component Tests
 *
 * Tests the main KanbanBoard component including state management,
 * drag-and-drop functionality, modal interactions, and error handling.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KanbanBoard } from '@/features/kanban';
import { Task } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock the useKanban hook
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Todo Task',
    description: 'Task in todo',
    priority: 'high',
    tags: ['urgent'],
    categories: ['Frontend'],
    columnId: 'todo',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'task-2',
    title: 'In Progress Task',
    description: 'Task in progress',
    priority: 'medium',
    tags: ['backend'],
    categories: ['API'],
    columnId: 'in-progress',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

const mockUseKanban = {
  tasks: mockTasks,
  isHydrated: true,
  isLoading: false,
  error: null,
  addTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  moveTask: vi.fn(),
  getTasksByColumn: vi.fn((columnId: string) =>
    mockTasks.filter((task) => task.columnId === columnId)
  ),
  clearError: vi.fn(),
};

vi.mock('@/features/kanban/hooks/useKanban', () => ({
  useKanban: () => mockUseKanban,
}));

// Mock child components to simplify testing
vi.mock('@/features/kanban/components/KanbanColumn', () => ({
  KanbanColumn: ({ column, tasks, onAddTask, onEditTask, onDeleteTask }: any) => (
    <div data-testid={`column-${column.id}`}>
      <h2>{column.title}</h2>
      <p>{tasks.length} tasks</p>
      {column.id === 'todo' && (
        <button onClick={onAddTask} aria-label="Add new task">
          Add Task
        </button>
      )}
      {tasks.map((task: Task) => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          <span>{task.title}</span>
          <button onClick={() => onEditTask(task)}>Edit {task.title}</button>
          <button onClick={() => onDeleteTask(task.id)}>Delete {task.title}</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/features/kanban/components/TaskForm', () => ({
  TaskForm: ({ initialData, onSubmit, onCancel }: any) => (
    <form
      data-testid="task-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          title: 'Test Task',
          description: 'Test Description',
          priority: 'medium',
          tags: [],
          categories: [],
          columnId: initialData?.columnId || 'todo',
        });
      }}
    >
      <input type="text" placeholder="Title" />
      <button type="submit">{initialData ? 'Save Changes' : 'Create Task'}</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  ),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, onClose, title, children }: any) =>
    isOpen ? (
      <div role="dialog" aria-labelledby="modal-title">
        <h2 id="modal-title">{title}</h2>
        <button onClick={onClose} aria-label="Close modal">
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

// Mock DnD components
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  DragOverlay: ({ children }: any) => <div>{children}</div>,
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  closestCorners: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  sortableKeyboardCoordinates: vi.fn(),
}));

vi.mock('@/features/kanban/TaskCard', () => ({
  TaskCardOverlay: ({ task }: any) => <div>Dragging: {task.title}</div>,
}));

// =============================================================================
// TEST SUITE
// =============================================================================

describe('KanbanBoard', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockUseKanban.isHydrated = true;
    mockUseKanban.isLoading = false;
    mockUseKanban.error = null;
    mockUseKanban.tasks = mockTasks;
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<KanbanBoard />);
      expect(screen.getByText('Kanban Board')).toBeInTheDocument();
    });

    it('should render all three columns', () => {
      render(<KanbanBoard />);
      expect(screen.getByText('To-Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should render board title', () => {
      render(<KanbanBoard />);
      expect(screen.getByText('Kanban Board')).toBeInTheDocument();
    });

    it('should render board subtitle', () => {
      render(<KanbanBoard />);
      expect(screen.getByText(/organize your tasks with drag and drop/i)).toBeInTheDocument();
    });

    it('should show loading state when not hydrated', () => {
      mockUseKanban.isHydrated = false;
      render(<KanbanBoard />);
      expect(screen.getByText(/loading board/i)).toBeInTheDocument();
    });

    it('should have loading spinner when not hydrated', () => {
      mockUseKanban.isHydrated = false;
      render(<KanbanBoard />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Loading State Tests
  // ---------------------------------------------------------------------------

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      mockUseKanban.isLoading = true;
      render(<KanbanBoard />);
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });

    it('should have loading spinner with proper accessibility', () => {
      mockUseKanban.isLoading = true;
      render(<KanbanBoard />);
      const loadingIndicator = screen.getByRole('status', { name: /loading/i });
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should not show loading indicator when isLoading is false', () => {
      mockUseKanban.isLoading = false;
      render(<KanbanBoard />);
      expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Error Handling Tests
  // ---------------------------------------------------------------------------

  describe('Error Handling', () => {
    it('should show error toast when error exists', () => {
      mockUseKanban.error = 'Failed to save task';
      render(<KanbanBoard />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to save task')).toBeInTheDocument();
    });

    it('should have dismiss button on error toast', () => {
      mockUseKanban.error = 'Test error';
      render(<KanbanBoard />);
      expect(screen.getByRole('button', { name: /dismiss error/i })).toBeInTheDocument();
    });

    it('should call clearError when dismiss button is clicked', async () => {
      mockUseKanban.error = 'Test error';
      render(<KanbanBoard />);

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      await user.click(dismissButton);

      expect(mockUseKanban.clearError).toHaveBeenCalledTimes(1);
    });

    it('should not show error toast when no error', () => {
      mockUseKanban.error = null;
      render(<KanbanBoard />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Task Management Tests
  // ---------------------------------------------------------------------------

  describe('Task Management', () => {
    it('should open modal when add task button is clicked', async () => {
      render(<KanbanBoard />);

      const addButton = screen.getByRole('button', { name: /add new task/i });
      await user.click(addButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('New Task')).toBeInTheDocument();
    });

    it('should open modal with task data when edit is clicked', async () => {
      render(<KanbanBoard />);

      const editButton = screen.getByRole('button', { name: /edit todo task/i });
      await user.click(editButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });

    it('should call addTask when form is submitted for new task', async () => {
      render(<KanbanBoard />);

      // Open modal
      const addButton = screen.getByRole('button', { name: /add new task/i });
      await user.click(addButton);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(mockUseKanban.addTask).toHaveBeenCalledTimes(1);
      expect(mockUseKanban.addTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Task',
          columnId: 'todo',
        })
      );
    });

    it('should call updateTask when form is submitted for edit', async () => {
      render(<KanbanBoard />);

      // Open edit modal
      const editButton = screen.getByRole('button', { name: /edit todo task/i });
      await user.click(editButton);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      expect(mockUseKanban.updateTask).toHaveBeenCalledTimes(1);
      expect(mockUseKanban.updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          title: 'Test Task',
        })
      );
    });

    it('should close modal after successful submission', async () => {
      render(<KanbanBoard />);

      // Open modal
      const addButton = screen.getByRole('button', { name: /add new task/i });
      await user.click(addButton);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      // Modal should be closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should close modal when cancel is clicked', async () => {
      render(<KanbanBoard />);

      // Open modal
      const addButton = screen.getByRole('button', { name: /add new task/i });
      await user.click(addButton);

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Modal should be closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should close modal when close button is clicked', async () => {
      render(<KanbanBoard />);

      // Open modal
      const addButton = screen.getByRole('button', { name: /add new task/i });
      await user.click(addButton);

      // Click close
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);

      // Modal should be closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Delete Confirmation Tests
  // ---------------------------------------------------------------------------

  describe('Delete Confirmation', () => {
    it('should show delete confirmation modal when delete is clicked', async () => {
      render(<KanbanBoard />);

      const deleteButton = screen.getByRole('button', { name: /delete todo task/i });
      await user.click(deleteButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Task')).toBeInTheDocument();
    });

    it('should show confirmation message in delete modal', async () => {
      render(<KanbanBoard />);

      const deleteButton = screen.getByRole('button', { name: /delete todo task/i });
      await user.click(deleteButton);

      expect(
        screen.getByText(/are you sure you want to delete this task/i)
      ).toBeInTheDocument();
    });

    it('should call deleteTask when delete is confirmed', async () => {
      render(<KanbanBoard />);

      // Open delete confirmation
      const deleteButton = screen.getByRole('button', { name: /delete todo task/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
      await user.click(confirmButton);

      expect(mockUseKanban.deleteTask).toHaveBeenCalledTimes(1);
      expect(mockUseKanban.deleteTask).toHaveBeenCalledWith('task-1');
    });

    it('should not call deleteTask when cancel is clicked', async () => {
      render(<KanbanBoard />);

      // Open delete confirmation
      const deleteButton = screen.getByRole('button', { name: /delete todo task/i });
      await user.click(deleteButton);

      // Cancel deletion
      const cancelButton = screen.getByRole('button', { name: /cancel deletion/i });
      await user.click(cancelButton);

      expect(mockUseKanban.deleteTask).not.toHaveBeenCalled();
    });

    it('should close delete modal after confirmation', async () => {
      render(<KanbanBoard />);

      // Open delete confirmation
      const deleteButton = screen.getByRole('button', { name: /delete todo task/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
      await user.click(confirmButton);

      // Modal should be closed
      expect(screen.queryByText('Delete Task')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<KanbanBoard />);
      const mainHeading = screen.getByRole('heading', { name: /kanban board/i });
      expect(mainHeading.tagName).toBe('H1');
    });

    it('should have main landmark with descriptive label', () => {
      render(<KanbanBoard />);
      expect(screen.getByRole('main', { name: /kanban board columns/i })).toBeInTheDocument();
    });

    it('should have live region for subtitle', () => {
      render(<KanbanBoard />);
      const subtitle = screen.getByText(/organize your tasks with drag and drop/i);
      expect(subtitle).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper roles for modals', async () => {
      render(<KanbanBoard />);

      const addButton = screen.getByRole('button', { name: /add new task/i });
      await user.click(addButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(<KanbanBoard />);
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    });

    it('should have group role for confirmation actions', async () => {
      render(<KanbanBoard />);

      const deleteButton = screen.getByRole('button', { name: /delete todo task/i });
      await user.click(deleteButton);

      const actionGroup = screen.getByRole('group', { name: /confirmation actions/i });
      expect(actionGroup).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Data Flow Tests
  // ---------------------------------------------------------------------------

  describe('Data Flow', () => {
    it('should pass tasks to columns correctly', () => {
      render(<KanbanBoard />);
      expect(screen.getByTestId('column-todo')).toBeInTheDocument();
      expect(screen.getByTestId('column-in-progress')).toBeInTheDocument();
      expect(screen.getByTestId('column-completed')).toBeInTheDocument();
    });

    it('should filter tasks by column', () => {
      render(<KanbanBoard />);
      const todoColumn = screen.getByTestId('column-todo');
      const inProgressColumn = screen.getByTestId('column-in-progress');

      expect(todoColumn).toHaveTextContent('1 tasks');
      expect(inProgressColumn).toHaveTextContent('1 tasks');
    });

    it('should call getTasksByColumn for each column', () => {
      render(<KanbanBoard />);
      expect(mockUseKanban.getTasksByColumn).toHaveBeenCalledWith('todo');
      expect(mockUseKanban.getTasksByColumn).toHaveBeenCalledWith('in-progress');
      expect(mockUseKanban.getTasksByColumn).toHaveBeenCalledWith('completed');
    });
  });
});
