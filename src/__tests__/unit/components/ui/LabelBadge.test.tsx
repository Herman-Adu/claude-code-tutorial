/**
 * LabelBadge Component Tests
 *
 * Tests the LabelBadge component for displaying color-coded labels
 * with optional remove button and proper styling.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  LabelBadge,
  LABEL_COLOR_MAP,
  getLabelColorClasses,
  shouldUseDarkText,
} from '@/components/ui/LabelBadge';

// =============================================================================
// TEST SUITE
// =============================================================================

describe('LabelBadge', () => {
  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(
        <LabelBadge label={{ id: '1', name: 'Test Label', color: 'blue' }} />
      );
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should display label name', () => {
      render(
        <LabelBadge label={{ id: '1', name: 'Custom Label', color: 'red' }} />
      );
      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('should render with preset color classes', () => {
      const { container } = render(
        <LabelBadge label={{ id: '1', name: 'Blue Label', color: 'blue' }} />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('text-blue-800');
    });

    it('should render with hex color using inline style', () => {
      const { container } = render(
        <LabelBadge label={{ id: '1', name: 'Custom Color', color: '#ff5500' }} />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({ backgroundColor: '#ff550080' });
    });

    it('should render small size variant', () => {
      const { container } = render(
        <LabelBadge
          label={{ id: '1', name: 'Small Label', color: 'green' }}
          size="sm"
        />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
    });

    it('should render medium size variant by default', () => {
      const { container } = render(
        <LabelBadge label={{ id: '1', name: 'Medium Label', color: 'purple' }} />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-sm');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <LabelBadge
          label={{ id: '1', name: 'Custom Class', color: 'cyan' }}
          className="custom-class"
        />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
    });

    it('should render color indicator dot', () => {
      const { container } = render(
        <LabelBadge label={{ id: '1', name: 'With Dot', color: 'orange' }} />
      );
      // Should have a dot element
      const dots = container.querySelectorAll('.w-2.h-2.rounded-full');
      expect(dots.length).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Remove Button Tests
  // ---------------------------------------------------------------------------

  describe('Remove Button', () => {
    it('should not render remove button when onRemove is not provided', () => {
      render(
        <LabelBadge label={{ id: '1', name: 'No Remove', color: 'blue' }} />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render remove button when onRemove is provided', () => {
      const onRemove = vi.fn();
      render(
        <LabelBadge
          label={{ id: '1', name: 'With Remove', color: 'blue' }}
          onRemove={onRemove}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should call onRemove when remove button is clicked', () => {
      const onRemove = vi.fn();
      render(
        <LabelBadge
          label={{ id: '1', name: 'Removable', color: 'red' }}
          onRemove={onRemove}
        />
      );

      const removeButton = screen.getByRole('button');
      fireEvent.click(removeButton);

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('should have accessible label for remove button', () => {
      const onRemove = vi.fn();
      render(
        <LabelBadge
          label={{ id: '1', name: 'Accessible', color: 'green' }}
          onRemove={onRemove}
        />
      );

      const removeButton = screen.getByLabelText('Remove label: Accessible');
      expect(removeButton).toBeInTheDocument();
    });

    it('should stop event propagation when clicking remove', () => {
      const onRemove = vi.fn();
      const parentClick = vi.fn();

      render(
        <div onClick={parentClick}>
          <LabelBadge
            label={{ id: '1', name: 'Stop Propagation', color: 'yellow' }}
            onRemove={onRemove}
          />
        </div>
      );

      const removeButton = screen.getByRole('button');
      fireEvent.click(removeButton);

      expect(onRemove).toHaveBeenCalled();
      expect(parentClick).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Color Tests
  // ---------------------------------------------------------------------------

  describe('Color Handling', () => {
    it('should handle all preset colors', () => {
      const presetColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

      presetColors.forEach((color) => {
        const { container, unmount } = render(
          <LabelBadge label={{ id: '1', name: 'Test', color }} />
        );
        const badge = container.firstChild as HTMLElement;
        expect(badge).toHaveClass(`text-${color}-800`);
        unmount();
      });
    });

    it('should handle uppercase hex colors', () => {
      const { container } = render(
        <LabelBadge label={{ id: '1', name: 'Uppercase Hex', color: '#AABBCC' }} />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({ backgroundColor: '#AABBCC80' });
    });

    it('should handle lowercase hex colors', () => {
      const { container } = render(
        <LabelBadge label={{ id: '1', name: 'Lowercase Hex', color: '#aabbcc' }} />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({ backgroundColor: '#aabbcc80' });
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should be visible to screen readers', () => {
      render(
        <LabelBadge label={{ id: '1', name: 'Accessible Label', color: 'blue' }} />
      );
      const label = screen.getByText('Accessible Label');
      expect(label).toBeVisible();
    });

    it('should have proper semantic structure', () => {
      const { container } = render(
        <LabelBadge label={{ id: '1', name: 'Semantic', color: 'red' }} />
      );
      expect(container.firstChild?.nodeName).toBe('SPAN');
    });

    it('should hide color dot from screen readers', () => {
      const { container } = render(
        <LabelBadge label={{ id: '1', name: 'Hidden Dot', color: 'green' }} />
      );
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
    });
  });
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

describe('getLabelColorClasses', () => {
  it('should return correct classes for preset colors', () => {
    const blueClasses = getLabelColorClasses('blue');
    expect(blueClasses.bg).toBe('bg-blue-400/50');
    expect(blueClasses.text).toBe('text-blue-800');
    expect(blueClasses.border).toBe('border-blue-300/60');
  });

  it('should handle case-insensitive preset colors', () => {
    const classes = getLabelColorClasses('BLUE');
    expect(classes.bg).toBe('bg-blue-400/50');
  });

  it('should return default classes for hex colors', () => {
    const classes = getLabelColorClasses('#ff0000');
    expect(classes.bg).toBe('');
    expect(classes.text).toBe('text-white');
    expect(classes.border).toBe('border-white/30');
  });

  it('should return default classes for unknown colors', () => {
    const classes = getLabelColorClasses('invalid-color');
    expect(classes.bg).toBe('');
    expect(classes.text).toBe('text-white');
  });
});

describe('shouldUseDarkText', () => {
  it('should return true for light hex colors', () => {
    expect(shouldUseDarkText('#ffffff')).toBe(true);
    expect(shouldUseDarkText('#ffff00')).toBe(true);
    expect(shouldUseDarkText('#00ff00')).toBe(true);
  });

  it('should return false for dark hex colors', () => {
    expect(shouldUseDarkText('#000000')).toBe(false);
    expect(shouldUseDarkText('#0000ff')).toBe(false);
    expect(shouldUseDarkText('#800000')).toBe(false);
  });

  it('should handle hex colors with or without #', () => {
    expect(shouldUseDarkText('#ffffff')).toBe(true);
    expect(shouldUseDarkText('ffffff')).toBe(true);
  });
});

describe('LABEL_COLOR_MAP', () => {
  it('should have all preset colors defined', () => {
    const expectedColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
    expectedColors.forEach((color) => {
      expect(LABEL_COLOR_MAP[color]).toBeDefined();
      expect(LABEL_COLOR_MAP[color].bg).toBeDefined();
      expect(LABEL_COLOR_MAP[color].text).toBeDefined();
      expect(LABEL_COLOR_MAP[color].border).toBeDefined();
    });
  });

  it('should have consistent structure for all colors', () => {
    Object.values(LABEL_COLOR_MAP).forEach((colorConfig) => {
      expect(colorConfig.bg).toMatch(/^bg-\w+-\d+\/\d+$/);
      expect(colorConfig.text).toMatch(/^text-\w+-\d+$/);
      expect(colorConfig.border).toMatch(/^border-\w+-\d+\/\d+$/);
    });
  });
});
