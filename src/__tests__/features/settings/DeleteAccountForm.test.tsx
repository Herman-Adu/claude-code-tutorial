import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAccountForm } from '@/features/settings/components/DeleteAccountForm';

// Mock the server action
vi.mock('@/app/actions/user', () => ({
  deleteAccount: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

import { deleteAccount } from '@/app/actions/user';

describe('DeleteAccountForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================================================================
  // Rendering Tests
  // =========================================================================

  describe('Rendering', () => {
    it('renders danger warning banner', () => {
      render(<DeleteAccountForm hasPassword={true} />);
      expect(screen.getByText(/danger zone/i)).toBeInTheDocument();
      expect(screen.getByText(/account deletion is permanent/i)).toBeInTheDocument();
    });

    it('renders password input for credential accounts', () => {
      render(<DeleteAccountForm hasPassword={true} />);
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('renders OAuth info message for OAuth-only accounts', () => {
      render(<DeleteAccountForm hasPassword={false} />);
      expect(screen.getByText(/oauth authentication only/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /proceed to confirmation/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Step 1 Behavior
  // =========================================================================

  describe('Step 1 - Password Verification', () => {
    it('disables Next button when password is empty for credential accounts', () => {
      render(<DeleteAccountForm hasPassword={true} />);
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('enables Next button when password is entered', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'mypassword');

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('proceeds to Step 2 when Next is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'mypassword');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should now be on Step 2
      expect(screen.getByText(/what will happen/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type delete to confirm/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // OAuth-only Flow
  // =========================================================================

  describe('OAuth-only Account Flow', () => {
    it('enables Proceed button immediately for OAuth accounts', () => {
      render(<DeleteAccountForm hasPassword={false} />);
      const proceedButton = screen.getByRole('button', { name: /proceed to confirmation/i });
      expect(proceedButton).not.toBeDisabled();
    });

    it('skips password step and goes to confirmation', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={false} />);

      const proceedButton = screen.getByRole('button', { name: /proceed to confirmation/i });
      await user.click(proceedButton);

      // Should now be on Step 2
      expect(screen.getByText(/what will happen/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Step 2 Behavior
  // =========================================================================

  describe('Step 2 - Confirmation', () => {
    async function goToStep2(hasPassword: boolean = true) {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={hasPassword} />);

      if (hasPassword) {
        const passwordInput = screen.getByLabelText(/current password/i);
        await user.type(passwordInput, 'mypassword');
        await user.click(screen.getByRole('button', { name: /next/i }));
      } else {
        await user.click(screen.getByRole('button', { name: /proceed to confirmation/i }));
      }

      return user;
    }

    it('shows what will happen message', async () => {
      await goToStep2();

      expect(screen.getByText(/what will happen/i)).toBeInTheDocument();
      expect(screen.getByText(/deleted permanently/i)).toBeInTheDocument();
      // Use more specific text to avoid matching the banner warning
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      expect(screen.getByText(/sessions will be terminated/i)).toBeInTheDocument();
    });

    it('shows confirmation input field', async () => {
      await goToStep2();

      expect(screen.getByPlaceholderText(/type delete to confirm/i)).toBeInTheDocument();
    });

    it('disables Delete Account button until DELETE is typed', async () => {
      await goToStep2();

      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      expect(deleteButton).toBeDisabled();
    });

    it('enables Delete Account button when DELETE is typed exactly', async () => {
      const user = await goToStep2();

      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');

      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      expect(deleteButton).not.toBeDisabled();
    });

    it('keeps button disabled for lowercase "delete"', async () => {
      const user = await goToStep2();

      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'delete');

      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      expect(deleteButton).toBeDisabled();
    });

    it('shows confirmation match helper text', async () => {
      const user = await goToStep2();

      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');

      expect(screen.getByText(/confirmation text matches/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Cancel / Back Button
  // =========================================================================

  describe('Back Button', () => {
    it('returns to Step 1 when Cancel is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      // Go to Step 2
      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'mypassword');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Click Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Should be back on Step 1
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.queryByText(/what will happen/i)).not.toBeInTheDocument();
    });

    it('clears confirmation text when returning to Step 1', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      // Go to Step 2
      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'mypassword');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Type confirmation
      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');

      // Go back and forward again
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Confirmation should be cleared
      const newConfirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      expect((newConfirmInput as HTMLInputElement).value).toBe('');
    });
  });

  // =========================================================================
  // Submission
  // =========================================================================

  describe('Submission', () => {
    it('calls deleteAccount with password and confirmation', async () => {
      const mockDeleteAccount = vi.mocked(deleteAccount);
      mockDeleteAccount.mockResolvedValue({ success: true });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      // Step 1
      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'mypassword');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2
      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalledWith({
          password: 'mypassword',
          confirmation: 'DELETE',
        });
      });
    });

    it('calls deleteAccount with empty password for OAuth accounts', async () => {
      const mockDeleteAccount = vi.mocked(deleteAccount);
      mockDeleteAccount.mockResolvedValue({ success: true });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={false} />);

      // Go to Step 2
      await user.click(screen.getByRole('button', { name: /proceed to confirmation/i }));

      // Step 2
      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalledWith({
          password: '',
          confirmation: 'DELETE',
        });
      });
    });

    it('shows loading state during submission', async () => {
      const mockDeleteAccount = vi.mocked(deleteAccount);
      mockDeleteAccount.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
      );

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      // Step 1
      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'mypassword');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2
      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Success Handling
  // =========================================================================

  describe('Success Handling', () => {
    it('shows success message after deletion', async () => {
      const mockDeleteAccount = vi.mocked(deleteAccount);
      mockDeleteAccount.mockResolvedValue({ success: true });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      // Step 1
      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'mypassword');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2
      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/account deleted successfully/i)).toBeInTheDocument();
      });
    });

    it('redirects to login page after 2 seconds', async () => {
      const mockDeleteAccount = vi.mocked(deleteAccount);
      mockDeleteAccount.mockResolvedValue({ success: true });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      // Step 1
      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'mypassword');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2
      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/account deleted successfully/i)).toBeInTheDocument();
      });

      // Advance timer by 2 seconds
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });

  // =========================================================================
  // Error Handling
  // =========================================================================

  describe('Error Handling', () => {
    it('shows error for incorrect password', async () => {
      const mockDeleteAccount = vi.mocked(deleteAccount);
      mockDeleteAccount.mockResolvedValue({
        success: false,
        error: 'Password is incorrect. Account deletion cancelled.',
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      // Step 1
      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2
      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
      });
    });

    it('shows rate limiting error', async () => {
      const mockDeleteAccount = vi.mocked(deleteAccount);
      mockDeleteAccount.mockResolvedValue({
        success: false,
        error: 'Too many deletion attempts. Please try again later.',
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      // Step 1
      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'mypassword');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2
      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/too many deletion attempts/i)).toBeInTheDocument();
      });
    });

    it('shows account not found error', async () => {
      const mockDeleteAccount = vi.mocked(deleteAccount);
      mockDeleteAccount.mockResolvedValue({
        success: false,
        error: 'User not found',
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      // Step 1
      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'mypassword');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2
      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/account not found/i)).toBeInTheDocument();
      });
    });

    it('allows dismissing error message', async () => {
      const mockDeleteAccount = vi.mocked(deleteAccount);
      mockDeleteAccount.mockResolvedValue({
        success: false,
        error: 'Password is incorrect.',
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteAccountForm hasPassword={true} />);

      // Step 1
      const passwordInput = screen.getByLabelText(/current password/i);
      await user.type(passwordInput, 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2
      const confirmInput = screen.getByPlaceholderText(/type delete to confirm/i);
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
      });

      // Dismiss the error
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      await user.click(dismissButton);

      expect(screen.queryByText(/current password is incorrect/i)).not.toBeInTheDocument();
    });
  });
});
