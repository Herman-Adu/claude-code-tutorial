'use client';

/**
 * Comments Zustand Store
 *
 * This store manages comment state with optimistic updates.
 * It integrates with server actions for persistence to PostgreSQL.
 *
 * Key features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic rollback on server errors
 * - Loading and error state management
 * - Efficient selectors with shallow comparison
 * - DevTools integration for debugging
 * - Comments organized by task ID for efficient lookup
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import {
  type CommentResponse,
  type ActionResponse,
  createComment as createCommentAction,
  updateComment as updateCommentAction,
  deleteComment as deleteCommentAction,
  getCommentsByTask as getCommentsByTaskAction,
} from '@/app/actions/comments';

// ============================================================================
// Types
// ============================================================================

/**
 * Comment type used in the store.
 * Mirrors CommentResponse for consistency.
 */
export interface StoreComment {
  id: string;
  text: string;
  taskId: string;
  authorId: string;
  authorName: string | null;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  // Optimistic update flag
  _isOptimistic?: boolean;
}

/**
 * Comments store state interface.
 */
interface CommentsState {
  // Data - Map of taskId to comments array
  commentsByTask: Map<string, StoreComment[]>;

  // UI State
  selectedTaskId: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Data mutations
  loadComments: (taskId: string) => Promise<boolean>;
  addComment: (text: string, taskId: string) => Promise<string | null>;
  editComment: (commentId: string, text: string) => Promise<boolean>;
  removeComment: (commentId: string, taskId: string) => Promise<boolean>;

