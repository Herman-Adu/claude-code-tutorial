/**
 * Test Utilities Barrel Export
 *
 * Central export point for all test utilities.
 * Import from '@test-utils' in test files.
 */

// ============================================================================
// Factory Exports
// ============================================================================

// Task factories
export {
  // ID generation
  generateTestId,
  resetTaskIdCounter,
  generateRandomId,
  // Frontend task factory
  createMockTask,
  createMockTasks,
  // Store task factory
  createStoreTask,
  createStoreTasks,
  // Database task factory
  createMockDbTask,
  createMockDbTasks,
  // Input factory
  createTaskInput,
  // Response factory
  createTaskResponse,
  createPrismaTaskResponse,
  // Constants
  VALID_UUID,
  VALID_UUID_2,
  INVALID_UUID,
} from './factories/task';

// Label factories
export {
  // ID generation
  generateLabelId,
  resetLabelIdCounter,
  // Label factories
  createMockLabel,
  createMockLabels,
  createStoreLabel,
  createLabelInput,
  // Constants
  LABEL_COLOR_PRESETS,
  VALID_LABEL_ID,
  VALID_LABEL_ID_2,
  VALID_TASK_ID,
  // Types
  type MockLabel,
  type MockDbLabel,
  type CreateLabelInput,
} from './factories/label';

// User/session factories
export {
  // Constants
  MOCK_USER_ID,
  OTHER_USER_ID,
  // Factory functions
  createMockUser,
  createMockSession,
  createExpiredSession,
  createNullUserSession,
  // Default instances
  mockSession,
  mockUser,
  // Types
  type MockUser,
  type MockSession,
} from './factories/user';

// ============================================================================
// Mock Exports
// ============================================================================

// Prisma mocks
export {
  // Factory functions
  createMockPrisma,
  createMockPrismaTask,
  createMockPrismaLabel,
  createMockPrismaTaskLabel,
  createMockPrismaSavedFilterPreset,
  resetMockPrisma,
  // Error helpers
  createPrismaNotFoundError,
  createPrismaUniqueError,
  createPrismaForeignKeyError,
  createPrismaUnknownError,
  // Types
  type MockPrismaClient,
  type MockPrismaTask,
  type MockPrismaLabel,
  type MockPrismaTaskLabel,
  type MockPrismaSavedFilterPreset,
} from './mocks/prisma';

// Auth mocks
export {
  createMockAuth,
  createAuthenticatedAuth,
  createUnauthenticatedAuth,
  createExpiredAuth,
  createNullUserAuth,
  setupAuthenticatedMock,
  setupUnauthenticatedMock,
  setupExpiredSessionMock,
  setupCustomSessionMock,
  type MockAuthFn,
} from './mocks/auth';

// Server action mocks
export {
  // Generic responses
  mockServerSuccess,
  mockServerError,
  mockSuccessResponse,
  mockErrorResponse,
  // Task action mocks
  createMockCreateTaskSuccess,
  createMockCreateTaskError,
  createMockCreateTaskException,
  createMockUpdateTaskSuccess,
  createMockDeleteTaskSuccess,
  createMockDeleteTaskError,
  createMockMoveTaskSuccess,
  createMockGetTasksSuccess,
  createMockGetTasksError,
  // Label action mocks
  createMockCreateLabelSuccess,
  createMockGetLabelsSuccess,
  // Search action mocks
  createMockSearchTasksSuccess,
  createMockSearchTasksError,
} from './mocks/server-actions';

// LocalStorage mocks
export {
  createMockLocalStorage,
  createMockLocalStorageWithData,
  installMockLocalStorage,
  clearMockLocalStorage,
  type MockLocalStorage,
} from './mocks/local-storage';

// ============================================================================
// Assertion/Helper Exports
// ============================================================================

// Store assertions
export {
  // Wait utilities
  waitForStoreCondition,
  waitForLoadingComplete,
  waitForTaskCount,
  waitForError,
  waitForTask,
  waitForTaskRemoved,
  // State getters
  getStoreState,
  getTasksByColumn,
  getTaskById,
  taskExists,
  getTaskIds,
  getColumnTaskIds,
  getStoreError,
  isStoreLoading,
  isStoreHydrated,
  // Store reset utilities
  resetStore,
  resetStoreWithTasks,
  setStoreError,
  setStoreLoading,
} from './assertions/store';

// ============================================================================
// Common Test Utilities
// ============================================================================

/**
 * Wait for a specified amount of time (useful for async tests).
 */
export const waitFor = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
