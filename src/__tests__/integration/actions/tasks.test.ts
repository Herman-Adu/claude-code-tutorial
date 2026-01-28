/**
 * Server Actions Integration Tests
 *
 * Comprehensive test suite for all task server actions.
 * Tests validation, sanitization, error handling, and database interactions.
 *
 * Coverage:
 * - createTask: 9 tests
 * - updateTask: 7 tests
 * - deleteTask: 4 tests
 * - moveTask: 6 tests
 * - getTasks: 4 tests
 * - getTasksByColumn: 5 tests
 * Total: 35 tests
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Mocks Setup
// =============================================================================

// IMPORTANT: Unmock server actions that were mocked in tests/setup.ts
// This allows us to test the REAL server action implementations
vi.unmock('@/app/actions/tasks');

// Define mock type for our prisma mock
interface MockPrismaTask {
  create: Mock;
  update: Mock;
  delete: Mock;
  findMany: Mock;
  findUnique: Mock;
}

interface MockPrisma {
  task: MockPrismaTask;
  $connect: Mock;
  $disconnect: Mock;
}

// Create mock using vi.hoisted - this runs before vi.mock factories
const prismaMock = vi.hoisted((): MockPrisma => {
  return {
    task: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
});

// Re-export for test file usage
export { prismaMock };

// Mock Prisma module - this is what we want to control in integration tests
vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Import after mocks are set up - these will be the REAL implementations
// because we unmocked them above
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  getTasks,
  getTasksByColumn,
} from '@/app/actions/tasks';

import {
  mockTask,
  mockPrismaTask,
  xssPayloads,
  sanitizedXssPayloads,
  invalidInputs,
  validInputs,
  prismaErrors,
  VALID_TASK_ID,
  VALID_TARGET_TASK_ID,
} from './mocks/test-data';

// =============================================================================
// Test Setup
// =============================================================================

beforeEach(() => {
  // Reset all mock function calls and implementations
  prismaMock.task.create.mockReset();
  prismaMock.task.update.mockReset();
  prismaMock.task.delete.mockReset();
  prismaMock.task.findMany.mockReset();
  prismaMock.task.findUnique.mockReset();
  vi.clearAllMocks();
});

// =============================================================================
// createTask Tests
// =============================================================================

describe('createTask', () => {
  describe('✓ Success Cases', () => {
    it('should create task with minimal data', async () => {
      const input = validInputs.minimal;

      prismaMock.task.create.mockResolvedValue({
        ...mockPrismaTask,
        title: input.title,
        columnId: input.columnId,
        description: '',
        priority: 'MEDIUM',
        tags: [],
        categories: [],
      });

      const result = await createTask(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe(input.title);
      expect(result.data?.columnId).toBe(input.columnId);
      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: input.title,
          columnId: input.columnId,
          description: '',
          tags: [],
          categories: [],
        }),
      });
    });

    it('should create task with full data', async () => {
      const input = validInputs.complete;

      prismaMock.task.create.mockResolvedValue({
        ...mockPrismaTask,
        ...input,
        tags: input.tags as unknown,
        categories: input.categories as unknown,
      });

      const result = await createTask(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe(input.title);
      expect(result.data?.priority).toBe(input.priority);
      expect(result.data?.tags).toEqual(input.tags);
      expect(result.data?.categories).toEqual(input.categories);
    });

    it('should sanitize XSS in title', async () => {
      const input = {
        title: xssPayloads[0], // '<script>alert("xss")</script>'
        columnId: 'TODO' as const,
      };

      // Mock to return the sanitized title
      prismaMock.task.create.mockImplementation((args: any) =>
        Promise.resolve({
          ...mockPrismaTask,
          title: args.data.title,
        })
      );

      const result = await createTask(input);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe(sanitizedXssPayloads[0]);
      expect(result.data?.title).not.toContain('<script>');
    });

    it('should sanitize XSS in description', async () => {
      const input = {
        title: 'Safe Title',
        description: xssPayloads[1], // '<img src=x onerror=alert("xss")>'
        columnId: 'TODO' as const,
      };

      prismaMock.task.create.mockImplementation((args: any) =>
        Promise.resolve({
          ...mockPrismaTask,
          description: args.data.description,
        })
      );

      const result = await createTask(input);

      expect(result.success).toBe(true);
      expect(result.data?.description).toBe(sanitizedXssPayloads[1]);
      expect(result.data?.description).not.toContain('<img');
    });

    it('should handle special characters correctly', async () => {
      const input = validInputs.specialCharacters;

      prismaMock.task.create.mockResolvedValue({
        ...mockPrismaTask,
        title: input.title,
        description: input.description!,
      });

      const result = await createTask(input);

      expect(result.success).toBe(true);
      expect(result.data?.title).toContain('🚀');
      expect(result.data?.description).toContain('\n');
    });
  });

  describe('✗ Validation Errors', () => {
    it('should reject empty title', async () => {
      const result = await createTask(invalidInputs.emptyTitle as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('title');
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('should reject title that is too long', async () => {
      const result = await createTask(invalidInputs.tooLongTitle as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('should reject invalid priority', async () => {
      const result = await createTask(invalidInputs.invalidPriority as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('should reject invalid columnId', async () => {
      const result = await createTask(invalidInputs.invalidColumnId as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });
  });

  describe('✗ Database Errors', () => {
    it('should handle Prisma unique constraint error', async () => {
      prismaMock.task.create.mockRejectedValue(prismaErrors.uniqueConstraint);

      const result = await createTask(validInputs.minimal);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should handle database connection error', async () => {
      prismaMock.task.create.mockRejectedValue(
        new Error('connect ECONNREFUSED')
      );

      const result = await createTask(validInputs.minimal);

      expect(result.success).toBe(false);
      expect(result.error).toContain('connect');
    });
  });
});

// =============================================================================
// updateTask Tests
// =============================================================================

describe('updateTask', () => {
  const taskId = VALID_TASK_ID;

  describe('✓ Success Cases', () => {
    it('should update task with partial data', async () => {
      const updateData = { title: 'Updated Title' };

      prismaMock.task.update.mockResolvedValue({
        ...mockPrismaTask,
        title: updateData.title,
      });

      const result = await updateTask(taskId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe(updateData.title);
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: expect.objectContaining({ title: updateData.title }),
      });
    });

    it('should update task with full data', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        priority: 'HIGH' as const,
        tags: ['updated', 'test'],
      };

      prismaMock.task.update.mockResolvedValue({
        ...mockPrismaTask,
        ...updateData,
        tags: updateData.tags as unknown,
      });

      const result = await updateTask(taskId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe(updateData.title);
      expect(result.data?.priority).toBe(updateData.priority);
    });

    it('should sanitize XSS on update', async () => {
      const updateData = {
        title: xssPayloads[2], // 'javascript:alert("xss")'
      };

      prismaMock.task.update.mockImplementation((args: any) =>
        Promise.resolve({
          ...mockPrismaTask,
          title: args.data.title,
        })
      );

      const result = await updateTask(taskId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe(sanitizedXssPayloads[2]);
    });
  });

  describe('✗ Validation Errors', () => {
    it('should reject invalid task ID format', async () => {
      const result = await updateTask('invalid-id', { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid task ID');
      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });

    it('should reject empty update data', async () => {
      const result = await updateTask(taskId, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('No update data');
      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });
  });

  describe('✗ Database Errors', () => {
    it('should handle task not found error', async () => {
      prismaMock.task.update.mockRejectedValue(prismaErrors.notFound);

      const result = await updateTask(taskId, { title: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle database constraint error', async () => {
      prismaMock.task.update.mockRejectedValue(
        prismaErrors.foreignKeyConstraint
      );

      const result = await updateTask(taskId, { title: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

// =============================================================================
// deleteTask Tests
// =============================================================================

describe('deleteTask', () => {
  const taskId = VALID_TASK_ID;

  describe('✓ Success Cases', () => {
    it('should delete task successfully', async () => {
      prismaMock.task.delete.mockResolvedValue(mockPrismaTask);

      const result = await deleteTask(taskId);

      expect(result.success).toBe(true);
      expect(prismaMock.task.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });
  });

  describe('✗ Validation Errors', () => {
    it('should reject invalid task ID', async () => {
      const result = await deleteTask('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid task ID');
      expect(prismaMock.task.delete).not.toHaveBeenCalled();
    });
  });

  describe('✗ Database Errors', () => {
    it('should handle task not found error', async () => {
      prismaMock.task.delete.mockRejectedValue(prismaErrors.notFound);

      const result = await deleteTask(taskId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle foreign key constraint error', async () => {
      prismaMock.task.delete.mockRejectedValue(
        prismaErrors.foreignKeyConstraint
      );

      const result = await deleteTask(taskId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

// =============================================================================
// moveTask Tests
// =============================================================================

describe('moveTask', () => {
  const taskId = VALID_TASK_ID;

  describe('✓ Success Cases', () => {
    it('should move task to different column', async () => {
      const input = {
        taskId,
        newColumnId: 'IN_PROGRESS' as const,
      };

      prismaMock.task.update.mockResolvedValue({
        ...mockPrismaTask,
        columnId: input.newColumnId,
      });

      const result = await moveTask(input);

      expect(result.success).toBe(true);
      expect(result.data?.columnId).toBe(input.newColumnId);
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { columnId: input.newColumnId },
      });
    });

    it('should handle move with target task ID', async () => {
      const input = {
        taskId,
        newColumnId: 'COMPLETED' as const,
        targetTaskId: VALID_TARGET_TASK_ID,
      };

      prismaMock.task.findUnique.mockResolvedValue({
        ...mockPrismaTask,
        id: input.targetTaskId,
      });

      prismaMock.task.update.mockResolvedValue({
        ...mockPrismaTask,
        columnId: input.newColumnId,
      });

      const result = await moveTask(input);

      expect(result.success).toBe(true);
      expect(prismaMock.task.findUnique).toHaveBeenCalledWith({
        where: { id: input.targetTaskId },
        select: { id: true },
      });
    });

    it('should move task to empty column', async () => {
      const input = {
        taskId,
        newColumnId: 'COMPLETED' as const,
      };

      prismaMock.task.update.mockResolvedValue({
        ...mockPrismaTask,
        columnId: input.newColumnId,
      });

      const result = await moveTask(input);

      expect(result.success).toBe(true);
      expect(result.data?.columnId).toBe(input.newColumnId);
    });
  });

  describe('✗ Validation Errors', () => {
    it('should reject invalid task ID', async () => {
      const result = await moveTask({
        taskId: 'invalid',
        newColumnId: 'TODO',
      } as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid column ID', async () => {
      const result = await moveTask({
        taskId,
        newColumnId: 'INVALID_COLUMN',
      } as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('✗ Database Errors', () => {
    it('should handle task not found error', async () => {
      prismaMock.task.update.mockRejectedValue(prismaErrors.notFound);

      const result = await moveTask({
        taskId,
        newColumnId: 'COMPLETED',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle target task not found', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      // Use a valid UUID v4 format that doesn't exist in the mock database
      const nonExistentTargetId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      const result = await moveTask({
        taskId,
        newColumnId: 'COMPLETED',
        targetTaskId: nonExistentTargetId,
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
  describe('✓ Success Cases', () => {
    it('should return all tasks ordered by createdAt', async () => {
      const tasks = [
        { ...mockPrismaTask, id: '1', createdAt: new Date('2025-01-03') },
        { ...mockPrismaTask, id: '2', createdAt: new Date('2025-01-02') },
        { ...mockPrismaTask, id: '3', createdAt: new Date('2025-01-01') },
      ];

      prismaMock.task.findMany.mockResolvedValue(tasks);

      const result = await getTasks();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no tasks', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);

      const result = await getTasks();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should include all task fields in response', async () => {
      prismaMock.task.findMany.mockResolvedValue([mockPrismaTask]);

      const result = await getTasks();

      expect(result.success).toBe(true);
      expect(result.data?.[0]).toHaveProperty('id');
      expect(result.data?.[0]).toHaveProperty('title');
      expect(result.data?.[0]).toHaveProperty('description');
      expect(result.data?.[0]).toHaveProperty('priority');
      expect(result.data?.[0]).toHaveProperty('columnId');
      expect(result.data?.[0]).toHaveProperty('tags');
      expect(result.data?.[0]).toHaveProperty('categories');
      expect(result.data?.[0]).toHaveProperty('createdAt');
      expect(result.data?.[0]).toHaveProperty('updatedAt');
    });
  });

  describe('✗ Database Errors', () => {
    it('should handle database query error', async () => {
      prismaMock.task.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await getTasks();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

// =============================================================================
// getTasksByColumn Tests
// =============================================================================

describe('getTasksByColumn', () => {
  describe('✓ Success Cases', () => {
    it('should filter tasks by valid columnId', async () => {
      const columnId = 'TODO';
      const tasks = [
        { ...mockPrismaTask, id: '1', columnId },
        { ...mockPrismaTask, id: '2', columnId },
      ];

      prismaMock.task.findMany.mockResolvedValue(tasks);

      const result = await getTasksByColumn(columnId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: { columnId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array for empty column', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);

      const result = await getTasksByColumn('COMPLETED');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should correctly filter IN_PROGRESS column', async () => {
      const tasks = [{ ...mockPrismaTask, columnId: 'IN_PROGRESS' as const }];
      prismaMock.task.findMany.mockResolvedValue(tasks);

      const result = await getTasksByColumn('IN_PROGRESS');

      expect(result.success).toBe(true);
      expect(result.data?.[0].columnId).toBe('IN_PROGRESS');
    });
  });

  describe('✗ Validation Errors', () => {
    it('should reject invalid columnId', async () => {
      const result = await getTasksByColumn('INVALID' as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid column ID');
      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
    });
  });

  describe('✗ Database Errors', () => {
    it('should handle database query error', async () => {
      prismaMock.task.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await getTasksByColumn('TODO');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
