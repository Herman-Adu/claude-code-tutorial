/**
 * Search and Filter Integration Tests
 *
 * Tests the end-to-end integration of search and filter functionality
 * including store state management and filtering logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKanbanStore,
  useSearchQuery,
  useFilters,
  useFilteredTasks,
  useHasActiveFilters,
  useActiveFilterCount,
  type StoreTask,
} from '@/store/kanban';

// Sample tasks for testing
const createSampleTasks = (): StoreTask[] => [
  {
    id: '1',
    title: 'Fix login bug',
    description: 'Users cannot login with special characters',
    priority: 'HIGH',
    tags: ['bug'],
    columnId: 'TODO',
    categories: ['Backend', 'Urgent'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    dueDate: '2024-01-15',
  },
  {
    id: '2',
    title: 'Add search feature',
    description: 'Implement full-text search for tasks',
    priority: 'MEDIUM',
    tags: ['feature'],
    columnId: 'IN_PROGRESS',
    categories: ['Frontend'],
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    dueDate: '2024-01-20',
  },
  {
    id: '3',
    title: 'Update documentation',
    description: 'Document the new API endpoints',
    priority: 'LOW',
    tags: ['docs'],
    columnId: 'COMPLETED',
    categories: ['Documentation'],
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
  {
    id: '4',
    title: 'Refactor database queries',
    description: 'Optimize slow queries in the user module',
    priority: 'HIGH',
    tags: ['optimization'],
    columnId: 'TODO',
    categories: ['Backend'],
    createdAt: '2024-01-04T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z',
    dueDate: '2024-01-25',
  },
];

describe('Search and Filter Integration', () => {
  beforeEach(() => {
    // Reset store state
    const store = useKanbanStore.getState();
    store.setTasks(createSampleTasks());
    store.clearFilters();
  });

  // ---------------------------------------------------------------------------
  // Search Query Tests
  // ---------------------------------------------------------------------------

  describe('Search Query', () => {
    it('should filter tasks by title', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('login');

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Fix login bug');
    });

    it('should filter tasks by description', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('optimize');

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Refactor database queries');
    });

    it('should be case-insensitive', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('LOGIN');

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Fix login bug');
    });

    it('should match partial words', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('doc');

      const filtered = store.getFilteredTasks();

      // Only task 3 "Update documentation" matches 'doc' in title
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Update documentation');
    });

    it('should return all tasks when search query is empty', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('');

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(4);
    });

    it('should trim search query', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('  login  ');

      // Need to get fresh state after update
      const updatedState = useKanbanStore.getState();
      expect(updatedState.searchQuery).toBe('login');
    });

    it('should limit search query to 200 characters', () => {
      const store = useKanbanStore.getState();
      const longQuery = 'a'.repeat(250);
      store.setSearchQuery(longQuery);

      // Need to get fresh state after update
      const updatedState = useKanbanStore.getState();
      expect(updatedState.searchQuery.length).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  // Priority Filter Tests
  // ---------------------------------------------------------------------------

  describe('Priority Filter', () => {
    it('should filter tasks by priority', () => {
      const store = useKanbanStore.getState();
      store.setFilter('priority', 'HIGH');

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.priority === 'HIGH')).toBe(true);
    });

    it('should return all tasks when priority is null', () => {
      const store = useKanbanStore.getState();
      store.setFilter('priority', null);

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Column Filter Tests
  // ---------------------------------------------------------------------------

  describe('Column Filter', () => {
    it('should filter tasks by column', () => {
      const store = useKanbanStore.getState();
      store.setFilter('columnId', 'TODO');

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.columnId === 'TODO')).toBe(true);
    });

    it('should return all tasks when column is null', () => {
      const store = useKanbanStore.getState();
      store.setFilter('columnId', null);

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Categories Filter Tests
  // ---------------------------------------------------------------------------

  describe('Categories Filter', () => {
    it('should filter tasks by single category', () => {
      const store = useKanbanStore.getState();
      store.setFilter('categories', ['Backend']);

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(2);
    });

    it('should filter tasks by multiple categories (AND)', () => {
      const store = useKanbanStore.getState();
      store.setFilter('categories', ['Backend', 'Urgent']);

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Fix login bug');
    });

    it('should return all tasks when categories is empty', () => {
      const store = useKanbanStore.getState();
      store.setFilter('categories', []);

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Date Range Filter Tests
  // ---------------------------------------------------------------------------

  describe('Date Range Filter', () => {
    it('should filter tasks by date range', () => {
      const store = useKanbanStore.getState();
      store.setFilter('dateRange', {
        start: '2024-01-10',
        end: '2024-01-20',
      });

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(2);
    });

    it('should exclude tasks without due date', () => {
      const store = useKanbanStore.getState();
      store.setFilter('dateRange', {
        start: '2024-01-01',
        end: '2024-12-31',
      });

      const filtered = store.getFilteredTasks();

      // Task 3 has no due date
      expect(filtered).toHaveLength(3);
    });

    it('should return all tasks when date range is undefined', () => {
      const store = useKanbanStore.getState();
      store.setFilter('dateRange', undefined);

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Combined Filters Tests
  // ---------------------------------------------------------------------------

  describe('Combined Filters', () => {
    it('should apply search query and priority filter together', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('bug');
      store.setFilter('priority', 'HIGH');

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Fix login bug');
    });

    it('should apply multiple filters together', () => {
      const store = useKanbanStore.getState();
      store.setFilter('priority', 'HIGH');
      store.setFilter('columnId', 'TODO');
      store.setFilter('categories', ['Backend']);

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(2);
    });

    it('should return empty when no tasks match all filters', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('nonexistent');
      store.setFilter('priority', 'LOW');

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Pagination Tests
  // ---------------------------------------------------------------------------

  describe('Pagination', () => {
    it('should apply limit', () => {
      const store = useKanbanStore.getState();
      store.setFilter('limit', 2);

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(2);
    });

    it('should apply offset', () => {
      const store = useKanbanStore.getState();
      store.setFilter('offset', 2);
      store.setFilter('limit', 2);

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('3');
    });

    it('should handle offset beyond tasks length', () => {
      const store = useKanbanStore.getState();
      store.setFilter('offset', 10);

      const filtered = store.getFilteredTasks();

      expect(filtered).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Active Filters Tests
  // ---------------------------------------------------------------------------

  describe('Active Filters Detection', () => {
    it('should detect search query as active filter', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('test');

      expect(store.hasActiveFilters()).toBe(true);
    });

    it('should detect priority as active filter', () => {
      const store = useKanbanStore.getState();
      store.setFilter('priority', 'HIGH');

      expect(store.hasActiveFilters()).toBe(true);
    });

    it('should count active filters correctly', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('test');
      store.setFilter('priority', 'HIGH');
      store.setFilter('categories', ['Backend']);

      expect(store.getActiveFilterCount()).toBe(3);
    });

    it('should return false when no filters active', () => {
      const store = useKanbanStore.getState();

      expect(store.hasActiveFilters()).toBe(false);
      expect(store.getActiveFilterCount()).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Clear Filters Tests
  // ---------------------------------------------------------------------------

  describe('Clear Filters', () => {
    it('should clear all filters', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('test');
      store.setFilter('priority', 'HIGH');
      store.setFilter('columnId', 'TODO');
      store.setFilter('categories', ['Backend']);
      store.setFilter('dateRange', { start: '2024-01-01', end: '2024-01-31' });

      store.clearFilters();

      expect(store.searchQuery).toBe('');
      expect(store.filters).toEqual({});
      expect(store.hasActiveFilters()).toBe(false);
    });

    it('should return all tasks after clearing filters', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('login');
      store.setFilter('priority', 'HIGH');

      let filtered = store.getFilteredTasks();
      expect(filtered).toHaveLength(1);

      store.clearFilters();
      filtered = store.getFilteredTasks();
      expect(filtered).toHaveLength(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Saved Presets Tests
  // ---------------------------------------------------------------------------

  describe('Saved Presets', () => {
    const samplePreset = {
      id: '1',
      name: 'High Priority',
      filters: { priority: 'HIGH' as const, categories: ['Backend'] },
    };

    it('should load saved preset', () => {
      const store = useKanbanStore.getState();
      store.loadSavedPreset(samplePreset);

      // Get fresh state after update
      const updatedState = useKanbanStore.getState();
      expect(updatedState.filters.priority).toBe('HIGH');
      expect(updatedState.filters.categories).toEqual(['Backend']);
    });

    it('should set saved presets list', () => {
      const store = useKanbanStore.getState();
      const presets = [samplePreset];
      store.setSavedFilterPresets(presets);

      // Get fresh state after update
      const updatedState = useKanbanStore.getState();
      expect(updatedState.savedFilterPresets).toEqual(presets);
    });
  });

  // ---------------------------------------------------------------------------
  // Hook Tests
  // ---------------------------------------------------------------------------

  describe('Hooks', () => {
    it('useSearchQuery should return current search query', () => {
      const store = useKanbanStore.getState();
      store.setSearchQuery('test');

      const { result } = renderHook(() => useSearchQuery());

      expect(result.current).toBe('test');
    });

    it('useFilters should return current filters', () => {
      const store = useKanbanStore.getState();
      store.setFilter('priority', 'HIGH');

      const { result } = renderHook(() => useFilters());

      expect(result.current.priority).toBe('HIGH');
    });

    it('useHasActiveFilters should update when filters change', () => {
      const store = useKanbanStore.getState();

      const { result, rerender } = renderHook(() => useHasActiveFilters());

      expect(result.current).toBe(false);

      act(() => {
        store.setSearchQuery('test');
      });

      rerender();

      expect(result.current).toBe(true);
    });

    it('useActiveFilterCount should track filter count', () => {
      const store = useKanbanStore.getState();

      const { result, rerender } = renderHook(() => useActiveFilterCount());

      expect(result.current).toBe(0);

      act(() => {
        store.setSearchQuery('test');
        store.setFilter('priority', 'HIGH');
      });

      rerender();

      expect(result.current).toBe(2);
    });
  });
});
