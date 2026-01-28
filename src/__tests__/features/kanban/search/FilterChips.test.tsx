/**
 * FilterChips Component Tests
 *
 * Tests the FilterChips component for displaying and removing active filters.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FilterChips } from '@/features/kanban/components/FilterChips';

// Track current mock state
let mockSearchQuery = '';
let mockFilters: Record<string, unknown> = {};
const mockSetSearchQuery = vi.fn();
const mockSetFilter = vi.fn();
const mockClearFilters = vi.fn();

// Mock the Zustand store with dynamic return values
vi.mock('@/store/kanban', () => ({
  useKanbanStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      searchQuery: mockSearchQuery,
      filters: mockFilters,
      setSearchQuery: mockSetSearchQuery,
      setFilter: mockSetFilter,
      clearFilters: mockClearFilters,
    };
    return selector(state);
  }),
  useSearchQuery: vi.fn(() => mockSearchQuery),
  useFilters: vi.fn(() => mockFilters),
}));

describe('FilterChips', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    // Reset mock state
    mockSearchQuery = '';
    mockFilters = {};
  });

  function setupMockStore(searchQuery = '', filters: Record<string, unknown> = {}) {
    mockSearchQuery = searchQuery;
    mockFilters = filters;
  }

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should not render when no filters are active', () => {
      setupMockStore('', {});
      const { container } = render(<FilterChips />);
      expect(container.firstChild).toBeNull();
    });

    it('should render search query chip', () => {
      setupMockStore('test query', {});
      render(<FilterChips />);

      expect(screen.getByText('Search:')).toBeInTheDocument();
      expect(screen.getByText('test query')).toBeInTheDocument();
    });

    it('should truncate long search queries', () => {
      setupMockStore('this is a very long search query that exceeds limit', {});
      render(<FilterChips />);

      // Component truncates at 20 characters plus "..."
      expect(screen.getByText('this is a very long ...')).toBeInTheDocument();
    });

    it('should render priority chip', () => {
      setupMockStore('', { priority: 'HIGH' });
      render(<FilterChips />);

      expect(screen.getByText('Priority:')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('should render status chip', () => {
      setupMockStore('', { columnId: 'IN_PROGRESS' });
      render(<FilterChips />);

      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('should render category chips', () => {
      setupMockStore('', { categories: ['Work', 'Personal'] });
      render(<FilterChips />);

      expect(screen.getAllByText('Category:')).toHaveLength(2);
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('should render date range chip', () => {
      setupMockStore('', { dateRange: { start: '2024-01-01', end: '2024-01-31' } });
      render(<FilterChips />);

      expect(screen.getByText('Due Date:')).toBeInTheDocument();
      expect(screen.getByText('Jan 1 - Jan 31')).toBeInTheDocument();
    });

    it('should render same-day date range as single date', () => {
      setupMockStore('', { dateRange: { start: '2024-01-15', end: '2024-01-15' } });
      render(<FilterChips />);

      expect(screen.getByText('Jan 15')).toBeInTheDocument();
    });

    it('should render multiple filter types together', () => {
      setupMockStore('test', {
        priority: 'HIGH',
        columnId: 'TODO',
      });
      render(<FilterChips />);

      expect(screen.getByText('Search:')).toBeInTheDocument();
      expect(screen.getByText('Priority:')).toBeInTheDocument();
      expect(screen.getByText('Status:')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Remove Button Tests
  // ---------------------------------------------------------------------------

  describe('Remove Button', () => {
    it('should call setSearchQuery when removing search chip', async () => {
      setupMockStore('test', {});
      render(<FilterChips />);

      const removeButton = screen.getByRole('button', { name: /remove search/i });
      await user.click(removeButton);

      expect(mockSetSearchQuery).toHaveBeenCalledWith('');
    });

    it('should call setFilter when removing priority chip', async () => {
      setupMockStore('', { priority: 'HIGH' });
      render(<FilterChips />);

      const removeButton = screen.getByRole('button', { name: /remove priority/i });
      await user.click(removeButton);

      expect(mockSetFilter).toHaveBeenCalledWith('priority', null);
    });

    it('should call setFilter when removing status chip', async () => {
      setupMockStore('', { columnId: 'TODO' });
      render(<FilterChips />);

      const removeButton = screen.getByRole('button', { name: /remove status/i });
      await user.click(removeButton);

      expect(mockSetFilter).toHaveBeenCalledWith('columnId', null);
    });

    it('should remove individual category', async () => {
      setupMockStore('', { categories: ['Work', 'Personal'] });
      render(<FilterChips />);

      // Remove the first category (Work)
      const removeButtons = screen.getAllByRole('button', { name: /remove category/i });
      await user.click(removeButtons[0]);

      expect(mockSetFilter).toHaveBeenCalledWith('categories', ['Personal']);
    });

    it('should clear categories when last one is removed', async () => {
      setupMockStore('', { categories: ['Work'] });
      render(<FilterChips />);

      const removeButton = screen.getByRole('button', { name: /remove category/i });
      await user.click(removeButton);

      expect(mockSetFilter).toHaveBeenCalledWith('categories', undefined);
    });

    it('should call setFilter when removing date range chip', async () => {
      setupMockStore('', { dateRange: { start: '2024-01-01', end: '2024-01-31' } });
      render(<FilterChips />);

      const removeButton = screen.getByRole('button', { name: /remove due date/i });
      await user.click(removeButton);

      expect(mockSetFilter).toHaveBeenCalledWith('dateRange', undefined);
    });
  });

  // ---------------------------------------------------------------------------
  // Clear All Tests
  // ---------------------------------------------------------------------------

  describe('Clear All', () => {
    it('should show Clear all button when multiple filters are active', () => {
      setupMockStore('test', { priority: 'HIGH' });
      render(<FilterChips />);

      expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
    });

    it('should not show Clear all button with only one filter', () => {
      setupMockStore('test', {});
      render(<FilterChips />);

      expect(screen.queryByRole('button', { name: /clear all filters/i })).not.toBeInTheDocument();
    });

    it('should call clearFilters when Clear all is clicked', async () => {
      setupMockStore('test', { priority: 'HIGH' });
      render(<FilterChips />);

      await user.click(screen.getByRole('button', { name: /clear all filters/i }));

      expect(mockClearFilters).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Max Chips Tests
  // ---------------------------------------------------------------------------

  describe('Max Chips', () => {
    it('should show overflow indicator when chips exceed maxChips', () => {
      setupMockStore('', {
        priority: 'HIGH',
        columnId: 'TODO',
        categories: ['Work', 'Personal', 'Urgent', 'Important'],
      });
      render(<FilterChips maxChips={3} />);

      expect(screen.getByText('+3 more')).toBeInTheDocument();
    });

    it('should not show overflow indicator when within limit', () => {
      setupMockStore('test', { priority: 'HIGH' });
      render(<FilterChips maxChips={5} />);

      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have proper list role', () => {
      setupMockStore('test', {});
      render(<FilterChips />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should have proper listitem roles', () => {
      setupMockStore('test', { priority: 'HIGH' });
      render(<FilterChips />);

      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('should have descriptive aria-labels on remove buttons', () => {
      setupMockStore('test', {});
      render(<FilterChips />);

      expect(
        screen.getByRole('button', { name: /remove search: test filter/i })
      ).toBeInTheDocument();
    });
  });
});
