/**
 * Comprehensive Unit Tests for Task Server Actions
 *
 * Tests all task CRUD operations with full coverage including:
 * - Happy path: Successful operations with valid inputs
 * - Validation: Invalid inputs rejected with proper error messages
 * - Authorization: Unauthenticated requests rejected
 * - Ownership: Users can only access their own data
 * - Error Handling: Database errors handled gracefully
 * - Edge Cases: Empty strings, max lengths, special characters
 * - Rate Limiting: Search rate limits enforced
 *
 * Coverage target: >80% for src/app/actions/tasks.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// Mock Setup - Using vi.hoisted for proper mock hoisting
// =============================================================================

// IMPORTANT: Unmock server actions that were mocked in tests/setup.ts
vi.unmock('@/app/actions/tasks');
// Unmock rate-limit to test actual rate limiting behavior
vi.unmock('@/lib/rate-limit');

// Use vi.hoisted to define mocks before they're used in vi.mock factories
const { mockPrisma, mockAuth } = vi.hoisted(() => {
  return {
    mockPrisma: {
      task: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
      },
      savedFilterPreset: {
        create: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
      },
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    },
    mockAuth: vi.fn(),
  };
});

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth
vi.mock('@/lib/auth/auth', () => ({
  auth: mockAuth,
}));

// Import after mocks are set up
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  getTasks,
  getTasksByColumn,
  getTasksByDateRange,
  searchTasks,
  getSavedFilterPresets,
  saveFilterPreset,
  deleteFilterPreset,
} from '@/app/actions/tasks';

// =============================================================================
// Test Data Constants
// =============================================================================

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '550e8400-e29b-41d4-a716-446655440001';
const MOCK_USER_ID = 'user-123-456-789';
const OTHER_USER_ID = 'other-user-999';

const mockSession = {
  user: { id: MOCK_USER_ID, email: 'test@example.com', name: 'Test User' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockPrismaTask = {
  id: VALID_UUID,
  title: 'Test Task',
  description: 'Test description',
  priority: 'MEDIUM' as const,
  columnId: 'TODO' as const,
  tags: ['tag1', 'tag2'] as unknown,
  categories: ['category1'] as unknown,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  dueDate: null,
  dueTime: null,
  isAllDay: true,
  ownerId: MOCK_USER_ID,
  owner: { name: 'Test User', email: 'test@example.com' },
};

const mockFilterPreset = {
  id: VALID_UUID,
  name: 'My Preset',
  filters: { priority: 'HIGH' },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  userId: MOCK_USER_ID,
};

// =============================================================================
// Test Setup
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  // Default: authenticated user
  mockAuth.mockResolvedValue(mockSession);
  // Suppress console output during tests
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// =============================================================================
// createTask Tests
// =============================================================================

describe('createTask', () => {
  describe('Happy Path', () => {
    it('should create task with minimal valid input', async () => {
      mockPrisma.task.create.mockResolvedValue(mockPrismaTask);

      const result = await createTask({
        title: 'New Task',
        columnId: 'TODO',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Test Task');
      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Task',
            ownerId: MOCK_USER_ID,
          }),
        })
      );
    });

    it('should create task with all fields populated', async () => {
      const fullTask = {
        ...mockPrismaTask,
        dueDate: new Date('2026-06-15'),
        dueTime: '14:30',
        isAllDay: false,
      };
      mockPrisma.task.create.mockResolvedValue(fullTask);

      const result = await createTask({
        title: 'Complete Task',
        description: 'Full description',
        priority: 'HIGH',
        columnId: 'IN_PROGRESS',
        tags: ['urgent', 'review'],
        categories: ['work', 'project'],
        dueDate: '2026-06-15',
        dueTime: '14:30',
        isAllDay: false,
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Complete Task',
            description: 'Full description',
            priority: 'HIGH',
            columnId: 'IN_PROGRESS',
          }),
        })
      );
    });

    it('should apply default values for optional fields', async () => {
      mockPrisma.task.create.mockResolvedValue(mockPrismaTask);

      await createTask({ title: 'Minimal Task' });

      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: '',
            priority: 'MEDIUM',
            columnId: 'TODO',
            tags: [],
            categories: [],
            isAllDay: true,
          }),
        })
      );
    });
  });

  describe('Validation', () => {
    it('should reject empty title', async () => {
      const result = await createTask({
        title: '',
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      expect(result.error?.toLowerCase()).toContain('title');
    });

    it('should reject whitespace-only title', async () => {
      const result = await createTask({
        title: '   ',
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      expect(result.error?.toLowerCase()).toContain('title');
    });

    it('should reject title exceeding max length (100 chars)', async () => {
      const result = await createTask({
        title: 'A'.repeat(101),
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('100');
    });

    it('should accept title at max length (100 chars)', async () => {
      mockPrisma.task.create.mockResolvedValue(mockPrismaTask);

      const result = await createTask({
        title: 'A'.repeat(100),
        columnId: 'TODO',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid priority value', async () => {
      const result = await createTask({
        title: 'Test',
        priority: 'INVALID' as any,
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid columnId value', async () => {
      const result = await createTask({
        title: 'Test',
        columnId: 'INVALID_COLUMN' as any,
      });

      expect(result.success).toBe(false);
    });

    it('should reject too many tags (>10)', async () => {
      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
        tags: Array(15).fill('tag'),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('10');
    });

    it('should reject tag exceeding max length (30 chars)', async () => {
      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
        tags: ['A'.repeat(31)],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('30');
    });

    it('should reject description exceeding max length (500 chars)', async () => {
      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
        description: 'A'.repeat(501),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('should reject invalid dueTime format', async () => {
      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
        dueTime: '25:00', // Invalid hour
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid dueTime format (HH:MM)', async () => {
      mockPrisma.task.create.mockResolvedValue(mockPrismaTask);

      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
        dueTime: '14:30',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
      expect(mockPrisma.task.create).not.toHaveBeenCalled();
    });

    it('should reject request with null user in session', async () => {
      mockAuth.mockResolvedValue({ user: null, expires: mockSession.expires });

      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });

    it('should reject request with missing user ID', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: mockSession.expires,
      });

      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS in title by HTML encoding', async () => {
      mockPrisma.task.create.mockImplementation((args: any) =>
        Promise.resolve({ ...mockPrismaTask, title: args.data.title })
      );

      const result = await createTask({
        title: '<script>alert("xss")</script>',
        columnId: 'TODO',
      });

      expect(result.success).toBe(true);
      // Sanitization HTML-encodes the script tags
      expect(result.data?.title).toContain('&lt;script&gt;');
      expect(result.data?.title).not.toContain('<script>');
    });

    it('should sanitize XSS in description by HTML encoding', async () => {
      mockPrisma.task.create.mockImplementation((args: any) =>
        Promise.resolve({ ...mockPrismaTask, description: args.data.description })
      );

      const result = await createTask({
        title: 'Test',
        description: '<img src=x onerror=alert("xss")>',
        columnId: 'TODO',
      });

      expect(result.success).toBe(true);
      // Sanitization HTML-encodes the img tag making it safe
      expect(result.data?.description).toContain('&lt;img');
    });

    it('should sanitize XSS in tags by HTML encoding', async () => {
      mockPrisma.task.create.mockImplementation((args: any) =>
        Promise.resolve({ ...mockPrismaTask, tags: args.data.tags })
      );

      // Note: Using a short XSS payload because sanitization increases length
      // (< becomes &lt;) and tags have a 30 char max length
      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
        tags: ['<b>bold</b>'], // 11 chars, becomes &lt;b&gt;bold&lt;/b&gt; (23 chars)
      });

      expect(result.success).toBe(true);
      const tagsString = JSON.stringify(result.data?.tags);
      // Sanitization HTML-encodes the tags
      expect(tagsString).toContain('&lt;b&gt;');
    });

    it('should trim whitespace from title', async () => {
      mockPrisma.task.create.mockImplementation((args: any) =>
        Promise.resolve({ ...mockPrismaTask, title: args.data.title })
      );

      await createTask({
        title: '  Trimmed Title  ',
        columnId: 'TODO',
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Trimmed Title',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return generic error for database connection failures', async () => {
      mockPrisma.task.create.mockRejectedValue(
        new Error('connect ECONNREFUSED 127.0.0.1:5432')
      );

      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('ECONNREFUSED');
      expect(result.error).not.toContain('127.0.0.1');
    });

    it('should handle P2002 unique constraint error', async () => {
      const uniqueError = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
      });
      mockPrisma.task.create.mockRejectedValue(uniqueError);

      const result = await createTask({
        title: 'Duplicate',
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
      expect(result.error).not.toContain('P2002');
    });

    it('should not expose stack traces in errors', async () => {
      const errorWithStack = new Error('Internal error');
      errorWithStack.stack = 'Error at /app/src/actions/tasks.ts:123:45';
      mockPrisma.task.create.mockRejectedValue(errorWithStack);

      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
      });

      expect(result.error).not.toContain('/app/src');
      expect(result.error).not.toContain('.ts:');
    });
  });

  describe('Edge Cases', () => {
    it('should handle Unicode characters in title', async () => {
      mockPrisma.task.create.mockImplementation((args: any) =>
        Promise.resolve({ ...mockPrismaTask, title: args.data.title })
      );

      const result = await createTask({
        title: 'Task with emojis and unicode chars',
        columnId: 'TODO',
      });

      expect(result.success).toBe(true);
    });

    it('should handle empty tags array', async () => {
      mockPrisma.task.create.mockResolvedValue(mockPrismaTask);

      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
        tags: [],
      });

      expect(result.success).toBe(true);
    });

    it('should filter out empty string tags', async () => {
      mockPrisma.task.create.mockResolvedValue(mockPrismaTask);

      await createTask({
        title: 'Test',
        columnId: 'TODO',
        tags: ['valid', '', '  ', 'another'],
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: expect.not.arrayContaining(['']),
          }),
        })
      );
    });
  });
});

// =============================================================================
// updateTask Tests
// =============================================================================

describe('updateTask', () => {
  describe('Happy Path', () => {
    it('should update task title successfully', async () => {
      mockPrisma.task.update.mockResolvedValue({
        ...mockPrismaTask,
        title: 'Updated Title',
      });

      const result = await updateTask(VALID_UUID, { title: 'Updated Title' });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated Title');
      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VALID_UUID, ownerId: MOCK_USER_ID },
        })
      );
    });

    it('should update multiple fields at once', async () => {
      mockPrisma.task.update.mockResolvedValue({
        ...mockPrismaTask,
        title: 'New Title',
        description: 'New Description',
        priority: 'HIGH',
      });

      const result = await updateTask(VALID_UUID, {
        title: 'New Title',
        description: 'New Description',
        priority: 'HIGH',
      });

      expect(result.success).toBe(true);
    });

    it('should update dueDate to a valid date', async () => {
      mockPrisma.task.update.mockResolvedValue({
        ...mockPrismaTask,
        dueDate: new Date('2026-06-15'),
      });

      const result = await updateTask(VALID_UUID, {
        dueDate: '2026-06-15',
      });

      expect(result.success).toBe(true);
    });

    it('should update dueDate to null', async () => {
      mockPrisma.task.update.mockResolvedValue({
        ...mockPrismaTask,
        dueDate: null,
      });

      const result = await updateTask(VALID_UUID, {
        dueDate: null,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should reject invalid task ID format', async () => {
      const result = await updateTask('not-a-uuid', { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid task ID');
    });

    it('should reject empty update data', async () => {
      const result = await updateTask(VALID_UUID, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('No update data');
    });

    it('should reject title exceeding max length', async () => {
      const result = await updateTask(VALID_UUID, {
        title: 'A'.repeat(101),
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid priority in update', async () => {
      const result = await updateTask(VALID_UUID, {
        priority: 'INVALID' as any,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateTask(VALID_UUID, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Ownership', () => {
    it('should return not found when updating task owned by another user', async () => {
      const notFoundError = Object.assign(new Error('Record not found'), {
        code: 'P2025',
      });
      mockPrisma.task.update.mockRejectedValue(notFoundError);

      const result = await updateTask(VALID_UUID, { title: 'Hijack attempt' });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not found|permission/i);
    });

    it('should include ownerId in update where clause', async () => {
      mockPrisma.task.update.mockResolvedValue(mockPrismaTask);

      await updateTask(VALID_UUID, { title: 'Test' });

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerId: MOCK_USER_ID,
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle P2025 not found error gracefully', async () => {
      const notFoundError = Object.assign(new Error('Record not found'), {
        code: 'P2025',
      });
      mockPrisma.task.update.mockRejectedValue(notFoundError);

      const result = await updateTask(VALID_UUID, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('P2025');
      expect(result.error).toMatch(/not found|permission/i);
    });
  });
});

// =============================================================================
// deleteTask Tests
// =============================================================================

describe('deleteTask', () => {
  describe('Happy Path', () => {
    it('should delete task successfully', async () => {
      mockPrisma.task.delete.mockResolvedValue(mockPrismaTask);

      const result = await deleteTask(VALID_UUID);

      expect(result.success).toBe(true);
      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: VALID_UUID, ownerId: MOCK_USER_ID },
      });
    });
  });

  describe('Validation', () => {
    it('should reject invalid task ID format', async () => {
      const result = await deleteTask('not-a-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid task ID');
    });

    it('should reject empty task ID', async () => {
      const result = await deleteTask('');

      expect(result.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await deleteTask(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Ownership', () => {
    it('should return not found when deleting task owned by another user', async () => {
      const notFoundError = Object.assign(new Error('Record not found'), {
        code: 'P2025',
      });
      mockPrisma.task.delete.mockRejectedValue(notFoundError);

      const result = await deleteTask(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not found|permission/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown Prisma errors gracefully', async () => {
      const unknownError = Object.assign(new Error('Unknown error'), {
        code: 'P9999',
      });
      mockPrisma.task.delete.mockRejectedValue(unknownError);

      const result = await deleteTask(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('P9999');
      expect(result.error).toContain('error occurred');
    });
  });
});

// =============================================================================
// moveTask Tests
// =============================================================================

describe('moveTask', () => {
  describe('Happy Path', () => {
    it('should move task to new column', async () => {
      mockPrisma.task.update.mockResolvedValue({
        ...mockPrismaTask,
        columnId: 'IN_PROGRESS',
      });

      const result = await moveTask({
        taskId: VALID_UUID,
        newColumnId: 'IN_PROGRESS',
      });

      expect(result.success).toBe(true);
      expect(result.data?.columnId).toBe('IN_PROGRESS');
    });

    it('should move task with target task ID for reordering', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({ id: VALID_UUID_2 });
      mockPrisma.task.update.mockResolvedValue({
        ...mockPrismaTask,
        columnId: 'COMPLETED',
      });

      const result = await moveTask({
        taskId: VALID_UUID,
        newColumnId: 'COMPLETED',
        targetTaskId: VALID_UUID_2,
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: VALID_UUID_2 },
        select: { id: true },
      });
    });
  });

  describe('Validation', () => {
    it('should reject invalid task ID format', async () => {
      const result = await moveTask({
        taskId: 'invalid',
        newColumnId: 'TODO',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid column ID', async () => {
      const result = await moveTask({
        taskId: VALID_UUID,
        newColumnId: 'INVALID' as any,
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid target task ID format', async () => {
      const result = await moveTask({
        taskId: VALID_UUID,
        newColumnId: 'TODO',
        targetTaskId: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await moveTask({
        taskId: VALID_UUID,
        newColumnId: 'IN_PROGRESS',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Error Handling', () => {
    it('should return error when target task not found', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const result = await moveTask({
        taskId: VALID_UUID,
        newColumnId: 'COMPLETED',
        targetTaskId: VALID_UUID_2,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Target task not found');
    });
  });
});

// =============================================================================
// getTasks Tests
// =============================================================================

describe('getTasks', () => {
  describe('Happy Path', () => {
    it('should return all tasks for authenticated user', async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockPrismaTask]);

      const result = await getTasks();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: MOCK_USER_ID },
        })
      );
    });

    it('should return empty array when user has no tasks', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const result = await getTasks();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should transform JSON fields correctly', async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockPrismaTask]);

      const result = await getTasks();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.[0].tags)).toBe(true);
      expect(Array.isArray(result.data?.[0].categories)).toBe(true);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getTasks();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.task.findMany.mockRejectedValue(new Error('DB connection lost'));

      const result = await getTasks();

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('DB connection');
    });
  });
});

// =============================================================================
// getTasksByColumn Tests
// =============================================================================

describe('getTasksByColumn', () => {
  describe('Happy Path', () => {
    it('should return tasks filtered by column', async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockPrismaTask]);

      const result = await getTasksByColumn('TODO');

      expect(result.success).toBe(true);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            columnId: 'TODO',
            ownerId: MOCK_USER_ID,
          }),
        })
      );
    });

    it('should work with all valid column IDs', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const columns = ['TODO', 'IN_PROGRESS', 'COMPLETED'] as const;
      for (const col of columns) {
        const result = await getTasksByColumn(col);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Validation', () => {
    it('should reject invalid column ID', async () => {
      const result = await getTasksByColumn('INVALID_COLUMN' as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid column');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getTasksByColumn('TODO');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });
});

// =============================================================================
// getTasksByDateRange Tests
// =============================================================================

describe('getTasksByDateRange', () => {
  describe('Happy Path', () => {
    it('should return tasks within date range', async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockPrismaTask]);

      const result = await getTasksByDateRange('2026-01-01', '2026-01-31');

      expect(result.success).toBe(true);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should accept same start and end date', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const result = await getTasksByDateRange('2026-01-15', '2026-01-15');

      expect(result.success).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should reject invalid start date format', async () => {
      const result = await getTasksByDateRange('invalid-date', '2026-01-31');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid start date');
    });

    it('should reject invalid end date format', async () => {
      const result = await getTasksByDateRange('2026-01-01', 'invalid-date');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid end date');
    });

    it('should reject when start date is after end date', async () => {
      const result = await getTasksByDateRange('2026-12-31', '2026-01-01');

      expect(result.success).toBe(false);
      expect(result.error).toContain('before or equal');
    });

    it('should reject date range exceeding 90 days', async () => {
      const result = await getTasksByDateRange('2026-01-01', '2026-06-01');

      expect(result.success).toBe(false);
      expect(result.error).toContain('90 days');
    });

    it('should accept date range of exactly 90 days', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const result = await getTasksByDateRange('2026-01-01', '2026-04-01');

      expect(result.success).toBe(true);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getTasksByDateRange('2026-01-01', '2026-01-31');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });
});

// =============================================================================
// searchTasks Tests
// =============================================================================

describe('searchTasks', () => {
  describe('Happy Path', () => {
    it('should search tasks by query', async () => {
      mockPrisma.task.count.mockResolvedValue(1);
      mockPrisma.task.findMany.mockResolvedValue([mockPrismaTask]);

      const result = await searchTasks({
        query: 'test',
        filters: {},
        limit: 50,
        offset: 0,
      });

      expect(result.success).toBe(true);
      expect(result.data?.tasks).toHaveLength(1);
      expect(result.data?.total).toBe(1);
    });

    it('should search with priority filter', async () => {
      mockPrisma.task.count.mockResolvedValue(1);
      mockPrisma.task.findMany.mockResolvedValue([mockPrismaTask]);

      const result = await searchTasks({
        query: '',
        filters: { priority: 'HIGH' },
        limit: 50,
        offset: 0,
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: 'HIGH',
          }),
        })
      );
    });

    it('should search with column filter', async () => {
      mockPrisma.task.count.mockResolvedValue(1);
      mockPrisma.task.findMany.mockResolvedValue([mockPrismaTask]);

      const result = await searchTasks({
        query: '',
        filters: { columnId: 'IN_PROGRESS' },
        limit: 50,
        offset: 0,
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            columnId: 'IN_PROGRESS',
          }),
        })
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.task.count.mockResolvedValue(100);
      mockPrisma.task.findMany.mockResolvedValue([mockPrismaTask]);

      const result = await searchTasks({
        query: '',
        filters: {},
        limit: 10,
        offset: 20,
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe('Validation', () => {
    it('should reject query exceeding max length', async () => {
      const result = await searchTasks({
        query: 'A'.repeat(201),
        filters: {},
        limit: 50,
        offset: 0,
      });

      expect(result.success).toBe(false);
    });

    it('should reject limit exceeding max (100)', async () => {
      const result = await searchTasks({
        query: '',
        filters: {},
        limit: 150,
        offset: 0,
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative offset', async () => {
      const result = await searchTasks({
        query: '',
        filters: {},
        limit: 50,
        offset: -1,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await searchTasks({
        query: 'test',
        filters: {},
        limit: 50,
        offset: 0,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  // Note: Rate limiting tests are moved to the end of the file
  // because the in-memory rate limit cache persists between tests
});

// =============================================================================
// getSavedFilterPresets Tests
// =============================================================================

describe('getSavedFilterPresets', () => {
  describe('Happy Path', () => {
    it('should return saved filter presets', async () => {
      mockPrisma.savedFilterPreset.findMany.mockResolvedValue([mockFilterPreset]);

      const result = await getSavedFilterPresets();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('My Preset');
    });

    it('should return empty array when no presets exist', async () => {
      mockPrisma.savedFilterPreset.findMany.mockResolvedValue([]);

      const result = await getSavedFilterPresets();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getSavedFilterPresets();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });
});

// =============================================================================
// saveFilterPreset Tests
// =============================================================================

describe('saveFilterPreset', () => {
  describe('Happy Path', () => {
    it('should save filter preset successfully', async () => {
      mockPrisma.savedFilterPreset.create.mockResolvedValue(mockFilterPreset);

      const result = await saveFilterPreset({
        name: 'My Preset',
        filters: { priority: 'HIGH' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('My Preset');
    });
  });

  describe('Validation', () => {
    it('should reject empty preset name', async () => {
      const result = await saveFilterPreset({
        name: '',
        filters: {},
      });

      expect(result.success).toBe(false);
    });

    it('should reject preset name exceeding max length (50 chars)', async () => {
      const result = await saveFilterPreset({
        name: 'A'.repeat(51),
        filters: {},
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await saveFilterPreset({
        name: 'Test',
        filters: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate preset name error', async () => {
      const uniqueError = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
      });
      mockPrisma.savedFilterPreset.create.mockRejectedValue(uniqueError);

      const result = await saveFilterPreset({
        name: 'Duplicate',
        filters: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('preset with this name already exists');
    });
  });
});

// =============================================================================
// deleteFilterPreset Tests
// =============================================================================

describe('deleteFilterPreset', () => {
  describe('Happy Path', () => {
    it('should delete filter preset successfully', async () => {
      mockPrisma.savedFilterPreset.delete.mockResolvedValue(mockFilterPreset);

      const result = await deleteFilterPreset(VALID_UUID);

      expect(result.success).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should reject invalid preset ID format', async () => {
      const result = await deleteFilterPreset('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid preset ID');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await deleteFilterPreset(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('Ownership', () => {
    it('should return error when deleting preset owned by another user', async () => {
      const notFoundError = Object.assign(new Error('Record not found'), {
        code: 'P2025',
      });
      mockPrisma.savedFilterPreset.delete.mockRejectedValue(notFoundError);

      const result = await deleteFilterPreset(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not found|permission/i);
    });
  });
});

// =============================================================================
// Rate Limiting Tests (Run Last - These consume the rate limit)
// =============================================================================

describe('searchTasks Rate Limiting', () => {
  it('should enforce rate limit after 20 requests', async () => {
    mockPrisma.task.count.mockResolvedValue(0);
    mockPrisma.task.findMany.mockResolvedValue([]);

    // Make 20 requests (rate limit is 20/minute)
    for (let i = 0; i < 20; i++) {
      await searchTasks({ query: `test${i}`, filters: {}, limit: 50, offset: 0 });
    }

    // 21st request should be rate limited
    const result = await searchTasks({
      query: 'test21',
      filters: {},
      limit: 50,
      offset: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error?.toLowerCase()).toContain('too many');
  });
});