  // UI state setters
  setSelectedTaskId: (taskId: string | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearComments: (taskId: string) => void;

  // Selectors
  getCommentsByTask: (taskId: string) => StoreComment[];
  getCommentById: (taskId: string, commentId: string) => StoreComment | undefined;
  getCommentCount: (taskId: string) => number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a temporary ID for optimistic updates.
 */
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Transforms CommentResponse to StoreComment.
 */
function transformCommentResponse(comment: CommentResponse): StoreComment {
  return {
    id: comment.id,
    text: comment.text,
    taskId: comment.taskId,
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorEmail: comment.authorEmail,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    editedAt: comment.editedAt,
  };
}

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * Comments Zustand store with devtools middleware.
 *
 * Follows optimistic update pattern:
 * 1. Apply change immediately to state
 * 2. Make server request in background
 * 3. On success: update with server response
 * 4. On failure: rollback to previous state
 */
export const useCommentsStore = create<CommentsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      commentsByTask: new Map(),
      selectedTaskId: null,
      isLoading: false,
      isSubmitting: false,
      error: null,

      // ========================================================================
      // UI State Setters
      // ========================================================================

      setSelectedTaskId: (taskId) => {
        set({ selectedTaskId: taskId }, false, 'setSelectedTaskId');
      },

      setError: (error) => {
        set({ error }, false, 'setError');
      },

      clearError: () => {
        set({ error: null }, false, 'clearError');
      },

      clearComments: (taskId) => {
        set(
          (state) => {
            const newMap = new Map(state.commentsByTask);
            newMap.delete(taskId);
            return { commentsByTask: newMap };
          },
          false,
          'clearComments'
        );
      },

      // ========================================================================
      // Data Mutations
      // ========================================================================

      /**
       * Loads comments for a task from the server.
       * Returns true on success, false on failure.
       */
      loadComments: async (taskId) => {
        set({ isLoading: true, error: null }, false, 'loadComments/start');

        try {
          const result = await getCommentsByTaskAction(taskId);

          if (result.success && result.data) {
            set(
              (state) => {
                const newMap = new Map(state.commentsByTask);
                newMap.set(
                  taskId,
                  result.data!.comments.map(transformCommentResponse)
                );
                return { commentsByTask: newMap, isLoading: false };
              },
              false,
              'loadComments/success'
            );
            return true;
          } else {
            set(
              { isLoading: false, error: result.error || 'Failed to load comments' },
              false,
              'loadComments/error'
            );
            return false;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load comments';
          set({ isLoading: false, error: message }, false, 'loadComments/exception');
          return false;
        }
      },

      /**
       * Adds a new comment with optimistic update.
       * Returns the new comment ID on success, null on failure.
       */
      addComment: async (text, taskId) => {
        const tempId = generateTempId();
        const now = new Date().toISOString();
        const previousComments = get().commentsByTask.get(taskId) || [];

        // Create optimistic comment
        const optimisticComment: StoreComment = {
          id: tempId,
          text,
          taskId,
          authorId: '', // Will be filled by server
          authorName: 'You', // Placeholder for optimistic UI
          authorEmail: '',
          createdAt: now,
          updatedAt: now,
          editedAt: null,
          _isOptimistic: true,
        };

        // Apply optimistic update
        set(
          (state) => {
            const newMap = new Map(state.commentsByTask);
            newMap.set(taskId, [...previousComments, optimisticComment]);
            return { commentsByTask: newMap, isSubmitting: true, error: null };
          },
          false,
          'addComment/optimistic'
        );

        try {
          const result = await createCommentAction({ text, taskId });

          if (result.success && result.data) {
            // Replace optimistic comment with server response
            const serverComment = transformCommentResponse(result.data);
            set(
              (state) => {
                const newMap = new Map(state.commentsByTask);
                const comments = newMap.get(taskId) || [];
                newMap.set(
                  taskId,
                  comments.map((c) => (c.id === tempId ? serverComment : c))
                );
                return { commentsByTask: newMap, isSubmitting: false };
              },
              false,
              'addComment/success'
            );
            return serverComment.id;
          } else {
            // Rollback on failure
            set(
              (state) => {
                const newMap = new Map(state.commentsByTask);
                newMap.set(taskId, previousComments);
                return {
                  commentsByTask: newMap,
                  isSubmitting: false,
                  error: result.error || 'Failed to add comment',
                };
              },
              false,
              'addComment/rollback'
            );
            return null;
          }
        } catch (error) {
          // Rollback on exception
          const message = error instanceof Error ? error.message : 'Failed to add comment';
          set(
            (state) => {
              const newMap = new Map(state.commentsByTask);
              newMap.set(taskId, previousComments);
              return { commentsByTask: newMap, isSubmitting: false, error: message };
            },
            false,
            'addComment/exception'
          );
          return null;
        }
      },

      /**
       * Updates a comment with optimistic update.
       * Returns true on success, false on failure.
       */
      editComment: async (commentId, text) => {
        // Find the task containing this comment
        let taskId: string | null = null;
        let previousComments: StoreComment[] = [];

        for (const [tid, comments] of get().commentsByTask) {
          const found = comments.find((c) => c.id === commentId);
          if (found) {
            taskId = tid;
            previousComments = [...comments];
            break;
          }
        }

        if (!taskId) {
          set({ error: 'Comment not found' }, false, 'editComment/notFound');
          return false;
        }

        const now = new Date().toISOString();

        // Apply optimistic update
        set(
          (state) => {
            const newMap = new Map(state.commentsByTask);
            newMap.set(
              taskId!,
              previousComments.map((c) =>
                c.id === commentId
                  ? { ...c, text, updatedAt: now, editedAt: now }
                  : c
              )
            );
            return { commentsByTask: newMap, isSubmitting: true, error: null };
          },
          false,
          'editComment/optimistic'
        );

        try {
          const result = await updateCommentAction(commentId, { text });

          if (result.success && result.data) {
            // Update with server response
            const serverComment = transformCommentResponse(result.data);
            set(
              (state) => {
                const newMap = new Map(state.commentsByTask);
                const comments = newMap.get(taskId!) || [];
                newMap.set(
                  taskId!,
                  comments.map((c) => (c.id === commentId ? serverComment : c))
                );
                return { commentsByTask: newMap, isSubmitting: false };
              },
              false,
              'editComment/success'
            );
            return true;
          } else {
            // Rollback on failure
            set(
              (state) => {
                const newMap = new Map(state.commentsByTask);
                newMap.set(taskId!, previousComments);
                return {
                  commentsByTask: newMap,
                  isSubmitting: false,
                  error: result.error || 'Failed to update comment',
                };
              },
              false,
              'editComment/rollback'
            );
            return false;
          }
        } catch (error) {
          // Rollback on exception
          const message = error instanceof Error ? error.message : 'Failed to update comment';
          set(
            (state) => {
              const newMap = new Map(state.commentsByTask);
              newMap.set(taskId!, previousComments);
              return { commentsByTask: newMap, isSubmitting: false, error: message };
            },
            false,
            'editComment/exception'
          );
          return false;
        }
      },

      /**
       * Removes a comment with optimistic update.
       * Returns true on success, false on failure.
       */
      removeComment: async (commentId, taskId) => {
        const previousComments = get().commentsByTask.get(taskId) || [];

        if (!previousComments.some((c) => c.id === commentId)) {
          set({ error: 'Comment not found' }, false, 'removeComment/notFound');
          return false;
        }

        // Apply optimistic update
        set(
          (state) => {
            const newMap = new Map(state.commentsByTask);
            newMap.set(
              taskId,
              previousComments.filter((c) => c.id !== commentId)
            );
            return { commentsByTask: newMap, isSubmitting: true, error: null };
          },
          false,
          'removeComment/optimistic'
        );

        try {
          const result = await deleteCommentAction(commentId);

          if (result.success) {
            set({ isSubmitting: false }, false, 'removeComment/success');
            return true;
          } else {
            // Rollback on failure
            set(
              (state) => {
                const newMap = new Map(state.commentsByTask);
                newMap.set(taskId, previousComments);
                return {
                  commentsByTask: newMap,
                  isSubmitting: false,
                  error: result.error || 'Failed to delete comment',
                };
              },
              false,
              'removeComment/rollback'
            );
            return false;
          }
        } catch (error) {
          // Rollback on exception
          const message = error instanceof Error ? error.message : 'Failed to delete comment';
          set(
            (state) => {
              const newMap = new Map(state.commentsByTask);
              newMap.set(taskId, previousComments);
              return { commentsByTask: newMap, isSubmitting: false, error: message };
            },
            false,
            'removeComment/exception'
          );
          return false;
        }
      },

      // ========================================================================
      // Selectors
      // ========================================================================

      /**
       * Gets all comments for a specific task.
       */
      getCommentsByTask: (taskId) => {
        return get().commentsByTask.get(taskId) || [];
      },

      /**
       * Gets a single comment by ID within a task.
       */
      getCommentById: (taskId, commentId) => {
        const comments = get().commentsByTask.get(taskId);
        return comments?.find((c) => c.id === commentId);
      },

      /**
       * Gets the comment count for a task.
       */
      getCommentCount: (taskId) => {
        return get().commentsByTask.get(taskId)?.length || 0;
      },
    }),
    {
      name: 'comments-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selector Hooks
// ============================================================================

/**
 * Hook to get comments for a specific task.
 * Uses shallow comparison for performance.
 */
export function useComments(taskId: string): StoreComment[] {
  return useCommentsStore(useShallow((state) => state.getCommentsByTask(taskId)));
}

/**
 * Hook to get comment count for a task.
 */
export function useCommentCount(taskId: string): number {
  return useCommentsStore((state) => state.getCommentCount(taskId));
}

/**
 * Hook to get loading state.
 */
export function useCommentsLoading(): boolean {
  return useCommentsStore((state) => state.isLoading);
}

/**
 * Hook to get submitting state (adding/editing/deleting).
 */
export function useCommentsSubmitting(): boolean {
  return useCommentsStore((state) => state.isSubmitting);
}

/**
 * Hook to get error state.
 */
export function useCommentsError(): string | null {
  return useCommentsStore((state) => state.error);
}

/**
 * Hook to get the selected task ID.
 */
export function useSelectedTaskId(): string | null {
  return useCommentsStore((state) => state.selectedTaskId);
}

/**
 * Hook to get comment actions.
 */
export function useCommentActions() {
  return useCommentsStore(
    useShallow((state) => ({
      loadComments: state.loadComments,
      addComment: state.addComment,
      editComment: state.editComment,
      removeComment: state.removeComment,
      setSelectedTaskId: state.setSelectedTaskId,
      clearError: state.clearError,
      clearComments: state.clearComments,
    }))
  );
}

/**
 * Hook to get all comments-related state for a task.
 */
export function useCommentsState(taskId: string) {
  return useCommentsStore(
    useShallow((state) => ({
      comments: state.getCommentsByTask(taskId),
      count: state.getCommentCount(taskId),
      isLoading: state.isLoading,
      isSubmitting: state.isSubmitting,
      error: state.error,
    }))
  );
}

// Export store for direct access (useful for testing and devtools)
export default useCommentsStore;
