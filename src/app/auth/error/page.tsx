'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access denied. You do not have permission to sign in.',
  Verification: 'The verification link has expired or has already been used.',
  OAuthSignin: 'Error occurred while trying to sign in with the provider.',
  OAuthCallback: 'Error occurred during the OAuth callback.',
  OAuthCreateAccount: 'Could not create an account with the OAuth provider.',
  EmailCreateAccount: 'Could not create an account with this email.',
  Callback: 'Error occurred during the authentication callback.',
  OAuthAccountNotLinked: 'This email is already associated with another account. Please sign in with the original provider.',
  EmailSignin: 'Error sending the verification email.',
  CredentialsSignin: 'Invalid email or password. Please try again.',
  SessionRequired: 'Please sign in to access this page.',
  Default: 'An unexpected authentication error occurred.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessage = error && errorMessages[error]
    ? errorMessages[error]
    : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-lg border border-white/40 shadow-lg rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100/80 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Error
          </h1>

          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>

          {error && (
            <p className="text-xs text-gray-400 mb-6">
              Error code: {error}
            </p>
          )}

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full py-3 px-4 bg-gradient-to-br from-sky-400 to-indigo-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Try Again
            </Link>

            <Link
              href="/"
              className="block w-full py-3 px-4 bg-white/70 backdrop-blur-lg border border-white/40 text-gray-700 font-medium rounded-xl hover:bg-white/80 transition-all"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
        <div className="w-full max-w-md">
          <div className="bg-white/70 backdrop-blur-lg border border-white/40 shadow-lg rounded-2xl p-8 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-200"></div>
              <div className="h-6 bg-gray-200 rounded mb-4 w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
