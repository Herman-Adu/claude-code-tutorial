/**
 * Notifications Feature Module
 *
 * This module exports all components and hooks related to the notifications feature.
 * Using a barrel export pattern for cleaner imports.
 */

// Components
export {
  NotificationBell,
  NotificationCenter,
  NotificationDropdown,
  NotificationItem,
} from './components';

// Hooks
export {
  useNotificationManager,
  useNotificationBadge,
  useNotificationsList,
  useUnreadNotificationCount,
  useNotificationsLoading,
  useNotificationsError,
  useUnreadNotifications,
  useNotificationById,
  useNotificationState,
} from './hooks';

// Re-export types from store for convenience
export type { StoreNotification } from '@/store/notifications';
