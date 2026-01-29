'use client';

/**
 * CommentForm Component
 *
 * Form for creating new comments on a task.
 *
 * Features:
 * - Text input with character count
 * - Submit button with loading state
 * - Keyboard shortcut (Ctrl+Enter to submit)
 * - Error message display
 * - Accessible labels and ARIA attributes
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { VALIDATION } from '@/lib/schemas';

interface CommentFormProps {
  /** Task ID to attach comment to */
  taskId: string;
  /** Callback when comment is submitted */
  onSubmit: (text: string, taskId: string) => Promise<string | null>;
  /** Whether submission is in progress */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Callback to clear error */
  onClearError?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to auto-focus the input */
  autoFocus?: boolean;
}

export function CommentForm({
  taskId,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
  placeholder = 'Add a comment...',
  autoFocus = false,
}: CommentFormProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxLength = VALIDATION.MAX_COMMENT_LENGTH;
  const isOverLimit = text.length > maxLength;
  const isEmpty = text.trim().length === 0;
  const canSubmit = !isEmpty && !isOverLimit && !isLoading;

  // Auto-focus when requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Clear error when user starts typing
  useEffect(() => {
    if (text && error && onClearError) {
      onClearError();
    }
  }, [text, error, onClearError]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    const result = await onSubmit(text.trim(), taskId);
    if (result) {
      // Success - clear the form
      setText('');
      textareaRef.current?.focus();
    }
  }, [canSubmit, onSubmit, text, taskId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit();
    },
    [handleSubmit]
  );

  // Auto-resize textarea based on content
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setText(textarea.value);

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight, with min and max constraints
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 80), 200);
    textarea.style.height = `${newHeight}px`;
  }, []);

  return (
    <form onSubmit={handleFormSubmit} className="space-y-2">
      <div className="relative">
        <label htmlFor={`comment-input-${taskId}`} className="sr-only">
          Add a comment
        </label>
        <textarea
          ref={textareaRef}
          id={`comment-input-${taskId}`}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-2.5 text-sm rounded-lg border resize-none',
            'bg-white transition-all duration-200',
            'placeholder:text-slate-400',
            isFocused
              ? 'border-violet-400 ring-2 ring-violet-100'
              : 'border-slate-200 hover:border-slate-300',
            isOverLimit && 'border-rose-400 ring-2 ring-rose-100',
            'disabled:bg-slate-50 disabled:cursor-not-allowed'
          )}
          style={{ minHeight: '80px', maxHeight: '200px' }}
          disabled={isLoading}
          aria-invalid={isOverLimit || !!error}
          aria-describedby={
            error ? `comment-error-${taskId}` : isOverLimit ? `comment-limit-${taskId}` : undefined
          }
        />
      </div>

      {/* Error message */}
      {error && (
        <div
          id={`comment-error-${taskId}`}
          className="flex items-center gap-2 text-sm text-rose-600"
          role="alert"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Footer with character count and submit button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            id={`comment-limit-${taskId}`}
            className={cn(
              'text-xs transition-colors',
              isOverLimit ? 'text-rose-600 font-medium' : 'text-slate-500'
            )}
          >
            {text.length}/{maxLength}
          </span>
          {isOverLimit && (
            <span className="text-xs text-rose-600">Character limit exceeded</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Ctrl+Enter to submit
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              'flex items-center gap-2',
              canSubmit
                ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm hover:shadow'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Posting...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span>Comment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CommentForm;
