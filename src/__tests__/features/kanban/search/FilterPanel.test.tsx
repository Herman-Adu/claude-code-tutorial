/**
 * FilterPanel Component Tests
 *
 * Tests the FilterPanel component including filter options,
 * apply/clear functionality, and integration with Zustand store.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FilterPanel } from '@/features/kanban/components/FilterPanel';

// Track current mock state
let mockFilters: Record<string, unknown> = {};
let mockActiveFilterCount = 0;
const mockSetFilter = vi.fn();
const mockSetFilters = vi.fn();
const mockClearFilters = vi.fn();

// Mock the Zustand store with dynamic return values
vi.mock('@/store/kanban', () => ({
  useKanbanStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      filters: mockFilters,
      setFilter: mockSetFilter,
      setFilters: mockSetFilters,
      clearFilters: mockClearFilters,
      hasActiveFilters: () => mockActiveFilterCount > 0,
      getActiveFilterCount: () => mockActiveFilterCount,
    };
    return selector(state);
  }),
  useFilters: vi.fn(() => mockFilters),
  useActiveFilterCount: vi.fn(() => mockActiveFilterCount),
}));

describe('FilterPanel', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnClose = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Reset mock state
    mockFilters = {};
    mockActiveFilterCount = 0;
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<FilterPanel isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display Filters title', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should show all filter options', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      // Priority dropdown
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();

      // Status dropdown
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();

      // Categories input (using specific ID selector since label text appears multiple times)
      expect(screen.getByPlaceholderText(/type and press enter/i)).toBeInTheDocument();

      // Date range inputs
      expect(screen.getByText(/due date range/i)).toBeInTheDocument();
    });

    it('should show Apply Filters button', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument();
    });

    it('should show Clear All button', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    });

    it('should show close button', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('button', { name: /close filter panel/i })).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Priority Filter Tests
  // ---------------------------------------------------------------------------

  describe('Priority Filter', () => {
    it('should display all priority options', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      const select = screen.getByLabelText(/priority/i);

      expect(select).toContainHTML('All Priorities');
      expect(select).toContainHTML('High');
      expect(select).toContainHTML('Medium');
      expect(select).toContainHTML('Low');
    });

    it('should call setFilter when priority is changed', async () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      const select = screen.getByLabelText(/priority/i);

      await user.selectOptions(select, 'HIGH');

      expect(mockSetFilter).toHaveBeenCalledWith('priority', 'HIGH');
    });

    it('should clear priority when All Priorities is selected', async () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      const select = screen.getByLabelText(/priority/i);

      await user.selectOptions(select, '');

      expect(mockSetFilter).toHaveBeenCalledWith('priority', null);
    });
  });

  // ---------------------------------------------------------------------------
  // Column Filter Tests
  // ---------------------------------------------------------------------------

  describe('Column/Status Filter', () => {
    it('should display all column options', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      const select = screen.getByLabelText(/status/i);

      expect(select).toContainHTML('All Columns');
      expect(select).toContainHTML('To-Do');
      expect(select).toContainHTML('In Progress');
      expect(select).toContainHTML('Completed');
    });

    it('should call setFilter when column is changed', async () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      const select = screen.getByLabelText(/status/i);

      await user.selectOptions(select, 'IN_PROGRESS');

      expect(mockSetFilter).toHaveBeenCalledWith('columnId', 'IN_PROGRESS');
    });
  });

  // ---------------------------------------------------------------------------
  // Categories Filter Tests
  // ---------------------------------------------------------------------------

  describe('Categories Filter', () => {
    it('should show category input', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByPlaceholderText(/type and press enter/i)).toBeInTheDocument();
    });

    it('should show category suggestions', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      // Should show some suggested categories
      expect(screen.getByText('+ Work')).toBeInTheDocument();
      expect(screen.getByText('+ Personal')).toBeInTheDocument();
    });

    it('should add category when suggestion is clicked', async () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      await user.click(screen.getByText('+ Work'));

      expect(mockSetFilter).toHaveBeenCalledWith('categories', ['Work']);
    });

    it('should add category when Enter is pressed in input', async () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      const input = screen.getByPlaceholderText(/type and press enter/i);

      await user.type(input, 'Custom Category{Enter}');

      expect(mockSetFilter).toHaveBeenCalledWith('categories', ['Custom Category']);
    });
  });

  // ---------------------------------------------------------------------------
  // Action Button Tests
  // ---------------------------------------------------------------------------

  describe('Action Buttons', () => {
    it('should call onClose when Apply Filters is clicked', async () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: /apply filters/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call clearFilters when Clear All is clicked', async () => {
      // Need active filters for Clear All button to be enabled
      mockFilters = { priority: 'HIGH' };
      mockActiveFilterCount = 1;

      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: /clear all/i }));

      expect(mockClearFilters).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', async () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: /close filter panel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable Clear All when no filters are active', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      expect(clearButton).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Navigation Tests
  // ---------------------------------------------------------------------------

  describe('Keyboard Navigation', () => {
    it('should close on Escape key', async () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Active Filter Count Tests
  // ---------------------------------------------------------------------------

  describe('Active Filter Count', () => {
    it('should show active filter count badge', () => {
      // Set mock state with active filters
      mockFilters = { priority: 'HIGH' };
      mockActiveFilterCount = 1;

      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('1 active')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests (Issue 6 Fix)
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have role="dialog" with aria-modal', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
      const dialog = screen.getByRole('dialog');

      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Filter options');
    });

    it('should have proper label for category input', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      // The label should be associated with the input
      const input = screen.getByPlaceholderText(/type and press enter/i);
      expect(input).toHaveAttribute('id', 'category-input');
      expect(input).toHaveAttribute('aria-labelledby', 'category-filter-label');
    });

    it('should have aria-describedby pointing to help text', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/type and press enter/i);
      expect(input).toHaveAttribute('aria-describedby', 'category-help');
    });

    it('should have screen reader help text', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      // Check for sr-only help text
      const helpText = document.getElementById('category-help');
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveClass('sr-only');
      expect(helpText?.textContent).toContain('ALL selected categories');
    });

    it('should have aria-autocomplete on category input', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/type and press enter/i);
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('should have autoComplete="off" on category input', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/type and press enter/i);
      expect(input).toHaveAttribute('autoComplete', 'off');
    });

    it('should have aria-label on suggestion buttons', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      // Find a suggestion button
      const workButton = screen.getByText('+ Work');
      expect(workButton).toHaveAttribute('aria-label', 'Add Work category filter');
    });

    it('should have role="group" on suggestions container', () => {
      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      const suggestionsGroup = screen.getByRole('group', { name: /suggested categories/i });
      expect(suggestionsGroup).toBeInTheDocument();
    });

    it('should have role="list" on selected categories', () => {
      mockFilters = { categories: ['Work', 'Personal'] };

      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      const selectedList = screen.getByRole('list', { name: /selected category filters/i });
      expect(selectedList).toBeInTheDocument();
    });

    it('should have role="listitem" on each selected category', () => {
      mockFilters = { categories: ['Work', 'Personal'] };

      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });

    it('should have accessible remove button for each category', () => {
      mockFilters = { categories: ['Work'] };

      render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

      const removeButton = screen.getByRole('button', { name: /remove work category filter/i });
      expect(removeButton).toBeInTheDocument();
    });
  });
});
