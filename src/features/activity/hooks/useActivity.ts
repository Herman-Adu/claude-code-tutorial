/**
 * useActivity Feature Hook
 *
 * Wraps the activity store with feature-specific logic and provides
 * a convenient API for activity timeline operations.
 */

import { useCallback, useEffect } from 'react';
import {
  useActivityStore,
  useTaskActivity as useTaskActivityFromStore,
  useActivityCount,
  useActivityLoading,
  useActivityError,
  type StoreActivity,
  formatActivityDescription,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_TYPE_ICONS,
} from '@/store/activity';
import type { ActivityType } from '@/app/actions/activity';

export interface UseActivityOptions {
  /** Whether to auto-load activity on mount */
  autoLoad?: boolean;
  /** Limit number of activities to load */
  limit?: number;
  /** Filter to specific activity types */
  filterTypes?: ActivityType[];
}

export interface UseActivityReturn {
  /** Array of activities for the task */
  activities: StoreActivity[];
  /** Total activity count */
  count: number;
  /** Whether loading is in progress */
  isLoading: boolean;
  /** Current error message if any */
  error: string | null;

  // Actions
  /** Reload activity from server */
  loadActivity: () => Promise<boolean>;
  /** Refresh activity (clear cache and reload) */
  refreshActivity: () => Promise<boolean>;
  /** Clear the current error */
  clearError: () => void;

  // Helpers
  /** Format an activity for display */
  formatActivity: (activity: StoreActivity) => string;
  /** Get label for an activity type */
  getTypeLabel: (type: ActivityType) => string;
  /** Get color classes for an activity type */
  getTypeColor: (type: ActivityType) => string;
}

/**
 * Hook for managing activity timeline for a specific task.
 *
 * @param taskId - The task ID to view activity for
 * @param options - Optional configuration
 * @returns Activity state and actions
 *
 * @example
 * ```tsx
 * function TaskActivity({ taskId }) {
 *   const { activities, isLoading, formatActivity } = useActivity(taskId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <ul>
 *       {activities.map(a => (
 *         <li key={a.id}>{formatActivity(a)}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useActivity(
  taskId: string,
  options: UseActivityOptions = {}
): UseActivityReturn {
  const { autoLoad = true, limit, filterTypes } = options;

  // Store state
  const allActivities = useTaskActivityFromStore(taskId);
  const count = useActivityCount(taskId);
  const isLoading = useActivityLoading();
  const error = useActivityError();

  // Store actions
  const storeLoadActivity = useActivityStore((state) => state.loadTaskActivity);
  const storeRefreshActivity = useActivityStore((state) => state.refreshTaskActivity);
  const storeClearError = useActivityStore((state) => state.clearError);

  // Apply filters
  let activities = allActivities;
  if (filterTypes && filterTypes.length > 0) {
    activities = activities.filter((a) => filterTypes.includes(a.type));
  }
  if (limit) {
    activities = activities.slice(0, limit);
  }

  // Wrapped actions with taskId pre-bound
  const loadActivity = useCallback(() => {
    return storeLoadActivity(taskId, { limit });
  }, [taskId, limit, storeLoadActivity]);

  const refreshActivity = useCallback(() => {
    return storeRefreshActivity(taskId);
  }, [taskId, storeRefreshActivity]);

  const clearError = useCallback(() => {
    storeClearError();
  }, [storeClearError]);

  // Helper functions
  const formatActivity = useCallback((activity: StoreActivity): string => {
    return formatActivityDescription(activity);
  }, []);

  const getTypeLabel = useCallback((type: ActivityType): string => {
    return ACTIVITY_TYPE_LABELS[type];
  }, []);

  const getTypeColor = useCallback((type: ActivityType): string => {
    return ACTIVITY_TYPE_COLORS[type];
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadActivity();
    }
  }, [autoLoad, loadActivity]);

  return {
    activities,
    count,
    isLoading,
    error,
    loadActivity,
    refreshActivity,
    clearError,
    formatActivity,
    getTypeLabel,
    getTypeColor,
  };
}

export default useActivity;

// Re-export helpers from store
export {
  formatActivityDescription,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_TYPE_ICONS,
};
