'use client';

import { useState, useTransition, useMemo } from 'react';
import { changePassword } from '@/app/actions/user';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { VALIDATION } from '@/lib/schemas';

interface ChangePasswordFormProps {
  /** Whether the user has an existing password (false for OAuth-only accounts) */
  hasPassword: boolean;
}

/**
 * Password strength requirements checklist item.
 */
interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

/**
 * Password strength requirements matching VALIDATION constants.
 * Each requirement maps to a validation rule in the Zod schema.
 */
const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    label: `${VALIDATION.MIN_PASSWORD_LENGTH}+ characters`,
    test: (password) => password.length >= VALIDATION.MIN_PASSWORD_LENGTH,
  },
  {
    label: 'Uppercase letter (A-Z)',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'Lowercase letter (a-z)',
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'Number (0-9)',
    test: (password) => /\d/.test(password),
  },
];

/**
 * Calculates password strength score (0-4) based on requirements met.
 */
function calculatePasswordStrength(password: string): number {
  return PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length;
}

/**
 * Returns color classes for strength indicator based on score.
 */
function getStrengthColor(strength: number): string {
  if (strength <= 1) return 'bg-rose-500';
  if (strength === 2) return 'bg-amber-500';
  if (strength === 3) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

/**
 * Returns strength label text based on score.
 */
function getStrengthLabel(strength: number): string {
  if (strength === 0) return 'Very Weak';
  if (strength === 1) return 'Weak';
  if (strength === 2) return 'Fair';
  if (strength === 3) return 'Good';
  return 'Strong';
}

/**
 * Eye icon SVG for showing password.
 */
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

/**
 * Eye-off icon SVG for hiding password.
 */
function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

/**
 * Password input field with visibility toggle.
 */
interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  showPassword: boolean;
  onToggleVisibility: () => void;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  showPassword,
  onToggleVisibility,
}: PasswordFieldProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        label={label}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        error={error}
        disabled={disabled}
        className="pr-12"
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-3 top-[38px] p-1 text-slate-500 hover:text-slate-700 transition-colors"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOffIcon className="w-5 h-5" />
        ) : (
          <EyeIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

/**
 * ChangePasswordForm allows users to update their account password.
 *
 * Features:
 * - Current password verification
 * - New password with strength indicator
 * - Confirm password matching validation
 * - Password visibility toggles
 * - OAuth-only account detection
 * - Rate limiting error handling
 */
export function ChangePasswordForm({ hasPassword }: ChangePasswordFormProps) {
  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  // Computed values
  const passwordStrength = useMemo(
    () => calculatePasswordStrength(newPassword),
    [newPassword]
  );

  const passwordsMatch = confirmPassword === '' || newPassword === confirmPassword;
  const isPasswordStrong = passwordStrength === PASSWORD_REQUIREMENTS.length;

  // Determine if submit should be disabled
  const isSubmitDisabled =
    isPending ||
    !currentPassword ||
    !newPassword ||
    !confirmPassword ||
    !passwordsMatch ||
    !isPasswordStrong;

  /**
   * Handles form submission, calling the changePassword server action.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    startTransition(async () => {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        setSuccessMessage('Password changed successfully');
        // Clear form on success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(result.error || 'Failed to change password');
      }
    });
  };

  // Show warning for OAuth-only accounts
  if (!hasPassword) {
    return (
      <Alert
        type="warning"
        title="Password Not Available"
        message="Your account uses OAuth authentication (Google, GitHub, etc.). Password changes are not available for OAuth-only accounts."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success message */}
      {successMessage && (
        <Alert
          type="success"
          title="Success"
          message={successMessage}
          dismissible
          onDismiss={() => setSuccessMessage('')}
        />
      )}

      {/* Error message */}
      {errorMessage && (
        <Alert
          type="error"
          title="Error"
          message={errorMessage}
          dismissible
          onDismiss={() => setErrorMessage('')}
        />
      )}

      {/* Current Password */}
      <PasswordField
        id="currentPassword"
        label="Current Password"
        value={currentPassword}
        onChange={setCurrentPassword}
        placeholder="Enter your current password"
        disabled={isPending}
        showPassword={showCurrentPassword}
        onToggleVisibility={() => setShowCurrentPassword(!showCurrentPassword)}
      />

      {/* New Password */}
      <div>
        <PasswordField
          id="newPassword"
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Enter your new password"
          disabled={isPending}
          showPassword={showNewPassword}
          onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
        />

        {/* Password Strength Indicator */}
        {newPassword.length > 0 && (
          <div className="mt-3">
            {/* Strength bars */}
            <div className="flex gap-1 mb-2" role="progressbar" aria-valuenow={passwordStrength} aria-valuemin={0} aria-valuemax={4} aria-label="Password strength">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    index < passwordStrength
                      ? getStrengthColor(passwordStrength)
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Strength label */}
            <p className="text-xs text-slate-600 mb-2">
              Strength: <span className="font-medium">{getStrengthLabel(passwordStrength)}</span>
            </p>

            {/* Requirements checklist */}
            <ul className="space-y-1">
              {PASSWORD_REQUIREMENTS.map((req, index) => {
                const isMet = req.test(newPassword);
                return (
                  <li
                    key={index}
                    className={`text-xs flex items-center gap-1.5 ${
                      isMet ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  >
                    <span aria-hidden="true">{isMet ? '✓' : '○'}</span>
                    <span>{req.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <PasswordField
        id="confirmPassword"
        label="Confirm Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Confirm your new password"
        error={
          confirmPassword && !passwordsMatch
            ? 'Passwords do not match'
            : undefined
        }
        disabled={isPending}
        showPassword={showConfirmPassword}
        onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full"
      >
        {isPending ? 'Changing...' : 'Change Password'}
      </Button>
    </form>
  );
}
