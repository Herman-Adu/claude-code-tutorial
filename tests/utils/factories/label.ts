/**
 * Label Factory Utilities
 *
 * Provides factory functions for creating test labels in different formats.
 */

import { VALID_UUID } from './task';

// ============================================================================
// Types
// ============================================================================

/**
 * Label as returned from the store/frontend.
 */
export interface MockLabel {
  id: string;
  name: string;
  color: string;
  taskCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Label as stored in the database (Prisma format).
 */
export interface MockDbLabel {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { tasks: number };
}

/**
 * Input for creating a new label.
 */
export interface CreateLabelInput {
  name: string;
  color: string;
}

// ============================================================================
// Label ID Generation
// ============================================================================

let labelIdCounter = 0;

/**
 * Generates a unique label ID for test labels.
 */
export function generateLabelId(): string {
  labelIdCounter++;
  return `test-label-${labelIdCounter}`;
}

/**
 * Resets the label ID counter.
 * Call this in beforeEach() for consistent IDs across tests.
 */
export function resetLabelIdCounter(): void {
  labelIdCounter = 0;
}

// ============================================================================
// Label Factories
// ============================================================================

/**
 * Valid label color presets.
 */
export const LABEL_COLOR_PRESETS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'] as const;

/**
 * Creates a mock label for frontend/store testing.
 */
export function createMockLabel(overrides?: Partial<MockLabel>): MockLabel {
  const id = overrides?.id ?? generateLabelId();
  const now = new Date().toISOString();

  return {
    id,
    name: `Test Label ${id}`,
    color: 'blue',
    taskCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates multiple mock labels.
 */
export function createMockLabels(count: number, overrides?: Partial<MockLabel>): MockLabel[] {
  return Array.from({ length: count }, (_, i) =>
    createMockLabel({
      id: `test-label-${i + 1}`,
      name: `Label ${i + 1}`,
      color: LABEL_COLOR_PRESETS[i % LABEL_COLOR_PRESETS.length],
      ...overrides,
    })
  );
}

/**
 * Creates a mock label in database format (Prisma).
 */
export function createStoreLabel(overrides?: Partial<MockDbLabel>): MockDbLabel {
  const id = overrides?.id ?? generateLabelId();
  const now = new Date();

  return {
    id,
    name: `Test Label ${id}`,
    color: 'blue',
    userId: 'user-123-456',
    createdAt: now,
    updatedAt: now,
    _count: { tasks: 0 },
    ...overrides,
  };
}

/**
 * Creates a label input for create operations.
 */
export function createLabelInput(overrides?: Partial<CreateLabelInput>): CreateLabelInput {
  return {
    name: 'New Label',
    color: 'blue',
    ...overrides,
  };
}

// ============================================================================
// Valid Label UUIDs
// ============================================================================

export const VALID_LABEL_ID = VALID_UUID;
export const VALID_LABEL_ID_2 = '550e8400-e29b-41d4-a716-446655440002';
export const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440003';
