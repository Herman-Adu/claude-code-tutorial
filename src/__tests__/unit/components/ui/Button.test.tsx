/**
 * Button Component Tests
 *
 * Tests the Button component with different variants, sizes,
 * and interactive states. Focus on user interactions and accessibility.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Button } from '@/components/ui/Button';

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Button', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should display provided children', () => {
      render(<Button>Custom Button Text</Button>);
      expect(screen.getByText('Custom Button Text')).toBeInTheDocument();
    });

    it('should render with primary variant by default', () => {
      const { container } = render(<Button>Primary</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('from-sky-400');
      expect(button).toHaveClass('to-indigo-500');
    });

    it('should render with secondary variant', () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('from-violet-300/90');
      expect(button).toHaveClass('to-pink-300/90');
    });

    it('should render with danger variant', () => {
      const { container } = render(<Button variant="danger">Delete</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('from-rose-400');
      expect(button).toHaveClass('to-pink-500');
    });

    it('should render with ghost variant', () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('bg-white/65');
      expect(button).toHaveClass('text-slate-600');
    });

    it('should render with medium size by default', () => {
      const { container } = render(<Button>Medium</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('px-5');
      expect(button).toHaveClass('py-2.5');
    });

    it('should render with small size', () => {
      const { container } = render(<Button size="sm">Small</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('px-3.5');
      expect(button).toHaveClass('py-1.5');
    });

    it('should render with large size', () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('px-7');
      expect(button).toHaveClass('py-3.5');
    });

    it('should apply custom className', () => {
      const { container } = render(<Button className="custom-class">Custom</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('custom-class');
    });
  });

  // ---------------------------------------------------------------------------
  // User Interaction Tests
  // ---------------------------------------------------------------------------

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole('button', { name: /disabled button/i });
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Multi Click</Button>);

      const button = screen.getByRole('button', { name: /multi click/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should handle keyboard activation with Enter', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);

      const button = screen.getByRole('button', { name: /keyboard/i });
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard activation with Space', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Space Key</Button>);

      const button = screen.getByRole('button', { name: /space key/i });
      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // State Tests
  // ---------------------------------------------------------------------------

  describe('State Management', () => {
    it('should render as disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:pointer-events-none');
    });

    it('should be focusable when not disabled', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button', { name: /focusable/i });
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>);
      const button = screen.getByRole('button', { name: /not focusable/i });
      button.focus();
      expect(button).not.toHaveFocus();
    });
  });

  // ---------------------------------------------------------------------------
  // Props Tests
  // ---------------------------------------------------------------------------

  describe('Props Handling', () => {
    it('should forward HTML button attributes', () => {
      render(
        <Button type="submit" name="submit-btn" value="submit-value">
          Submit
        </Button>
      );
      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
      expect(button).toHaveAttribute('value', 'submit-value');
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Custom Label">Icon</Button>);
      expect(screen.getByRole('button', { name: /custom label/i })).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Button aria-describedby="description">Button</Button>
          <p id="description">Description text</p>
        </>
      );
      const button = screen.getByRole('button', { name: /button/i });
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('should handle ref forwarding', () => {
      const ref = { current: null } as React.RefObject<HTMLButtonElement>;
      render(<Button ref={ref}>Ref Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should support data attributes', () => {
      render(<Button data-testid="custom-test-id" data-value="42">Data</Button>);
      const button = screen.getByTestId('custom-test-id');
      expect(button).toHaveAttribute('data-value', '42');
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(
        <>
          <Button>First</Button>
          <Button>Second</Button>
        </>
      );

      const firstButton = screen.getByRole('button', { name: /first/i });
      const secondButton = screen.getByRole('button', { name: /second/i });

      firstButton.focus();
      expect(firstButton).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(secondButton).toHaveFocus();
    });

    it('should have focus ring styles', () => {
      const { container } = render(<Button>Focus</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });

    it('should indicate disabled state to screen readers', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toHaveAttribute('disabled');
    });

    it('should render complex children for screen readers', () => {
      render(
        <Button>
          <svg aria-hidden="true">icon</svg>
          <span>Button Text</span>
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Button Text');
    });
  });

  // ---------------------------------------------------------------------------
  // Visual Variants Tests
  // ---------------------------------------------------------------------------

  describe('Visual Variants', () => {
    it('should have correct color scheme for primary variant', () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-sky-400');
      expect(button).toHaveClass('to-indigo-500');
      expect(button).toHaveClass('text-white');
    });

    it('should have correct color scheme for secondary variant', () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('from-violet-300/90');
      expect(button).toHaveClass('to-pink-300/90');
      expect(button).toHaveClass('text-slate-700');
    });

    it('should have correct color scheme for danger variant', () => {
      const { container } = render(<Button variant="danger">Danger</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('from-rose-400');
      expect(button).toHaveClass('to-pink-500');
      expect(button).toHaveClass('text-white');
    });

    it('should have correct color scheme for ghost variant', () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('bg-white/65');
      expect(button).toHaveClass('text-slate-600');
    });

    it('should have hover effects for all variants', () => {
      const variants: Array<'primary' | 'secondary' | 'danger' | 'ghost'> = [
        'primary',
        'secondary',
        'danger',
        'ghost',
      ];

      variants.forEach((variant) => {
        const { container } = render(<Button variant={variant}>{variant}</Button>);
        const button = container.firstChild as HTMLElement;
        expect(button.className).toContain('hover:');
      });
    });
  });
});
