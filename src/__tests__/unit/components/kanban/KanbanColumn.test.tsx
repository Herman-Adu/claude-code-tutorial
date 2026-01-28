/**
 * KanbanColumn Component Tests
 *
 * Tests the KanbanColumn component for displaying tasks in a column,
 * drag-and-drop zones, empty states, and column-specific actions.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KanbanColumn } from '@/features/kanban';
import { Column, Task } from '@/types';
import { DndContext } from '@dnd-kit/core';

// Mock TaskCard component to simplify testing
vi.mock('@/features/kanban/components/TaskCard', () => ({
  TaskCard: ({ task, onEdit, onDelete }: any) => (
    <div data-testid={`task-${task.id}`}>
      <h3>{task.title}</h3>
      <button onClick={() => onEdit(task)}>Edit {task.title}</button>
      <button onClick={() => onDelete(task.id)}>Delete {task.title}</button>
    </div>
  ),
}));

// =============================================================================
// TEST UTILITIES
// =============================================================================

const todoColumn: Column = {
  id: 'todo',
  title: 'To-Do',
};

const inProgressColumn: Column = {
  id: 'in-progress',
  title: 'In Progress',
};

const completedColumn: Column = {
  id: 'completed',
  title: 'Completed',
};

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Description 1',
    priority: 'high',
    tags: ['urgent'],
    categories: ['Frontend'],
    columnId: 'todo',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Description 2',
    priority: 'medium',
    tags: ['backend'],
    categories: ['API'],
    columnId: 'todo',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

// Helper to render KanbanColumn with DndContext
function renderColumn(
  column: Column,
  tasks: Task[] = [],
  onAddTask = vi.fn(),
  onEditTask = vi.fn(),
  onDeleteTask = vi.fn()
) {
  return render(
    <DndContext>
      <KanbanColumn
        column={column}
        tasks={tasks}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
      />
    </DndContext>
  );
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('KanbanColumn', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnAddTask = vi.fn();
  const mockOnEditTask = vi.fn();
  const mockOnDeleteTask = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderColumn(todoColumn);
      expect(screen.getByText('To-Do')).toBeInTheDocument();
    });

    it('should display column title', () => {
      renderColumn(inProgressColumn);
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('should display task count', () => {
      renderColumn(todoColumn, mockTasks);
      expect(screen.getByText('2 tasks')).toBeInTheDocument();
    });

    it('should display singular "task" for one task', () => {
      renderColumn(todoColumn, [mockTasks[0]]);
      expect(screen.getByText('1 task')).toBeInTheDocument();
    });

    it('should display "0 tasks" when empty', () => {
      renderColumn(todoColumn, []);
      expect(screen.getByText('0 tasks')).toBeInTheDocument();
    });

    it('should render add button only for todo column', () => {
      renderColumn(todoColumn);
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    });

    it('should not render add button for in-progress column', () => {
      renderColumn(inProgressColumn);
      expect(screen.queryByRole('button', { name: /add new task/i })).not.toBeInTheDocument();
    });

    it('should not render add button for completed column', () => {
      renderColumn(completedColumn);
      expect(screen.queryByRole('button', { name: /add new task/i })).not.toBeInTheDocument();
    });

    it('should render all tasks in the column', () => {
      renderColumn(todoColumn, mockTasks);
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    it('should show empty state when no tasks', () => {
      renderColumn(todoColumn, []);
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });

    it('should display column icon', () => {
      const { container } = renderColumn(todoColumn);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // User Interaction Tests
  // ---------------------------------------------------------------------------

  describe('User Interactions', () => {
    it('should call onAddTask when add button is clicked', async () => {
      renderColumn(todoColumn, [], mockOnAddTask);

      const addButton = screen.getByRole('button', { name: /add new task/i });
      await user.click(addButton);

      expect(mockOnAddTask).toHaveBeenCalledTimes(1);
    });

    it('should call onEditTask when task edit button is clicked', async () => {
      renderColumn(todoColumn, mockTasks, mockOnAddTask, mockOnEditTask);

      const editButton = screen.getByRole('button', { name: /edit task 1/i });
      await user.click(editButton);

      expect(mockOnEditTask).toHaveBeenCalledTimes(1);
      expect(mockOnEditTask).toHaveBeenCalledWith(mockTasks[0]);
    });

    it('should call onDeleteTask when task delete button is clicked', async () => {
      renderColumn(todoColumn, mockTasks, mockOnAddTask, mockOnEditTask, mockOnDeleteTask);

      const deleteButton = screen.getByRole('button', { name: /delete task 1/i });
      await user.click(deleteButton);

      expect(mockOnDeleteTask).toHaveBeenCalledTimes(1);
      expect(mockOnDeleteTask).toHaveBeenCalledWith('task-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Column-Specific Styling Tests
  // ---------------------------------------------------------------------------

  describe('Column-Specific Styling', () => {
    it('should have todo-specific glass styling', () => {
      const { container } = renderColumn(todoColumn);
      const column = container.querySelector('.glass-sky');
      expect(column).toBeInTheDocument();
    });

    it('should have in-progress-specific glass styling', () => {
      const { container } = renderColumn(inProgressColumn);
      const column = container.querySelector('.glass-peach');
      expect(column).toBeInTheDocument();
    });

    it('should have completed-specific glass styling', () => {
      const { container } = renderColumn(completedColumn);
      const column = container.querySelector('.glass-mint');
      expect(column).toBeInTheDocument();
    });

    it('should have correct header gradient for todo', () => {
      const { container } = renderColumn(todoColumn);
      const header = container.querySelector('.from-sky-200\\/80');
      expect(header).toBeInTheDocument();
    });

    it('should have correct header gradient for in-progress', () => {
      const { container } = renderColumn(inProgressColumn);
      const header = container.querySelector('.from-amber-200\\/80');
      expect(header).toBeInTheDocument();
    });

    it('should have correct header gradient for completed', () => {
      const { container } = renderColumn(completedColumn);
      const header = container.querySelector('.from-emerald-200\\/80');
      expect(header).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Empty State Tests
  // ---------------------------------------------------------------------------

  describe('Empty State', () => {
    it('should show empty state with icon', () => {
      const { container } = renderColumn(todoColumn, []);
      const emptyState = container.querySelector('.border-dashed');
      expect(emptyState).toBeInTheDocument();
    });

    it('should show "No tasks yet" message', () => {
      renderColumn(todoColumn, []);
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });

    it('should have role status for empty state', () => {
      renderColumn(todoColumn, []);
      const statusElements = screen.getAllByRole('status');
      // Should have at least one status element for empty state
      expect(statusElements.length).toBeGreaterThan(0);
      // Check that one of them contains the empty state text
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Task List Tests
  // ---------------------------------------------------------------------------

  describe('Task List', () => {
    it('should render correct number of tasks', () => {
      renderColumn(todoColumn, mockTasks);
      expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-task-2')).toBeInTheDocument();
    });

    it('should render tasks in order', () => {
      renderColumn(todoColumn, mockTasks);
      const task1 = screen.getByTestId('task-task-1');
      const task2 = screen.getByTestId('task-task-2');

      expect(task1.compareDocumentPosition(task2)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('should handle many tasks', () => {
      const manyTasks = Array.from({ length: 10 }, (_, i) => ({
        ...mockTasks[0],
        id: `task-${i}`,
        title: `Task ${i}`,
      }));

      renderColumn(todoColumn, manyTasks);
      expect(screen.getByText('10 tasks')).toBeInTheDocument();
    });

    it('should update when tasks change', () => {
      const { rerender } = render(
        <DndContext>
          <KanbanColumn
            column={todoColumn}
            tasks={[mockTasks[0]]}
            onAddTask={mockOnAddTask}
            onEditTask={mockOnEditTask}
            onDeleteTask={mockOnDeleteTask}
          />
        </DndContext>
      );

      expect(screen.getByText('1 task')).toBeInTheDocument();

      rerender(
        <DndContext>
          <KanbanColumn
            column={todoColumn}
            tasks={mockTasks}
            onAddTask={mockOnAddTask}
            onEditTask={mockOnEditTask}
            onDeleteTask={mockOnDeleteTask}
          />
        </DndContext>
      );

      expect(screen.getByText('2 tasks')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have section role with descriptive label', () => {
      renderColumn(todoColumn, mockTasks);
      expect(
        screen.getByRole('region', { name: /to-do column with 2 tasks/i })
      ).toBeInTheDocument();
    });

    it('should update aria-label with task count', () => {
      renderColumn(todoColumn, [mockTasks[0]]);
      expect(
        screen.getByRole('region', { name: /to-do column with 1 task/i })
      ).toBeInTheDocument();
    });

    it('should have accessible add button label', () => {
      renderColumn(todoColumn);
      const addButton = screen.getByRole('button', { name: /add new task/i });
      expect(addButton).toHaveAttribute('aria-label', 'Add new task');
    });

    it('should mark SVG icons as aria-hidden', () => {
      const { container } = renderColumn(todoColumn);
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have proper heading hierarchy', () => {
      renderColumn(todoColumn);
      const heading = screen.getByRole('heading', { name: /to-do/i });
      expect(heading.tagName).toBe('H2');
    });
  });

  // ---------------------------------------------------------------------------
  // Props Handling Tests
  // ---------------------------------------------------------------------------

  describe('Props Handling', () => {
    it('should handle all column types', () => {
      const columns = [todoColumn, inProgressColumn, completedColumn];

      columns.forEach((column) => {
        const { unmount } = renderColumn(column);
        expect(screen.getByText(column.title)).toBeInTheDocument();
        unmount();
      });
    });

    it('should pass task data to TaskCard components', () => {
      renderColumn(todoColumn, mockTasks);
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    it('should handle empty tasks array', () => {
      renderColumn(todoColumn, []);
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Visual State Tests
  // ---------------------------------------------------------------------------

  describe('Visual States', () => {
    it('should have minimum height', () => {
      const { container } = renderColumn(todoColumn);
      const column = container.querySelector('.min-h-\\[400px\\]');
      expect(column).toBeInTheDocument();
    });

    it('should have scrollable task list area', () => {
      const { container } = renderColumn(todoColumn, mockTasks);
      const taskList = container.querySelector('.overflow-y-auto');
      expect(taskList).toBeInTheDocument();
    });

    it('should have flex layout', () => {
      const { container } = renderColumn(todoColumn);
      const column = container.querySelector('.flex');
      expect(column).toBeInTheDocument();
    });

    it('should have proper spacing between tasks', () => {
      const { container } = renderColumn(todoColumn, mockTasks);
      const taskList = container.querySelector('.space-y-3');
      expect(taskList).toBeInTheDocument();
    });
  });
});
