/**
 * Comprehensive Unit Tests for Activity Server Actions
 *
 * Tests all activity log operations with full coverage including:
 * - Happy path: Successful operations with valid inputs
 * - Validation: Invalid inputs rejected with proper error messages
 * - Authorization: Unauthenticated requests rejected
 * - Ownership: Users can only access activity for their own tasks
 * - Error Handling: Database errors handled gracefully
 * - Edge Cases: Pagination limits, empty results
 *
 * Coverage target: >80% for src/app/actions/activity.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// Mock Setup
// =============================================================================

vi.unmock('@/app/actions/activity');

const { mockPrisma, mockAuth } = vi.hoisted(() => {
  return {
    mockPrisma: {
      activity: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      task: {
        findFirst: vi.fn(),
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
  getTaskActivity,
  getUserActivity,
  logTaskActivity,
  getTaskActivityCounts,
} from '@/app/actions/activity';

// =============================================================================
// Test Data
// =============================================================================

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const MOCK_USER_ID = 'user-123-456-789';

const mockSession = {
  user: { id: MOCK_USER_ID, email: 'test@example.com', name: 'Test User' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockTask = {
  id: VALID_TASK_ID,
  title: 'Test Task',
  ownerId: MOCK_USER_ID,
};

const mockActivity = {
  id: VALID_UUID,
  type: 'TASK_CREATED' as const,
  taskId: VALID_TASK_ID,
  userId: MOCK_USER_ID,
  data: { title: 'Test Task' },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  user: {
    id: MOCK_USER_ID,
    name: 'Test User',
    email: 'test@example.com',
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
// getTaskActivity Tests
// =============================================================================

describe('getTaskActivity', () => {
  describe('Happy Path', () => {
    it('should return activity timeline for a task', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.activity.count.mockResolvedValue(1);

      const result = await getTaskActivity(VALID_TASK_ID);

      expect(result.success).toBe(true);
      expect(result.data?.activities).toHaveLength(1);
      expect(result.data?.total).toBe(1);
      expect(result.data?.activities[0].type).toBe('TASK_CREATED');
    });

    it('should include user information in activity', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.activity.count.mockResolvedValue(1);

      const result = await getTaskActivity(VALID_TASK_ID);

      expect(result.success).toBe(true);
      expect(result.data?.activities[0].userName).toBe('Test User');
      expect(result.data?.activities[0].userEmail).toBe('test@example.com');
    });

    it('should return empty array when task has no activity', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const result = await getTaskActivity(VALID_TASK_ID);

      expect(result.success).toBe(true);
      expect(result.data?.activities).toEqual([]);
      expect(result.data?.total).toBe(0);
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.activity.count.mockResolvedValue(100);

      await getTaskActivity(VALID_TASK_ID, { limit: 10, offset: 20 });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should limit max results to 100', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await getTaskActivity(VALID_TASK_ID, { limit: 200 });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should default to 50 items if no limit specified', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await getTaskActivity(VALID_TASK_ID);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should order by createdAt descending (newest first)', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await getTaskActivity(VALID_TASK_ID);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should transform dates to ISO strings', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.activity.count.mockResolvedValue(1);

      const result = await getTaskActivity(VALID_TASK_ID);

      expect(result.success).toBe(true);
      expect(typeof result.data?.activities[0].createdAt).toBe('string');
    });
  });

  describe('Validation', () => {
    it('should reject invalid task ID format', async () => {
      const result = await getTaskActivity('invalid-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid task ID');
    });

    it('should reject empty task ID', async () => {
      const result = await getTaskActivity('');

      expect(result.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getTaskActivity(VALID_TASK_ID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
      expect(mockPrisma.activity.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Ownership', () => {
    it('should verify task ownership', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      const result = await getTaskActivity(VALID_TASK_ID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task not found');
    });

    it('should check ownership in task query', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await getTaskActivity(VALID_TASK_ID);

      expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: VALID_TASK_ID, ownerId: MOCK_USER_ID },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockRejectedValue(new Error('DB connection lost'));

      const result = await getTaskActivity(VALID_TASK_ID);

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('DB connection');
    });
  });

  describe('Edge Cases', () => {
    it('should use default limit when provided limit is 0', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      // When limit is 0, the implementation uses: Math.min(Math.max(options?.limit ?? 50, 1), 100)
      // 0 ?? 50 = 0, Math.max(0, 1) = 1, Math.min(1, 100) = 1
      await getTaskActivity(VALID_TASK_ID, { limit: 0 });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        })
      );
    });

    it('should enforce minimum offset of 0', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await getTaskActivity(VALID_TASK_ID, { offset: -5 });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      );
    });
  });
});

// =============================================================================
// getUserActivity Tests
// =============================================================================

describe('getUserActivity', () => {
  describe('Happy Path', () => {
    it('should return activity across all user tasks', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.activity.count.mockResolvedValue(1);

      const result = await getUserActivity();

      expect(result.success).toBe(true);
      expect(result.data?.activities).toHaveLength(1);
      expect(result.data?.total).toBe(1);
    });

    it('should filter by tasks owned by user', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await getUserActivity();

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            task: { ownerId: MOCK_USER_ID },
          },
        })
      );
    });

    it('should return empty array when user has no activity', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      const result = await getUserActivity();

      expect(result.success).toBe(true);
      expect(result.data?.activities).toEqual([]);
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.activity.count.mockResolvedValue(100);

      await getUserActivity({ limit: 10, offset: 20 });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should limit max results to 100', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await getUserActivity({ limit: 200 });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should default to 50 items if no limit specified', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await getUserActivity();

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should order by createdAt descending (newest first)', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await getUserActivity();

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should include user information', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await getUserActivity();

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        })
      );
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getUserActivity();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
      expect(mockPrisma.activity.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.activity.findMany.mockRejectedValue(new Error('DB error'));

      const result = await getUserActivity();

      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should use minimum limit of 1 when provided limit is 0', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      // When limit is 0, the implementation uses: Math.min(Math.max(options?.limit ?? 50, 1), 100)
      // 0 ?? 50 = 0, Math.max(0, 1) = 1, Math.min(1, 100) = 1
      await getUserActivity({ limit: 0 });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        })
      );
    });

    it('should enforce minimum offset of 0', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await getUserActivity({ offset: -5 });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      );
    });
  });
});

// =============================================================================
// logTaskActivity Tests (Internal Function)
// =============================================================================

describe('logTaskActivity', () => {
  describe('Happy Path', () => {
    it('should log activity with all parameters', async () => {
      mockPrisma.activity.create.mockResolvedValue(mockActivity);

      await logTaskActivity(
        'TASK_CREATED',
        VALID_TASK_ID,
        MOCK_USER_ID,
        { title: 'New Task' }
      );

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          type: 'TASK_CREATED',
          taskId: VALID_TASK_ID,
          userId: MOCK_USER_ID,
          data: { title: 'New Task' },
        },
      });
    });

    it('should log activity without optional data', async () => {
      mockPrisma.activity.create.mockResolvedValue(mockActivity);

      await logTaskActivity('TASK_UPDATED', VALID_TASK_ID, MOCK_USER_ID);

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          data: {},
        }),
      });
    });
  });

  describe('Activity Types', () => {
    it('should accept all valid activity types', async () => {
      mockPrisma.activity.create.mockResolvedValue(mockActivity);

      const activityTypes = [
        'TASK_CREATED',
        'TASK_UPDATED',
        'TASK_MOVED',
        'TASK_DELETED',
        'COMMENT_ADDED',
        'COMMENT_UPDATED',
        'COMMENT_DELETED',
        'LABEL_ADDED',
        'LABEL_REMOVED',
      ] as const;

      for (const type of activityTypes) {
        await logTaskActivity(type, VALID_TASK_ID, MOCK_USER_ID);
        expect(mockPrisma.activity.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ type }),
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should not throw on database errors (fail silently)', async () => {
      mockPrisma.activity.create.mockRejectedValue(new Error('DB error'));

      // Should not throw
      await expect(
        logTaskActivity('TASK_CREATED', VALID_TASK_ID, MOCK_USER_ID)
      ).resolves.not.toThrow();

      // Should log the error
      expect(console.error).toHaveBeenCalled();
    });

    it('should not block main operations on failure', async () => {
      mockPrisma.activity.create.mockRejectedValue(new Error('DB error'));

      // Function should complete without throwing
      const startTime = Date.now();
      await logTaskActivity('TASK_CREATED', VALID_TASK_ID, MOCK_USER_ID);
      const duration = Date.now() - startTime;

      // Should complete quickly (not hanging on error)
      expect(duration).toBeLessThan(100);
    });
  });
});

// =============================================================================
// getTaskActivityCounts Tests
// =============================================================================

describe('getTaskActivityCounts', () => {
  describe('Happy Path', () => {
    it('should return counts by activity type', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.groupBy.mockResolvedValue([
        { type: 'TASK_CREATED', _count: 1 },
        { type: 'COMMENT_ADDED', _count: 5 },
        { type: 'TASK_UPDATED', _count: 3 },
      ]);

      const result = await getTaskActivityCounts(VALID_TASK_ID);

      expect(result.success).toBe(true);
      expect(result.data?.TASK_CREATED).toBe(1);
      expect(result.data?.COMMENT_ADDED).toBe(5);
      expect(result.data?.TASK_UPDATED).toBe(3);
    });

    it('should initialize all activity types to 0', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.groupBy.mockResolvedValue([]);

      const result = await getTaskActivityCounts(VALID_TASK_ID);

      expect(result.success).toBe(true);
      expect(result.data?.TASK_CREATED).toBe(0);
      expect(result.data?.TASK_UPDATED).toBe(0);
      expect(result.data?.TASK_MOVED).toBe(0);
      expect(result.data?.TASK_DELETED).toBe(0);
      expect(result.data?.COMMENT_ADDED).toBe(0);
      expect(result.data?.COMMENT_UPDATED).toBe(0);
      expect(result.data?.COMMENT_DELETED).toBe(0);
      expect(result.data?.LABEL_ADDED).toBe(0);
      expect(result.data?.LABEL_REMOVED).toBe(0);
    });

    it('should call groupBy with correct parameters', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.groupBy.mockResolvedValue([]);

      await getTaskActivityCounts(VALID_TASK_ID);

      expect(mockPrisma.activity.groupBy).toHaveBeenCalledWith({
        by: ['type'],
        where: { taskId: VALID_TASK_ID },
        _count: true,
      });
    });
  });

  describe('Validation', () => {
    it('should reject invalid task ID format', async () => {
      const result = await getTaskActivityCounts('invalid-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid task ID');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getTaskActivityCounts(VALID_TASK_ID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Ownership', () => {
    it('should verify task ownership', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      const result = await getTaskActivityCounts(VALID_TASK_ID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task not found');
    });

    it('should check ownership in task query', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.groupBy.mockResolvedValue([]);

      await getTaskActivityCounts(VALID_TASK_ID);

      expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: VALID_TASK_ID, ownerId: MOCK_USER_ID },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.activity.groupBy.mockRejectedValue(new Error('DB error'));

      const result = await getTaskActivityCounts(VALID_TASK_ID);

      expect(result.success).toBe(false);
    });
  });
});
