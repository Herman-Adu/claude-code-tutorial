import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangePasswordForm } from '@/features/settings/components/ChangePasswordForm';

// Mock the server action
vi.mock('@/app/actions/user', () => ({
  changePassword: vi.fn(),
}));

import { changePassword } from '@/app/actions/user';

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('rendering', () => {
    it('renders all password fields when user has password', () => {
      render(<ChangePasswordForm hasPassword={true} />);

      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const button = screen.getByRole('button', { name: /change password/i });
      expect(button).toBeInTheDocument();
    });

    it('renders OAuth warning when user has no password', () => {
      render(<ChangePasswordForm hasPassword={false} />);

      expect(
        screen.getByText(/password not available/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/oauth authentication/i)
      ).toBeInTheDocument();
    });

    it('does not render form fields for OAuth-only accounts', () => {
      render(<ChangePasswordForm hasPassword={false} />);

      expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Password Strength Indicator Tests
  // ============================================================================

  describe('password strength indicator', () => {
    it('shows strength indicator when typing new password', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      await userEvent.type(newPasswordInput, 'a');

      expect(screen.getByText(/strength:/i)).toBeInTheDocument();
    });

    it('updates strength indicator in real-time', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);

      // Very weak - just lowercase
      await userEvent.type(newPasswordInput, 'abc');
      expect(screen.getByText(/weak/i)).toBeInTheDocument();

      // Clear and type stronger password
      await userEvent.clear(newPasswordInput);
      await userEvent.type(newPasswordInput, 'Abcdefgh1');

      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });

    it('shows requirements checklist', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      await userEvent.type(newPasswordInput, 'a');

      expect(screen.getByText(/8\+ characters/i)).toBeInTheDocument();
      expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/number/i)).toBeInTheDocument();
    });

    it('marks requirements as met when satisfied', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      await userEvent.type(newPasswordInput, 'Password1');

      // All requirements should be marked as met
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBe(4);
    });
  });

  // ============================================================================
  // Match Validation Tests
  // ============================================================================

  describe('match validation', () => {
    it('shows error when passwords do not match', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(newPasswordInput, 'Password1');
      await userEvent.type(confirmPasswordInput, 'Password2');

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('does not show error when passwords match', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(newPasswordInput, 'Password1');
      await userEvent.type(confirmPasswordInput, 'Password1');

      expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    });

    it('does not show error when confirm password is empty', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      await userEvent.type(newPasswordInput, 'Password1');

      expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Form Submission Tests
  // ============================================================================

  describe('submission', () => {
    it('calls changePassword with correct data on submit', async () => {
      const mockChangePassword = vi.mocked(changePassword);
      mockChangePassword.mockResolvedValue({ success: true });

      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith({
          currentPassword: 'OldPassword1',
          newPassword: 'NewPassword1',
          confirmPassword: 'NewPassword1',
        });
      });
    });
  });

  // ============================================================================
  // Success Flow Tests
  // ============================================================================

  describe('success flow', () => {
    it('shows success message on successful password change', async () => {
      const mockChangePassword = vi.mocked(changePassword);
      mockChangePassword.mockResolvedValue({ success: true });

      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
      });
    });

    it('clears form fields on successful password change', async () => {
      const mockChangePassword = vi.mocked(changePassword);
      mockChangePassword.mockResolvedValue({ success: true });

      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect((currentPasswordInput as HTMLInputElement).value).toBe('');
        expect((newPasswordInput as HTMLInputElement).value).toBe('');
        expect((confirmPasswordInput as HTMLInputElement).value).toBe('');
      });
    });
  });

  // ============================================================================
  // Error Flow Tests
  // ============================================================================

  describe('error flows', () => {
    it('shows error message on server error', async () => {
      const mockChangePassword = vi.mocked(changePassword);
      mockChangePassword.mockResolvedValue({
        success: false,
        error: 'Current password is incorrect.',
      });

      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'WrongPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
      });
    });

    it('shows rate limiting error message', async () => {
      const mockChangePassword = vi.mocked(changePassword);
      mockChangePassword.mockResolvedValue({
        success: false,
        error: 'Too many password change attempts. Please try again later.',
      });

      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/too many password change attempts/i)).toBeInTheDocument();
      });
    });

    it('shows generic error message on unknown error', async () => {
      const mockChangePassword = vi.mocked(changePassword);
      mockChangePassword.mockResolvedValue({
        success: false,
        error: undefined,
      });

      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to change password/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Loading State Tests
  // ============================================================================

  describe('loading state', () => {
    it('shows loading text during submission', async () => {
      const mockChangePassword = vi.mocked(changePassword);
      // Create a promise that we can resolve manually
      let resolvePromise: (value: { success: boolean }) => void;
      const pendingPromise = new Promise<{ success: boolean }>((resolve) => {
        resolvePromise = resolve;
      });
      mockChangePassword.mockReturnValue(pendingPromise);

      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /changing\.\.\./i })).toBeInTheDocument();
      });

      // Cleanup - resolve the promise
      resolvePromise!({ success: true });
    });

    it('disables submit button during submission', async () => {
      const mockChangePassword = vi.mocked(changePassword);
      let resolvePromise: (value: { success: boolean }) => void;
      const pendingPromise = new Promise<{ success: boolean }>((resolve) => {
        resolvePromise = resolve;
      });
      mockChangePassword.mockReturnValue(pendingPromise);

      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /changing\.\.\./i })).toBeDisabled();
      });

      // Cleanup
      resolvePromise!({ success: true });
    });
  });

  // ============================================================================
  // Password Visibility Toggle Tests
  // ============================================================================

  describe('password visibility toggles', () => {
    it('toggles current password visibility', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const toggleButton = screen.getAllByRole('button', { name: /show password/i })[0];

      expect(currentPasswordInput).toHaveAttribute('type', 'password');

      await userEvent.click(toggleButton);

      expect(currentPasswordInput).toHaveAttribute('type', 'text');

      await userEvent.click(toggleButton);

      expect(currentPasswordInput).toHaveAttribute('type', 'password');
    });

    it('toggles new password visibility', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const toggleButton = screen.getAllByRole('button', { name: /show password/i })[1];

      expect(newPasswordInput).toHaveAttribute('type', 'password');

      await userEvent.click(toggleButton);

      expect(newPasswordInput).toHaveAttribute('type', 'text');
    });

    it('toggles confirm password visibility', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const toggleButton = screen.getAllByRole('button', { name: /show password/i })[2];

      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      await userEvent.click(toggleButton);

      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });

    it('shows correct aria-label based on visibility state', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const showButtons = screen.getAllByRole('button', { name: /show password/i });
      expect(showButtons.length).toBe(3);

      await userEvent.click(showButtons[0]);

      const hideButton = screen.getByRole('button', { name: /hide password/i });
      expect(hideButton).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Disabled State Tests
  // ============================================================================

  describe('disabled state', () => {
    it('disables submit when current password is empty', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');

      expect(submitButton).toBeDisabled();
    });

    it('disables submit when new password is weak', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'weak'); // Weak password
      await userEvent.type(confirmPasswordInput, 'weak');

      expect(submitButton).toBeDisabled();
    });

    it('disables submit when passwords do not match', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'DifferentPassword1');

      expect(submitButton).toBeDisabled();
    });

    it('enables submit when all conditions are met', async () => {
      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');

      expect(submitButton).not.toBeDisabled();
    });
  });

  // ============================================================================
  // Alert Dismissal Tests
  // ============================================================================

  describe('alert dismissal', () => {
    it('shows dismiss button on success alert', async () => {
      const mockChangePassword = vi.mocked(changePassword);
      mockChangePassword.mockResolvedValue({ success: true });

      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
      });

      // Verify dismiss button is present and clickable
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      expect(dismissButton).toBeInTheDocument();
    });

    it('shows dismiss button on error alert', async () => {
      const mockChangePassword = vi.mocked(changePassword);
      mockChangePassword.mockResolvedValue({
        success: false,
        error: 'Test error message',
      });

      render(<ChangePasswordForm hasPassword={true} />);

      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      await userEvent.type(currentPasswordInput, 'OldPassword1');
      await userEvent.type(newPasswordInput, 'NewPassword1');
      await userEvent.type(confirmPasswordInput, 'NewPassword1');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/test error message/i)).toBeInTheDocument();
      });

      // Verify dismiss button is present and clickable
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      expect(dismissButton).toBeInTheDocument();
    });
  });
});
