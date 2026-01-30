/**
 * Task Factory Utilities
 *
 * Provides factory functions for creating test tasks in different formats:
 * - Frontend format (lowercase enums, ISO string dates)
 * - Store format (uppercase enums for Zustand store)
 * - Database format (uppercase enums, Date objects)
 * - Input format (for creating new tasks)
 *
 * These factories consolidate functionality from:
 * - tests/utils/testHelpers.ts
 * - src/__tests__/unit/store/mocks/store-test-utils.ts
 */

import type { Task, Priority, ColumnId, DbTask, DbPriority, DbColumnId } from '@/types';
import type { StoreTask, CreateTaskData } from '@/store/kanban';
import type { TaskResponse } from '@/app/actions/tasks';

// ============================================================================
// ID Generation
// ============================================================================

let taskIdCounter = 0;

/**
 * Generates a unique task ID for test tasks.
 * Uses a counter to ensure uniqueness across test runs.
 */
export function generateTestId(): string {
  taskIdCounter++;
  return `test-task-${taskIdCounter}`;
}

/**
 * Resets the task ID counter.
 * Call this in beforeEach() for consistent IDs across tests.
 */
export function resetTaskIdCounter(): void {
  taskIdCounter = 0;
}

/**
 * Generates a random timestamp-based ID.
 * Useful when unique IDs per call are needed.
 */
export function generateRandomId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// Frontend Task Factory (lowercase enums)
// ============================================================================

/**
 * Creates a task in frontend format (lowercase enums, ISO string dates).
 * Used for UI component testing.
 */
export function createMockTask(overrides?: Partial<Task>): Task {
  const id = overrides?.id ?? generateRandomId();
  const now = new Date().toISOString();

  return {
    id,
    title: 'Test Task',
    description: 'Test description',
    priority: 'medium' as Priority,
    tags: ['test'],
    categories: ['Testing'],
    columnId: 'todo' as ColumnId,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates multiple tasks in frontend format.
 */
export function createMockTasks(count: number, overrides?: Partial<Task>): Task[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTask({
      id: `test-${i}`,
      title: `Task ${i + 1}`,
      ...overrides,
    })
  );
}

// ============================================================================
// Store Task Factory (uppercase enums for Zustand)
// ============================================================================

/**
 * Creates a StoreTask with sensible defaults.
 * Used for Zustand store testing.
 */
export function createStoreTask(overrides: Partial<StoreTask> = {}): StoreTask {
  const id = overrides.id ?? generateTestId();
  const now = new Date().toISOString();

  return {
    id,
    title: `Test Task ${id}`,
    description: 'Test description',
    priority: 'MEDIUM',
    tags: [],
    columnId: 'TODO',
    categories: [],
    createdAt: now,
    updatedAt: now,
    isAllDay: true,
    ...overrides,
  };
}

/**
 * Creates multiple store tasks.
 */
export function createStoreTasks(count: number, overrides?: Partial<StoreTask>): StoreTask[] {
  return Array.from({ length: count }, (_, i) =>
    createStoreTask({
      id: `test-task-${i + 1}`,
      title: `Task ${i + 1}`,
      ...overrides,
    })
  );
}

// ============================================================================
// Database Task Factory (Prisma format)
// ============================================================================

/**
 * Creates a task in database format (uppercase enums, Date objects).
 * Used for server action and Prisma testing.
 */
export function createMockDbTask(overrides?: Partial<DbTask>): DbTask {
  const id = overrides?.id ?? generateRandomId();
  const now = new Date();

  return {
    id,
    title: 'Test Task',
    description: 'Test description',
    priority: 'MEDIUM' as DbPriority,
    tags: ['test'],
    categories: ['Testing'],
    columnId: 'TODO' as DbColumnId,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates multiple database tasks.
 */
export function createMockDbTasks(count: number, overrides?: Partial<DbTask>): DbTask[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDbTask({
      id: `test-${i}`,
      title: `Task ${i + 1}`,
      ...overrides,
    })
  );
}

// ============================================================================
// Task Input Factory (for creating new tasks)
// ============================================================================

/**
 * Creates CreateTaskData (input for addTask) with sensible defaults.
 * Used for testing task creation flows.
 */
export function createTaskInput(overrides: Partial<CreateTaskData> = {}): CreateTaskData {
  return {
    title: 'New Test Task',
    description: 'New task description',
    priority: 'MEDIUM',
    tags: [],
    columnId: 'TODO',
    categories: [],
    isAllDay: true,
    ...overrides,
  };
}

// ============================================================================
// Task Response Factory (server response format)
// ============================================================================

/**
 * Creates a TaskResponse (server response format) from a StoreTask.
 * Converts string dates to Date objects.
 */
export function createTaskResponse(task: StoreTask): TaskResponse {
  return {
    ...task,
    dueDate: null,
    dueTime: null,
    isAllDay: true,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
    ownerName: task.ownerName ?? null,
    ownerEmail: task.ownerEmail ?? '',
  };
}

/**
 * Creates a full TaskResponse with Prisma-style structure.
 * Used for mocking server action responses.
 */
export function createPrismaTaskResponse(overrides?: Partial<TaskResponse>): TaskResponse {
  const now = new Date();

  return {
    id: generateRandomId(),
    title: 'Test Task',
    description: 'Test description',
    priority: 'MEDIUM',
    columnId: 'TODO',
    tags: [],
    categories: [],
    dueDate: null,
    dueTime: null,
    isAllDay: true,
    createdAt: now,
    updatedAt: now,
    ownerName: 'Test User',
    ownerEmail: 'test@example.com',
    ...overrides,
  };
}

// ============================================================================
// Valid UUID Constants
// ============================================================================

/**
 * A valid UUID for testing UUID validation.
 */
export const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * A second valid UUID for testing multi-task operations.
 */
export const VALID_UUID_2 = '550e8400-e29b-41d4-a716-446655440001';

/**
 * An invalid UUID for testing validation.
 */
export const INVALID_UUID = 'not-a-valid-uuid';
