/**
 * Test Scenarios (Fixtures)
 *
 * Pre-built test data scenarios for Kanban store testing.
 * These fixtures provide consistent, predictable data for testing
 * specific behaviors like column filtering, reordering, and edge cases.
 */

import type { StoreTask } from '@/store/kanban';

// ============================================================================
// Base Timestamps
// ============================================================================

// Fixed timestamps for deterministic test data
const BASE_TIME = '2024-01-15T10:00:00.000Z';
const HOUR_MS = 3600000;

function offsetTime(hours: number): string {
  return new Date(new Date(BASE_TIME).getTime() + hours * HOUR_MS).toISOString();
}

// ============================================================================
// Multi-Column Scenarios
// ============================================================================

/**
 * Creates a scenario with tasks distributed across all three columns.
 * Useful for testing column filtering and cross-column moves.
 *
 * Layout:
 * - TODO: 2 tasks (task-1, task-2)
 * - IN_PROGRESS: 2 tasks (task-3, task-4)
 * - COMPLETED: 1 task (task-5)
 */
export function createMultiColumnScenario(): StoreTask[] {
  return [
    {
      id: 'task-1',
      title: 'Todo Task 1',
      description: 'First todo task',
      priority: 'HIGH',
      tags: ['urgent'],
      columnId: 'TODO',
      categories: ['feature'],
      createdAt: offsetTime(0),
      updatedAt: offsetTime(0),
    },
    {
      id: 'task-2',
      title: 'Todo Task 2',
      description: 'Second todo task',
      priority: 'MEDIUM',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(1),
      updatedAt: offsetTime(1),
    },
    {
      id: 'task-3',
      title: 'In Progress Task 1',
      description: 'First in-progress task',
      priority: 'HIGH',
      tags: ['bug'],
      columnId: 'IN_PROGRESS',
      categories: ['bugfix'],
      createdAt: offsetTime(2),
      updatedAt: offsetTime(2),
    },
    {
      id: 'task-4',
      title: 'In Progress Task 2',
      description: 'Second in-progress task',
      priority: 'LOW',
      tags: [],
      columnId: 'IN_PROGRESS',
      categories: [],
      createdAt: offsetTime(3),
      updatedAt: offsetTime(3),
    },
    {
      id: 'task-5',
      title: 'Completed Task 1',
      description: 'First completed task',
      priority: 'MEDIUM',
      tags: ['done'],
      columnId: 'COMPLETED',
      categories: [],
      createdAt: offsetTime(4),
      updatedAt: offsetTime(4),
    },
  ];
}

// ============================================================================
// Same-Column Scenarios (for Reordering Tests)
// ============================================================================

/**
 * Creates a scenario with multiple tasks in the same column.
 * Useful for testing within-column reordering.
 *
 * Layout:
 * - TODO: 5 tasks in order (reorder-1 through reorder-5)
 */
export function createSameColumnScenario(): StoreTask[] {
  return [
    {
      id: 'reorder-1',
      title: 'First Task',
      description: 'Position 1',
      priority: 'HIGH',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(0),
      updatedAt: offsetTime(0),
    },
    {
      id: 'reorder-2',
      title: 'Second Task',
      description: 'Position 2',
      priority: 'MEDIUM',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(1),
      updatedAt: offsetTime(1),
    },
    {
      id: 'reorder-3',
      title: 'Third Task',
      description: 'Position 3',
      priority: 'LOW',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(2),
      updatedAt: offsetTime(2),
    },
    {
      id: 'reorder-4',
      title: 'Fourth Task',
      description: 'Position 4',
      priority: 'HIGH',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(3),
      updatedAt: offsetTime(3),
    },
    {
      id: 'reorder-5',
      title: 'Fifth Task',
      description: 'Position 5',
      priority: 'MEDIUM',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(4),
      updatedAt: offsetTime(4),
    },
  ];
}

// ============================================================================
// Edge Case Scenarios
// ============================================================================

/**
 * Creates a scenario with a single task.
 * Useful for testing operations on minimal data.
 */
export function createSingleTaskScenario(): StoreTask[] {
  return [
    {
      id: 'single-1',
      title: 'Only Task',
      description: 'The only task in the board',
      priority: 'MEDIUM',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(0),
      updatedAt: offsetTime(0),
    },
  ];
}

