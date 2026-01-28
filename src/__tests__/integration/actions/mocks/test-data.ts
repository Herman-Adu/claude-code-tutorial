/**
 * Test Data Fixtures
 *
 * Provides mock task data, XSS payloads, and invalid inputs for testing server actions.
 */

import type { Priority, ColumnId } from '@/generated/prisma/enums';
import type { TaskResponse } from '@/app/actions/tasks';

/**
 * Valid UUID for testing - matches UUID format requirements.
 */
export const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440000';
export const VALID_TARGET_TASK_ID = '550e8400-e29b-41d4-a716-446655440001';

/**
 * Base mock task for testing.
 * Represents a valid task with all required fields.
 */
export const mockTask: TaskResponse = {
  id: VALID_TASK_ID,
  title: 'Test Task',
  description: 'Test Description',
  priority: 'MEDIUM' as Priority,
  columnId: 'TODO' as ColumnId,
  tags: ['test', 'unit'],
  categories: ['development'],
  dueDate: null,
  dueTime: null,
  isAllDay: true,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ownerName: 'Test User',
  ownerEmail: 'test@example.com',
};

/**
 * Collection of XSS attack payloads for security testing.
 * These should all be sanitized by the sanitizeString function.
 */
export const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  'javascript:alert("xss")',
  '<svg onload=alert("xss")>',
  '<iframe src="javascript:alert(\'xss\')">',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
] as const;

/**
 * Expected sanitized versions of XSS payloads.
 * Used to verify sanitization worked correctly.
 */
export const sanitizedXssPayloads = [
  '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;',
  '&lt;img src=x onerror=alert(&quot;xss&quot;)&gt;',
  'javascript:alert(&quot;xss&quot;)',
  '&lt;svg onload=alert(&quot;xss&quot;)&gt;',
  '&lt;iframe src=&quot;javascript:alert(&#x27;xss&#x27;)&quot;&gt;',
  '&quot;&gt;&lt;script&gt;alert(String.fromCharCode(88,83,83))&lt;&#x2F;script&gt;',
] as const;

/**
 * Invalid input data for validation testing.
 * Each object represents data that should fail validation.
 */
export const invalidInputs = {
  emptyTitle: {
    title: '',
    description: 'Valid description',
    columnId: 'TODO' as ColumnId,
  },
  tooLongTitle: {
    title: 'a'.repeat(256),
    description: 'Valid description',
    columnId: 'TODO' as ColumnId,
  },
  invalidPriority: {
    title: 'Valid title',
    description: 'Valid description',
    priority: 'INVALID_PRIORITY',
    columnId: 'TODO' as ColumnId,
  },
  invalidColumnId: {
    title: 'Valid title',
    description: 'Valid description',
    columnId: 'INVALID_COLUMN',
  },
  tooManyTags: {
    title: 'Valid title',
    description: 'Valid description',
    columnId: 'TODO' as ColumnId,
    tags: Array(15).fill('tag'),
  },
  tooLongTag: {
    title: 'Valid title',
    description: 'Valid description',
    columnId: 'TODO' as ColumnId,
    tags: ['a'.repeat(50)],
  },
} as const;

/**
 * Valid task creation inputs for positive test cases.
 */
export const validInputs = {
  minimal: {
    title: 'Minimal Task',
    columnId: 'TODO' as ColumnId,
  },
  complete: {
    title: 'Complete Task',
    description: 'A fully specified task with all optional fields',
    priority: 'HIGH' as Priority,
    columnId: 'IN_PROGRESS' as ColumnId,
    tags: ['feature', 'urgent'],
    categories: ['frontend', 'ui'],
  },
  specialCharacters: {
    title: 'Task with émojis 🚀 and spëcial çharacters',
    description: 'Description with newlines\nand tabs\ttoo',
    columnId: 'TODO' as ColumnId,
  },
} as const;

/**
 * Prisma error codes for testing error handling.
 */
export const prismaErrors = {
  notFound: { code: 'P2025', message: 'Record not found' },
  uniqueConstraint: { code: 'P2002', message: 'Unique constraint failed' },
  foreignKeyConstraint: { code: 'P2003', message: 'Foreign key constraint failed' },
  recordNotFound: { code: 'P2016', message: 'Record not found in database' },
} as const;

/**
 * Mock Prisma task record (before transformation).
 * Matches the internal PrismaTaskRecord type from tasks.ts.
 */
export const mockPrismaTask = {
  id: VALID_TASK_ID,
  title: 'Test Task',
  description: 'Test Description',
  priority: 'MEDIUM' as Priority,
  columnId: 'TODO' as ColumnId,
  tags: ['test', 'unit'] as unknown, // Prisma returns JSON as unknown
  categories: ['development'] as unknown,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};
