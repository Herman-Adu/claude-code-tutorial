/**
 * Component Test Template
 *
 * Use this template for testing React components with React Testing Library.
 * Focus on testing component behavior from the user's perspective.
 *
 * Guidelines:
 * - Test what the user sees and does
 * - Use accessible queries (getByRole, getByLabelText)
 * - Test user interactions, not implementation details
 * - Include accessibility tests with jest-axe
 * - Target 60-70% coverage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// =============================================================================
// IMPORTS
// =============================================================================

// Import component to test
// import { ComponentName } from '@/components/path/ComponentName';

// Import types
// import type { ComponentProps } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock child components if needed
// jest.mock('@/components/ChildComponent', () => ({
//   ChildComponent: ({ children }: { children: React.ReactNode }) => (
//     <div data-testid="mock-child">{children}</div>
//   ),
// }));

// Mock hooks if needed
// jest.mock('@/hooks/useCustomHook', () => ({
//   useCustomHook: jest.fn(() => ({
//     data: mockData,
//     loading: false,
//     error: null,
//   })),
// }));

// =============================================================================
// TEST UTILITIES
// =============================================================================

// Helper function to render component with providers
// function renderWithProviders(
//   ui: React.ReactElement,
//   options = {}
// ) {
//   return render(ui, {
//     wrapper: ({ children }) => (
//       <Provider>
//         {children}
//       </Provider>
//     ),
//     ...options,
//   });
// }

// Default props for testing
// const defaultProps: ComponentProps = {
//   title: 'Test Title',
//   onAction: jest.fn(),
//   // ... other required props
// };

// =============================================================================
// TEST SUITE
// =============================================================================

describe('ComponentName', () => {
  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // Set up userEvent for simulating user interactions
    user = userEvent.setup();

    // Clear all mocks
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render without crashing', () => {
      // Act
      // render(<ComponentName {...defaultProps} />);

      // Assert
      // expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should display provided content', () => {
      // Arrange
      const props = {
        // ...defaultProps,
        title: 'Custom Title',
        description: 'Custom Description',
      };

      // Act
      // render(<ComponentName {...props} />);

      // Assert
      // expect(screen.getByText('Custom Title')).toBeInTheDocument();
      // expect(screen.getByText('Custom Description')).toBeInTheDocument();
    });

    it('should render with correct structure', () => {
      // Act
      // const { container } = render(<ComponentName {...defaultProps} />);

      // Assert - check DOM structure
      // expect(container.firstChild).toHaveClass('expected-class');
    });

    it('should not render when condition is false', () => {
      // Arrange
      // const props = { ...defaultProps, shouldRender: false };

      // Act
      // render(<ComponentName {...props} />);

      // Assert
      // expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // User Interaction Tests
  // ---------------------------------------------------------------------------

  describe('User Interactions', () => {
    it('should handle button click', async () => {
      // Arrange
      const onAction = jest.fn();
      // render(<ComponentName {...defaultProps} onAction={onAction} />);

      // Act
      // const button = screen.getByRole('button', { name: /submit/i });
      // await user.click(button);

      // Assert
      // expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('should handle text input', async () => {
      // Arrange
      const onChange = jest.fn();
      // render(<ComponentName {...defaultProps} onChange={onChange} />);

      // Act
      // const input = screen.getByLabelText(/title/i);
      // await user.type(input, 'Test input');

      // Assert
      // expect(input).toHaveValue('Test input');
      // expect(onChange).toHaveBeenCalled();
    });

    it('should handle form submission', async () => {
      // Arrange
      const onSubmit = jest.fn();
      // render(<ComponentName {...defaultProps} onSubmit={onSubmit} />);

      // Act
      // const titleInput = screen.getByLabelText(/title/i);
      // await user.type(titleInput, 'New Title');

      // const submitButton = screen.getByRole('button', { name: /submit/i });
      // await user.click(submitButton);

      // Assert
      // expect(onSubmit).toHaveBeenCalledWith(
      //   expect.objectContaining({ title: 'New Title' })
      // );
    });

    it('should handle keyboard navigation', async () => {
      // Arrange
      // render(<ComponentName {...defaultProps} />);

      // Act
      // const firstButton = screen.getByRole('button', { name: /first/i });
      // firstButton.focus();
      // await user.keyboard('{Tab}');

      // Assert
      // const secondButton = screen.getByRole('button', { name: /second/i });
      // expect(secondButton).toHaveFocus();
    });

    it('should handle escape key press', async () => {
      // Arrange
      const onClose = jest.fn();
      // render(<ComponentName {...defaultProps} onClose={onClose} />);

      // Act
      // await user.keyboard('{Escape}');

      // Assert
      // expect(onClose).toHaveBeenCalled();
    });

    it('should handle enter key press', async () => {
      // Arrange
      const onSubmit = jest.fn();
      // render(<ComponentName {...defaultProps} onSubmit={onSubmit} />);

      // Act
      // const input = screen.getByRole('textbox');
      // await user.type(input, 'Test{Enter}');

      // Assert
      // expect(onSubmit).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // State Management Tests
  // ---------------------------------------------------------------------------

  describe('State Management', () => {
    it('should update state on user input', async () => {
      // Arrange
      // render(<ComponentName {...defaultProps} />);

      // Act
      // const input = screen.getByLabelText(/title/i);
      // await user.type(input, 'Updated Title');

      // Assert
      // expect(input).toHaveValue('Updated Title');
    });

    it('should reset state on cancel', async () => {
      // Arrange
      // render(<ComponentName {...defaultProps} />);

      // Act
      // const input = screen.getByLabelText(/title/i);
      // await user.type(input, 'Changed');

      // const cancelButton = screen.getByRole('button', { name: /cancel/i });
      // await user.click(cancelButton);

      // Assert
      // expect(input).toHaveValue(''); // or original value
    });

    it('should toggle visibility', async () => {
      // Arrange
      // render(<ComponentName {...defaultProps} />);

      // Act
      // const toggleButton = screen.getByRole('button', { name: /toggle/i });
      // await user.click(toggleButton);

      // Assert
      // expect(screen.getByTestId('hidden-content')).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Conditional Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Conditional Rendering', () => {
    it('should show loading state', () => {
      // Arrange & Act
      // render(<ComponentName {...defaultProps} loading={true} />);

      // Assert
      // expect(screen.getByRole('status')).toBeInTheDocument();
      // expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show error state', () => {
      // Arrange
      const error = 'Something went wrong';

      // Act
      // render(<ComponentName {...defaultProps} error={error} />);

      // Assert
      // expect(screen.getByRole('alert')).toBeInTheDocument();
      // expect(screen.getByText(error)).toBeInTheDocument();
    });

    it('should show empty state', () => {
      // Arrange & Act
      // render(<ComponentName {...defaultProps} data={[]} />);

      // Assert
      // expect(screen.getByText(/no items/i)).toBeInTheDocument();
    });

    it('should show success message after action', async () => {
      // Arrange
      // render(<ComponentName {...defaultProps} />);

      // Act
      // const button = screen.getByRole('button', { name: /save/i });
      // await user.click(button);

      // Assert
      // await waitFor(() => {
      //   expect(screen.getByText(/success/i)).toBeInTheDocument();
      // });
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      // Arrange
      // const { container } = render(<ComponentName {...defaultProps} />);

      // Act
      // const results = await axe(container);

      // Assert
      // expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
      // Act
      // render(<ComponentName {...defaultProps} />);

      // Assert
      // expect(screen.getByRole('button')).toHaveAttribute('aria-label');
      // expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
    });

    it('should trap focus within modal', async () => {
      // Arrange
      // render(<ComponentName {...defaultProps} isOpen={true} />);

      // Act
      // const dialog = screen.getByRole('dialog');
      // const buttons = within(dialog).getAllByRole('button');

      // Focus first button
      // buttons[0].focus();

      // Tab to cycle through
      // await user.keyboard('{Tab}');

      // Assert
      // Focus should stay within modal
      // expect(document.activeElement).toBe(buttons[1]);
    });

    it('should have proper heading hierarchy', () => {
      // Act
      // render(<ComponentName {...defaultProps} />);

      // Assert
      // const h1 = screen.getByRole('heading', { level: 1 });
      // const h2 = screen.getByRole('heading', { level: 2 });
      // expect(h1).toBeInTheDocument();
      // expect(h2).toBeInTheDocument();
    });

    it('should announce live region updates', async () => {
      // Arrange
      // render(<ComponentName {...defaultProps} />);

      // Act
      // const button = screen.getByRole('button', { name: /update/i });
      // await user.click(button);

      // Assert
      // const liveRegion = screen.getByRole('status');
      // expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      // expect(liveRegion).toHaveTextContent(/updated/i);
    });
  });

  // ---------------------------------------------------------------------------
  // Props Tests
  // ---------------------------------------------------------------------------

  describe('Props Handling', () => {
    it('should use default props when not provided', () => {
      // Act
      // render(<ComponentName title="Test" />);

      // Assert - check default behavior
      // expect(screen.getByRole('button')).toHaveTextContent('Submit');
    });

    it('should override defaults with provided props', () => {
      // Arrange
      const customLabel = 'Custom Label';

      // Act
      // render(<ComponentName {...defaultProps} buttonLabel={customLabel} />);

      // Assert
      // expect(screen.getByRole('button')).toHaveTextContent(customLabel);
    });

    it('should handle optional props', () => {
      // Act
      // render(<ComponentName {...defaultProps} optionalProp={undefined} />);

      // Assert
      // expect(screen.queryByTestId('optional-element')).not.toBeInTheDocument();
    });

    it('should pass props to child components', () => {
      // Act
      // render(<ComponentName {...defaultProps} childProp="value" />);

      // Assert
      // const child = screen.getByTestId('mock-child');
      // expect(child).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Async Behavior Tests
  // ---------------------------------------------------------------------------

  describe('Async Behavior', () => {
    it('should handle async data loading', async () => {
      // Arrange
      // const mockData = [{ id: 1, name: 'Item 1' }];
      // const mockFetch = jest.fn(() =>
      //   Promise.resolve({ data: mockData })
      // );

      // Act
      // render(<ComponentName {...defaultProps} fetchData={mockFetch} />);

      // Assert
      // await waitFor(() => {
      //   expect(screen.getByText('Item 1')).toBeInTheDocument();
      // });
    });

    it('should debounce input', async () => {
      // Arrange
      jest.useFakeTimers();
      const onChange = jest.fn();
      // render(<ComponentName {...defaultProps} onChange={onChange} />);

      // Act
      // const input = screen.getByRole('textbox');
      // await user.type(input, 'test');

      // Fast-forward time
      // jest.advanceTimersByTime(300);

      // Assert
      // expect(onChange).toHaveBeenCalledTimes(1); // Called once after debounce

      jest.useRealTimers();
    });

    it('should handle timeout', async () => {
      // Arrange
      jest.useFakeTimers();
      // render(<ComponentName {...defaultProps} timeout={5000} />);

      // Act
      // jest.advanceTimersByTime(5000);

      // Assert
      // await waitFor(() => {
      //   expect(screen.getByText(/timeout/i)).toBeInTheDocument();
      // });

      jest.useRealTimers();
    });
  });

  // ---------------------------------------------------------------------------
  // Snapshot Tests
  // ---------------------------------------------------------------------------

  describe('Snapshots', () => {
    it('should match snapshot', () => {
      // Act
      // const { container } = render(<ComponentName {...defaultProps} />);

      // Assert
      // expect(container).toMatchSnapshot();
    });

    it('should match snapshot with different state', () => {
      // Act
      // const { container } = render(
      //   <ComponentName {...defaultProps} loading={true} />
      // );

      // Assert
      // expect(container).toMatchSnapshot();
    });
  });

  // ---------------------------------------------------------------------------
  // Event Handler Tests
  // ---------------------------------------------------------------------------

  describe('Event Handlers', () => {
    it('should call onClick handler', async () => {
      // Arrange
      const onClick = jest.fn();
      // render(<ComponentName {...defaultProps} onClick={onClick} />);

      // Act
      // await user.click(screen.getByRole('button'));

      // Assert
      // expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call handler when disabled', async () => {
      // Arrange
      const onClick = jest.fn();
      // render(
      //   <ComponentName {...defaultProps} onClick={onClick} disabled={true} />
      // );

      // Act
      // await user.click(screen.getByRole('button'));

      // Assert
      // expect(onClick).not.toHaveBeenCalled();
    });

    it('should pass correct arguments to handler', async () => {
      // Arrange
      const onAction = jest.fn();
      // render(<ComponentName {...defaultProps} onAction={onAction} />);

      // Act
      // const button = screen.getByRole('button');
      // await user.click(button);

      // Assert
      // expect(onAction).toHaveBeenCalledWith(
      //   expect.objectContaining({ type: 'click' })
      // );
    });
  });
});

// =============================================================================
// TIPS FOR WRITING GOOD COMPONENT TESTS
// =============================================================================

/*
1. Query Priority (React Testing Library)
   - getByRole (preferred) - accessible and semantic
   - getByLabelText - for form fields
   - getByPlaceholderText - for inputs
   - getByText - for non-interactive elements
   - getByTestId - last resort

2. User-Centric Testing
   - Test what users see and do
   - Don't test implementation details
   - Use userEvent over fireEvent (more realistic)

3. Accessibility First
   - Run axe checks on all components
   - Test keyboard navigation
   - Verify ARIA attributes
   - Check focus management

4. Async Patterns
   - Use waitFor for async updates
   - Use findBy queries (combine wait + query)
   - Don't forget to await user interactions

5. Mock Sparingly
   - Only mock external dependencies
   - Don't mock child components unless necessary
   - Prefer integration over isolation

6. Test User Flows
   - Test complete interactions
   - Verify state changes
   - Check side effects

7. Error Boundaries
   - Test error states
   - Verify error messages
   - Check fallback UI

8. Performance
   - Test render performance if critical
   - Verify memoization if used
   - Check for unnecessary re-renders

9. Responsive Behavior
   - Test different viewport sizes
   - Verify mobile interactions
   - Check touch events

10. Clean Up
    - Clear timers
    - Reset mocks
    - Clean up event listeners
*/
