/**
 * Store Test Utilities
 *
 * Re-exports from @test-utils for backwards compatibility.
 * This file can be removed once all tests are migrated to use @test-utils directly.
 *
 * @deprecated Import directly from '@test-utils' instead.
 */

// Re-export everything from the consolidated test utilities
export {
  // Store reset utilities
  resetStore,
  resetStoreWithTasks,

  // Task factories
  generateTestId,
  resetTaskIdCounter,
  createStoreTask,
  createTaskInput,
  createTaskResponse,

  // Server action mocks
  mockServerSuccess,
  mockServerError,
  createMockCreateTaskSuccess,
  createMockCreateTaskError,
  createMockCreateTaskException,
  createMockUpdateTaskSuccess,
  createMockDeleteTaskSuccess,
  createMockMoveTaskSuccess,

  // Async state waiting utilities
  waitForStoreCondition,
  waitForLoadingComplete,
  waitForTaskCount,
  waitForError,

  // State getters
  getStoreState,
  getTasksByColumn,
  getTaskById,
  taskExists,
  getTaskIds,
  getColumnTaskIds,
} from '@test-utils';