/**
 * Creates an empty scenario (no tasks).
 * Useful for testing empty state operations.
 */
export function createEmptyScenario(): StoreTask[] {
  return [];
}

/**
 * Creates a scenario with only one column populated.
 * Useful for testing moves to empty columns.
 *
 * Layout:
 * - TODO: 3 tasks
 * - IN_PROGRESS: 0 tasks
 * - COMPLETED: 0 tasks
 */
export function createSingleColumnScenario(): StoreTask[] {
  return [
    {
      id: 'only-todo-1',
      title: 'Todo Only 1',
      description: 'Task 1',
      priority: 'HIGH',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(0),
      updatedAt: offsetTime(0),
    },
    {
      id: 'only-todo-2',
      title: 'Todo Only 2',
      description: 'Task 2',
      priority: 'MEDIUM',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(1),
      updatedAt: offsetTime(1),
    },
    {
      id: 'only-todo-3',
      title: 'Todo Only 3',
      description: 'Task 3',
      priority: 'LOW',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(2),
      updatedAt: offsetTime(2),
    },
  ];
}

/**
 * Creates a large dataset scenario for performance testing.
 * Contains 50 tasks distributed across columns.
 */
export function createLargeDatasetScenario(): StoreTask[] {
  const tasks: StoreTask[] = [];
  const columns: Array<'TODO' | 'IN_PROGRESS' | 'COMPLETED'> = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
  const priorities: Array<'LOW' | 'MEDIUM' | 'HIGH'> = ['LOW', 'MEDIUM', 'HIGH'];

  for (let i = 0; i < 50; i++) {
    tasks.push({
      id: `large-${i}`,
      title: `Large Dataset Task ${i}`,
      description: `Task description for item ${i}`,
      priority: priorities[i % 3],
      tags: i % 5 === 0 ? ['tagged'] : [],
      columnId: columns[i % 3],
      categories: [],
      createdAt: offsetTime(i),
      updatedAt: offsetTime(i),
    });
  }

  return tasks;
}

// ============================================================================
// Scenario with All Priorities
// ============================================================================

/**
 * Creates tasks with each priority level.
 * Useful for testing priority-related filtering or display.
 */
export function createPriorityScenario(): StoreTask[] {
  return [
    {
      id: 'priority-high',
      title: 'High Priority Task',
      description: 'Urgent task',
      priority: 'HIGH',
      tags: ['urgent'],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(0),
      updatedAt: offsetTime(0),
    },
    {
      id: 'priority-medium',
      title: 'Medium Priority Task',
      description: 'Normal task',
      priority: 'MEDIUM',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(1),
      updatedAt: offsetTime(1),
    },
    {
      id: 'priority-low',
      title: 'Low Priority Task',
      description: 'Low urgency task',
      priority: 'LOW',
      tags: [],
      columnId: 'TODO',
      categories: [],
      createdAt: offsetTime(2),
      updatedAt: offsetTime(2),
    },
  ];
}

// ============================================================================
// Scenario with Tags and Categories
// ============================================================================

/**
 * Creates tasks with various tags and categories.
 * Useful for testing tag/category filtering.
 */
export function createTaggedScenario(): StoreTask[] {
  return [
    {
      id: 'tagged-1',
      title: 'Bug Fix',
      description: 'Fix the login bug',
      priority: 'HIGH',
      tags: ['bug', 'urgent', 'frontend'],
      columnId: 'IN_PROGRESS',
      categories: ['bugfix', 'auth'],
      createdAt: offsetTime(0),
      updatedAt: offsetTime(0),
    },
    {
      id: 'tagged-2',
      title: 'Feature Development',
      description: 'Add new dashboard',
      priority: 'MEDIUM',
      tags: ['feature', 'frontend'],
      columnId: 'TODO',
      categories: ['feature', 'dashboard'],
      createdAt: offsetTime(1),
      updatedAt: offsetTime(1),
    },
    {
      id: 'tagged-3',
      title: 'Documentation',
      description: 'Update API docs',
      priority: 'LOW',
      tags: ['docs'],
      columnId: 'TODO',
      categories: ['documentation'],
      createdAt: offsetTime(2),
      updatedAt: offsetTime(2),
    },
  ];
}
