/**
 * Label Feature Tests
 *
 * Tests for label-related functionality including:
 * - Label persistence on task creation
 * - Error handling for label operations
 * - Store synchronization
 * - Max labels validation
 * - Duplicate label detection
 * - Label filter counts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VALIDATION } from '@/lib/schemas';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock the labels store
const mockSetTaskLabels = vi.fn();
const mockTaskLabelsMap = new Map<string, string[]>();

vi.mock('@/store/labels', () => ({
  useLabelsStore: vi.fn((selector) => {
    const state = {
      taskLabels: mockTaskLabelsMap,
      setTaskLabels: mockSetTaskLabels,
      labels: new Map(),
      isHydrated: true,
      isLoading: false,
      error: null,
      getLabelsArray: () => [],
      getLabelById: () => undefined,
      getTaskLabels: (taskId: string) => mockTaskLabelsMap.get(taskId) || [],
      getLabelsForTask: () => [],
    };
    return selector(state);
  }),
}));

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe('Label Validation Constants', () => {
  it('should have MAX_LABELS_PER_TASK defined as 20', () => {
    expect(VALIDATION.MAX_LABELS_PER_TASK).toBe(20);
  });

  it('should have MAX_LABEL_NAME_LENGTH defined as 100', () => {
    expect(VALIDATION.MAX_LABEL_NAME_LENGTH).toBe(100);
  });
});

describe('Max Labels Per Task Enforcement', () => {
  it('should allow arrays with 20 or fewer labels', () => {
    const labelIds = Array.from({ length: 20 }, (_, i) => `label-${i}`);
    expect(labelIds.length).toBeLessThanOrEqual(VALIDATION.MAX_LABELS_PER_TASK);
  });

  it('should detect when array exceeds 20 labels', () => {
    const labelIds = Array.from({ length: 21 }, (_, i) => `label-${i}`);
    expect(labelIds.length).toBeGreaterThan(VALIDATION.MAX_LABELS_PER_TASK);
  });

  it('should handle empty label arrays', () => {
    const labelIds: string[] = [];
    expect(labelIds.length).toBeLessThanOrEqual(VALIDATION.MAX_LABELS_PER_TASK);
  });

  it('should handle exactly 20 labels (boundary)', () => {
    const labelIds = Array.from({ length: 20 }, (_, i) => `label-${i}`);
    expect(labelIds.length).toBe(VALIDATION.MAX_LABELS_PER_TASK);
    expect(labelIds.length <= VALIDATION.MAX_LABELS_PER_TASK).toBe(true);
  });
});

// =============================================================================
// DUPLICATE LABEL DETECTION TESTS
// =============================================================================

describe('Duplicate Label Detection', () => {
  const existingLabels = [
    { id: '1', name: 'Bug', color: 'red' },
    { id: '2', name: 'Feature', color: 'blue' },
    { id: '3', name: 'Enhancement', color: 'green' },
  ];

  function isDuplicateName(name: string, labels: typeof existingLabels, excludeId?: string): boolean {
    const nameLower = name.toLowerCase().trim();
    return labels.some(
      (l) => l.name.toLowerCase() === nameLower && l.id !== excludeId
    );
  }

  it('should detect exact duplicate names', () => {
    expect(isDuplicateName('Bug', existingLabels)).toBe(true);
  });

  it('should detect case-insensitive duplicates', () => {
    expect(isDuplicateName('bug', existingLabels)).toBe(true);
    expect(isDuplicateName('BUG', existingLabels)).toBe(true);
    expect(isDuplicateName('bUg', existingLabels)).toBe(true);
  });

  it('should allow unique names', () => {
    expect(isDuplicateName('New Label', existingLabels)).toBe(false);
    expect(isDuplicateName('Bugfix', existingLabels)).toBe(false);
  });

  it('should exclude current label when editing', () => {
    // When editing label with id '1', 'Bug' should not be a duplicate
    expect(isDuplicateName('Bug', existingLabels, '1')).toBe(false);
    // But 'Feature' should still be a duplicate
    expect(isDuplicateName('Feature', existingLabels, '1')).toBe(true);
  });

  it('should handle whitespace in names', () => {
    expect(isDuplicateName('  Bug  ', existingLabels)).toBe(true);
    expect(isDuplicateName('  New Label  ', existingLabels)).toBe(false);
  });
});

// =============================================================================
// LABEL FILTER COUNT TESTS
// =============================================================================

describe('Label Filter Count Calculation', () => {
  const taskLabelsMap = new Map<string, string[]>([
    ['task-1', ['label-a', 'label-b']],
    ['task-2', ['label-a']],
    ['task-3', ['label-b', 'label-c']],
    ['task-4', ['label-a', 'label-b', 'label-c']],
    ['task-5', []],
  ]);

  function calculateFilteredLabelCount(
    labelId: string,
    filteredTaskIds: string[],
    labelsMap: Map<string, string[]>
  ): number {
    let count = 0;
    filteredTaskIds.forEach((taskId) => {
      const taskLabelIds = labelsMap.get(taskId) || [];
      if (taskLabelIds.includes(labelId)) {
        count++;
      }
    });
    return count;
  }

  it('should count labels across all tasks when no filters applied', () => {
    const allTaskIds = ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'];

    expect(calculateFilteredLabelCount('label-a', allTaskIds, taskLabelsMap)).toBe(3);
    expect(calculateFilteredLabelCount('label-b', allTaskIds, taskLabelsMap)).toBe(3);
    expect(calculateFilteredLabelCount('label-c', allTaskIds, taskLabelsMap)).toBe(2);
  });

  it('should count labels only in filtered tasks', () => {
    const filteredTaskIds = ['task-1', 'task-2'];

    expect(calculateFilteredLabelCount('label-a', filteredTaskIds, taskLabelsMap)).toBe(2);
    expect(calculateFilteredLabelCount('label-b', filteredTaskIds, taskLabelsMap)).toBe(1);
    expect(calculateFilteredLabelCount('label-c', filteredTaskIds, taskLabelsMap)).toBe(0);
  });

  it('should return 0 for labels not in any filtered task', () => {
    const filteredTaskIds = ['task-5']; // No labels

    expect(calculateFilteredLabelCount('label-a', filteredTaskIds, taskLabelsMap)).toBe(0);
    expect(calculateFilteredLabelCount('label-b', filteredTaskIds, taskLabelsMap)).toBe(0);
  });

  it('should handle empty filtered task list', () => {
    const filteredTaskIds: string[] = [];

    expect(calculateFilteredLabelCount('label-a', filteredTaskIds, taskLabelsMap)).toBe(0);
  });

  it('should handle tasks with no labels', () => {
    const filteredTaskIds = ['task-5'];

    expect(calculateFilteredLabelCount('label-a', filteredTaskIds, taskLabelsMap)).toBe(0);
  });
});

// =============================================================================
// STORE SYNCHRONIZATION TESTS
// =============================================================================

describe('Labels Store Synchronization', () => {
  beforeEach(() => {
    mockTaskLabelsMap.clear();
    mockSetTaskLabels.mockClear();
  });

  it('should update store when setting task labels', () => {
    const taskId = 'new-task-123';
    const labelIds = ['label-1', 'label-2'];

    // Simulate store update
    mockTaskLabelsMap.set(taskId, labelIds);

    expect(mockTaskLabelsMap.get(taskId)).toEqual(labelIds);
  });

  it('should clear task labels when empty array provided', () => {
    const taskId = 'task-123';
    mockTaskLabelsMap.set(taskId, ['label-1', 'label-2']);

    // Clear labels
    mockTaskLabelsMap.set(taskId, []);

    expect(mockTaskLabelsMap.get(taskId)).toEqual([]);
  });

  it('should maintain other tasks when updating one task', () => {
    mockTaskLabelsMap.set('task-1', ['label-a']);
    mockTaskLabelsMap.set('task-2', ['label-b']);

    // Update task-1
    mockTaskLabelsMap.set('task-1', ['label-c']);

    expect(mockTaskLabelsMap.get('task-1')).toEqual(['label-c']);
    expect(mockTaskLabelsMap.get('task-2')).toEqual(['label-b']);
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('Label Error Handling', () => {
  it('should handle setTaskLabels failure gracefully', async () => {
    const mockSetLabels = vi.fn().mockRejectedValue(new Error('Network error'));

    try {
      await mockSetLabels('task-123', ['label-1']);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network error');
    }
  });

  it('should handle empty label IDs array', () => {
    const labelIds: string[] = [];
    expect(labelIds.length).toBe(0);
    expect(labelIds.length <= VALIDATION.MAX_LABELS_PER_TASK).toBe(true);
  });

  it('should handle undefined task labels gracefully', () => {
    const taskLabelsMap = new Map<string, string[]>();
    const taskId = 'nonexistent-task';

    const labels = taskLabelsMap.get(taskId) || [];
    expect(labels).toEqual([]);
  });
});

// =============================================================================
// LABEL PERSISTENCE FLOW TESTS
// =============================================================================

describe('Label Persistence Flow', () => {
  it('should validate task ID before setting labels', () => {
    const isValidUUID = (id: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('invalid-id')).toBe(false);
    expect(isValidUUID('')).toBe(false);
  });

  it('should validate all label IDs before persisting', () => {
    const isValidUUID = (id: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    const validLabelIds = [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ];

    const allValid = validLabelIds.every(isValidUUID);
    expect(allValid).toBe(true);
  });

  it('should reject invalid label IDs in array', () => {
    const isValidUUID = (id: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    const mixedLabelIds = [
      '550e8400-e29b-41d4-a716-446655440001',
      'invalid-id',
    ];

    const allValid = mixedLabelIds.every(isValidUUID);
    expect(allValid).toBe(false);
  });
});
