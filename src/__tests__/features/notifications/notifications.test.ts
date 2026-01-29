/**
 * Notifications Feature Unit Tests
 *
 * Tests for notification server actions and store functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ============================================================================
// Mocks - Must be before any imports that use them
// ============================================================================

// Mock server actions for store tests
vi.mock('@/app/actions/notifications', () => ({
  getNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  createNotification: vi.fn(),
}));

import {
  useNotificationsStore,
  useNotifications,
  useUnreadNotificationCount,
  useNotificationsLoading,
  useNotificationsError,
  type StoreNotification,
} from '@/store/notifications';

import * as notificationActions from '@/app/actions/notifications';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockNotification(overrides: Partial<StoreNotification> = {}): StoreNotification {
  return {
    id: 'notification-1',
    userId: 'user-1',
    eventType: 'COMMENT_ADDED_TO_TASK',
    taskId: 'task-1',
    isRead: false,
    readAt: null,
    title: 'New comment',
    message: 'Someone commented on your task',
    data: {},
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function resetStore() {
  useNotificationsStore.setState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    lastFetched: null,
  });
}

function resetStoreWithNotifications(notifications: StoreNotification[]) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  useNotificationsStore.setState({
    notifications,
    unreadCount,
    isLoading: false,
    error: null,
    lastFetched: new Date().toISOString(),
  });
}

// ============================================================================
// Store Tests
// ============================================================================

describe('Notifications Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useNotificationsStore.getState();

      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeNull();
    });
  });

  describe('loadNotifications', () => {
    it('should load notifications successfully', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1' }),
        createMockNotification({ id: 'notif-2', isRead: true }),
      ];

      vi.mocked(notificationActions.getNotifications).mockResolvedValue({
        success: true,
        data: {
          notifications: mockNotifications,
          total: 2,
        },
      });

      const store = useNotificationsStore.getState();
      const result = await store.loadNotifications();

      expect(result).toBe(true);
      expect(useNotificationsStore.getState().notifications).toEqual(mockNotifications);
      expect(useNotificationsStore.getState().isLoading).toBe(false);
      expect(useNotificationsStore.getState().lastFetched).not.toBeNull();
    });

    it('should handle load failure', async () => {
      vi.mocked(notificationActions.getNotifications).mockResolvedValue({
        success: false,
        error: 'Failed to load',
      });

      const store = useNotificationsStore.getState();
      const result = await store.loadNotifications();

      expect(result).toBe(false);
      expect(useNotificationsStore.getState().error).toBe('Failed to load');
      expect(useNotificationsStore.getState().isLoading).toBe(false);
    });

    it('should handle load exception', async () => {
      vi.mocked(notificationActions.getNotifications).mockRejectedValue(
        new Error('Network error')
      );

      const store = useNotificationsStore.getState();
      const result = await store.loadNotifications();

      expect(result).toBe(false);
      expect(useNotificationsStore.getState().error).toBe('Network error');
    });

    it('should set loading state during load', async () => {
      let loadingDuringOperation = false;

      vi.mocked(notificationActions.getNotifications).mockImplementation(async () => {
        loadingDuringOperation = useNotificationsStore.getState().isLoading;
        return {
          success: true,
          data: { notifications: [], total: 0 },
        };
      });

      const store = useNotificationsStore.getState();
      await store.loadNotifications();

      expect(loadingDuringOperation).toBe(true);
      expect(useNotificationsStore.getState().isLoading).toBe(false);
    });
  });

  describe('refreshUnreadCount', () => {
    it('should refresh unread count successfully', async () => {
      vi.mocked(notificationActions.getUnreadNotificationCount).mockResolvedValue({
        success: true,
        data: 5,
      });

      const store = useNotificationsStore.getState();
      const result = await store.refreshUnreadCount();

      expect(result).toBe(true);
      expect(useNotificationsStore.getState().unreadCount).toBe(5);
    });

    it('should handle refresh failure', async () => {
      vi.mocked(notificationActions.getUnreadNotificationCount).mockResolvedValue({
        success: false,
        error: 'Failed to get count',
      });

      const store = useNotificationsStore.getState();
      const result = await store.refreshUnreadCount();

      expect(result).toBe(false);
      expect(useNotificationsStore.getState().error).toBe('Failed to get count');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read with optimistic update', async () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
        createMockNotification({ id: 'notif-2', isRead: false }),
      ];
      resetStoreWithNotifications(notifications);

      vi.mocked(notificationActions.markNotificationAsRead).mockResolvedValue({
        success: true,
      });

      const store = useNotificationsStore.getState();
      const result = await store.markAsRead('notif-1');

      expect(result).toBe(true);
      const state = useNotificationsStore.getState();
      expect(state.notifications.find((n) => n.id === 'notif-1')?.isRead).toBe(true);
      expect(state.unreadCount).toBe(1);
    });

    it('should rollback on failure', async () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
      ];
      resetStoreWithNotifications(notifications);

      vi.mocked(notificationActions.markNotificationAsRead).mockResolvedValue({
        success: false,
        error: 'Failed to mark as read',
      });

      const store = useNotificationsStore.getState();
      const result = await store.markAsRead('notif-1');

      expect(result).toBe(false);
      const state = useNotificationsStore.getState();
      expect(state.notifications.find((n) => n.id === 'notif-1')?.isRead).toBe(false);
      expect(state.unreadCount).toBe(1);
      expect(state.error).toBe('Failed to mark as read');
    });

    it('should return error for non-existent notification', async () => {
      resetStoreWithNotifications([]);

      const store = useNotificationsStore.getState();
      const result = await store.markAsRead('non-existent');

      expect(result).toBe(false);
      expect(useNotificationsStore.getState().error).toBe('Notification not found');
    });

    it('should skip already read notifications', async () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', isRead: true }),
      ];
      resetStoreWithNotifications(notifications);

      const store = useNotificationsStore.getState();
      const result = await store.markAsRead('notif-1');

      expect(result).toBe(true);
      expect(notificationActions.markNotificationAsRead).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read with optimistic update', async () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
        createMockNotification({ id: 'notif-2', isRead: false }),
        createMockNotification({ id: 'notif-3', isRead: true }),
      ];
      resetStoreWithNotifications(notifications);

      vi.mocked(notificationActions.markAllNotificationsAsRead).mockResolvedValue({
        success: true,
        data: 'Marked 2 notifications as read',
      });

      const store = useNotificationsStore.getState();
      const result = await store.markAllAsRead();

      expect(result).toBe(true);
      const state = useNotificationsStore.getState();
      expect(state.notifications.every((n) => n.isRead)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('should rollback on failure', async () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
      ];
      resetStoreWithNotifications(notifications);

      vi.mocked(notificationActions.markAllNotificationsAsRead).mockResolvedValue({
        success: false,
        error: 'Failed',
      });

      const store = useNotificationsStore.getState();
      const result = await store.markAllAsRead();

      expect(result).toBe(false);
      const state = useNotificationsStore.getState();
      expect(state.notifications.find((n) => n.id === 'notif-1')?.isRead).toBe(false);
      expect(state.unreadCount).toBe(1);
    });

    it('should skip when no unread notifications', async () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', isRead: true }),
      ];
      resetStoreWithNotifications(notifications);

      const store = useNotificationsStore.getState();
      const result = await store.markAllAsRead();

      expect(result).toBe(true);
      expect(notificationActions.markAllNotificationsAsRead).not.toHaveBeenCalled();
    });
  });

  describe('removeNotification', () => {
    it('should remove notification with optimistic update', async () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
        createMockNotification({ id: 'notif-2', isRead: true }),
      ];
      resetStoreWithNotifications(notifications);

      vi.mocked(notificationActions.deleteNotification).mockResolvedValue({
        success: true,
      });

      const store = useNotificationsStore.getState();
      const result = await store.removeNotification('notif-1');

      expect(result).toBe(true);
      const state = useNotificationsStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].id).toBe('notif-2');
      expect(state.unreadCount).toBe(0);
    });

    it('should rollback on failure', async () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
      ];
      resetStoreWithNotifications(notifications);

      vi.mocked(notificationActions.deleteNotification).mockResolvedValue({
        success: false,
        error: 'Failed to delete',
      });

      const store = useNotificationsStore.getState();
      const result = await store.removeNotification('notif-1');

      expect(result).toBe(false);
      const state = useNotificationsStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(1);
      expect(state.error).toBe('Failed to delete');
    });

    it('should return error for non-existent notification', async () => {
      resetStoreWithNotifications([]);

      const store = useNotificationsStore.getState();
      const result = await store.removeNotification('non-existent');

      expect(result).toBe(false);
      expect(useNotificationsStore.getState().error).toBe('Notification not found');
    });
  });

  describe('Selectors', () => {
    it('should get unread notifications', () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
        createMockNotification({ id: 'notif-2', isRead: true }),
        createMockNotification({ id: 'notif-3', isRead: false }),
      ];
      resetStoreWithNotifications(notifications);

      const unread = useNotificationsStore.getState().getUnreadNotifications();

      expect(unread).toHaveLength(2);
      expect(unread.every((n) => !n.isRead)).toBe(true);
    });

    it('should get notification by ID', () => {
      const notifications = [
        createMockNotification({ id: 'notif-1' }),
        createMockNotification({ id: 'notif-2' }),
      ];
      resetStoreWithNotifications(notifications);

      const notification = useNotificationsStore.getState().getNotificationById('notif-1');

      expect(notification).toBeDefined();
      expect(notification?.id).toBe('notif-1');
    });

    it('should return undefined for non-existent notification', () => {
      resetStoreWithNotifications([]);

      const notification = useNotificationsStore.getState().getNotificationById('non-existent');

      expect(notification).toBeUndefined();
    });
  });

  describe('State Setters', () => {
    it('should set and clear error', () => {
      const store = useNotificationsStore.getState();

      store.setError('Test error');
      expect(useNotificationsStore.getState().error).toBe('Test error');

      store.clearError();
      expect(useNotificationsStore.getState().error).toBeNull();
    });

    it('should set notifications directly', () => {
      const notifications = [createMockNotification()];

      useNotificationsStore.getState().setNotifications(notifications);

      expect(useNotificationsStore.getState().notifications).toEqual(notifications);
    });

    it('should set unread count directly', () => {
      useNotificationsStore.getState().setUnreadCount(10);

      expect(useNotificationsStore.getState().unreadCount).toBe(10);
    });
  });
});

// ============================================================================
// Hook Tests
// ============================================================================

describe('Notification Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  describe('useNotifications', () => {
    it('should return notifications from store', () => {
      const notifications = [createMockNotification()];
      resetStoreWithNotifications(notifications);

      const { result } = renderHook(() => useNotifications());

      expect(result.current).toEqual(notifications);
    });

    it('should update when notifications change', () => {
      resetStoreWithNotifications([]);

      const { result, rerender } = renderHook(() => useNotifications());
      expect(result.current).toHaveLength(0);

      act(() => {
        useNotificationsStore.getState().setNotifications([createMockNotification()]);
      });

      rerender();
      expect(result.current).toHaveLength(1);
    });
  });

  describe('useUnreadNotificationCount', () => {
    it('should return unread count from store', () => {
      const notifications = [
        createMockNotification({ id: '1', isRead: false }),
        createMockNotification({ id: '2', isRead: false }),
        createMockNotification({ id: '3', isRead: true }),
      ];
      resetStoreWithNotifications(notifications);

      const { result } = renderHook(() => useUnreadNotificationCount());

      expect(result.current).toBe(2);
    });
  });

  describe('useNotificationsLoading', () => {
    it('should return loading state from store', () => {
      const { result, rerender } = renderHook(() => useNotificationsLoading());
      expect(result.current).toBe(false);

      act(() => {
        useNotificationsStore.setState({ isLoading: true });
      });

      rerender();
      expect(result.current).toBe(true);
    });
  });

  describe('useNotificationsError', () => {
    it('should return error state from store', () => {
      const { result, rerender } = renderHook(() => useNotificationsError());
      expect(result.current).toBeNull();

      act(() => {
        useNotificationsStore.getState().setError('Test error');
      });

      rerender();
      expect(result.current).toBe('Test error');
    });
  });
});
