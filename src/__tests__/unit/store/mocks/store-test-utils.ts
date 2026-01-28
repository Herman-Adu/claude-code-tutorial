/**
 * Store Test Utilities
 *
 * Helper functions for testing the Kanban Zustand store.
 * Provides utilities for resetting state, creating test data,
 * mocking server responses, and async state assertions.
 */

import { vi } from 'vitest';
import { useKanbanStore, type StoreTask, type CreateTaskData } from '@/store/kanban';
import type { ActionResponse, TaskResponse } from '@/app/actions/tasks';

// ============================================================================
// Store Reset Utilities
// ============================================================================

/**
 * Resets the store to its initial clean state.
 * Call this in beforeEach() to ensure test isolation.
 */
export function resetStore(): void {
  useKanbanStore.setState({
    tasks: [],
    isHydrated: false,
    isLoading: false,
    error: null,
  });
}

/**
 * Resets the store and sets it as hydrated with optional initial tasks.
 * Useful for tests that need a ready-to-use store.
 */
export function resetStoreWithTasks(tasks: StoreTask[] = []): void {
  useKanbanStore.setState({
    tasks,
    isHydrated: true,
    isLoading: false,
    error: null,
  });
}

// ============================================================================
// Task Factory Functions
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
 * Creates a StoreTask with sensible defaults.
 * Override any field by passing it in the overrides object.
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
    ...overrides,
  };
}

/**
 * Creates CreateTaskData (input for addTask) with sensible defaults.
 */
export function createTaskInput(overrides: Partial<CreateTaskData> = {}): CreateTaskData {
  return {
    title: 'New Test Task',
    description: 'New task description',
    priority: 'MEDIUM',
    tags: [],
    columnId: 'TODO',
    categories: [],
    ...overrides,
  };
}

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

// ============================================================================
// Mock Server Response Helpers
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
export function mockServerError(error: string = 'Server error'): ActionResponse {
  return {
    success: false,
    error,
  };
}

/**
 * Creates a mock server action that returns a successful response.
 * Returns the task with a new server-generated ID.
 */
export function createMockCreateTaskSuccess(serverId?: string) {
  return vi.fn().mockImplementation(async (data: CreateTaskData) => {
    const id = serverId ?? `server-${Date.now()}`;
    const now = new Date();
    const task: TaskResponse = {
      ...data,
      id,
      dueDate: null,
      dueTime: null,
      isAllDay: true,
      createdAt: now,
      updatedAt: now,
      ownerName: 'Test User',
      ownerEmail: 'test@example.com',
    };
    return mockServerSuccess(task);
  });
}

/**
 * Creates a mock server action that returns an error response.
 */
export function createMockCreateTaskError(errorMessage: string = 'Database error') {
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
    const now = new Date();
    const task: TaskResponse = {
      id,
      title: updates.title ?? 'Updated Task',
      description: updates.description ?? '',
      priority: updates.priority ?? 'MEDIUM',
      tags: updates.tags ?? [],
      columnId: updates.columnId ?? 'TODO',
      categories: updates.categories ?? [],
      dueDate: null,
      dueTime: null,
      isAllDay: true,
      createdAt: now,
      updatedAt: now,
      ownerName: updates.ownerName ?? 'Test User',
      ownerEmail: updates.ownerEmail ?? 'test@example.com',
    };
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
 * Creates a mock move task action that returns success.
 */
export function createMockMoveTaskSuccess() {
  return vi.fn().mockImplementation(async (input: { taskId: string; newColumnId: string }) => {
    const now = new Date();
    const task: TaskResponse = {
      id: input.taskId,
      title: 'Moved Task',
      description: '',
      priority: 'MEDIUM',
      tags: [],
      columnId: input.newColumnId as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
      categories: [],
      dueDate: null,
      dueTime: null,
      isAllDay: true,
      createdAt: now,
      updatedAt: now,
      ownerName: 'Test User',
      ownerEmail: 'test@example.com',
    };
    return mockServerSuccess(task);
  });
}

// ============================================================================
// Async State Waiting Utilities
// ============================================================================

/**
 * Waits for a store condition to become true.
 * Polls the store state at regular intervals until the predicate returns true
 * or the timeout is reached.
 *
 * @param predicate - Function that receives store state and returns boolean
 * @param timeout - Maximum time to wait in milliseconds (default: 1000)
 * @param interval - Polling interval in milliseconds (default: 10)
 * @throws Error if timeout is reached before condition is met
 */
export async function waitForStoreCondition(
  predicate: (state: ReturnType<typeof useKanbanStore.getState>) => boolean,
  timeout: number = 1000,
  interval: number = 10
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (predicate(useKanbanStore.getState())) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for store condition after ${timeout}ms`);
}

/**
 * Waits for the store to finish loading.
 */
export async function waitForLoadingComplete(timeout: number = 1000): Promise<void> {
  await waitForStoreCondition((state) => !state.isLoading, timeout);
}

/**
 * Waits for a specific number of tasks to be in the store.
 */
export async function waitForTaskCount(count: number, timeout: number = 1000): Promise<void> {
  await waitForStoreCondition((state) => state.tasks.length === count, timeout);
}

/**
 * Waits for an error to be set in the store.
 */
export async function waitForError(timeout: number = 1000): Promise<string | null> {
  await waitForStoreCondition((state) => state.error !== null, timeout);
  return useKanbanStore.getState().error;
}

// ============================================================================
// State Assertion Helpers
// ============================================================================

/**
 * Gets the current store state for assertions.
 */
export function getStoreState() {
  return useKanbanStore.getState();
}

/**
 * Gets tasks filtered by column ID.
 */
export function getTasksByColumn(columnId: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'): StoreTask[] {
  return useKanbanStore.getState().tasks.filter((t) => t.columnId === columnId);
}

/**
 * Gets a task by ID or undefined if not found.
 */
export function getTaskById(id: string): StoreTask | undefined {
  return useKanbanStore.getState().tasks.find((t) => t.id === id);
}

/**
 * Checks if a task exists in the store.
 */
export function taskExists(id: string): boolean {
  return useKanbanStore.getState().tasks.some((t) => t.id === id);
}

/**
 * Gets the task IDs in order (useful for verifying reordering).
 */
export function getTaskIds(): string[] {
  return useKanbanStore.getState().tasks.map((t) => t.id);
}

/**
 * Gets task IDs for a specific column in order.
 */
export function getColumnTaskIds(columnId: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'): string[] {
  return useKanbanStore
    .getState()
    .tasks.filter((t) => t.columnId === columnId)
    .map((t) => t.id);
}
