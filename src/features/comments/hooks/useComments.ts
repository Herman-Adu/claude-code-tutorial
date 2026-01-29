/**
 * useComments Feature Hook
 *
 * Wraps the comments store with feature-specific logic and provides
 * a convenient API for comment operations.
 */

import { useCallback, useEffect } from 'react';
import {
  useCommentsStore,
  useComments as useCommentsFromStore,
  useCommentCount,
  useCommentsLoading,
  useCommentsSubmitting,
  useCommentsError,
  type StoreComment,
} from '@/store/comments';

export interface UseCommentsOptions {
  /** Whether to auto-load comments on mount */
  autoLoad?: boolean;
}

export interface UseCommentsReturn {
  /** Array of comments for the task */
  comments: StoreComment[];
  /** Total comment count */
  count: number;
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Whether a mutation is in progress */
  isSubmitting: boolean;
  /** Current error message if any */
  error: string | null;

  // Actions
  /** Reload comments from server */
  loadComments: () => Promise<boolean>;
  /** Add a new comment */
  addComment: (text: string) => Promise<string | null>;
  /** Edit an existing comment */
  editComment: (commentId: string, newText: string) => Promise<boolean>;
  /** Delete a comment */
  deleteComment: (commentId: string) => Promise<boolean>;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * Hook for managing comments on a specific task.
 *
 * @param taskId - The task ID to manage comments for
 * @param options - Optional configuration
 * @returns Comment state and actions
 *
 * @example
 * ```tsx
 * function TaskComments({ taskId }) {
 *   const {
 *     comments,
 *     isLoading,
 *     addComment,
 *     deleteComment
 *   } = useComments(taskId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       {comments.map(c => <Comment key={c.id} {...c} />)}
 *       <CommentForm onSubmit={(text) => addComment(text)} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useComments(
  taskId: string,
  options: UseCommentsOptions = {}
): UseCommentsReturn {
  const { autoLoad = true } = options;

  // Store state
  const comments = useCommentsFromStore(taskId);
  const count = useCommentCount(taskId);
  const isLoading = useCommentsLoading();
  const isSubmitting = useCommentsSubmitting();
  const error = useCommentsError();

  // Store actions
  const storeLoadComments = useCommentsStore((state) => state.loadComments);
  const storeAddComment = useCommentsStore((state) => state.addComment);
  const storeEditComment = useCommentsStore((state) => state.editComment);
  const storeRemoveComment = useCommentsStore((state) => state.removeComment);
  const storeClearError = useCommentsStore((state) => state.clearError);

  // Wrapped actions with taskId pre-bound
  const loadComments = useCallback(() => {
    return storeLoadComments(taskId);
  }, [taskId, storeLoadComments]);

  const addComment = useCallback(
    (text: string) => {
      return storeAddComment(text, taskId);
    },
    [taskId, storeAddComment]
  );

  const editComment = useCallback(
    (commentId: string, newText: string) => {
      return storeEditComment(commentId, newText);
    },
    [storeEditComment]
  );

  const deleteComment = useCallback(
    (commentId: string) => {
      return storeRemoveComment(commentId, taskId);
    },
    [taskId, storeRemoveComment]
  );

  const clearError = useCallback(() => {
    storeClearError();
  }, [storeClearError]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadComments();
    }
  }, [autoLoad, loadComments]);

  return {
    comments,
    count,
    isLoading,
    isSubmitting,
    error,
    loadComments,
    addComment,
    editComment,
    deleteComment,
    clearError,
  };
}

export default useComments;
