'use client';

/**
 * CommentItem Component
 *
 * Displays a single comment with author information, timestamp,
 * and edit/delete actions for authorized users.
 *
 * Features:
 * - Author badge with name/email
 * - Timestamp with "edited" indicator
 * - Edit mode with inline editing
 * - Delete button with confirmation
 * - Optimistic update visual feedback
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { StoreComment } from '@/store/comments';

interface CommentItemProps {
  /** The comment to display */
  comment: StoreComment;
  /** Current user's ID for authorization */
  currentUserId?: string;
  /** Whether the current user owns the task */
  isTaskOwner?: boolean;
  /** Callback when edit is submitted */
  onEdit?: (commentId: string, newText: string) => Promise<boolean>;
  /** Callback when delete is confirmed */
  onDelete?: (commentId: string) => Promise<boolean>;
  /** Whether the comment is being processed */
  isLoading?: boolean;
}

/**
 * Formats a date string for display.
 * Shows relative time for recent comments, absolute date for older ones.
 */
function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Format as date for older comments
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function CommentItem({
  comment,
  currentUserId,
  isTaskOwner = false,
  onEdit,
  onDelete,
  isLoading = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAuthor = currentUserId === comment.authorId;
  const canEdit = isAuthor && onEdit;
  const canDelete = (isAuthor || isTaskOwner) && onDelete;
  const isOptimistic = comment._isOptimistic;

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [isEditing, editText.length]);

  // Reset edit text when comment changes
  useEffect(() => {
    setEditText(comment.text);
  }, [comment.text]);

  const handleEditSubmit = useCallback(async () => {
    if (!onEdit || editText.trim() === comment.text || !editText.trim()) {
      setIsEditing(false);
      setEditText(comment.text);
      return;
    }

    const success = await onEdit(comment.id, editText.trim());
    if (success) {
      setIsEditing(false);
    }
  }, [comment.id, comment.text, editText, onEdit]);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditText(comment.text);
  }, [comment.text]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await onDelete(comment.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  }, [comment.id, onDelete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleEditSubmit();
      } else if (e.key === 'Escape') {
        handleEditCancel();
      }
    },
    [handleEditSubmit, handleEditCancel]
  );

  const authorDisplay = comment.authorName || comment.authorEmail || 'Unknown';
  const timestamp = formatTimestamp(comment.createdAt);
  const wasEdited = comment.editedAt !== null;

  return (
    <div
      className={cn(
        'group relative p-3 rounded-lg transition-colors',
        isOptimistic && 'opacity-70',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
      aria-busy={isLoading || isDeleting}
    >
      {/* Author and timestamp header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Author avatar placeholder */}
          <div
            className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <span className="text-xs font-medium text-white">
              {authorDisplay.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Author name */}
          <span className="font-medium text-sm text-slate-700 truncate" title={authorDisplay}>
            {authorDisplay}
          </span>
          {/* You badge for current user */}
          {isAuthor && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-violet-100 text-violet-700">
              You
            </span>
          )}
        </div>

        {/* Timestamp and edit indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0">
          <time dateTime={comment.createdAt} title={new Date(comment.createdAt).toLocaleString()}>
            {timestamp}
          </time>
          {wasEdited && (
            <span
              className="text-slate-400"
              title={`Edited ${formatTimestamp(comment.editedAt!)}`}
            >
              (edited)
            </span>
          )}
        </div>
      </div>

      {/* Comment text or edit form */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full px-3 py-2 text-sm rounded-lg border resize-none',
              'bg-white border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200',
              'transition-colors'
            )}
            rows={3}
            maxLength={2000}
            aria-label="Edit comment"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{editText.length}/2000</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEditCancel}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  'bg-violet-600 text-white hover:bg-violet-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                disabled={isLoading || !editText.trim() || editText.trim() === comment.text}
              >
                Save
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Press Ctrl+Enter to save, Escape to cancel
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">{comment.text}</p>
      )}

      {/* Action buttons (visible on hover or focus) */}
      {!isEditing && (canEdit || canDelete) && (
        <div
          className={cn(
            'absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100',
            'transition-opacity'
          )}
        >
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-md bg-white/80 text-slate-500 hover:text-violet-600 hover:bg-violet-50 border border-slate-200 transition-colors"
              aria-label="Edit comment"
              disabled={isLoading}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-md bg-white/80 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
              aria-label="Delete comment"
              disabled={isLoading}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4"
            role="alertdialog"
            aria-labelledby="delete-confirm-title"
            aria-describedby="delete-confirm-desc"
          >
            <h3 id="delete-confirm-title" className="text-lg font-semibold text-slate-800 mb-2">
              Delete Comment
            </h3>
            <p id="delete-confirm-desc" className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  'bg-rose-600 text-white hover:bg-rose-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommentItem;
