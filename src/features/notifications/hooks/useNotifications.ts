'use client';

/**
 * useNotificationManager Hook
 *
 * Custom hook that wraps the notifications store with initialization logic
 * and provides a convenient interface for managing notifications.
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  useNotificationsStore,
  useNotifications as useNotificationsFromStore,
  useUnreadNotificationCount,
  useNotificationsLoading,
  useNotificationsError,
} from '@/store/notifications';

/**
 * Polling interval for refreshing notifications (30 seconds).
 */
const POLL_INTERVAL_MS = 30000;

/**
 * Options for the notification manager hook.
 */
interface UseNotificationManagerOptions {
  /** Whether to automatically load notifications on mount */
  autoLoad?: boolean;
  /** Whether to poll for new notifications */
  enablePolling?: boolean;
  /** Custom poll interval in milliseconds */
  pollInterval?: number;
}

/**
 * useNotificationManager provides a complete interface for managing notifications.
 *
 * Features:
 * - Auto-loads notifications on mount
 * - Polls for new notifications periodically
 * - Provides all notification state and actions
 *
 * @param options - Configuration options
 * @returns Notification state and actions
 */
export function useNotificationManager(options: UseNotificationManagerOptions = {}) {
  const {
    autoLoad = true,
    enablePolling = true,
    pollInterval = POLL_INTERVAL_MS,
  } = options;

  const notifications = useNotificationsFromStore();
  const unreadCount = useUnreadNotificationCount();
  const isLoading = useNotificationsLoading();
  const error = useNotificationsError();

  const store = useNotificationsStore();
  const initialLoadRef = useRef(false);

  // Load notifications on mount
  useEffect(() => {
    if (autoLoad && !initialLoadRef.current) {
      initialLoadRef.current = true;
      store.loadNotifications();
      store.refreshUnreadCount();
    }
  }, [autoLoad, store]);

  // Set up polling for unread count
  useEffect(() => {
    if (!enablePolling) return;

    const interval = setInterval(() => {
      store.refreshUnreadCount();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [enablePolling, pollInterval, store]);

  // Action wrappers
  const markAsRead = useCallback(
    async (notificationId: string) => {
      return store.markAsRead(notificationId);
    },
    [store]
  );

  const markAllAsRead = useCallback(async () => {
    return store.markAllAsRead();
  }, [store]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      return store.removeNotification(notificationId);
    },
    [store]
  );

  const refresh = useCallback(async () => {
    await Promise.all([
      store.loadNotifications(),
      store.refreshUnreadCount(),
    ]);
  }, [store]);

  const clearError = useCallback(() => {
    store.clearError();
  }, [store]);

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    error,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    clearError,

    // Direct access to store actions if needed
    loadNotifications: store.loadNotifications,
    refreshUnreadCount: store.refreshUnreadCount,
  };
}

/**
 * useNotificationBadge provides just the unread count for badge display.
 *
 * This is a lightweight hook for components that only need the badge count.
 * It automatically refreshes the count periodically.
 *
 * @returns Object with unread count
 */
export function useNotificationBadge() {
  const unreadCount = useUnreadNotificationCount();
  const refreshUnreadCount = useNotificationsStore((state) => state.refreshUnreadCount);

  // Refresh count on mount and periodically
  useEffect(() => {
    refreshUnreadCount();

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
  };
}

/**
 * Re-export store hooks for convenience.
 */
export {
  useNotifications as useNotificationsList,
  useUnreadNotificationCount,
  useNotificationsLoading,
  useNotificationsError,
  useUnreadNotifications,
  useNotificationById,
  useNotificationState,
} from '@/store/notifications';
