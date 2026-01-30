/**
 * Comprehensive Unit Tests for Notification Server Actions
 *
 * Tests all notification CRUD operations with full coverage including:
 * - Happy path: Successful operations with valid inputs
 * - Validation: Invalid inputs rejected with proper error messages
 * - Authorization: Unauthenticated requests rejected
 * - Ownership: Users can only access their own notifications
 * - Error Handling: Database errors handled gracefully
 * - Edge Cases: Pagination limits, empty results
 *
 * Coverage target: >80% for src/app/actions/notifications.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// Mock Setup
// =============================================================================

vi.unmock('@/app/actions/notifications');

const { mockPrisma, mockAuth } = vi.hoisted(() => {
  return {
    mockPrisma: {
      notification: {
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
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

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
} from '@/app/actions/notifications';

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

const mockNotification = {
  id: VALID_UUID,
  userId: MOCK_USER_ID,
  eventType: 'COMMENT_ADDED_TO_TASK' as const,
  taskId: VALID_TASK_ID,
  isRead: false,
  readAt: null,
  title: 'New Comment',
  message: 'Someone commented on your task',
  data: { commentId: 'comment-123' },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockReadNotification = {
  ...mockNotification,
  isRead: true,
  readAt: new Date('2026-01-02T00:00:00.000Z'),
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
// getNotifications Tests
// =============================================================================

describe('getNotifications', () => {
  describe('Happy Path', () => {
    it('should return all notifications for user', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await getNotifications();

      expect(result.success).toBe(true);
      expect(result.data?.notifications).toHaveLength(1);
      expect(result.data?.total).toBe(1);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: MOCK_USER_ID },
        })
      );
    });

    it('should return only unread notifications when filter applied', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);
      mockPrisma.notification.count.mockResolvedValue(1);

      await getNotifications({ unreadOnly: true });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: MOCK_USER_ID, isRead: false },
        })
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);
      mockPrisma.notification.count.mockResolvedValue(100);

      await getNotifications({ limit: 10, offset: 20 });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should limit max results to 100', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await getNotifications({ limit: 200 });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should default to 50 items if no limit specified', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await getNotifications();

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should order by createdAt descending (newest first)', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await getNotifications();

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should return empty array when user has no notifications', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      const result = await getNotifications();

      expect(result.success).toBe(true);
      expect(result.data?.notifications).toEqual([]);
      expect(result.data?.total).toBe(0);
    });

    it('should transform notification dates to ISO strings', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await getNotifications();

      expect(result.success).toBe(true);
      expect(typeof result.data?.notifications[0].createdAt).toBe('string');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getNotifications();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
      expect(mockPrisma.notification.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.notification.findMany.mockRejectedValue(
        new Error('DB connection lost')
      );

      const result = await getNotifications();

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('DB connection');
    });
  });

  describe('Edge Cases', () => {
    it('should use default limit when provided limit is 0', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      // When limit is 0, Math.max(0, 1) = 1, but then Math.min(1, 100) = 1
      // The implementation uses: Math.min(Math.max(options?.limit || 50, 1), 100)
      // With limit = 0, 0 || 50 = 50, so we get 50
      await getNotifications({ limit: 0 });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // Default when 0 is falsy
        })
      );
    });

    it('should enforce minimum offset of 0', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await getNotifications({ offset: -5 });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      );
    });

    it('should use minimum limit of 1 when provided', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await getNotifications({ limit: 1 });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        })
      );
    });
  });
});

// =============================================================================
// getUnreadNotificationCount Tests
// =============================================================================

describe('getUnreadNotificationCount', () => {
  describe('Happy Path', () => {
    it('should return count of unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await getUnreadNotificationCount();

      expect(result.success).toBe(true);
      expect(result.data).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID, isRead: false },
      });
    });

    it('should return 0 when no unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(0);

      const result = await getUnreadNotificationCount();

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getUnreadNotificationCount();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.notification.count.mockRejectedValue(new Error('DB error'));

      const result = await getUnreadNotificationCount();

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// markNotificationAsRead Tests
// =============================================================================

describe('markNotificationAsRead', () => {
  describe('Happy Path', () => {
    it('should mark notification as read', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrisma.notification.update.mockResolvedValue(mockReadNotification);

      const result = await markNotificationAsRead(VALID_UUID);

      expect(result.success).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('should verify ownership before marking as read', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrisma.notification.update.mockResolvedValue(mockReadNotification);

      await markNotificationAsRead(VALID_UUID);

      expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: VALID_UUID, userId: MOCK_USER_ID },
      });
    });
  });

  describe('Validation', () => {
    it('should reject invalid notification ID format', async () => {
      const result = await markNotificationAsRead('invalid-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid notification ID');
    });

    it('should reject empty notification ID', async () => {
      const result = await markNotificationAsRead('');

      expect(result.success).toBe(false);
    });

    it('should reject non-UUID strings', async () => {
      const invalidIds = [
        'abc123',
        '550e8400-e29b-41d4-a716', // Too short
        '550e8400-e29b-41d4-a716-446655440000extra', // Too long
        '550e8400_e29b_41d4_a716_446655440000', // Wrong delimiter
      ];

      for (const id of invalidIds) {
        const result = await markNotificationAsRead(id);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await markNotificationAsRead(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Ownership', () => {
    it('should return error when notification not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      const result = await markNotificationAsRead(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Notification not found');
    });

    it('should return error when trying to mark another users notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null); // Ownership check fails

      const result = await markNotificationAsRead(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not found|permission/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrisma.notification.update.mockRejectedValue(new Error('DB error'));

      const result = await markNotificationAsRead(VALID_UUID);

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// markAllNotificationsAsRead Tests
// =============================================================================

describe('markAllNotificationsAsRead', () => {
  describe('Happy Path', () => {
    it('should mark all notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await markAllNotificationsAsRead();

      expect(result.success).toBe(true);
      expect(result.data).toContain('5');
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID, isRead: false },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('should return success even when no unread notifications', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await markAllNotificationsAsRead();

      expect(result.success).toBe(true);
      expect(result.data).toContain('0');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await markAllNotificationsAsRead();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.notification.updateMany.mockRejectedValue(new Error('DB error'));

      const result = await markAllNotificationsAsRead();

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// deleteNotification Tests
// =============================================================================

describe('deleteNotification', () => {
  describe('Happy Path', () => {
    it('should delete notification successfully', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrisma.notification.delete.mockResolvedValue(mockNotification);

      const result = await deleteNotification(VALID_UUID);

      expect(result.success).toBe(true);
      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
      });
    });
  });

  describe('Validation', () => {
    it('should reject invalid notification ID format', async () => {
      const result = await deleteNotification('invalid-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid notification ID');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await deleteNotification(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Ownership', () => {
    it('should verify ownership before deletion', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrisma.notification.delete.mockResolvedValue(mockNotification);

      await deleteNotification(VALID_UUID);

      expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: VALID_UUID, userId: MOCK_USER_ID },
      });
    });

    it('should return error when notification not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      const result = await deleteNotification(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Notification not found');
    });

    it('should return error when trying to delete another users notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      const result = await deleteNotification(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not found|permission/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrisma.notification.delete.mockRejectedValue(new Error('DB error'));

      const result = await deleteNotification(VALID_UUID);

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// createNotification Tests (Internal Function)
// =============================================================================

describe('createNotification', () => {
  describe('Happy Path', () => {
    it('should create notification with all parameters', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      await createNotification(
        MOCK_USER_ID,
        'COMMENT_ADDED_TO_TASK',
        'New Comment',
        'Someone commented on your task',
        VALID_TASK_ID,
        { commentId: 'comment-123' }
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: MOCK_USER_ID,
          eventType: 'COMMENT_ADDED_TO_TASK',
          title: 'New Comment',
          message: 'Someone commented on your task',
          taskId: VALID_TASK_ID,
          data: { commentId: 'comment-123' },
        },
      });
    });

    it('should create notification without optional parameters', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      await createNotification(
        MOCK_USER_ID,
        'TASK_MODIFIED',
        'Task Updated',
        'Your task was modified'
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: MOCK_USER_ID,
          eventType: 'TASK_MODIFIED',
          taskId: null,
          data: {},
        }),
      });
    });
  });

  describe('Input Sanitization', () => {
    it('should truncate title to 200 characters', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const longTitle = 'A'.repeat(250);
      await createNotification(
        MOCK_USER_ID,
        'TASK_MODIFIED',
        longTitle,
        'Message'
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'A'.repeat(200),
        }),
      });
    });

    it('should truncate message to 500 characters', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const longMessage = 'B'.repeat(600);
      await createNotification(
        MOCK_USER_ID,
        'TASK_MODIFIED',
        'Title',
        longMessage
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          message: 'B'.repeat(500),
        }),
      });
    });
  });

  describe('Error Handling', () => {
    it('should not throw on database errors (fail silently)', async () => {
      mockPrisma.notification.create.mockRejectedValue(new Error('DB error'));

      // Should not throw
      await expect(
        createNotification(MOCK_USER_ID, 'TASK_MODIFIED', 'Title', 'Message')
      ).resolves.not.toThrow();

      // Should log the error
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Event Types', () => {
    it('should accept all valid event types', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const eventTypes = [
        'COMMENT_ADDED_TO_TASK',
        'TASK_MOVED_TO_COMPLETED',
        'TASK_MODIFIED',
      ] as const;

      for (const eventType of eventTypes) {
        await createNotification(MOCK_USER_ID, eventType, 'Title', 'Message');
        expect(mockPrisma.notification.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ eventType }),
        });
      }
    });
  });
});
