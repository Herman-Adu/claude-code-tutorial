/**
 * Store Exports
 *
 * Re-exports all store modules for convenient importing.
 */

export {
  useKanbanStore,
  useTasksByColumn,
  useTaskById,
  useTotalTasks,
  useIsHydrated,
  useIsLoading,
  useError,
  useKanbanStatus,
  // Date filtering selectors
  filterTasksByDateRange,
  useTasksByDateRange,
  useTasksModifiedToday,
  type StoreTask,
  type CreateTaskData,
  type UpdateTaskData,
} from './kanban';

// Labels store exports
export {
  useLabelsStore,
  useLabels,
  useLabelById,
  useTaskLabels,
  useTaskLabelIds,
  useTasksWithLabel,
  useLabelsHydrated,
  useLabelsLoading,
  useLabelsError,
  type StoreLabel,
  type CreateLabelData,
  type UpdateLabelData,
} from './labels';

// Activity store exports
export {
  useActivityStore,
  useTaskActivity,
  useRecentActivity,
  useGlobalActivity,
  useActivityCount,
  useActivityLoading,
  useGlobalActivityLoading,
  useActivityError,
  useActivityActions,
  useActivityState,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_TYPE_COLORS,
  formatActivityDescription,
  type StoreActivity,
} from './activity';

// Comments store exports
export {
  useCommentsStore,
  useComments,
  useCommentCount,
  useCommentsLoading,
  useCommentsSubmitting,
  useCommentsError,
  useSelectedTaskId,
  useCommentActions,
  useCommentsState,
  type StoreComment,
} from './comments';

// Notifications store exports
export {
  useNotificationsStore,
  useNotifications,
  useUnreadNotificationCount,
  useNotificationsLoading,
  useNotificationsError,
  type StoreNotification,
} from './notifications';
