/**
 * Server Action Response Mock Utilities
 *
 * Provides mock response factories for testing server action results.
 * Consolidates patterns from store-test-utils.ts and various test files.
 */

import { vi } from 'vitest';
import type { ActionResponse, TaskResponse } from '@/app/actions/tasks';
import type { CreateTaskData, StoreTask } from '@/store/kanban';
import { createPrismaTaskResponse, createTaskResponse } from '../factories/task';

// ============================================================================
// Generic Response Mocks
// ============================================================================

/**
 * Creates a successful ActionResponse with the given data.
 */
export function mockServerSuccess<T>(data: T): ActionResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates a failed ActionResponse with the given error message.
 */
export function mockServerError(error = 'Server error'): ActionResponse {
  return {
    success: false,
    error,
  };
}

/**
 * Mock successful API response (legacy format for compatibility).
 */
export const mockSuccessResponse = <T>(data: T) => ({
  success: true as const,
  data,
});

/**
 * Mock error API response (legacy format for compatibility).
 */
export const mockErrorResponse = (error: string) => ({
  success: false as const,
  error,
});

// ============================================================================
// Task Server Action Mocks
// ============================================================================

/**
 * Creates a mock server action that returns a successful create response.
 * Returns the task with a new server-generated ID.
 */
export function createMockCreateTaskSuccess(serverId?: string) {
  return vi.fn().mockImplementation(async (data: CreateTaskData) => {
    const id = serverId ?? `server-${Date.now()}`;
    const task = createPrismaTaskResponse({
      id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      tags: data.tags,
      columnId: data.columnId,
      categories: data.categories,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      dueTime: data.dueTime ?? null,
      isAllDay: data.isAllDay,
    });
    return mockServerSuccess(task);
  });
}

/**
 * Creates a mock server action that returns an error response.
 */
export function createMockCreateTaskError(errorMessage = 'Database error') {
  return vi.fn().mockResolvedValue(mockServerError(errorMessage));
}

/**
 * Creates a mock server action that throws an exception.
 */
export function createMockCreateTaskException(error: Error | string = new Error('Network error')) {
  return vi.fn().mockRejectedValue(typeof error === 'string' ? new Error(error) : error);
}

/**
 * Creates a mock update task action that returns success.
 */
export function createMockUpdateTaskSuccess() {
  return vi.fn().mockImplementation(async (id: string, updates: Partial<StoreTask>) => {
    const task = createPrismaTaskResponse({
      id,
      title: updates.title ?? 'Updated Task',
      description: updates.description ?? '',
      priority: updates.priority ?? 'MEDIUM',
      tags: updates.tags ?? [],
      columnId: updates.columnId ?? 'TODO',
      categories: updates.categories ?? [],
      dueDate: updates.dueDate ? new Date(updates.dueDate) : null,
      dueTime: updates.dueTime ?? null,
      isAllDay: updates.isAllDay ?? true,
      ownerName: updates.ownerName ?? 'Test User',
      ownerEmail: updates.ownerEmail ?? 'test@example.com',
    });
    return mockServerSuccess(task);
  });
}

/**
 * Creates a mock delete task action that returns success.
 */
export function createMockDeleteTaskSuccess() {
  return vi.fn().mockResolvedValue({ success: true });
}

/**
 * Creates a mock delete task action that returns an error.
 */
export function createMockDeleteTaskError(errorMessage = 'Delete failed') {
  return vi.fn().mockResolvedValue(mockServerError(errorMessage));
}

/**
 * Creates a mock move task action that returns success.
 */
export function createMockMoveTaskSuccess() {
  return vi.fn().mockImplementation(async (input: { taskId: string; newColumnId: string }) => {
    const task = createPrismaTaskResponse({
      id: input.taskId,
      title: 'Moved Task',
      columnId: input.newColumnId as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
    });
    return mockServerSuccess(task);
  });
}

/**
 * Creates a mock get tasks action that returns the specified tasks.
 */
export function createMockGetTasksSuccess(tasks: TaskResponse[] = []) {
  return vi.fn().mockResolvedValue(mockServerSuccess(tasks));
}

/**
 * Creates a mock get tasks action that returns an error.
 */
export function createMockGetTasksError(errorMessage = 'Failed to fetch tasks') {
  return vi.fn().mockResolvedValue(mockServerError(errorMessage));
}

// ============================================================================
// Label Server Action Mocks
// ============================================================================

/**
 * Creates a mock create label action that returns success.
 */
export function createMockCreateLabelSuccess(labelId = 'test-label-id') {
  return vi.fn().mockResolvedValue(
    mockServerSuccess({
      id: labelId,
      name: 'Test Label',
      color: '#3B82F6',
    })
  );
}

/**
 * Creates a mock get labels action that returns success.
 */
export function createMockGetLabelsSuccess(labels: Array<{ id: string; name: string; color: string }> = []) {
  return vi.fn().mockResolvedValue(mockServerSuccess(labels));
}

// ============================================================================
// Search Action Mocks
// ============================================================================

/**
 * Creates a mock search tasks action that returns success.
 */
export function createMockSearchTasksSuccess(tasks: TaskResponse[] = [], total = 0) {
  return vi.fn().mockResolvedValue(
    mockServerSuccess({
      tasks,
      total,
    })
  );
}

/**
 * Creates a mock search tasks action that returns an error.
 */
export function createMockSearchTasksError(errorMessage = 'Search failed') {
  return vi.fn().mockResolvedValue(mockServerError(errorMessage));
}
