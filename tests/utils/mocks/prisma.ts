/**
 * Prisma Mock Utilities
 *
 * Provides mock Prisma client for testing server actions in isolation.
 * Consolidates Prisma mocking patterns used across test files.
 */

import { vi } from 'vitest';

// ============================================================================
// Types
// ============================================================================

/**
 * Mock Prisma task model with all common methods.
 */
export interface MockPrismaTask {
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
}

/**
 * Mock Prisma label model with all common methods.
 */
export interface MockPrismaLabel {
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
}

/**
 * Mock Prisma taskLabel model.
 */
export interface MockPrismaTaskLabel {
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
}

/**
 * Mock Prisma savedFilterPreset model.
 */
export interface MockPrismaSavedFilterPreset {
  create: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

/**
 * Complete mock Prisma client interface.
 */
export interface MockPrismaClient {
  task: MockPrismaTask;
  label: MockPrismaLabel;
  taskLabel: MockPrismaTaskLabel;
  savedFilterPreset: MockPrismaSavedFilterPreset;
  $connect: ReturnType<typeof vi.fn>;
  $disconnect: ReturnType<typeof vi.fn>;
  $transaction: ReturnType<typeof vi.fn>;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a mock Prisma task model.
 */
export function createMockPrismaTask(): MockPrismaTask {
  return {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
  };
}

/**
 * Creates a mock Prisma label model.
 */
export function createMockPrismaLabel(): MockPrismaLabel {
  return {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  };
}

/**
 * Creates a mock Prisma taskLabel model.
 */
export function createMockPrismaTaskLabel(): MockPrismaTaskLabel {
  return {
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  };
}

/**
 * Creates a mock Prisma savedFilterPreset model.
 */
export function createMockPrismaSavedFilterPreset(): MockPrismaSavedFilterPreset {
  return {
    create: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  };
}

/**
 * Creates a complete mock Prisma client with all models.
 */
export function createMockPrisma(): MockPrismaClient {
  return {
    task: createMockPrismaTask(),
    label: createMockPrismaLabel(),
    taskLabel: createMockPrismaTaskLabel(),
    savedFilterPreset: createMockPrismaSavedFilterPreset(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
  };
}

/**
 * Resets all mock functions in a Prisma client mock.
 */
export function resetMockPrisma(mock: MockPrismaClient): void {
  // Reset task methods
  Object.values(mock.task).forEach((fn) => fn.mockReset());
  // Reset label methods
  Object.values(mock.label).forEach((fn) => fn.mockReset());
  // Reset taskLabel methods
  Object.values(mock.taskLabel).forEach((fn) => fn.mockReset());
  // Reset savedFilterPreset methods
  Object.values(mock.savedFilterPreset).forEach((fn) => fn.mockReset());
  // Reset client methods
  mock.$connect.mockReset();
  mock.$disconnect.mockReset();
  mock.$transaction.mockReset();
}

// ============================================================================
// Prisma Error Helpers
// ============================================================================

/**
 * Creates a Prisma P2025 (record not found) error.
 */
export function createPrismaNotFoundError(message = 'Record not found'): Error {
  return Object.assign(new Error(message), { code: 'P2025' });
}

/**
 * Creates a Prisma P2002 (unique constraint violation) error.
 */
export function createPrismaUniqueError(message = 'Unique constraint failed'): Error {
  return Object.assign(new Error(message), { code: 'P2002' });
}

/**
 * Creates a Prisma P2003 (foreign key constraint) error.
 */
export function createPrismaForeignKeyError(message = 'Foreign key constraint failed'): Error {
  return Object.assign(new Error(message), { code: 'P2003' });
}

/**
 * Creates an unknown Prisma error.
 */
export function createPrismaUnknownError(code = 'P9999', message = 'Unknown error'): Error {
  return Object.assign(new Error(message), { code });
}
