'use client';

/**
 * Activity Zustand Store
 *
 * This store manages activity timeline state for tasks.
 * Unlike comments, activity is read-only from the client perspective -
 * activities are created automatically by server actions.
 *
 * Key features:
 * - Read-only activity timeline per task
 * - Loading and error state management
 * - Efficient selectors with shallow comparison
 * - DevTools integration for debugging
 * - Activities organized by task ID for efficient lookup
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import {
  type ActivityResponse,
  type ActivityType,
  getTaskActivity as getTaskActivityAction,
  getUserActivity as getUserActivityAction,
} from '@/app/actions/activity';

// ============================================================================
// Types
// ============================================================================

/**
 * Activity type used in the store.
 * Mirrors ActivityResponse for consistency.
 */
export interface StoreActivity {
  id: string;
  type: ActivityType;
  taskId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  data: Record<string, unknown>;
  createdAt: string;
}

/**
 * Activity store state interface.
 */
interface ActivityState {
  // Data - Map of taskId to activities array
  activityByTask: Map<string, StoreActivity[]>;

  // Global activity feed (across all user's tasks)
  globalActivity: StoreActivity[];

  // UI State
  isLoading: boolean;
  isLoadingGlobal: boolean;
  error: string | null;

  // Data fetching
  loadTaskActivity: (taskId: string, options?: { limit?: number; offset?: number }) => Promise<boolean>;
  loadGlobalActivity: (options?: { limit?: number; offset?: number }) => Promise<boolean>;
  refreshTaskActivity: (taskId: string) => Promise<boolean>;

  // UI state setters
  setError: (error: string | null) => void;
  clearError: () => void;
  clearTaskActivity: (taskId: string) => void;
  clearGlobalActivity: () => void;

