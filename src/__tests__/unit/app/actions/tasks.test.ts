/**
 * Unit Tests for Server Actions Error Handling
 *
 * Tests the error handling patterns in task server actions:
 * - Generic error messages returned to client
 * - Detailed errors logged server-side
 * - No database error codes exposed
 * - No sensitive data in error responses
 * - Validation errors formatted correctly
 * - Ownership verification errors handled
 *
 * Note: This is a UNIT test file focused on error handling patterns.
 * Integration tests for the full server actions are in:
 * src/__tests__/integration/actions/tasks.test.ts
 *
 * Coverage targets: >80% for error handling code paths
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// Mock Setup - Using vi.hoisted to properly hoist mock definitions
// =============================================================================

// IMPORTANT: Unmock server actions that were mocked in tests/setup.ts
vi.unmock('@/app/actions/tasks');

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

// Import after mocks
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  getTasks,
  getTasksByColumn,
  getTasksByDateRange,
} from '@/app/actions/tasks';

// =============================================================================
// Test Data
// =============================================================================

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_USER_ID = 'user-123-456';

const mockSession = {
  user: { id: MOCK_USER_ID, email: 'test@example.com', name: 'Test User' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockTaskResponse = {
  id: VALID_UUID,
  title: 'Test Task',
  description: 'Test description',
  priority: 'MEDIUM' as const,
  columnId: 'TODO' as const,
  tags: [] as unknown,
  categories: [] as unknown,
  createdAt: new Date(),
  updatedAt: new Date(),
  dueDate: null,
  dueTime: null,
  isAllDay: true,
  ownerId: MOCK_USER_ID,
  owner: { name: 'Test User', email: 'test@example.com' },
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
// Error Handling Tests
// =============================================================================

describe('Server Actions Error Handling', () => {
  describe('generic error messages to client', () => {
    it('should return generic message for database connection errors', async () => {
      mockPrisma.task.create.mockRejectedValue(
        new Error('connect ECONNREFUSED 127.0.0.1:5432')
      );

      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      // Should not expose connection details
      expect(result.error).not.toContain('ECONNREFUSED');
      expect(result.error).not.toContain('127.0.0.1');
      expect(result.error).not.toContain('5432');
    });

    it('should return generic message for unknown errors', async () => {
      mockPrisma.task.findMany.mockRejectedValue(
        new Error('Internal server error with sensitive data: password=secret123')
      );

      const result = await getTasks();

      expect(result.success).toBe(false);
      // Should not expose sensitive data
      expect(result.error).not.toContain('password');
      expect(result.error).not.toContain('secret123');
    });

    it('should return safe message for P2025 (not found) errors', async () => {
      const notFoundError = Object.assign(new Error('Record not found'), {
        code: 'P2025',
      });
      mockPrisma.task.update.mockRejectedValue(notFoundError);

      const result = await updateTask(VALID_UUID, { title: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      // Should not expose Prisma error code
      expect(result.error).not.toContain('P2025');
    });

    it('should return safe message for P2002 (unique constraint) errors', async () => {
      const uniqueError = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
      });
      mockPrisma.task.create.mockRejectedValue(uniqueError);

      const result = await createTask({
        title: 'Duplicate Task',
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
      // Should not expose Prisma error code
      expect(result.error).not.toContain('P2002');
    });

    it('should return generic message for unknown Prisma errors', async () => {
      const unknownError = Object.assign(new Error('Unknown constraint'), {
        code: 'P9999',
      });
      mockPrisma.task.delete.mockRejectedValue(unknownError);

      const result = await deleteTask(VALID_UUID);

      expect(result.success).toBe(false);
      // Should not expose Prisma error code
      expect(result.error).not.toContain('P9999');
      // Should use generic message
      expect(result.error).toContain('error occurred');
    });
  });

  describe('detailed errors logged server-side', () => {
    it('should log error details when database error occurs', async () => {
      const dbError = new Error('Database connection timeout');
      mockPrisma.task.findMany.mockRejectedValue(dbError);

      await getTasks();

      // Console.error should have been called with details
      expect(console.error).toHaveBeenCalled();
    });

    it('should log Prisma error codes for debugging', async () => {
      const prismaError = Object.assign(new Error('Constraint failed'), {
        code: 'P2003',
      });
      mockPrisma.task.delete.mockRejectedValue(prismaError);

      await deleteTask(VALID_UUID);

      // Verify logging occurred
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('no database error codes exposed', () => {
    const prismaCodes = ['P2000', 'P2001', 'P2002', 'P2003', 'P2025'];

    prismaCodes.forEach((code) => {
      it(`should not expose Prisma code ${code} in error response`, async () => {
        const error = Object.assign(new Error(`Error ${code}`), { code });
        mockPrisma.task.create.mockRejectedValue(error);

        const result = await createTask({
          title: 'Test',
          columnId: 'TODO',
        });

        expect(result.success).toBe(false);
        expect(result.error).not.toContain(code);
      });
    });
  });

  describe('no sensitive data in error responses', () => {
    it('should not expose database URL in errors', async () => {
      mockPrisma.task.findMany.mockRejectedValue(
        new Error('Connection failed: postgresql://user:password@localhost:5432/db')
      );

      const result = await getTasks();

      expect(result.error).not.toContain('postgresql://');
      expect(result.error).not.toContain('password');
      expect(result.error).not.toContain('localhost:5432');
    });

    it('should not expose stack traces in errors', async () => {
      const errorWithStack = new Error('Something went wrong');
      errorWithStack.stack = 'Error at /app/src/actions/tasks.ts:123:45';
      mockPrisma.task.create.mockRejectedValue(errorWithStack);

      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
      });

      expect(result.error).not.toContain('/app/src');
      expect(result.error).not.toContain('.ts:');
    });

    it('should not expose internal function names', async () => {
      mockPrisma.task.update.mockRejectedValue(
        new Error('Error in prisma.task.update at PrismaClient._executeRequest')
      );

      const result = await updateTask(VALID_UUID, { title: 'Test' });

      expect(result.error).not.toContain('PrismaClient');
      expect(result.error).not.toContain('_executeRequest');
    });
  });

  describe('validation errors formatted correctly', () => {
    it('should return clear message for empty title', async () => {
      const result = await createTask({
        title: '',
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.toLowerCase()).toContain('title');
    });

    it('should return clear message for invalid task ID format', async () => {
      const result = await updateTask('not-a-uuid', { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid task ID');
    });

    it('should return clear message for invalid column ID', async () => {
      const result = await getTasksByColumn('INVALID_COLUMN' as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid column');
    });

    it('should return clear message for empty update data', async () => {
      const result = await updateTask(VALID_UUID, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('No update data');
    });

    it('should format multiple validation errors', async () => {
      const result = await createTask({
        title: 'A'.repeat(200), // Too long
        columnId: 'INVALID' as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('authentication errors', () => {
    it('should return authentication required for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await createTask({
        title: 'Test',
        columnId: 'TODO',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });

    it('should return authentication required for expired session', async () => {
      mockAuth.mockResolvedValue({
        user: null,
        expires: new Date(Date.now() - 86400000).toISOString(),
      });

      const result = await getTasks();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });

    it('should require auth for all CRUD operations', async () => {
      mockAuth.mockResolvedValue(null);

      const createResult = await createTask({ title: 'Test', columnId: 'TODO' });
      const updateResult = await updateTask(VALID_UUID, { title: 'Test' });
      const deleteResult = await deleteTask(VALID_UUID);
      const moveResult = await moveTask({ taskId: VALID_UUID, newColumnId: 'IN_PROGRESS' });
      const getResult = await getTasks();
      const getByColumnResult = await getTasksByColumn('TODO');

      expect(createResult.error).toContain('Authentication required');
      expect(updateResult.error).toContain('Authentication required');
      expect(deleteResult.error).toContain('Authentication required');
      expect(moveResult.error).toContain('Authentication required');
      expect(getResult.error).toContain('Authentication required');
      expect(getByColumnResult.error).toContain('Authentication required');
    });
  });

  describe('ownership verification errors', () => {
    it('should return not found when updating task owned by another user', async () => {
      const notFoundError = Object.assign(new Error('Record not found'), {
        code: 'P2025',
      });
      mockPrisma.task.update.mockRejectedValue(notFoundError);

      const result = await updateTask(VALID_UUID, { title: 'Hijack attempt' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      // The message should not distinguish between "doesn't exist" and "not yours"
      expect(result.error).toMatch(/not found|permission/i);
    });

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

  describe('date range validation errors', () => {
    it('should return error for invalid start date', async () => {
      const result = await getTasksByDateRange('invalid-date', '2026-01-31');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid start date');
    });

    it('should return error for invalid end date', async () => {
      const result = await getTasksByDateRange('2026-01-01', 'invalid-date');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid end date');
    });

    it('should return error when start date is after end date', async () => {
      const result = await getTasksByDateRange('2026-12-31', '2026-01-01');

      expect(result.success).toBe(false);
      expect(result.error).toContain('before or equal');
    });

    it('should return error when date range exceeds 90 days', async () => {
      const result = await getTasksByDateRange('2026-01-01', '2026-06-01');

      expect(result.success).toBe(false);
      expect(result.error).toContain('90 days');
    });
  });
});

// =============================================================================
// Success Path Tests (for coverage)
// =============================================================================

describe('Server Actions Success Paths', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('createTask success', () => {
    it('should create task successfully with valid data', async () => {
      mockPrisma.task.create.mockResolvedValue(mockTaskResponse);

      const result = await createTask({
        title: 'New Task',
        columnId: 'TODO',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Test Task');
    });

    it('should sanitize XSS in title', async () => {
      mockPrisma.task.create.mockImplementation((args: any) =>
        Promise.resolve({
          ...mockTaskResponse,
          title: args.data.title,
        })
      );

      const result = await createTask({
        title: '<script>alert("xss")</script>',
        columnId: 'TODO',
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).not.toContain('<script>');
    });
  });

  describe('updateTask success', () => {
    it('should update task successfully', async () => {
      mockPrisma.task.update.mockResolvedValue({
        ...mockTaskResponse,
        title: 'Updated Title',
      });

      const result = await updateTask(VALID_UUID, {
        title: 'Updated Title',
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated Title');
    });
  });

  describe('deleteTask success', () => {
    it('should delete task successfully', async () => {
      mockPrisma.task.delete.mockResolvedValue(mockTaskResponse);

      const result = await deleteTask(VALID_UUID);

      expect(result.success).toBe(true);
    });
  });

  describe('moveTask success', () => {
    it('should move task to new column', async () => {
      mockPrisma.task.update.mockResolvedValue({
        ...mockTaskResponse,
        columnId: 'IN_PROGRESS',
      });

      const result = await moveTask({
        taskId: VALID_UUID,
        newColumnId: 'IN_PROGRESS',
      });

      expect(result.success).toBe(true);
      expect(result.data?.columnId).toBe('IN_PROGRESS');
    });

    it('should verify target task exists when provided', async () => {
      const targetId = '660e8400-e29b-41d4-a716-446655440001';
      mockPrisma.task.findUnique.mockResolvedValue({ id: targetId });
      mockPrisma.task.update.mockResolvedValue({
        ...mockTaskResponse,
        columnId: 'COMPLETED',
      });

      const result = await moveTask({
        taskId: VALID_UUID,
        newColumnId: 'COMPLETED',
        targetTaskId: targetId,
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: targetId },
        select: { id: true },
      });
    });

    it('should return error when target task not found', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const result = await moveTask({
        taskId: VALID_UUID,
        newColumnId: 'COMPLETED',
        targetTaskId: '660e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Target task not found');
    });
  });

  describe('getTasks success', () => {
    it('should return all tasks', async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockTaskResponse]);

      const result = await getTasks();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should return empty array when no tasks', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const result = await getTasks();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getTasksByColumn success', () => {
    it('should return tasks filtered by column', async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockTaskResponse]);

      const result = await getTasksByColumn('TODO');

      expect(result.success).toBe(true);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            columnId: 'TODO',
          }),
        })
      );
    });
  });

  describe('getTasksByDateRange success', () => {
    it('should return tasks in date range', async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockTaskResponse]);

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
  });
});
