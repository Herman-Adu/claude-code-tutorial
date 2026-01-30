'use client';

import { useEffect } from 'react';

/**
 * Props for the ErrorToast component.
 */
export interface ErrorToastProps {
  /** The error message to display */
  message: string;
  /** Callback when the toast should be dismissed */
  onDismiss: () => void;
}

/**
 * Error Toast Component
 *
 * Displays dismissible error messages in a glassmorphic style.
 * Auto-dismisses after 5 seconds.
 */
export function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - onDismiss intentionally excluded to prevent timer reset on re-renders

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 max-w-md animate-slide-up"
    >
      <div className="glass-lg bg-rose-50/90 border-rose-200/60 p-4 pr-12 shadow-[0_8px_32px_rgba(240,100,100,0.2)]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-[0_2px_8px_rgba(240,100,100,0.3)]">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-rose-800">Error</h3>
            <p className="text-sm text-rose-700 mt-0.5">{message}</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-200/50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Loading Spinner Component
 *
 * Shows during async operations (saving, deleting, moving tasks).
 */
export function LoadingIndicator() {
  return (
    <div className="fixed bottom-6 left-6 z-50" role="status" aria-live="polite" aria-label="Loading">
      <div className="glass-sm px-4 py-3 flex items-center gap-3 shadow-[0_8px_24px_rgba(100,150,230,0.2)]">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-slate-600">Saving...</span>
      </div>
    </div>
  );
}

/**
 * Board Loading Skeleton
 *
 * Shows while the board is hydrating from the store.
 */
export function BoardLoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 p-8 glass-lg">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-sky-400" aria-hidden="true" />
        <p className="text-slate-600 font-medium tracking-wide">Loading Board...</p>
      </div>
    </div>
  );
}
