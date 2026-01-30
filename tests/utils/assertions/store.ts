/**
 * Store Assertion Helpers
 *
 * Provides utility functions for testing Zustand stores,
 * particularly the Kanban store with async operations.
 */

import { useKanbanStore, type StoreTask } from '@/store/kanban';

// ============================================================================
// Wait Utilities
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
  timeout = 1000,
  interval = 10
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
export async function waitForLoadingComplete(timeout = 1000): Promise<void> {
  await waitForStoreCondition((state) => !state.isLoading, timeout);
}

/**
 * Waits for a specific number of tasks to be in the store.
 */
export async function waitForTaskCount(count: number, timeout = 1000): Promise<void> {
  await waitForStoreCondition((state) => state.tasks.length === count, timeout);
}

/**
 * Waits for an error to be set in the store.
 */
export async function waitForError(timeout = 1000): Promise<string | null> {
  await waitForStoreCondition((state) => state.error !== null, timeout);
  return useKanbanStore.getState().error;
}

/**
 * Waits for a specific task to exist in the store.
 */
export async function waitForTask(taskId: string, timeout = 1000): Promise<StoreTask | undefined> {
  await waitForStoreCondition((state) => state.tasks.some((t) => t.id === taskId), timeout);
  return useKanbanStore.getState().tasks.find((t) => t.id === taskId);
}

/**
 * Waits for a task to be removed from the store.
 */
export async function waitForTaskRemoved(taskId: string, timeout = 1000): Promise<void> {
  await waitForStoreCondition((state) => !state.tasks.some((t) => t.id === taskId), timeout);
}

// ============================================================================
// State Getters
// ============================================================================

/**
 * Gets the current store state for assertions.
 */
export function getStoreState(): ReturnType<typeof useKanbanStore.getState> {
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

/**
 * Gets the current error state.
 */
export function getStoreError(): string | null {
  return useKanbanStore.getState().error;
}

/**
 * Gets the current loading state.
 */
export function isStoreLoading(): boolean {
  return useKanbanStore.getState().isLoading;
}

/**
 * Gets the current hydration state.
 */
export function isStoreHydrated(): boolean {
  return useKanbanStore.getState().isHydrated;
}

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
    searchQuery: '',
    filters: {},
    isSearching: false,
    searchResults: null,
    savedFilterPresets: [],
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
    searchQuery: '',
    filters: {},
    isSearching: false,
    searchResults: null,
    savedFilterPresets: [],
  });
}

/**
 * Sets the store error state.
 */
export function setStoreError(error: string | null): void {
  useKanbanStore.setState({ error });
}

/**
 * Sets the store loading state.
 */
export function setStoreLoading(loading: boolean): void {
  useKanbanStore.setState({ isLoading: loading });
}
