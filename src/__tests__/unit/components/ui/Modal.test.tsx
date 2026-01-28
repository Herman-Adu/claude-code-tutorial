/**
 * Modal Component Tests
 *
 * Tests the Modal component focusing on visibility control, focus management,
 * keyboard navigation, and accessibility features like focus trapping.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Modal } from '@/components/ui/Modal';

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Modal', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnClose = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    document.body.style.overflow = 'unset';
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <p>Modal Content</p>
        </Modal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal Content</p>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display the title', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="My Modal Title">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByText('My Modal Title')).toBeInTheDocument();
    });

    it('should display children content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Modal body content</p>
        </Modal>
      );

      expect(screen.getByText('Modal body content')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
    });

    it('should render backdrop', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      const backdrop = container.querySelector('.bg-slate-900\\/30');
      expect(backdrop).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // User Interaction Tests
  // ---------------------------------------------------------------------------

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      const backdrop = container.querySelector('.bg-slate-900\\/30');
      if (backdrop) {
        await user.click(backdrop as HTMLElement);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when clicking inside modal content', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <button>Inside Button</button>
        </Modal>
      );

      const insideButton = screen.getByRole('button', { name: /inside button/i });
      await user.click(insideButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle multiple Escape key presses', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      await user.keyboard('{Escape}');
      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Focus Management Tests
  // ---------------------------------------------------------------------------

  describe('Focus Management', () => {
    it('should focus first focusable element when opened', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );

      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: /close modal/i });
        expect(firstButton).toHaveFocus();
      });
    });

    it('should trap focus within modal', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <button>First</button>
          <button>Second</button>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      const firstButton = screen.getByRole('button', { name: /first/i });
      const secondButton = screen.getByRole('button', { name: /second/i });

      // Tab through elements
      await user.tab();
      await waitFor(() => expect(firstButton).toHaveFocus());

      await user.tab();
      await waitFor(() => expect(secondButton).toHaveFocus());

      // Tab from last element should wrap to first
      await user.tab();
      await waitFor(() => expect(closeButton).toHaveFocus());
    });

    it('should trap focus with Shift+Tab', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <button>First</button>
          <button>Second</button>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      const secondButton = screen.getByRole('button', { name: /second/i });

      // Start at close button and shift+tab should go to last element
      closeButton.focus();
      await user.keyboard('{Shift>}{Tab}{/Shift}');

      await waitFor(() => expect(secondButton).toHaveFocus());
    });

    it('should restore focus to previous element when closed', async () => {
      const TriggerButton = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        return (
          <>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal">
              <p>Content</p>
            </Modal>
          </>
        );
      };

      render(<TriggerButton />);

      const triggerButton = screen.getByRole('button', { name: /open modal/i });

      // Store focus before opening modal
      triggerButton.focus();
      expect(triggerButton).toHaveFocus();

      await user.click(triggerButton);

      // Modal should be open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal
      await user.keyboard('{Escape}');

      // Wait for modal to close and focus to restore
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Focus should be restored to trigger button
      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      }, { timeout: 1000 });
    });
  });

  // ---------------------------------------------------------------------------
  // State Management Tests
  // ---------------------------------------------------------------------------

  describe('State Management', () => {
    it('should prevent body scroll when open', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('unset');
    });

    it('should handle rapid open/close cycles', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      rerender(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(
        <Modal isOpen={false} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Title">
          <p>Content</p>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      const titleElement = screen.getByText('Test Title');
      const titleId = titleElement.getAttribute('id');

      expect(dialog).toHaveAttribute('aria-labelledby', titleId);
    });

    it('should have backdrop marked as aria-hidden', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have accessible close button label', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Content</p>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });

    it('should use unique IDs for title when multiple modals exist', () => {
      const { container } = render(
        <>
          <Modal isOpen={true} onClose={mockOnClose} title="Modal 1">
            <p>Content 1</p>
          </Modal>
          <Modal isOpen={true} onClose={mockOnClose} title="Modal 2">
            <p>Content 2</p>
          </Modal>
        </>
      );

      const dialogs = screen.getAllByRole('dialog');
      const labelId1 = dialogs[0].getAttribute('aria-labelledby');
      const labelId2 = dialogs[1].getAttribute('aria-labelledby');

      expect(labelId1).not.toBe(labelId2);
    });
  });

  // ---------------------------------------------------------------------------
  // Props Tests
  // ---------------------------------------------------------------------------

  describe('Props Handling', () => {
    it('should handle complex children', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <div>
            <h3>Section Title</h3>
            <p>Paragraph text</p>
            <button>Action Button</button>
          </div>
        </Modal>
      );

      expect(screen.getByText('Section Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph text')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action button/i })).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Empty Modal">
          {null}
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should update title dynamically', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Original Title">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByText('Original Title')).toBeInTheDocument();

      rerender(
        <Modal isOpen={true} onClose={mockOnClose} title="Updated Title">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.queryByText('Original Title')).not.toBeInTheDocument();
    });

    it('should update children dynamically', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Original Content</p>
        </Modal>
      );

      expect(screen.getByText('Original Content')).toBeInTheDocument();

      rerender(
        <Modal isOpen={true} onClose={mockOnClose} title="Modal">
          <p>Updated Content</p>
        </Modal>
      );

      expect(screen.getByText('Updated Content')).toBeInTheDocument();
      expect(screen.queryByText('Original Content')).not.toBeInTheDocument();
    });
  });
});
