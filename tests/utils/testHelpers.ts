import { type Task, type Priority, type ColumnId, type DbTask, type DbPriority, type DbColumnId } from '@/types';

/**
 * Factory function for creating test tasks (frontend format)
 */
export function createMockTask(overrides?: Partial<Task>): Task {
  const id = `test-${Date.now()}-${Math.random()}`;
  return {
    id,
    title: 'Test Task',
    description: 'Test description',
    priority: 'medium' as Priority,
    tags: ['test'],
    categories: ['Testing'],
    columnId: 'todo' as ColumnId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Factory function for creating test tasks (database format)
 */
export function createMockDbTask(overrides?: Partial<DbTask>): DbTask {
  const id = `test-${Date.now()}-${Math.random()}`;
  return {
    id,
    title: 'Test Task',
    description: 'Test description',
    priority: 'MEDIUM' as DbPriority,
    tags: ['test'],
    categories: ['Testing'],
    columnId: 'TODO' as DbColumnId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Factory for creating multiple tasks
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

/**
 * Factory for creating multiple database tasks
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

/**
 * Mock successful API response
 */
export const mockSuccessResponse = <T>(data: T) => ({
  success: true as const,
  data,
});

/**
 * Mock error API response
 */
export const mockErrorResponse = (error: string) => ({
  success: false as const,
  error,
});

/**
 * Wait for a specified amount of time (useful for async tests)
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock localStorage for tests
 */
export const createMockLocalStorage = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
};
