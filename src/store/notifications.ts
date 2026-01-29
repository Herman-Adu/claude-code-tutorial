/**
 * Notifications Zustand Store
 *
 * This store manages the notifications state with optimistic updates.
 * It integrates with server actions for persistence to PostgreSQL.
 *
 * Key features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic rollback on server errors
 * - Loading and error state management
 * - Efficient selectors with shallow comparison
 * - DevTools integration for debugging
 * - Periodic polling for new notifications
 */

'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import {
  type NotificationResponse,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/app/actions/notifications';

// ============================================================================
// Types
// ============================================================================

/**
 * Notification type used in the store.
 * Extends NotificationResponse for consistency.
 */
export type StoreNotification = NotificationResponse;

/**
 * Notifications store state interface.
 */
interface NotificationsState {
  // Data
  notifications: StoreNotification[];
  unreadCount: number;

  // Status flags
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;

  // Data mutations
  loadNotifications: (unreadOnly?: boolean) => Promise<boolean>;
  refreshUnreadCount: () => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  removeNotification: (notificationId: string) => Promise<boolean>;

  // UI state setters
  setError: (error: string | null) => void;
  clearError: () => void;
  setNotifications: (notifications: StoreNotification[]) => void;
  setUnreadCount: (count: number) => void;

  // Selectors
  getUnreadNotifications: () => StoreNotification[];
  getNotificationById: (id: string) => StoreNotification | undefined;
}

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * Notifications Zustand store with devtools middleware.
 *
 * The store follows these patterns:
 * 1. Optimistic updates: State changes immediately on user action
 * 2. Server sync: Background server action call
 * 3. Rollback: Revert to previous state on error
 * 4. Error handling: Capture and expose errors for UI feedback
 */
