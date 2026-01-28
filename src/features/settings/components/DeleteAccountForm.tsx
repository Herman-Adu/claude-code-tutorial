'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAccount } from '@/app/actions/user';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface DeleteAccountFormProps {
  hasPassword: boolean;
}

/**
 * Two-step account deletion form with confirmation flow.
 *
 * Step 1: Password verification (credential accounts) or info display (OAuth-only)
 * Step 2: Type "DELETE" confirmation
 *
 * Features:
 * - Password verification for credential-based accounts
 * - Skip password step for OAuth-only accounts
 * - Real-time validation for confirmation text
 * - Error handling with specific messages
 * - Success redirect after deletion
 */
export function DeleteAccountForm({ hasPassword }: DeleteAccountFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  // Validation state
  const isConfirmationValid = confirmation === 'DELETE';
  const canProceedFromStep1 = hasPassword ? password.length > 0 : true;
  const canSubmitDeletion = isConfirmationValid && !isPending;

  /**
   * Handle proceeding from Step 1 to Step 2.
   * For OAuth-only accounts, skip password verification entirely.
   */
  const handleProceedToStep2 = () => {
    setErrorMessage('');
    setCurrentStep(2);
  };

  /**
   * Handle going back to Step 1 from Step 2.
   */
  const handleBackToStep1 = () => {
    setErrorMessage('');
    setConfirmation('');
    setCurrentStep(1);
  };

  /**
   * Handle account deletion submission.
   * Validates password (for credential accounts) and confirmation text.
   */
  const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    // Final validation check
    if (!isConfirmationValid) {
      setErrorMessage('Type "DELETE" to confirm');
      return;
    }

    startTransition(async () => {
      const result = await deleteAccount({
        password: hasPassword ? password : '',
        confirmation,
      });

      if (result.success) {
        setSuccessMessage('Account deleted successfully. Redirecting...');
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        // Map server errors to user-friendly messages
        const errorMsg = mapErrorMessage(result.error);
        setErrorMessage(errorMsg);
      }
    });
  };

  /**
   * Maps server error messages to user-friendly display messages.
   */
  function mapErrorMessage(error: string | undefined): string {
    if (!error) return 'An error occurred. Please try again.';

    if (error.toLowerCase().includes('password') && error.toLowerCase().includes('incorrect')) {
      return 'Current password is incorrect';
    }
    if (error.toLowerCase().includes('delete') || error.toLowerCase().includes('confirm')) {
      return 'Type "DELETE" to confirm';
    }
    if (error.toLowerCase().includes('too many') || error.toLowerCase().includes('rate')) {
      return 'Too many deletion attempts. Please try again later.';
    }
    if (error.toLowerCase().includes('not found')) {
      return 'Account not found';
    }

    return error;
  }

  // Success state - show message and prevent further interaction
  if (successMessage) {
    return (
      <div className="space-y-6">
        <Alert
          type="success"
          title="Account Deleted"
          message={successMessage}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Danger Warning Banner */}
      <div className="p-4 rounded-xl bg-red-50/65 border border-red-200/40 backdrop-blur-md">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-700">
              Danger Zone
            </h3>
            <p className="mt-1 text-sm text-red-700">
              Account deletion is permanent and cannot be undone. All your data will be lost.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Alert
          type="error"
          title="Error"
          message={errorMessage}
          dismissible
          onDismiss={() => setErrorMessage('')}
        />
      )}

      {/* Step 1: Password Verification / OAuth Info */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {hasPassword ? (
            <>
              <p className="text-sm text-slate-600">
                To delete your account, please enter your password to verify your identity.
              </p>
              <Input
                label="Current Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isPending}
                autoComplete="current-password"
              />
            </>
          ) : (
            <div className="p-3 rounded-lg bg-amber-50/65 border border-amber-200/40">
              <p className="text-xs text-amber-700">
                <span className="font-medium">Note:</span> This account uses OAuth
                authentication only. You will proceed directly to the confirmation step.
              </p>
            </div>
          )}

          <Button
            type="button"
            variant="danger"
            onClick={handleProceedToStep2}
            disabled={!canProceedFromStep1 || isPending}
            className="w-full"
          >
            {hasPassword ? 'Next' : 'Proceed to Confirmation'}
          </Button>
        </div>
      )}

      {/* Step 2: Confirmation */}
      {currentStep === 2 && (
        <form onSubmit={handleDeleteAccount} className="space-y-6">
          <div className="p-4 rounded-xl bg-red-50/65 border border-red-200/40 backdrop-blur-md">
            <h4 className="text-sm font-semibold text-red-700 mb-2">
              What will happen:
            </h4>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>Your account and all tasks will be deleted permanently</li>
              <li>This action cannot be undone</li>
              <li>All active sessions will be terminated</li>
            </ul>
          </div>

          <Input
            label="Confirmation"
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Type DELETE to confirm"
            disabled={isPending}
            helperText={
              confirmation.length > 0 && isConfirmationValid
                ? 'Confirmation text matches'
                : 'Type DELETE (case-sensitive) to confirm deletion'
            }
            autoComplete="off"
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBackToStep1}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={!canSubmitDeletion}
              className="flex-1"
            >
              {isPending ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
