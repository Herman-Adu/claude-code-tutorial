/**
 * Comments Store Tests
 *
 * Tests for the Zustand comments store including:
 * - Optimistic updates
 * - Rollback on failure
 * - State management
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock server actions
vi.mock('@/app/actions/comments', () => ({
  createComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
  getCommentsByTask: vi.fn(),
}));

// Import after mocks
import {
  useCommentsStore,
  useComments,
  useCommentCount,
  useCommentsLoading,
  useCommentsSubmitting,
  useCommentsError,
} from '@/store/comments';
import {
  createComment,
  updateComment,
  deleteComment,
  getCommentsByTask,
} from '@/app/actions/comments';

// =============================================================================
// Test Constants
// =============================================================================

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';

const mockComment = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  text: 'Test comment',
  taskId: TASK_ID,
  authorId: '550e8400-e29b-41d4-a716-446655440002',
  authorName: 'Test User',
  authorEmail: 'test@example.com',
  createdAt: '2025-01-15T10:00:00.000Z',
  updatedAt: '2025-01-15T10:00:00.000Z',
  editedAt: null,
};

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  // Reset store state
  useCommentsStore.setState({
    commentsByTask: new Map(),
    selectedTaskId: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
  });
});

// =============================================================================
// Store State Tests
// =============================================================================

describe('Comments Store State', () => {
  it('should have correct initial state', () => {
    const state = useCommentsStore.getState();

    expect(state.commentsByTask.size).toBe(0);
    expect(state.selectedTaskId).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.isSubmitting).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set selected task ID', () => {
    const { setSelectedTaskId } = useCommentsStore.getState();

    act(() => {
      setSelectedTaskId(TASK_ID);
    });

    expect(useCommentsStore.getState().selectedTaskId).toBe(TASK_ID);
  });

  it('should set and clear error', () => {
    const { setError, clearError } = useCommentsStore.getState();

    act(() => {
      setError('Test error');
    });

    expect(useCommentsStore.getState().error).toBe('Test error');

    act(() => {
      clearError();
    });

    expect(useCommentsStore.getState().error).toBeNull();
  });
});

// =============================================================================
// Load Comments Tests
// =============================================================================

describe('Load Comments', () => {
  it('should load comments successfully', async () => {
    (getCommentsByTask as Mock).mockResolvedValue({
      success: true,
      data: {
        comments: [mockComment],
        total: 1,
      },
    });

    const { loadComments, getCommentsByTask: getCommentsFromStore } =
      useCommentsStore.getState();

    await act(async () => {
      const success = await loadComments(TASK_ID);
      expect(success).toBe(true);
    });

    expect(getCommentsByTask).toHaveBeenCalledWith(TASK_ID);
    expect(getCommentsFromStore(TASK_ID)).toHaveLength(1);
    expect(getCommentsFromStore(TASK_ID)[0].text).toBe('Test comment');
  });

  it('should handle load failure', async () => {
    (getCommentsByTask as Mock).mockResolvedValue({
      success: false,
      error: 'Failed to load',
    });

    const { loadComments } = useCommentsStore.getState();

    await act(async () => {
      const success = await loadComments(TASK_ID);
      expect(success).toBe(false);
    });

    expect(useCommentsStore.getState().error).toBe('Failed to load');
  });

  it('should set loading state during load', async () => {
    let resolvePromise: (value: unknown) => void;
    (getCommentsByTask as Mock).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { loadComments } = useCommentsStore.getState();

    const loadPromise = loadComments(TASK_ID);

    // Check loading state is true
    expect(useCommentsStore.getState().isLoading).toBe(true);

    // Resolve the promise
    resolvePromise!({
      success: true,
      data: { comments: [], total: 0 },
    });

    await loadPromise;

    // Check loading state is false
    expect(useCommentsStore.getState().isLoading).toBe(false);
  });
});

// =============================================================================
// Add Comment Tests (Optimistic Updates)
// =============================================================================

describe('Add Comment (Optimistic Updates)', () => {
  it('should add comment optimistically', async () => {
    (createComment as Mock).mockResolvedValue({
      success: true,
      data: mockComment,
    });

    const { addComment, getCommentsByTask: getCommentsFromStore } =
      useCommentsStore.getState();

    // Start adding - optimistic update should happen immediately
    const addPromise = addComment('Test comment', TASK_ID);

    // Check optimistic comment is added
    const comments = getCommentsFromStore(TASK_ID);
    expect(comments.length).toBe(1);
    expect(comments[0].text).toBe('Test comment');
    expect(comments[0].id).toMatch(/^temp-/); // Temp ID

    // Wait for server response
    const result = await addPromise;

    // Check final state has server comment
    const finalComments = useCommentsStore.getState().getCommentsByTask(TASK_ID);
    expect(finalComments.length).toBe(1);
    expect(finalComments[0].id).toBe(mockComment.id); // Server ID
    expect(result).toBe(mockComment.id);
  });

  it('should rollback on add failure', async () => {
    (createComment as Mock).mockResolvedValue({
      success: false,
      error: 'Server error',
    });

    const { addComment, getCommentsByTask: getCommentsFromStore } =
      useCommentsStore.getState();

    await act(async () => {
      const result = await addComment('Test comment', TASK_ID);
      expect(result).toBeNull();
    });

    // Check comment was rolled back
    expect(getCommentsFromStore(TASK_ID)).toHaveLength(0);
    expect(useCommentsStore.getState().error).toBe('Server error');
  });
});

// =============================================================================
// Edit Comment Tests (Optimistic Updates)
// =============================================================================

describe('Edit Comment (Optimistic Updates)', () => {
  beforeEach(() => {
    // Pre-populate with a comment
    useCommentsStore.setState({
      commentsByTask: new Map([[TASK_ID, [{ ...mockComment, _isOptimistic: false }]]]),
    });
  });

  it('should edit comment optimistically', async () => {
    (updateComment as Mock).mockResolvedValue({
      success: true,
      data: { ...mockComment, text: 'Updated comment', editedAt: new Date().toISOString() },
    });

    const { editComment, getCommentsByTask: getCommentsFromStore } =
      useCommentsStore.getState();

    // Start editing - optimistic update
    const editPromise = editComment(mockComment.id, 'Updated comment');

    // Check optimistic update
    const comments = getCommentsFromStore(TASK_ID);
    expect(comments[0].text).toBe('Updated comment');

    await editPromise;

    // Verify final state
    const finalComments = useCommentsStore.getState().getCommentsByTask(TASK_ID);
    expect(finalComments[0].text).toBe('Updated comment');
    expect(finalComments[0].editedAt).toBeTruthy();
  });

  it('should rollback on edit failure', async () => {
    (updateComment as Mock).mockResolvedValue({
      success: false,
      error: 'Update failed',
    });

    const { editComment, getCommentsByTask: getCommentsFromStore } =
      useCommentsStore.getState();

    await act(async () => {
      const result = await editComment(mockComment.id, 'Updated comment');
      expect(result).toBe(false);
    });

    // Check text was rolled back
    expect(getCommentsFromStore(TASK_ID)[0].text).toBe('Test comment');
    expect(useCommentsStore.getState().error).toBe('Update failed');
  });

  it('should return false if comment not found', async () => {
    const { editComment } = useCommentsStore.getState();

    await act(async () => {
      const result = await editComment('non-existent-id', 'Updated');
      expect(result).toBe(false);
    });

    expect(useCommentsStore.getState().error).toBe('Comment not found');
  });
});

// =============================================================================
// Delete Comment Tests (Optimistic Updates)
// =============================================================================

describe('Delete Comment (Optimistic Updates)', () => {
  beforeEach(() => {
    // Pre-populate with a comment
    useCommentsStore.setState({
      commentsByTask: new Map([[TASK_ID, [{ ...mockComment }]]]),
    });
  });

  it('should delete comment optimistically', async () => {
    (deleteComment as Mock).mockResolvedValue({
      success: true,
    });

    const { removeComment, getCommentsByTask: getCommentsFromStore } =
      useCommentsStore.getState();

    // Start deleting - optimistic update
    const deletePromise = removeComment(mockComment.id, TASK_ID);

    // Check optimistic deletion
    expect(getCommentsFromStore(TASK_ID)).toHaveLength(0);

    await deletePromise;

    // Verify final state
    expect(useCommentsStore.getState().getCommentsByTask(TASK_ID)).toHaveLength(0);
  });

  it('should rollback on delete failure', async () => {
    (deleteComment as Mock).mockResolvedValue({
      success: false,
      error: 'Delete failed',
    });

    const { removeComment, getCommentsByTask: getCommentsFromStore } =
      useCommentsStore.getState();

    await act(async () => {
      const result = await removeComment(mockComment.id, TASK_ID);
      expect(result).toBe(false);
    });

    // Check comment was restored
    expect(getCommentsFromStore(TASK_ID)).toHaveLength(1);
    expect(useCommentsStore.getState().error).toBe('Delete failed');
  });
});

// =============================================================================
// Selector Hooks Tests
// =============================================================================

describe('Selector Hooks', () => {
  beforeEach(() => {
    useCommentsStore.setState({
      commentsByTask: new Map([[TASK_ID, [mockComment]]]),
      isLoading: false,
      isSubmitting: true,
      error: 'Test error',
    });
  });

  it('useComments should return comments for task', () => {
    const { result } = renderHook(() => useComments(TASK_ID));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].text).toBe('Test comment');
  });

  it('useCommentCount should return count', () => {
    const { result } = renderHook(() => useCommentCount(TASK_ID));
    expect(result.current).toBe(1);
  });

  it('useCommentsLoading should return loading state', () => {
    const { result } = renderHook(() => useCommentsLoading());
    expect(result.current).toBe(false);
  });

  it('useCommentsSubmitting should return submitting state', () => {
    const { result } = renderHook(() => useCommentsSubmitting());
    expect(result.current).toBe(true);
  });

  it('useCommentsError should return error', () => {
    const { result } = renderHook(() => useCommentsError());
    expect(result.current).toBe('Test error');
  });
});
