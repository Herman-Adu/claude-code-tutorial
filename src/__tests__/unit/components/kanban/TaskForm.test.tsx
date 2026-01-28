/**
 * TaskForm Component Tests
 *
 * Tests the TaskForm component for creating and editing tasks,
 * including form validation, user input handling, and submission.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskForm } from '@/features/kanban';
import { Task } from '@/types';
import { VALIDATION } from '@/lib/utils';

// =============================================================================
// TEST UTILITIES
// =============================================================================

const mockTask: Task = {
  id: 'task-1',
  title: 'Existing Task',
  description: 'Existing description',
  priority: 'high',
  tags: ['design', 'urgent'],
  categories: ['Frontend', 'UI'],
  columnId: 'in-progress',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// =============================================================================
// TEST SUITE
// =============================================================================

describe('TaskForm', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/categories/i)).toBeInTheDocument();
    });

    it('should render priority buttons', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /set priority to low/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set priority to medium/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set priority to high/i })).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show "Create Task" button when no initial data', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    });

    it('should show "Save Changes" button when editing', () => {
      render(<TaskForm initialData={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('should render status dropdown when editing', () => {
      render(<TaskForm initialData={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('should not render status dropdown when creating', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Initial Data Tests
  // ---------------------------------------------------------------------------

  describe('Initial Data', () => {
    it('should populate form with initial data', () => {
      render(<TaskForm initialData={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Task');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Existing description');
      expect(screen.getByLabelText(/tags/i)).toHaveValue('design, urgent');
      expect(screen.getByLabelText(/categories/i)).toHaveValue('Frontend, UI');
    });

    it('should set correct priority from initial data', () => {
      render(<TaskForm initialData={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const highPriorityButton = screen.getByRole('button', { name: /set priority to high/i });
      expect(highPriorityButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should set correct status from initial data', () => {
      render(<TaskForm initialData={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement;
      expect(statusSelect.value).toBe('in-progress');
    });

    it('should handle empty initial tags and categories', () => {
      const taskWithoutTags = { ...mockTask, tags: [], categories: [] };
      render(
        <TaskForm initialData={taskWithoutTags} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/tags/i)).toHaveValue('');
      expect(screen.getByLabelText(/categories/i)).toHaveValue('');
    });
  });

  // ---------------------------------------------------------------------------
  // User Input Tests
  // ---------------------------------------------------------------------------

  describe('User Input', () => {
    it('should handle title input', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Task Title');

      expect(titleInput).toHaveValue('New Task Title');
    });

    it('should handle description input', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Task description here');

      expect(descriptionInput).toHaveValue('Task description here');
    });

    it('should handle priority selection', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const lowPriorityButton = screen.getByRole('button', { name: /set priority to low/i });
      await user.click(lowPriorityButton);

      expect(lowPriorityButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should toggle priority selection', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const mediumButton = screen.getByRole('button', { name: /set priority to medium/i });
      const highButton = screen.getByRole('button', { name: /set priority to high/i });

      expect(mediumButton).toHaveAttribute('aria-pressed', 'true'); // default

      await user.click(highButton);
      expect(highButton).toHaveAttribute('aria-pressed', 'true');
      expect(mediumButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should handle tags input', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const tagsInput = screen.getByLabelText(/tags/i);
      await user.type(tagsInput, 'tag1, tag2, tag3');

      expect(tagsInput).toHaveValue('tag1, tag2, tag3');
    });

    it('should handle categories input', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const categoriesInput = screen.getByLabelText(/categories/i);
      await user.type(categoriesInput, 'Cat1, Cat2');

      expect(categoriesInput).toHaveValue('Cat1, Cat2');
    });

    it('should handle status selection when editing', async () => {
      render(<TaskForm initialData={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, 'completed');

      expect(statusSelect).toHaveValue('completed');
    });
  });

  // ---------------------------------------------------------------------------
  // Form Submission Tests
  // ---------------------------------------------------------------------------

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/title/i), 'New Task');
      await user.type(screen.getByLabelText(/description/i), 'New description');
      await user.click(screen.getByRole('button', { name: /set priority to high/i }));

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          description: 'New description',
          priority: 'high',
          columnId: 'todo',
        })
      );
    });

    it('should parse tags correctly on submit', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/title/i), 'Task');
      await user.type(screen.getByLabelText(/tags/i), 'tag1, tag2, tag3');

      await user.click(screen.getByRole('button', { name: /create task/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag1', 'tag2', 'tag3'],
        })
      );
    });

    it('should parse categories correctly on submit', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/title/i), 'Task');
      await user.type(screen.getByLabelText(/categories/i), 'Cat1, Cat2');

      await user.click(screen.getByRole('button', { name: /create task/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: ['Cat1', 'Cat2'],
        })
      );
    });

    it('should trim whitespace from title', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/title/i), '  Task with spaces  ');
      await user.click(screen.getByRole('button', { name: /create task/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Task with spaces',
        })
      );
    });

    it('should trim whitespace from tags', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/title/i), 'Task');
      await user.type(screen.getByLabelText(/tags/i), '  tag1 ,  tag2  ,tag3  ');
      await user.click(screen.getByRole('button', { name: /create task/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag1', 'tag2', 'tag3'],
        })
      );
    });

    it('should remove empty tags', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/title/i), 'Task');
      await user.type(screen.getByLabelText(/tags/i), 'tag1, , ,tag2');
      await user.click(screen.getByRole('button', { name: /create task/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag1', 'tag2'],
        })
      );
    });

    it('should remove duplicate tags', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/title/i), 'Task');
      await user.type(screen.getByLabelText(/tags/i), 'tag1, tag2, tag1, tag2');
      await user.click(screen.getByRole('button', { name: /create task/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag1', 'tag2'],
        })
      );
    });

    it('should not submit when title is empty', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not submit when title is only whitespace', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/title/i), '   ');
      await user.click(screen.getByRole('button', { name: /create task/i }));

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle submit with Enter key in title field', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Task{Enter}');

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Validation Tests
  // ---------------------------------------------------------------------------

  describe('Validation', () => {
    it('should enforce max title length', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      expect(titleInput).toHaveAttribute('maxLength', VALIDATION.MAX_TITLE_LENGTH.toString());
    });

    it('should enforce max description length', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      expect(descriptionInput).toHaveAttribute(
        'maxLength',
        VALIDATION.MAX_DESCRIPTION_LENGTH.toString()
      );
    });

    it('should show character count for title', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.getByText(`0/${VALIDATION.MAX_TITLE_LENGTH} characters`)).toBeInTheDocument();
    });

    it('should update character count as user types in title', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test');

      expect(screen.getByText(`4/${VALIDATION.MAX_TITLE_LENGTH} characters`)).toBeInTheDocument();
    });

    it('should show character count for description', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(
        screen.getByText(`0/${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`)
      ).toBeInTheDocument();
    });

    it('should mark title as required', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toBeRequired();
    });

    it('should not mark description as required', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const descriptionInput = screen.getByLabelText(/description/i);
      expect(descriptionInput).not.toBeRequired();
    });
  });

  // ---------------------------------------------------------------------------
  // Cancel Functionality Tests
  // ---------------------------------------------------------------------------

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not submit when cancel is clicked', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/title/i), 'Task');
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/categories/i)).toBeInTheDocument();
    });

    it('should have aria-describedby for character count hints', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveAttribute('aria-describedby', 'title-hint');

      const descriptionInput = screen.getByLabelText(/description/i);
      expect(descriptionInput).toHaveAttribute('aria-describedby', 'description-hint');
    });

    it('should have proper button labels for priority selection', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText('Set priority to Low')).toBeInTheDocument();
      expect(screen.getByLabelText('Set priority to Medium')).toBeInTheDocument();
      expect(screen.getByLabelText('Set priority to High')).toBeInTheDocument();
    });

    it('should have aria-pressed for priority buttons', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const mediumButton = screen.getByRole('button', { name: /set priority to medium/i });
      expect(mediumButton).toHaveAttribute('aria-pressed');
    });

    it('should disable submit button when title is empty', () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', { name: /create task/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when title has content', async () => {
      render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      expect(submitButton).toBeEnabled();
    });
  });
});
