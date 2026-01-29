'use client';

/**
 * CommentList Component
 *
 * Displays a list of comments for a task with the ability to add new comments.
 *
 * Features:
 * - Paginated comment display
 * - Add new comment form
 * - Edit and delete functionality
 * - Loading and empty states
 * - Error handling with toast-like display
 * - Automatic loading on mount
 */

import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import {
  useCommentsStore,
  useComments,
  useCommentsLoading,
  useCommentsSubmitting,
  useCommentsError,
} from '@/store/comments';

interface CommentListProps {
  /** Task ID to display comments for */
  taskId: string;
  /** Current user's ID for authorization */
  currentUserId?: string;
  /** Whether the current user owns the task */
  isTaskOwner?: boolean;
  /** Maximum height before scrolling */
  maxHeight?: string;
  /** Whether to show the add comment form */
  showForm?: boolean;
  /** Custom class name */
  className?: string;
}

export function CommentList({
  taskId,
  currentUserId,
  isTaskOwner = false,
  maxHeight = '400px',
  showForm = true,
  className,
}: CommentListProps) {
  const comments = useComments(taskId);
  const isLoading = useCommentsLoading();
  const isSubmitting = useCommentsSubmitting();
  const error = useCommentsError();

  const loadComments = useCommentsStore((state) => state.loadComments);
  const addComment = useCommentsStore((state) => state.addComment);
  const editComment = useCommentsStore((state) => state.editComment);
  const removeComment = useCommentsStore((state) => state.removeComment);
  const clearError = useCommentsStore((state) => state.clearError);

  // Load comments on mount
  useEffect(() => {
    loadComments(taskId);
  }, [taskId, loadComments]);

  // Handle add comment
  const handleAddComment = useCallback(
    async (text: string, tid: string) => {
      return addComment(text, tid);
    },
    [addComment]
  );

  // Handle edit comment
  const handleEditComment = useCallback(
    async (commentId: string, newText: string) => {
      return editComment(commentId, newText);
    },
    [editComment]
  );

  // Handle delete comment
  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      return removeComment(commentId, taskId);
    },
    [removeComment, taskId]
  );

  // Loading skeleton
  if (isLoading && comments.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-slate-200" />
              <div className="h-4 w-24 bg-slate-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Comments
          {comments.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
              {comments.length}
            </span>
          )}
        </h3>

        {/* Refresh button */}
        <button
          type="button"
          onClick={() => loadComments(taskId)}
          disabled={isLoading}
          className={cn(
            'p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Refresh comments"
        >
          <svg
            className={cn('w-4 h-4', isLoading && 'animate-spin')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm"
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
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="p-1 rounded hover:bg-rose-100 transition-colors"
            aria-label="Dismiss error"
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
      )}

      {/* Comments list */}
      <div
        className={cn('space-y-1 overflow-y-auto', maxHeight && `max-h-[${maxHeight}]`)}
        style={{ maxHeight }}
        role="list"
        aria-label="Comments"
      >
        {comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm font-medium">No comments yet</p>
            <p className="text-xs mt-1">Be the first to add a comment</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              isTaskOwner={isTaskOwner}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              isLoading={isSubmitting}
            />
          ))
        )}
      </div>

      {/* Divider */}
      {showForm && comments.length > 0 && <hr className="border-slate-200" />}

      {/* Add comment form */}
      {showForm && (
        <CommentForm
          taskId={taskId}
          onSubmit={handleAddComment}
          isLoading={isSubmitting}
          error={error}
          onClearError={clearError}
        />
      )}
    </div>
  );
}

export default CommentList;
