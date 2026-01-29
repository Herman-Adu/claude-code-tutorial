/**
 * Comments Feature Module
 *
 * This module exports all components and hooks related to the comments feature.
 * Using a barrel export pattern for cleaner imports.
 *
 * @example
 * ```tsx
 * import { CommentList, useComments } from '@/features/comments';
 *
 * function TaskComments({ taskId }) {
 *   const { comments, addComment } = useComments(taskId);
 *   return <CommentList taskId={taskId} />;
 * }
 * ```
 */

// Components
export { CommentList } from './components/CommentList';
export { CommentForm } from './components/CommentForm';
export { CommentItem } from './components/CommentItem';

// Hooks (recommended usage)
export { useComments, type UseCommentsOptions, type UseCommentsReturn } from './hooks/useComments';

// Re-export store types and store for direct access if needed
export type { StoreComment } from '@/store/comments';
export { useCommentsStore } from '@/store/comments';
