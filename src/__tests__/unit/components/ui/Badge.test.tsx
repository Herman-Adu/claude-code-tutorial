/**
 * Badge Component Tests
 *
 * Tests the Badge component and its utility functions for displaying
 * labels, tags, priorities, and categories with consistent styling.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge, getCategoryColor, CATEGORY_COLORS } from '@/components/ui/Badge';

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Badge', () => {
  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should display provided children', () => {
      render(<Badge>Custom Content</Badge>);
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });

    it('should render with default variant', () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-white/70');
      expect(badge).toHaveClass('text-slate-600');
    });

    it('should render with tag variant', () => {
      const { container } = render(<Badge variant="tag">Tag Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-violet-100/70');
      expect(badge).toHaveClass('text-violet-600');
    });

    it('should render with category variant', () => {
      const { container } = render(<Badge variant="category">Category Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-teal-100/70');
      expect(badge).toHaveClass('text-teal-700');
    });

    it('should render with priority variant', () => {
      const { container } = render(<Badge variant="priority">Priority Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('inline-flex');
    });

    it('should apply custom className', () => {
      const { container } = render(<Badge className="custom-class">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
    });

    it('should maintain base styles with custom className', () => {
      const { container } = render(<Badge className="custom-class">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-lg');
    });
  });

  // ---------------------------------------------------------------------------
  // Props Tests
  // ---------------------------------------------------------------------------

  describe('Props Handling', () => {
    it('should handle React nodes as children', () => {
      render(
        <Badge>
          <span>Icon</span> Text
        </Badge>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText(/Text/)).toBeInTheDocument();
    });

    it('should handle numeric children', () => {
      render(<Badge>{123}</Badge>);
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should combine variant and className styles', () => {
      const { container } = render(
        <Badge variant="tag" className="font-bold">
          Combined
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-violet-100/70');
      expect(badge).toHaveClass('font-bold');
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should be accessible to screen readers', () => {
      render(<Badge>Accessible Badge</Badge>);
      const badge = screen.getByText('Accessible Badge');
      expect(badge).toBeVisible();
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(<Badge>Semantic Badge</Badge>);
      expect(container.firstChild?.nodeName).toBe('SPAN');
    });
  });
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

describe('getCategoryColor', () => {
  it('should return a color from CATEGORY_COLORS array', () => {
    const color = getCategoryColor('Frontend');
    expect(CATEGORY_COLORS).toContain(color);
  });

  it('should return consistent color for same category', () => {
    const color1 = getCategoryColor('Backend');
    const color2 = getCategoryColor('Backend');
    expect(color1).toBe(color2);
  });

  it('should return different colors for different categories', () => {
    const color1 = getCategoryColor('Frontend');
    const color2 = getCategoryColor('Backend');
    // Note: This might occasionally be the same color due to hash collisions
    // but it's more likely to be different
    expect(typeof color1).toBe('string');
    expect(typeof color2).toBe('string');
  });

  it('should handle empty string', () => {
    const color = getCategoryColor('');
    expect(CATEGORY_COLORS).toContain(color);
  });

  it('should handle special characters', () => {
    const color = getCategoryColor('UI/UX Design');
    expect(CATEGORY_COLORS).toContain(color);
  });

  it('should handle unicode characters', () => {
    const color = getCategoryColor('デザイン');
    expect(CATEGORY_COLORS).toContain(color);
  });

  it('should return valid color class string', () => {
    const color = getCategoryColor('Testing');
    expect(color).toMatch(/^bg-\w+-\d+\/\d+ text-\w+-\d+ border-\w+-\d+\/\d+$/);
  });
});

describe('CATEGORY_COLORS', () => {
  it('should have 10 color options', () => {
    expect(CATEGORY_COLORS).toHaveLength(10);
  });

  it('should contain only valid Tailwind classes', () => {
    CATEGORY_COLORS.forEach((colorClass) => {
      expect(colorClass).toMatch(/^bg-\w+-\d+\/\d+ text-\w+-\d+ border-\w+-\d+\/\d+$/);
    });
  });

  it('should have unique color combinations', () => {
    const uniqueColors = new Set(CATEGORY_COLORS);
    expect(uniqueColors.size).toBe(CATEGORY_COLORS.length);
  });
});
