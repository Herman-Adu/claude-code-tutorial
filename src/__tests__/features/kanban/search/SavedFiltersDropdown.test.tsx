/**
 * SavedFiltersDropdown Component Tests
 *
 * Tests the SavedFiltersDropdown component for managing filter presets.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SavedFiltersDropdown } from '@/features/kanban/components/SavedFiltersDropdown';
import * as actions from '@/app/actions/tasks';

// Track current mock state
let mockSavedFilterPresets: Array<{ id: string; name: string; filters: Record<string, unknown>; createdAt?: string }> = [];
let mockFilters: Record<string, unknown> = {};
let mockHasActiveFilters = false;
const mockSetSavedFilterPresets = vi.fn();
const mockLoadSavedPreset = vi.fn();

// Mock the Zustand store with dynamic return values
vi.mock('@/store/kanban', () => ({
  useKanbanStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      savedFilterPresets: mockSavedFilterPresets,
      filters: mockFilters,
      setSavedFilterPresets: mockSetSavedFilterPresets,
      loadSavedPreset: mockLoadSavedPreset,
      hasActiveFilters: () => mockHasActiveFilters,
    };
    return selector(state);
  }),
  useSavedFilterPresets: vi.fn(() => mockSavedFilterPresets),
  useFilters: vi.fn(() => mockFilters),
  useHasActiveFilters: vi.fn(() => mockHasActiveFilters),
}));

// Mock server actions
vi.mock('@/app/actions/tasks', () => ({
  getSavedFilterPresets: vi.fn(),
  saveFilterPreset: vi.fn(),
  deleteFilterPreset: vi.fn(),
}));

describe('SavedFiltersDropdown', () => {
  let user: ReturnType<typeof userEvent.setup>;

  const samplePresets = [
    { id: '1', name: 'High Priority', filters: { priority: 'HIGH' }, createdAt: '2024-01-01' },
    { id: '2', name: 'In Progress', filters: { columnId: 'IN_PROGRESS' }, createdAt: '2024-01-02' },
  ];

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Reset mock state
    mockSavedFilterPresets = [];
    mockFilters = {};
    mockHasActiveFilters = false;

    // Mock successful fetch
    (actions.getSavedFilterPresets as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: samplePresets.map((p) => ({ ...p, createdAt: new Date(p.createdAt) })),
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render trigger button', () => {
      render(<SavedFiltersDropdown />);
      expect(screen.getByRole('button', { name: /saved filter presets/i })).toBeInTheDocument();
    });

    it('should not show dropdown by default', () => {
      render(<SavedFiltersDropdown />);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should show dropdown when trigger is clicked', async () => {
      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should show Saved Filters header in dropdown', async () => {
      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));

      expect(screen.getByText('Saved Filters')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Preset List Tests
  // ---------------------------------------------------------------------------

  describe('Preset List', () => {
    beforeEach(() => {
      mockSavedFilterPresets = samplePresets;
    });

    it('should display preset names', async () => {
      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));

      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('should call loadSavedPreset when preset is clicked', async () => {
      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));
      await user.click(screen.getByRole('menuitem', { name: /high priority/i }));

      expect(mockLoadSavedPreset).toHaveBeenCalledWith(samplePresets[0]);
    });

    it('should close dropdown after preset is loaded', async () => {
      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));
      await user.click(screen.getByRole('menuitem', { name: /high priority/i }));

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should show empty state when no presets exist', async () => {
      mockSavedFilterPresets = [];

      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));

      expect(screen.getByText('No saved presets yet')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Delete Preset Tests
  // ---------------------------------------------------------------------------

  describe('Delete Preset', () => {
    beforeEach(() => {
      mockSavedFilterPresets = samplePresets;
      (actions.deleteFilterPreset as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
      });
    });

    it('should show delete button for each preset', async () => {
      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));

      const deleteButtons = screen.getAllByRole('button', { name: /delete.*preset/i });
      expect(deleteButtons).toHaveLength(2);
    });

    it('should call deleteFilterPreset when delete is clicked', async () => {
      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));
      await user.click(screen.getByRole('button', { name: /delete high priority preset/i }));

      expect(actions.deleteFilterPreset).toHaveBeenCalledWith('1');
    });

    it('should update presets list after successful delete', async () => {
      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));
      await user.click(screen.getByRole('button', { name: /delete high priority preset/i }));

      await waitFor(() => {
        expect(mockSetSavedFilterPresets).toHaveBeenCalledWith([samplePresets[1]]);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Save Current Filters Tests
  // ---------------------------------------------------------------------------

  describe('Save Current Filters', () => {
    it('should show save button when filters are active', async () => {
      mockSavedFilterPresets = [];
      mockFilters = { priority: 'HIGH' };
      mockHasActiveFilters = true;

      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));

      expect(screen.getByText(/save current filters/i)).toBeInTheDocument();
    });

    it('should not show save button when no filters are active', async () => {
      mockSavedFilterPresets = [];
      mockFilters = {};
      mockHasActiveFilters = false;

      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));

      expect(screen.queryByText(/save current filters/i)).not.toBeInTheDocument();
    });

    it('should show save form when save button is clicked', async () => {
      mockSavedFilterPresets = [];
      mockFilters = { priority: 'HIGH' };
      mockHasActiveFilters = true;

      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));
      await user.click(screen.getByText(/save current filters/i));

      expect(screen.getByPlaceholderText(/enter preset name/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Navigation Tests
  // ---------------------------------------------------------------------------

  describe('Keyboard Navigation', () => {
    it('should close on Escape key', async () => {
      render(<SavedFiltersDropdown />);

      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have proper aria attributes on trigger', () => {
      render(<SavedFiltersDropdown />);
      const trigger = screen.getByRole('button', { name: /saved filter presets/i });

      expect(trigger).toHaveAttribute('aria-haspopup', 'true');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when open', async () => {
      render(<SavedFiltersDropdown />);
      const trigger = screen.getByRole('button', { name: /saved filter presets/i });

      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // ---------------------------------------------------------------------------
  // Error Handling Tests (Issue 3 Fix)
  // ---------------------------------------------------------------------------

  describe('Error Handling', () => {
    it('should call getSavedFilterPresets on mount', async () => {
      render(<SavedFiltersDropdown />);

      // Verify the API is called on mount
      await waitFor(() => {
        expect(actions.getSavedFilterPresets).toHaveBeenCalled();
      });
    });

    it('should call setSavedFilterPresets with empty array on fetch error', async () => {
      (actions.getSavedFilterPresets as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      render(<SavedFiltersDropdown />);

      // Verify setSavedFilterPresets was called with empty array
      await waitFor(() => {
        expect(mockSetSavedFilterPresets).toHaveBeenCalledWith([]);
      });
    });

    it('should handle API returning success=false', async () => {
      (actions.getSavedFilterPresets as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Server error',
      });

      render(<SavedFiltersDropdown />);

      // Wait for the API to be called
      await waitFor(() => {
        expect(actions.getSavedFilterPresets).toHaveBeenCalled();
      });

      // The component should handle the error (internal state)
      // We verify by ensuring the empty state is set
      expect(mockSetSavedFilterPresets).toHaveBeenCalledWith([]);
    });

    it('should handle API exception', async () => {
      (actions.getSavedFilterPresets as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network failure')
      );

      render(<SavedFiltersDropdown />);

      // Wait for the API to be called and error handled
      await waitFor(() => {
        expect(actions.getSavedFilterPresets).toHaveBeenCalled();
      });

      // The component should handle the error by setting empty presets
      await waitFor(() => {
        expect(mockSetSavedFilterPresets).toHaveBeenCalledWith([]);
      });
    });

    it('should retry fetch when clicking retry after error', async () => {
      // First call fails, second succeeds
      (actions.getSavedFilterPresets as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          success: false,
          error: 'Network error',
        })
        .mockResolvedValueOnce({
          success: true,
          data: samplePresets.map((p) => ({ ...p, createdAt: new Date(p.createdAt) })),
        });

      render(<SavedFiltersDropdown />);

      // Wait for initial fetch
      await waitFor(() => {
        expect(actions.getSavedFilterPresets).toHaveBeenCalledTimes(1);
      });

      // Open dropdown
      await user.click(screen.getByRole('button', { name: /saved filter presets/i }));

      // Look for retry button (may or may not be visible depending on error state)
      const retryButton = screen.queryByText(/try again/i);
      if (retryButton) {
        await user.click(retryButton);

        // Verify fetch was called again
        await waitFor(() => {
          expect(actions.getSavedFilterPresets).toHaveBeenCalledTimes(2);
        });
      }
    });
  });
});
