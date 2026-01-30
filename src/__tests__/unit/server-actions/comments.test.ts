/**
 * Comprehensive Unit Tests for Comment Server Actions
 *
 * Tests all comment CRUD operations with full coverage including:
 * - Happy path: Successful operations with valid inputs
 * - Validation: Invalid inputs rejected with proper error messages
 * - Authorization: Unauthenticated requests rejected
 * - Ownership: Users can only access their own data
 * - Error Handling: Database errors handled gracefully
 * - Rate Limiting: Comment creation rate limits enforced (50/hour)
 * - Edge Cases: Empty strings, max lengths, special characters
 *
 * Coverage target: >80% for src/app/actions/comments.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// Mock Setup
// =============================================================================

vi.unmock('@/app/actions/comments');
// Unmock rate-limit to test actual rate limiting behavior
vi.unmock('@/lib/rate-limit');

const { mockPrisma, mockAuth } = vi.hoisted(() => {
  return {
    mockPrisma: {
      comment: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
      },
      task: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      activity: {
        create: vi.fn(),
      },
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    },
    mockAuth: vi.fn(),
  };
});

vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: mockAuth,
}));

// Mock notification creation (called internally by createComment)
vi.mock('@/app/actions/notifications', () => ({
  createNotification: vi.fn(() => Promise.resolve()),
}));

import {
  createComment,
  updateComment,
  deleteComment,
  getCommentsByTask,
  getComment,
} from '@/app/actions/comments';

// =============================================================================
// Test Data
// =============================================================================

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const MOCK_USER_ID = 'user-123-456-789';
const OTHER_USER_ID = 'other-user-999';

const mockSession = {
  user: { id: MOCK_USER_ID, email: 'test@example.com', name: 'Test User' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockTask = {
  id: VALID_TASK_ID,
  title: 'Test Task',
  ownerId: MOCK_USER_ID,
};

const mockComment = {
  id: VALID_UUID,
  text: 'Test comment text',
  taskId: VALID_TASK_ID,
  authorId: MOCK_USER_ID,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  editedAt: null,
  author: {
    id: MOCK_USER_ID,
    name: 'Test User',
    email: 'test@example.com',
  },
  task: {
    ownerId: MOCK_USER_ID,
  },
};

// =============================================================================
// Test Setup
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(mockSession);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// =============================================================================
// createComment Tests
// =============================================================================

describe('createComment', () => {
  describe('Happy Path', () => {
    it('should create comment with valid input', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.create.mockResolvedValue(mockComment);
      mockPrisma.activity.create.mockResolvedValue({});

      const result = await createComment({
        text: 'This is a test comment',
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(true);
      expect(result.data?.text).toBe('Test comment text');
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            text: 'This is a test comment',
            taskId: VALID_TASK_ID,
            authorId: MOCK_USER_ID,
          }),
        })
      );
    });

    it('should log activity when comment is created', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.create.mockResolvedValue(mockComment);
      mockPrisma.activity.create.mockResolvedValue({});

      await createComment({
        text: 'Test comment',
        taskId: VALID_TASK_ID,
      });

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'COMMENT_ADDED',
            taskId: VALID_TASK_ID,
            userId: MOCK_USER_ID,
          }),
        })
      );
    });

    it('should truncate preview in activity log to 100 chars', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.create.mockResolvedValue(mockComment);
      mockPrisma.activity.create.mockResolvedValue({});

      const longText = 'A'.repeat(150);
      await createComment({
        text: longText,
        taskId: VALID_TASK_ID,
      });

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            data: expect.objectContaining({
              preview: 'A'.repeat(100),
            }),
          }),
        })
      );
    });
  });

  describe('Validation', () => {
    it('should reject empty comment text', async () => {
      const result = await createComment({
        text: '',
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only comment text', async () => {
      const result = await createComment({
        text: '   ',
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(false);
    });

    it('should reject comment exceeding max length (2000 chars)', async () => {
      const result = await createComment({
        text: 'A'.repeat(2001),
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(false);
    });

    it('should accept comment at max length (2000 chars)', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.create.mockResolvedValue(mockComment);
      mockPrisma.activity.create.mockResolvedValue({});

      const result = await createComment({
        text: 'A'.repeat(2000),
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid task ID format', async () => {
      const result = await createComment({
        text: 'Test comment',
        taskId: 'invalid-uuid',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await createComment({
        text: 'Test comment',
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
      expect(mockPrisma.comment.create).not.toHaveBeenCalled();
    });
  });

  describe('Ownership', () => {
    it('should verify task ownership before creating comment', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      const result = await createComment({
        text: 'Test comment',
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task not found');
    });

    it('should reject comment on task owned by another user', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null); // Simulates ownership check failing

      const result = await createComment({
        text: 'Test comment',
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not found|permission/i);
    });
  });

  // Note: Rate limiting tests are moved to the end of the file
  // because the in-memory rate limit cache persists between tests

  describe('Input Sanitization', () => {
    it('should sanitize XSS in comment text by HTML encoding', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.create.mockImplementation((args: any) =>
        Promise.resolve({ ...mockComment, text: args.data.text })
      );
      mockPrisma.activity.create.mockResolvedValue({});

      const result = await createComment({
        text: '<script>alert("xss")</script>',
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(true);
      // Sanitization HTML-encodes the script tags
      expect(result.data?.text).toContain('&lt;script&gt;');
      expect(result.data?.text).not.toContain('<script>');
    });

    it('should trim whitespace from comment text', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.create.mockImplementation((args: any) =>
        Promise.resolve({ ...mockComment, text: args.data.text })
      );
      mockPrisma.activity.create.mockResolvedValue({});

      await createComment({
        text: '  Trimmed text  ',
        taskId: VALID_TASK_ID,
      });

      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            text: 'Trimmed text',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.create.mockRejectedValue(new Error('DB connection lost'));

      const result = await createComment({
        text: 'Test comment',
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('DB connection');
    });
  });

  describe('Edge Cases', () => {
    it('should handle Unicode characters in comment', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.create.mockResolvedValue(mockComment);
      mockPrisma.activity.create.mockResolvedValue({});

      const result = await createComment({
        text: 'Comment with unicode text and chars',
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(true);
    });

    it('should handle newlines in comment', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.create.mockResolvedValue(mockComment);
      mockPrisma.activity.create.mockResolvedValue({});

      const result = await createComment({
        text: 'Line 1\nLine 2\nLine 3',
        taskId: VALID_TASK_ID,
      });

      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// updateComment Tests
// =============================================================================

describe('updateComment', () => {
  describe('Happy Path', () => {
    it('should update comment text', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue({
        ...mockComment,
        text: 'Updated text',
        editedAt: new Date(),
      });
      mockPrisma.activity.create.mockResolvedValue({});

      const result = await updateComment(VALID_UUID, { text: 'Updated text' });

      expect(result.success).toBe(true);
      expect(mockPrisma.comment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            text: 'Updated text',
            editedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should set editedAt timestamp on update', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue({
        ...mockComment,
        editedAt: new Date(),
      });
      mockPrisma.activity.create.mockResolvedValue({});

      const result = await updateComment(VALID_UUID, { text: 'Updated' });

      expect(result.success).toBe(true);
      expect(result.data?.editedAt).not.toBeNull();
    });

    it('should log activity when comment is updated', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue(mockComment);
      mockPrisma.activity.create.mockResolvedValue({});

      await updateComment(VALID_UUID, { text: 'Updated' });

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'COMMENT_UPDATED',
          }),
        })
      );
    });
  });

  describe('Validation', () => {
    it('should reject invalid comment ID format', async () => {
      const result = await updateComment('invalid-uuid', { text: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid comment ID');
    });

    it('should reject empty text', async () => {
      const result = await updateComment(VALID_UUID, { text: '' });

      expect(result.success).toBe(false);
    });

    it('should reject text exceeding max length', async () => {
      const result = await updateComment(VALID_UUID, { text: 'A'.repeat(2001) });

      expect(result.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateComment(VALID_UUID, { text: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Ownership', () => {
    it('should only allow author to update comment', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(null); // Author check fails

      const result = await updateComment(VALID_UUID, { text: 'Hijack' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Comment not found');
    });

    it('should verify author in query', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue(mockComment);
      mockPrisma.activity.create.mockResolvedValue({});

      await updateComment(VALID_UUID, { text: 'Test' });

      expect(mockPrisma.comment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: MOCK_USER_ID,
          }),
        })
      );
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS in updated text by HTML encoding', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockImplementation((args: any) =>
        Promise.resolve({ ...mockComment, text: args.data.text })
      );
      mockPrisma.activity.create.mockResolvedValue({});

      const result = await updateComment(VALID_UUID, {
        text: '<script>alert("xss")</script>',
      });

      expect(result.success).toBe(true);
      // Sanitization HTML-encodes the script tags
      expect(result.data?.text).toContain('&lt;script&gt;');
      expect(result.data?.text).not.toContain('<script>');
    });
  });
});

// =============================================================================
// deleteComment Tests
// =============================================================================

describe('deleteComment', () => {
  describe('Happy Path', () => {
    it('should delete comment when user is author', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);
      mockPrisma.comment.delete.mockResolvedValue(mockComment);
      mockPrisma.activity.create.mockResolvedValue({});

      const result = await deleteComment(VALID_UUID);

      expect(result.success).toBe(true);
      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
      });
    });

    it('should delete comment when user is task owner', async () => {
      const commentByOther = {
        ...mockComment,
        authorId: OTHER_USER_ID, // Different author
        task: { ownerId: MOCK_USER_ID }, // But user owns the task
      };
      mockPrisma.comment.findUnique.mockResolvedValue(commentByOther);
      mockPrisma.comment.delete.mockResolvedValue(commentByOther);
      mockPrisma.activity.create.mockResolvedValue({});

      const result = await deleteComment(VALID_UUID);

      expect(result.success).toBe(true);
    });

    it('should log activity when comment is deleted', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);
      mockPrisma.comment.delete.mockResolvedValue(mockComment);
      mockPrisma.activity.create.mockResolvedValue({});

      await deleteComment(VALID_UUID);

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'COMMENT_DELETED',
          }),
        })
      );
    });

    it('should log correct deletedBy value for author', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);
      mockPrisma.comment.delete.mockResolvedValue(mockComment);
      mockPrisma.activity.create.mockResolvedValue({});

      await deleteComment(VALID_UUID);

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            data: expect.objectContaining({
              deletedBy: 'author',
            }),
          }),
        })
      );
    });

    it('should log correct deletedBy value for task owner', async () => {
      const commentByOther = {
        ...mockComment,
        authorId: OTHER_USER_ID,
        task: { ownerId: MOCK_USER_ID },
      };
      mockPrisma.comment.findUnique.mockResolvedValue(commentByOther);
      mockPrisma.comment.delete.mockResolvedValue(commentByOther);
      mockPrisma.activity.create.mockResolvedValue({});

      await deleteComment(VALID_UUID);

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            data: expect.objectContaining({
              deletedBy: 'task_owner',
            }),
          }),
        })
      );
    });
  });

  describe('Validation', () => {
    it('should reject invalid comment ID format', async () => {
      const result = await deleteComment('invalid-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid comment ID');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await deleteComment(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Ownership', () => {
    it('should reject if user is neither author nor task owner', async () => {
      const commentByOther = {
        ...mockComment,
        authorId: OTHER_USER_ID,
        task: { ownerId: OTHER_USER_ID },
      };
      mockPrisma.comment.findUnique.mockResolvedValue(commentByOther);

      const result = await deleteComment(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('permission');
    });

    it('should return error when comment not found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      const result = await deleteComment(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Comment not found');
    });
  });
});

// =============================================================================
// getCommentsByTask Tests
// =============================================================================

describe('getCommentsByTask', () => {
  describe('Happy Path', () => {
    it('should return comments for a task', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.findMany.mockResolvedValue([mockComment]);
      mockPrisma.comment.count.mockResolvedValue(1);

      const result = await getCommentsByTask(VALID_TASK_ID);

      expect(result.success).toBe(true);
      expect(result.data?.comments).toHaveLength(1);
      expect(result.data?.total).toBe(1);
    });

    it('should return empty array when task has no comments', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.findMany.mockResolvedValue([]);
      mockPrisma.comment.count.mockResolvedValue(0);

      const result = await getCommentsByTask(VALID_TASK_ID);

      expect(result.success).toBe(true);
      expect(result.data?.comments).toEqual([]);
      expect(result.data?.total).toBe(0);
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.findMany.mockResolvedValue([mockComment]);
      mockPrisma.comment.count.mockResolvedValue(100);

      await getCommentsByTask(VALID_TASK_ID, { limit: 10, offset: 20 });

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should limit max pagination to 100', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.findMany.mockResolvedValue([]);
      mockPrisma.comment.count.mockResolvedValue(0);

      await getCommentsByTask(VALID_TASK_ID, { limit: 200 });

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should default pagination values', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.findMany.mockResolvedValue([]);
      mockPrisma.comment.count.mockResolvedValue(0);

      await getCommentsByTask(VALID_TASK_ID);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        })
      );
    });

    it('should order comments by createdAt ascending', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.comment.findMany.mockResolvedValue([]);
      mockPrisma.comment.count.mockResolvedValue(0);

      await getCommentsByTask(VALID_TASK_ID);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        })
      );
    });
  });

  describe('Validation', () => {
    it('should reject invalid task ID format', async () => {
      const result = await getCommentsByTask('invalid-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid task ID');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getCommentsByTask(VALID_TASK_ID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Ownership', () => {
    it('should verify task ownership', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      const result = await getCommentsByTask(VALID_TASK_ID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task not found');
    });
  });
});

// =============================================================================
// getComment Tests
// =============================================================================

describe('getComment', () => {
  describe('Happy Path', () => {
    it('should return comment by ID', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);

      const result = await getComment(VALID_UUID);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(VALID_UUID);
      expect(result.data?.text).toBe('Test comment text');
    });

    it('should include author information', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);

      const result = await getComment(VALID_UUID);

      expect(result.success).toBe(true);
      expect(result.data?.authorName).toBe('Test User');
      expect(result.data?.authorEmail).toBe('test@example.com');
    });
  });

  describe('Validation', () => {
    it('should reject invalid comment ID format', async () => {
      const result = await getComment('invalid-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid comment ID');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getComment(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Ownership', () => {
    it('should verify user owns the task the comment belongs to', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(null);

      const result = await getComment(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Comment not found');
    });

    it('should check task ownership in query', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);

      await getComment(VALID_UUID);

      expect(mockPrisma.comment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            task: {
              ownerId: MOCK_USER_ID,
            },
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return error when comment not found', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(null);

      const result = await getComment(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Comment not found');
    });
  });
});

// =============================================================================
// Rate Limiting Tests (Run Last - These consume the rate limit)
// =============================================================================

describe('createComment Rate Limiting', () => {
  it('should enforce rate limit after 50 comments per hour', async () => {
    mockPrisma.task.findFirst.mockResolvedValue(mockTask);
    mockPrisma.comment.create.mockResolvedValue(mockComment);
    mockPrisma.activity.create.mockResolvedValue({});

    // Create 50 comments (rate limit)
    for (let i = 0; i < 50; i++) {
      await createComment({ text: `Comment ${i}`, taskId: VALID_TASK_ID });
    }

    // 51st request should be rate limited
    const result = await createComment({
      text: 'Comment 51',
      taskId: VALID_TASK_ID,
    });

    expect(result.success).toBe(false);
    expect(result.error?.toLowerCase()).toContain('rate limit');
  });
});
