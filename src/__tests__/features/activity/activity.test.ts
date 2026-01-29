/**
 * Activity Feature Tests
 *
 * Tests for the activity store and helpers including:
 * - Store state management
 * - Activity type helpers
 * - Formatting functions
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock server actions
vi.mock('@/app/actions/activity', () => ({
  getTaskActivity: vi.fn(),
  getUserActivity: vi.fn(),
}));

// Import after mocks
import {
  useActivityStore,
  useTaskActivity,
  useActivityCount,
  useActivityLoading,
  useActivityError,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_COLORS,
  formatActivityDescription,
  type StoreActivity,
} from '@/store/activity';
import { getTaskActivity, getUserActivity } from '@/app/actions/activity';

// =============================================================================
// Test Constants
// =============================================================================

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';

const mockActivity: StoreActivity = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'COMMENT_ADDED',
  taskId: TASK_ID,
  userId: USER_ID,
  userName: 'Test User',
  userEmail: 'test@example.com',
  data: { preview: 'This is a comment' },
  createdAt: '2025-01-15T10:00:00.000Z',
};

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  // Reset store state
  useActivityStore.setState({
    activityByTask: new Map(),
    globalActivity: [],
    isLoading: false,
    isLoadingGlobal: false,
    error: null,
  });
});

// =============================================================================
// Store State Tests
// =============================================================================

describe('Activity Store State', () => {
  it('should have correct initial state', () => {
    const state = useActivityStore.getState();

    expect(state.activityByTask.size).toBe(0);
    expect(state.globalActivity).toHaveLength(0);
    expect(state.isLoading).toBe(false);
    expect(state.isLoadingGlobal).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set and clear error', () => {
    const { setError, clearError } = useActivityStore.getState();

    act(() => {
      setError('Test error');
    });

    expect(useActivityStore.getState().error).toBe('Test error');

    act(() => {
      clearError();
    });

    expect(useActivityStore.getState().error).toBeNull();
  });

  it('should clear task activity', () => {
    useActivityStore.setState({
      activityByTask: new Map([[TASK_ID, [mockActivity]]]),
    });

    const { clearTaskActivity, getActivityByTask } = useActivityStore.getState();

    act(() => {
      clearTaskActivity(TASK_ID);
    });

    expect(getActivityByTask(TASK_ID)).toHaveLength(0);
  });
});

// =============================================================================
// Load Activity Tests
// =============================================================================

describe('Load Task Activity', () => {
  it('should load activity successfully', async () => {
    (getTaskActivity as Mock).mockResolvedValue({
      success: true,
      data: {
        activities: [mockActivity],
        total: 1,
      },
    });

    const { loadTaskActivity, getActivityByTask } = useActivityStore.getState();

    await act(async () => {
      const success = await loadTaskActivity(TASK_ID);
      expect(success).toBe(true);
    });

    expect(getTaskActivity).toHaveBeenCalledWith(TASK_ID, undefined);
    expect(getActivityByTask(TASK_ID)).toHaveLength(1);
    expect(getActivityByTask(TASK_ID)[0].type).toBe('COMMENT_ADDED');
  });

  it('should handle load failure', async () => {
    (getTaskActivity as Mock).mockResolvedValue({
      success: false,
      error: 'Failed to load',
    });

    const { loadTaskActivity } = useActivityStore.getState();

    await act(async () => {
      const success = await loadTaskActivity(TASK_ID);
      expect(success).toBe(false);
    });

    expect(useActivityStore.getState().error).toBe('Failed to load');
  });

  it('should pass pagination options', async () => {
    (getTaskActivity as Mock).mockResolvedValue({
      success: true,
      data: { activities: [], total: 0 },
    });

    const { loadTaskActivity } = useActivityStore.getState();

    await act(async () => {
      await loadTaskActivity(TASK_ID, { limit: 10, offset: 5 });
    });

    expect(getTaskActivity).toHaveBeenCalledWith(TASK_ID, { limit: 10, offset: 5 });
  });
});

describe('Load Global Activity', () => {
  it('should load global activity successfully', async () => {
    (getUserActivity as Mock).mockResolvedValue({
      success: true,
      data: {
        activities: [mockActivity],
        total: 1,
      },
    });

    const { loadGlobalActivity } = useActivityStore.getState();

    await act(async () => {
      const success = await loadGlobalActivity();
      expect(success).toBe(true);
    });

    expect(getUserActivity).toHaveBeenCalled();
    expect(useActivityStore.getState().globalActivity).toHaveLength(1);
  });

  it('should handle global load failure', async () => {
    (getUserActivity as Mock).mockResolvedValue({
      success: false,
      error: 'Global load failed',
    });

    const { loadGlobalActivity } = useActivityStore.getState();

    await act(async () => {
      const success = await loadGlobalActivity();
      expect(success).toBe(false);
    });

    expect(useActivityStore.getState().error).toBe('Global load failed');
  });
});

// =============================================================================
// Selector Tests
// =============================================================================

describe('Activity Selectors', () => {
  beforeEach(() => {
    const activities: StoreActivity[] = [
      { ...mockActivity, id: '1', createdAt: '2025-01-15T12:00:00.000Z' },
      { ...mockActivity, id: '2', createdAt: '2025-01-15T11:00:00.000Z' },
      { ...mockActivity, id: '3', createdAt: '2025-01-15T10:00:00.000Z' },
    ];
    useActivityStore.setState({
      activityByTask: new Map([[TASK_ID, activities]]),
    });
  });

  it('getActivityByTask should return activities', () => {
    const { getActivityByTask } = useActivityStore.getState();
    expect(getActivityByTask(TASK_ID)).toHaveLength(3);
  });

  it('getActivityById should find specific activity', () => {
    const { getActivityById } = useActivityStore.getState();
    expect(getActivityById(TASK_ID, '2')?.id).toBe('2');
  });

  it('getActivityCount should return count', () => {
    const { getActivityCount } = useActivityStore.getState();
    expect(getActivityCount(TASK_ID)).toBe(3);
  });

  it('getRecentActivity should limit results', () => {
    const { getRecentActivity } = useActivityStore.getState();
    expect(getRecentActivity(TASK_ID, 2)).toHaveLength(2);
  });

  it('should return empty array for unknown task', () => {
    const { getActivityByTask } = useActivityStore.getState();
    expect(getActivityByTask('unknown-id')).toHaveLength(0);
  });
});

// =============================================================================
// Selector Hooks Tests
// =============================================================================

describe('Selector Hooks', () => {
  beforeEach(() => {
    useActivityStore.setState({
      activityByTask: new Map([[TASK_ID, [mockActivity]]]),
      isLoading: true,
      error: 'Test error',
    });
  });

  it('useTaskActivity should return activities for task', () => {
    const { result } = renderHook(() => useTaskActivity(TASK_ID));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].type).toBe('COMMENT_ADDED');
  });

  it('useActivityCount should return count', () => {
    const { result } = renderHook(() => useActivityCount(TASK_ID));
    expect(result.current).toBe(1);
  });

  it('useActivityLoading should return loading state', () => {
    const { result } = renderHook(() => useActivityLoading());
    expect(result.current).toBe(true);
  });

  it('useActivityError should return error', () => {
    const { result } = renderHook(() => useActivityError());
    expect(result.current).toBe('Test error');
  });
});

// =============================================================================
// Activity Type Helpers Tests
// =============================================================================

describe('Activity Type Helpers', () => {
  describe('ACTIVITY_TYPE_LABELS', () => {
    it('should have labels for all activity types', () => {
      expect(ACTIVITY_TYPE_LABELS.TASK_CREATED).toBe('created this task');
      expect(ACTIVITY_TYPE_LABELS.TASK_UPDATED).toBe('updated this task');
      expect(ACTIVITY_TYPE_LABELS.TASK_MOVED).toBe('moved this task');
      expect(ACTIVITY_TYPE_LABELS.TASK_DELETED).toBe('deleted this task');
      expect(ACTIVITY_TYPE_LABELS.COMMENT_ADDED).toBe('added a comment');
      expect(ACTIVITY_TYPE_LABELS.COMMENT_UPDATED).toBe('edited a comment');
      expect(ACTIVITY_TYPE_LABELS.COMMENT_DELETED).toBe('deleted a comment');
      expect(ACTIVITY_TYPE_LABELS.LABEL_ADDED).toBe('added a label');
      expect(ACTIVITY_TYPE_LABELS.LABEL_REMOVED).toBe('removed a label');
    });
  });

  describe('ACTIVITY_TYPE_COLORS', () => {
    it('should have colors for all activity types', () => {
      expect(ACTIVITY_TYPE_COLORS.TASK_CREATED).toContain('emerald');
      expect(ACTIVITY_TYPE_COLORS.TASK_UPDATED).toContain('blue');
      expect(ACTIVITY_TYPE_COLORS.TASK_MOVED).toContain('purple');
      expect(ACTIVITY_TYPE_COLORS.TASK_DELETED).toContain('red');
      expect(ACTIVITY_TYPE_COLORS.COMMENT_ADDED).toContain('sky');
      expect(ACTIVITY_TYPE_COLORS.LABEL_ADDED).toContain('violet');
    });
  });
});

// =============================================================================
// Format Activity Description Tests
// =============================================================================

describe('formatActivityDescription', () => {
  it('should format TASK_CREATED', () => {
    const activity: StoreActivity = {
      ...mockActivity,
      type: 'TASK_CREATED',
      data: {},
    };
    expect(formatActivityDescription(activity)).toBe('Test User created this task');
  });

  it('should format TASK_UPDATED with fields', () => {
    const activity: StoreActivity = {
      ...mockActivity,
      type: 'TASK_UPDATED',
      data: { updatedFields: ['title', 'description'] },
    };
    expect(formatActivityDescription(activity)).toBe('Test User updated title, description');
  });

  it('should format TASK_MOVED with columns', () => {
    const activity: StoreActivity = {
      ...mockActivity,
      type: 'TASK_MOVED',
      data: { fromColumn: 'TODO', toColumn: 'IN_PROGRESS' },
    };
    expect(formatActivityDescription(activity)).toBe('Test User moved from TODO to IN_PROGRESS');
  });

  it('should format COMMENT_ADDED with preview', () => {
    const activity: StoreActivity = {
      ...mockActivity,
      type: 'COMMENT_ADDED',
      data: { preview: 'This is a comment' },
    };
    expect(formatActivityDescription(activity)).toContain('commented');
    expect(formatActivityDescription(activity)).toContain('This is a comment');
  });

  it('should format LABEL_ADDED with name', () => {
    const activity: StoreActivity = {
      ...mockActivity,
      type: 'LABEL_ADDED',
      data: { labelName: 'Bug' },
    };
    expect(formatActivityDescription(activity)).toBe('Test User added label "Bug"');
  });

  it('should use email when name is missing', () => {
    const activity: StoreActivity = {
      ...mockActivity,
      type: 'TASK_CREATED',
      userName: null,
      data: {},
    };
    expect(formatActivityDescription(activity)).toBe('test@example.com created this task');
  });

  it('should truncate long comment previews', () => {
    const activity: StoreActivity = {
      ...mockActivity,
      type: 'COMMENT_ADDED',
      data: { preview: 'a'.repeat(100) },
    };
    const description = formatActivityDescription(activity);
    expect(description).toContain('...');
    expect(description.length).toBeLessThan(120);
  });
});
