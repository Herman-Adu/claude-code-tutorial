/**
 * Activity Feature Module
 *
 * This module exports all components and hooks related to the activity timeline feature.
 * Using a barrel export pattern for cleaner imports.
 *
 * @example
 * ```tsx
 * import { ActivityTimeline, useActivity } from '@/features/activity';
 *
 * function TaskActivity({ taskId }) {
 *   const { activities, formatActivity } = useActivity(taskId);
 *   return <ActivityTimeline taskId={taskId} />;
 * }
 * ```
 */

// Components
export { ActivityTimeline } from './components/ActivityTimeline';
export { ActivityItem } from './components/ActivityItem';

// Feature exports (recommended usage)
export {
  useActivity,
  type UseActivityOptions,
  type UseActivityReturn,
  formatActivityDescription,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_TYPE_ICONS,
} from './hooks/useActivity';

// Store exports (direct access if needed - not recommended)
export type { StoreActivity } from '@/store/activity';
export { useActivityStore } from '@/store/activity';
