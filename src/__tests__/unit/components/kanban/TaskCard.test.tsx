/**
 * TaskCard Component Tests
 *
 * Tests the TaskCard component for displaying task information,
 * drag-and-drop functionality, and action handlers (edit/delete).
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskCard, TaskCardOverlay } from '@/features/kanban';
import { Task } from '@/types';
import { DndContext } from '@dnd-kit/core';

// =============================================================================
// TEST UTILITIES
// =============================================================================

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task description',
  priority: 'medium',
  tags: ['frontend', 'urgent'],
  categories: ['Development', 'UI'],
  columnId: 'todo',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// Helper to render TaskCard with DndContext
function renderTaskCard(task: Task, onEdit = vi.fn(), onDelete = vi.fn()) {
  return render(
    <DndContext>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
    </DndContext>
  );
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('TaskCard', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderTaskCard(mockTask, mockOnEdit, mockOnDelete);
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should display task title', () => {
      renderTaskCard(mockTask);
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should display task description', () => {
      renderTaskCard(mockTask);
      expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    });

    it('should not display description if not provided', () => {
      const taskWithoutDescription = { ...mockTask, description: '' };
      renderTaskCard(taskWithoutDescription);
      expect(screen.queryByText('This is a test task description')).not.toBeInTheDocument();
    });

    it('should display priority badge', () => {
      renderTaskCard(mockTask);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should display tags', () => {
      renderTaskCard(mockTask);
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('should display categories', () => {
      renderTaskCard(mockTask);
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('UI')).toBeInTheDocument();
    });

    it('should not display categories section if no categories', () => {
      const taskWithoutCategories = { ...mockTask, categories: [] };
      const { container } = renderTaskCard(taskWithoutCategories);
      const categoryIcons = container.querySelectorAll('svg');
      // Should have fewer SVG elements without category section
      expect(categoryIcons.length).toBeLessThan(4);
    });

    it('should render edit button', () => {
      renderTaskCard(mockTask);
      expect(screen.getByRole('button', { name: /edit task/i })).toBeInTheDocument();
    });

    it('should render delete button', () => {
      renderTaskCard(mockTask);
      expect(screen.getByRole('button', { name: /delete task/i })).toBeInTheDocument();
    });

    it('should display correct priority badge for low priority', () => {
      const lowPriorityTask = { ...mockTask, priority: 'low' as const };
      renderTaskCard(lowPriorityTask);
      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('should display correct priority badge for high priority', () => {
      const highPriorityTask = { ...mockTask, priority: 'high' as const };
      renderTaskCard(highPriorityTask);
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // User Interaction Tests
  // ---------------------------------------------------------------------------

  describe('User Interactions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      renderTaskCard(mockTask, mockOnEdit, mockOnDelete);

      const editButton = screen.getByRole('button', { name: /edit task: test task/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
    });

    it('should call onDelete when delete button is clicked', async () => {
      renderTaskCard(mockTask, mockOnEdit, mockOnDelete);

      const deleteButton = screen.getByRole('button', { name: /delete task: test task/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
    });

    it('should not call handlers when clicking on card body', async () => {
      renderTaskCard(mockTask, mockOnEdit, mockOnDelete);

      const taskTitle = screen.getByText('Test Task');
      await user.click(taskTitle);

      expect(mockOnEdit).not.toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

  });

  // ---------------------------------------------------------------------------
  // Visual Styling Tests
  // ---------------------------------------------------------------------------

  describe('Visual Styling', () => {
    it('should have correct priority accent for low priority', () => {
      const lowPriorityTask = { ...mockTask, priority: 'low' as const };
      const { container } = renderTaskCard(lowPriorityTask);
      const priorityAccent = container.querySelector('.from-emerald-300\\/40');
      expect(priorityAccent).toBeInTheDocument();
    });

    it('should have correct priority accent for medium priority', () => {
      const { container } = renderTaskCard(mockTask);
      const priorityAccent = container.querySelector('.from-amber-300\\/40');
      expect(priorityAccent).toBeInTheDocument();
    });

    it('should have correct priority accent for high priority', () => {
      const highPriorityTask = { ...mockTask, priority: 'high' as const };
      const { container } = renderTaskCard(highPriorityTask);
      const priorityAccent = container.querySelector('.from-rose-300\\/40');
      expect(priorityAccent).toBeInTheDocument();
    });

    it('should have cursor-grab class for draggable card', () => {
      const { container } = renderTaskCard(mockTask);
      const card = container.querySelector('.cursor-grab');
      expect(card).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have accessible edit button label with task name', () => {
      renderTaskCard(mockTask);
      expect(screen.getByRole('button', { name: 'Edit task: Test Task' })).toBeInTheDocument();
    });

    it('should have accessible delete button label with task name', () => {
      renderTaskCard(mockTask);
      expect(screen.getByRole('button', { name: 'Delete task: Test Task' })).toBeInTheDocument();
    });

    it('should group action buttons with role group', () => {
      const { container } = renderTaskCard(mockTask);
      const actionGroup = container.querySelector('[role="group"][aria-label="Task actions"]');
      expect(actionGroup).toBeInTheDocument();
    });

    it('should have edit and delete button elements', () => {
      renderTaskCard(mockTask);
      expect(screen.getByRole('button', { name: /edit task: test task/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete task: test task/i })).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Conditional Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Conditional Rendering', () => {
    it('should not render tags if tags array is empty', () => {
      const taskWithoutTags = { ...mockTask, tags: [] };
      renderTaskCard(taskWithoutTags);
      expect(screen.queryByText('frontend')).not.toBeInTheDocument();
      expect(screen.queryByText('urgent')).not.toBeInTheDocument();
    });

    it('should handle tasks with many tags', () => {
      const taskWithManyTags = {
        ...mockTask,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      };
      renderTaskCard(taskWithManyTags);
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag5')).toBeInTheDocument();
    });

    it('should handle tasks with long descriptions', () => {
      const longDescription = 'A'.repeat(200);
      const taskWithLongDesc = { ...mockTask, description: longDescription };
      renderTaskCard(taskWithLongDesc);
      const description = screen.getByText(longDescription);
      expect(description).toBeInTheDocument();
    });

    it('should handle tasks with undefined categories', () => {
      const taskWithUndefinedCategories = { ...mockTask, categories: undefined as any };
      renderTaskCard(taskWithUndefinedCategories);
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// TASK CARD OVERLAY TESTS
// =============================================================================

describe('TaskCardOverlay', () => {
  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<TaskCardOverlay task={mockTask} />);
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should display task title', () => {
      render(<TaskCardOverlay task={mockTask} />);
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should display task description', () => {
      render(<TaskCardOverlay task={mockTask} />);
      expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    });

    it('should display priority badge', () => {
      render(<TaskCardOverlay task={mockTask} />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should display tags', () => {
      render(<TaskCardOverlay task={mockTask} />);
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('should display categories', () => {
      render(<TaskCardOverlay task={mockTask} />);
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('UI')).toBeInTheDocument();
    });

    it('should not render action buttons', () => {
      render(<TaskCardOverlay task={mockTask} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should have visual styling for drag state', () => {
      const { container } = render(<TaskCardOverlay task={mockTask} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('rotate-2');
      expect(overlay).toHaveClass('scale-105');
    });

    it('should render for all priority levels', () => {
      const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      priorities.forEach((priority) => {
        const task = { ...mockTask, priority };
        const { rerender } = render(<TaskCardOverlay task={task} />);
        expect(screen.getByText('Test Task')).toBeInTheDocument();
        rerender(<></>);
      });
    });
  });
});
