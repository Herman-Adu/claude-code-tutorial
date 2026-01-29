/**
 * Test Data Fixtures
 *
 * Provides mock task data, XSS payloads, and invalid inputs for testing server actions.
 */

import type { Priority, ColumnId } from '@/generated/prisma/enums';
import type { TaskResponse } from '@/app/actions/tasks';

// ============================================================================
// Constants
// ============================================================================

/**
 * Valid UUID for testing - matches UUID format requirements.
 */
export const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440000';
export const VALID_TARGET_TASK_ID = '550e8400-e29b-41d4-a716-446655440001';

// ============================================================================
// Mock Task Data
// ============================================================================

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

// ============================================================================
// XSS Test Data
// ============================================================================

/**
 * Collection of XSS attack payloads for security testing.
 * These should all be sanitized by the sanitizeString function.
 */
export const xssPayloads: string[] = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  'javascript:alert("xss")',
  '<svg onload=alert("xss")>',
  '<iframe src="javascript:alert(\'xss\')">',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
];

/**
 * Expected sanitized versions of XSS payloads.
 * Used to verify sanitization worked correctly.
 */
export const sanitizedXssPayloads: string[] = [
  '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;',
  '&lt;img src=x onerror=alert(&quot;xss&quot;)&gt;',
  'javascript:alert(&quot;xss&quot;)',
  '&lt;svg onload=alert(&quot;xss&quot;)&gt;',
  '&lt;iframe src=&quot;javascript:alert(&#x27;xss&#x27;)&quot;&gt;',
  '&quot;&gt;&lt;script&gt;alert(String.fromCharCode(88,83,83))&lt;&#x2F;script&gt;',
];

// ============================================================================
// Invalid Input Data (for validation error testing)
// ============================================================================

/**
 * Type for invalid inputs that intentionally violate CreateTaskInput constraints.
 * Uses Record<string, unknown> to allow any shape of invalid data for testing.
 * These inputs are designed to fail Zod validation at runtime.
 */
type InvalidTaskInput = Record<string, unknown>;

/**
 * Invalid input data for validation testing.
 * Each object represents data that should fail validation at runtime.
 * Note: TypeScript allows these inputs but Zod validation catches errors at runtime.
 */
export const invalidInputs: Record<string, InvalidTaskInput> = {
  emptyTitle: {
    title: '',
    description: 'Valid description',
    columnId: 'TODO',
  },
  tooLongTitle: {
    title: 'a'.repeat(256),
    description: 'Valid description',
    columnId: 'TODO',
  },
  invalidPriority: {
    title: 'Valid title',
    description: 'Valid description',
    priority: 'INVALID_PRIORITY',
    columnId: 'TODO',
  },
  invalidColumnId: {
    title: 'Valid title',
    description: 'Valid description',
    columnId: 'INVALID_COLUMN',
  },
  tooManyTags: {
    title: 'Valid title',
    description: 'Valid description',
    columnId: 'TODO',
    tags: Array(15).fill('tag') as string[],
  },
  tooLongTag: {
    title: 'Valid title',
    description: 'Valid description',
    columnId: 'TODO',
    tags: ['a'.repeat(50)],
  },
};

// ============================================================================
// Valid Input Data (for success case testing)
// ============================================================================

/**
 * Type for valid test inputs - allows partial data since Zod applies defaults.
 * Only title is truly required; other fields have schema defaults.
 */
type ValidTaskTestInput = {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  columnId?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  tags?: string[];
  categories?: string[];
  dueDate?: string | null;
  dueTime?: string | null;
  isAllDay?: boolean;
};

/**
 * Valid task creation inputs for positive test cases.
 * These conform to CreateTaskInput schema and should pass validation.
 * Fields with defaults in the schema can be omitted.
 */
export const validInputs: {
  minimal: ValidTaskTestInput;
  complete: ValidTaskTestInput;
  specialCharacters: ValidTaskTestInput;
} = {
  minimal: {
    title: 'Minimal Task',
    columnId: 'TODO',
  },
  complete: {
    title: 'Complete Task',
    description: 'A fully specified task with all optional fields',
    priority: 'HIGH',
    columnId: 'IN_PROGRESS',
    tags: ['feature', 'urgent'],
    categories: ['frontend', 'ui'],
  },
  specialCharacters: {
    title: 'Task with émojis 🚀 and spëcial çharacters',
    description: 'Description with newlines\nand tabs\ttoo',
    columnId: 'TODO',
  },
};

// ============================================================================
// Prisma Error Mocks
// ============================================================================

/**
 * Prisma error codes for testing error handling.
 */
export const prismaErrors = {
  notFound: { code: 'P2025', message: 'Record not found' },
  uniqueConstraint: { code: 'P2002', message: 'Unique constraint failed' },
  foreignKeyConstraint: { code: 'P2003', message: 'Foreign key constraint failed' },
  recordNotFound: { code: 'P2016', message: 'Record not found in database' },
} as const;

// ============================================================================
// Mock Prisma Records
// ============================================================================

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