  // Selectors
  getActivityByTask: (taskId: string) => StoreActivity[];
  getActivityById: (taskId: string, activityId: string) => StoreActivity | undefined;
  getActivityCount: (taskId: string) => number;
  getRecentActivity: (taskId: string, limit?: number) => StoreActivity[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transforms ActivityResponse to StoreActivity.
 */
function transformActivityResponse(activity: ActivityResponse): StoreActivity {
  return {
    id: activity.id,
    type: activity.type,
    taskId: activity.taskId,
    userId: activity.userId,
    userName: activity.userName,
    userEmail: activity.userEmail,
    data: activity.data,
    createdAt: activity.createdAt,
  };
}

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * Activity Zustand store with devtools middleware.
 *
 * This is a read-only store - activities are created by server actions
 * when tasks, comments, or labels are modified.
 */
export const useActivityStore = create<ActivityState>()(
  devtools(
    (set, get) => ({
      // Initial state
      activityByTask: new Map(),
      globalActivity: [],
      isLoading: false,
      isLoadingGlobal: false,
      error: null,

      // ========================================================================
      // UI State Setters
      // ========================================================================

      setError: (error) => {
        set({ error }, false, 'setError');
      },

      clearError: () => {
        set({ error: null }, false, 'clearError');
      },

      clearTaskActivity: (taskId) => {
        set(
          (state) => {
            const newMap = new Map(state.activityByTask);
            newMap.delete(taskId);
            return { activityByTask: newMap };
          },
          false,
          'clearTaskActivity'
        );
      },

      clearGlobalActivity: () => {
        set({ globalActivity: [] }, false, 'clearGlobalActivity');
      },

      // ========================================================================
      // Data Fetching
      // ========================================================================

      /**
       * Loads activity timeline for a specific task.
       * Returns true on success, false on failure.
       */
      loadTaskActivity: async (taskId, options) => {
        set({ isLoading: true, error: null }, false, 'loadTaskActivity/start');

        try {
          const result = await getTaskActivityAction(taskId, options);

          if (result.success && result.data) {
            set(
              (state) => {
                const newMap = new Map(state.activityByTask);
                newMap.set(
                  taskId,
                  result.data!.activities.map(transformActivityResponse)
                );
                return { activityByTask: newMap, isLoading: false };
              },
              false,
              'loadTaskActivity/success'
            );
            return true;
          } else {
            set(
              { isLoading: false, error: result.error || 'Failed to load activity' },
              false,
              'loadTaskActivity/error'
            );
            return false;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load activity';
          set({ isLoading: false, error: message }, false, 'loadTaskActivity/exception');
          return false;
        }
      },

      /**
       * Loads global activity across all user's tasks.
       * Returns true on success, false on failure.
       */
      loadGlobalActivity: async (options) => {
        set({ isLoadingGlobal: true, error: null }, false, 'loadGlobalActivity/start');

        try {
          const result = await getUserActivityAction(options);

          if (result.success && result.data) {
            set(
              {
                globalActivity: result.data.activities.map(transformActivityResponse),
                isLoadingGlobal: false,
              },
              false,
              'loadGlobalActivity/success'
            );
            return true;
          } else {
            set(
              { isLoadingGlobal: false, error: result.error || 'Failed to load activity' },
              false,
              'loadGlobalActivity/error'
            );
            return false;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load activity';
          set({ isLoadingGlobal: false, error: message }, false, 'loadGlobalActivity/exception');
          return false;
        }
      },

      /**
       * Refreshes activity for a task (clears cache and reloads).
       */
      refreshTaskActivity: async (taskId) => {
        get().clearTaskActivity(taskId);
        return get().loadTaskActivity(taskId);
      },

      // ========================================================================
      // Selectors
      // ========================================================================

      /**
       * Gets all activity for a specific task.
       * Returns activities in reverse chronological order (newest first).
       */
      getActivityByTask: (taskId) => {
        return get().activityByTask.get(taskId) || [];
      },

      /**
       * Gets a single activity by ID within a task.
       */
      getActivityById: (taskId, activityId) => {
        const activities = get().activityByTask.get(taskId);
        return activities?.find((a) => a.id === activityId);
      },

      /**
       * Gets the activity count for a task.
       */
      getActivityCount: (taskId) => {
        return get().activityByTask.get(taskId)?.length || 0;
      },

      /**
       * Gets the most recent activities for a task.
       */
      getRecentActivity: (taskId, limit = 5) => {
        const activities = get().activityByTask.get(taskId) || [];
        return activities.slice(0, limit);
      },
    }),
    {
      name: 'activity-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selector Hooks
// ============================================================================

/**
 * Hook to get activity for a specific task.
 * Uses shallow comparison for performance.
 */
export function useTaskActivity(taskId: string): StoreActivity[] {
  return useActivityStore(useShallow((state) => state.getActivityByTask(taskId)));
}

/**
 * Hook to get recent activity for a task.
 */
export function useRecentActivity(taskId: string, limit?: number): StoreActivity[] {
  return useActivityStore(useShallow((state) => state.getRecentActivity(taskId, limit)));
}

/**
 * Hook to get global activity feed.
 */
export function useGlobalActivity(): StoreActivity[] {
  return useActivityStore(useShallow((state) => state.globalActivity));
}

/**
 * Hook to get activity count for a task.
 */
export function useActivityCount(taskId: string): number {
  return useActivityStore((state) => state.getActivityCount(taskId));
}

/**
 * Hook to get loading state.
 */
export function useActivityLoading(): boolean {
  return useActivityStore((state) => state.isLoading);
}

/**
 * Hook to get global loading state.
 */
export function useGlobalActivityLoading(): boolean {
  return useActivityStore((state) => state.isLoadingGlobal);
}

/**
 * Hook to get error state.
 */
export function useActivityError(): string | null {
  return useActivityStore((state) => state.error);
}

/**
 * Hook to get activity actions.
 */
export function useActivityActions() {
  return useActivityStore(
    useShallow((state) => ({
      loadTaskActivity: state.loadTaskActivity,
      loadGlobalActivity: state.loadGlobalActivity,
      refreshTaskActivity: state.refreshTaskActivity,
      clearError: state.clearError,
      clearTaskActivity: state.clearTaskActivity,
      clearGlobalActivity: state.clearGlobalActivity,
    }))
  );
}

/**
 * Hook to get all activity-related state for a task.
 */
export function useActivityState(taskId: string) {
  return useActivityStore(
    useShallow((state) => ({
      activities: state.getActivityByTask(taskId),
      count: state.getActivityCount(taskId),
      isLoading: state.isLoading,
      error: state.error,
    }))
  );
}

// ============================================================================
// Activity Type Helpers
// ============================================================================

/**
 * Human-readable labels for activity types.
 */
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  TASK_CREATED: 'created this task',
  TASK_UPDATED: 'updated this task',
  TASK_MOVED: 'moved this task',
  TASK_DELETED: 'deleted this task',
  COMMENT_ADDED: 'added a comment',
  COMMENT_UPDATED: 'edited a comment',
  COMMENT_DELETED: 'deleted a comment',
  LABEL_ADDED: 'added a label',
  LABEL_REMOVED: 'removed a label',
};

/**
 * Icon names for activity types (for use with icon components).
 */
export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  TASK_CREATED: 'plus-circle',
  TASK_UPDATED: 'pencil',
  TASK_MOVED: 'arrow-right',
  TASK_DELETED: 'trash',
  COMMENT_ADDED: 'message-circle',
  COMMENT_UPDATED: 'edit-3',
  COMMENT_DELETED: 'message-circle-off',
  LABEL_ADDED: 'tag',
  LABEL_REMOVED: 'tag-off',
};

/**
 * Color classes for activity types.
 */
export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  TASK_CREATED: 'text-emerald-600 bg-emerald-100',
  TASK_UPDATED: 'text-blue-600 bg-blue-100',
  TASK_MOVED: 'text-purple-600 bg-purple-100',
  TASK_DELETED: 'text-red-600 bg-red-100',
  COMMENT_ADDED: 'text-sky-600 bg-sky-100',
  COMMENT_UPDATED: 'text-amber-600 bg-amber-100',
  COMMENT_DELETED: 'text-slate-600 bg-slate-100',
  LABEL_ADDED: 'text-violet-600 bg-violet-100',
  LABEL_REMOVED: 'text-rose-600 bg-rose-100',
};

/**
 * Formats activity data for display based on activity type.
 */
export function formatActivityDescription(activity: StoreActivity): string {
  const { type, data, userName, userEmail } = activity;
  const actor = userName || userEmail || 'Someone';

  switch (type) {
    case 'TASK_CREATED':
      return `${actor} created this task`;
    case 'TASK_UPDATED': {
      const fields = data.updatedFields as string[] | undefined;
      if (fields && fields.length > 0) {
        return `${actor} updated ${fields.join(', ')}`;
      }
      return `${actor} updated this task`;
    }
    case 'TASK_MOVED': {
      const from = data.fromColumn as string | undefined;
      const to = data.toColumn as string | undefined;
      if (from && to) {
        return `${actor} moved from ${from} to ${to}`;
      }
      return `${actor} moved this task`;
    }
    case 'TASK_DELETED':
      return `${actor} deleted this task`;
    case 'COMMENT_ADDED': {
      const preview = data.preview as string | undefined;
      if (preview) {
        const truncated = preview.length > 50 ? `${preview.substring(0, 50)}...` : preview;
        return `${actor} commented: "${truncated}"`;
      }
      return `${actor} added a comment`;
    }
    case 'COMMENT_UPDATED':
      return `${actor} edited a comment`;
    case 'COMMENT_DELETED':
      return `${actor} deleted a comment`;
    case 'LABEL_ADDED': {
      const labelName = data.labelName as string | undefined;
      if (labelName) {
        return `${actor} added label "${labelName}"`;
      }
      return `${actor} added a label`;
    }
    case 'LABEL_REMOVED': {
      const labelName = data.labelName as string | undefined;
      if (labelName) {
        return `${actor} removed label "${labelName}"`;
      }
      return `${actor} removed a label`;
    }
    default:
      return `${actor} performed an action`;
  }
}

// Export store for direct access (useful for testing and devtools)
export default useActivityStore;
