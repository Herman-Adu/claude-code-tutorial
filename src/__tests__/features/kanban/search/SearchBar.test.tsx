/**
 * SearchBar Component Tests
 *
 * Tests the UI SearchBar component with debouncing, clear functionality,
 * and various input scenarios.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchBar } from '@/components/ui/SearchBar';

describe('SearchBar', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ delay: null });
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should display the provided value', () => {
      const onChange = vi.fn();
      render(<SearchBar value="test query" onChange={onChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('test query');
    });

    it('should display placeholder text', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} placeholder="Search tasks..." />);
      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
    });

    it('should show magnifying glass icon', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);
      // Icon should be present (hidden from accessibility)
      const input = screen.getByRole('textbox');
      expect(input.parentElement?.querySelector('svg')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('should have correct aria-label', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} aria-label="Search tasks" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Search tasks');
    });
  });

  // ---------------------------------------------------------------------------
  // Debouncing Tests
  // ---------------------------------------------------------------------------

  describe('Debouncing', () => {
    it('should debounce onChange calls (default 300ms)', async () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);
      const input = screen.getByRole('textbox');

      // Type quickly
      await user.type(input, 'test');

      // onChange should not be called immediately
      expect(onChange).not.toHaveBeenCalled();

      // Advance timers past debounce delay
      vi.advanceTimersByTime(300);

      // Now onChange should be called with final value
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('test');
    });

    it('should respect custom debounce delay', async () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} debounceMs={500} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');

      // Should not be called at 300ms
      vi.advanceTimersByTime(300);
      expect(onChange).not.toHaveBeenCalled();

      // Should be called at 500ms
      vi.advanceTimersByTime(200);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should reset debounce timer on continued typing', async () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} debounceMs={300} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'te');
      vi.advanceTimersByTime(200);
      await user.type(input, 'st');
      vi.advanceTimersByTime(200);

      // Still not called because we kept typing
      expect(onChange).not.toHaveBeenCalled();

      // Final debounce completes
      vi.advanceTimersByTime(100);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('test');
    });
  });

  // ---------------------------------------------------------------------------
  // Clear Button Tests
  // ---------------------------------------------------------------------------

  describe('Clear Button', () => {
    it('should show clear button when value is present', () => {
      const onChange = vi.fn();
      render(<SearchBar value="test" onChange={onChange} />);
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });

    it('should not show clear button when value is empty', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);
      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
    });

    it('should clear input and call onChange immediately when clear is clicked', async () => {
      const onChange = vi.fn();
      render(<SearchBar value="test" onChange={onChange} />);

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      // Clear should call onChange immediately (no debounce)
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('should not show clear button when disabled', () => {
      const onChange = vi.fn();
      render(<SearchBar value="test" onChange={onChange} disabled />);
      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Loading State Tests
  // ---------------------------------------------------------------------------

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      const onChange = vi.fn();
      render(<SearchBar value="test" onChange={onChange} isLoading />);
      expect(screen.getByRole('status', { name: /searching/i })).toBeInTheDocument();
    });

    it('should not show loading spinner when isLoading is false', () => {
      const onChange = vi.fn();
      render(<SearchBar value="test" onChange={onChange} isLoading={false} />);
      expect(screen.queryByRole('status', { name: /searching/i })).not.toBeInTheDocument();
    });

    it('should hide clear button when loading', () => {
      const onChange = vi.fn();
      render(<SearchBar value="test" onChange={onChange} isLoading />);
      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Disabled State Tests
  // ---------------------------------------------------------------------------

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should not call onChange when disabled', async () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} disabled />);
      const input = screen.getByRole('textbox');

      // Attempting to type in disabled input
      await user.type(input, 'test');
      vi.advanceTimersByTime(500);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Special Characters Tests
  // ---------------------------------------------------------------------------

  describe('Special Characters', () => {
    it('should handle spaces in search query', async () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'hello world');
      vi.advanceTimersByTime(300);

      expect(onChange).toHaveBeenCalledWith('hello world');
    });

    it('should handle special characters', async () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test@#$%');
      vi.advanceTimersByTime(300);

      expect(onChange).toHaveBeenCalledWith('test@#$%');
    });

    it('should handle unicode characters', async () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');
      vi.advanceTimersByTime(300);

      expect(onChange).toHaveBeenCalledWith('test');
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should be focusable', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);
      const input = screen.getByRole('textbox');

      input.focus();
      expect(input).toHaveFocus();
    });

    it('should have proper role', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should support custom aria-label', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} aria-label="Custom label" />);
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
    });
  });
});