export const useNotificationsStore = create<NotificationsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastFetched: null,

      // ========================================================================
      // State Setters
      // ========================================================================

      setError: (error) => {
        set({ error }, false, 'setError');
      },

      clearError: () => {
        set({ error: null }, false, 'clearError');
      },

      setNotifications: (notifications) => {
        set({ notifications }, false, 'setNotifications');
      },

      setUnreadCount: (count) => {
        set({ unreadCount: count }, false, 'setUnreadCount');
      },

      // ========================================================================
      // Data Mutations
      // ========================================================================

      /**
       * Loads notifications from the server.
       * Returns true on success, false on failure.
       */
      loadNotifications: async (unreadOnly = false): Promise<boolean> => {
        set({ isLoading: true, error: null }, false, 'loadNotifications/start');

        try {
          const result = await getNotifications({ unreadOnly });

          if (result.success && result.data) {
            set(
              {
                notifications: result.data.notifications,
                isLoading: false,
                lastFetched: new Date().toISOString(),
              },
              false,
              'loadNotifications/success'
            );
            return true;
          } else {
            set(
              {
                error: result.error || 'Failed to load notifications',
                isLoading: false,
              },
              false,
              'loadNotifications/error'
            );
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load notifications';
          set(
            { error: errorMessage, isLoading: false },
            false,
            'loadNotifications/exception'
          );
          return false;
        }
      },

      /**
       * Refreshes the unread notification count.
       * Returns true on success, false on failure.
       */
      refreshUnreadCount: async (): Promise<boolean> => {
        try {
          const result = await getUnreadNotificationCount();

          if (result.success && result.data !== undefined) {
            set({ unreadCount: result.data }, false, 'refreshUnreadCount/success');
            return true;
          } else {
            set(
              { error: result.error || 'Failed to get unread count' },
              false,
              'refreshUnreadCount/error'
            );
            return false;
          }
        } catch (error) {
          console.error('Failed to refresh unread count:', error);
          return false;
        }
      },

      /**
       * Marks a notification as read with optimistic update.
       * Returns true on success, false on failure.
       */
      markAsRead: async (notificationId: string): Promise<boolean> => {
        const previousNotifications = get().notifications;
        const previousUnreadCount = get().unreadCount;

        // Find the notification to check if it's already read
        const notification = previousNotifications.find((n) => n.id === notificationId);
        if (!notification) {
          set({ error: 'Notification not found' }, false, 'markAsRead/notFound');
          return false;
        }

        // Skip if already read
        if (notification.isRead) {
          return true;
        }

        // Optimistic update
        set(
          (state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }),
          false,
          'markAsRead/optimistic'
        );

        try {
          const result = await markNotificationAsRead(notificationId);

          if (result.success) {
            return true;
          } else {
            // Rollback on failure
            set(
              {
                notifications: previousNotifications,
                unreadCount: previousUnreadCount,
                error: result.error || 'Failed to mark as read',
              },
              false,
              'markAsRead/rollback'
            );
            return false;
          }
        } catch (error) {
          // Rollback on exception
          const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
          set(
            {
              notifications: previousNotifications,
              unreadCount: previousUnreadCount,
              error: errorMessage,
            },
            false,
            'markAsRead/exception'
          );
          return false;
        }
      },

      /**
       * Marks all notifications as read with optimistic update.
       * Returns true on success, false on failure.
       */
      markAllAsRead: async (): Promise<boolean> => {
        const previousNotifications = get().notifications;
        const previousUnreadCount = get().unreadCount;

        // Skip if no unread notifications
        if (previousUnreadCount === 0) {
          return true;
        }

        // Optimistic update - mark all as read
        set(
          (state) => ({
            notifications: state.notifications.map((n) => ({
              ...n,
              isRead: true,
              readAt: n.isRead ? n.readAt : new Date().toISOString(),
            })),
            unreadCount: 0,
          }),
          false,
          'markAllAsRead/optimistic'
        );

        try {
          const result = await markAllNotificationsAsRead();

          if (result.success) {
            return true;
          } else {
            // Rollback on failure
            set(
              {
                notifications: previousNotifications,
                unreadCount: previousUnreadCount,
                error: result.error || 'Failed to mark all as read',
              },
              false,
              'markAllAsRead/rollback'
            );
            return false;
          }
        } catch (error) {
          // Rollback on exception
          const errorMessage = error instanceof Error ? error.message : 'Failed to mark all notifications as read';
          set(
            {
              notifications: previousNotifications,
              unreadCount: previousUnreadCount,
              error: errorMessage,
            },
            false,
            'markAllAsRead/exception'
          );
          return false;
        }
      },

      /**
       * Removes a notification with optimistic update.
       * Returns true on success, false on failure.
       */
      removeNotification: async (notificationId: string): Promise<boolean> => {
        const previousNotifications = get().notifications;
        const previousUnreadCount = get().unreadCount;

        // Find the notification to check if it was unread
        const notification = previousNotifications.find((n) => n.id === notificationId);
        if (!notification) {
          set({ error: 'Notification not found' }, false, 'removeNotification/notFound');
          return false;
        }

        const wasUnread = !notification.isRead;

        // Optimistic update - remove notification
        set(
          (state) => ({
            notifications: state.notifications.filter((n) => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          }),
          false,
          'removeNotification/optimistic'
        );

        try {
          const result = await deleteNotification(notificationId);

          if (result.success) {
            return true;
          } else {
            // Rollback on failure
            set(
              {
                notifications: previousNotifications,
                unreadCount: previousUnreadCount,
                error: result.error || 'Failed to delete notification',
              },
              false,
              'removeNotification/rollback'
            );
            return false;
          }
        } catch (error) {
          // Rollback on exception
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
          set(
            {
              notifications: previousNotifications,
              unreadCount: previousUnreadCount,
              error: errorMessage,
            },
            false,
            'removeNotification/exception'
          );
          return false;
        }
      },

      // ========================================================================
      // Selectors
      // ========================================================================

      /**
       * Gets all unread notifications.
       */
      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.isRead);
      },

      /**
       * Gets a single notification by ID.
       */
      getNotificationById: (id: string) => {
        return get().notifications.find((n) => n.id === id);
      },
    }),
    {
      name: 'notifications-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selector Hooks
// ============================================================================

/**
 * Hook to get all notifications.
 * Uses shallow comparison to prevent unnecessary re-renders.
 */
export function useNotifications(): StoreNotification[] {
  return useNotificationsStore(useShallow((state) => state.notifications));
}

/**
 * Hook to get unread notification count.
 */
export function useUnreadNotificationCount(): number {
  return useNotificationsStore((state) => state.unreadCount);
}

/**
 * Hook to get loading state.
 */
export function useNotificationsLoading(): boolean {
  return useNotificationsStore((state) => state.isLoading);
}

/**
 * Hook to get error state.
 */
export function useNotificationsError(): string | null {
  return useNotificationsStore((state) => state.error);
}

/**
 * Hook to get unread notifications only.
 * Uses shallow comparison for performance.
 */
export function useUnreadNotifications(): StoreNotification[] {
  return useNotificationsStore(useShallow((state) => state.getUnreadNotifications()));
}

/**
 * Hook to get a notification by ID.
 */
export function useNotificationById(id: string): StoreNotification | undefined {
  return useNotificationsStore((state) => state.getNotificationById(id));
}

/**
 * Hook to get all notification-related state and actions.
 * Useful for components that need multiple values.
 */
export function useNotificationState() {
  return useNotificationsStore(
    useShallow((state) => ({
      notifications: state.notifications,
      unreadCount: state.unreadCount,
      isLoading: state.isLoading,
      error: state.error,
      lastFetched: state.lastFetched,
      // Actions
      loadNotifications: state.loadNotifications,
      refreshUnreadCount: state.refreshUnreadCount,
      markAsRead: state.markAsRead,
      markAllAsRead: state.markAllAsRead,
      removeNotification: state.removeNotification,
      clearError: state.clearError,
    }))
  );
}

// Export store for direct access (useful for testing and devtools)
export default useNotificationsStore;
