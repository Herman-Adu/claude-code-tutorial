/**
 * NotificationBell Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the store before importing components
vi.mock('@/store/notifications', () => ({
  useNotificationsStore: vi.fn(),
  useUnreadNotificationCount: vi.fn(),
  useNotifications: vi.fn(),
  useNotificationState: vi.fn(),
}));

import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import * as storeModule from '@/store/notifications';

describe('NotificationBell', () => {
  const mockRefreshUnreadCount = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock implementation
    vi.mocked(storeModule.useUnreadNotificationCount).mockReturnValue(0);
    vi.mocked(storeModule.useNotificationsStore).mockImplementation((selector) => {
      const state = {
        refreshUnreadCount: mockRefreshUnreadCount,
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        loadNotifications: vi.fn(),
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        removeNotification: vi.fn(),
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });
    vi.mocked(storeModule.useNotificationState).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastFetched: null,
      loadNotifications: vi.fn().mockResolvedValue(true),
      refreshUnreadCount: mockRefreshUnreadCount,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      removeNotification: vi.fn(),
      clearError: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render bell button', () => {
    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toBeInTheDocument();
  });

  it('should show badge when there are unread notifications', () => {
    vi.mocked(storeModule.useUnreadNotificationCount).mockReturnValue(5);

    render(<NotificationBell />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should not show badge when there are no unread notifications', () => {
    vi.mocked(storeModule.useUnreadNotificationCount).mockReturnValue(0);

    render(<NotificationBell />);

    expect(screen.queryByText('0')).toBeNull();
  });

  it('should show 99+ for more than 99 notifications', () => {
    vi.mocked(storeModule.useUnreadNotificationCount).mockReturnValue(150);

    render(<NotificationBell />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should toggle dropdown on click', () => {
    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click again to close (the button is still accessible)
    fireEvent.click(button);

    // After second click, dialog should be closed
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should call refreshUnreadCount on mount', () => {
    render(<NotificationBell />);

    expect(mockRefreshUnreadCount).toHaveBeenCalledTimes(1);
  });

  it('should poll for unread count periodically', () => {
    render(<NotificationBell />);

    // Initial call
    expect(mockRefreshUnreadCount).toHaveBeenCalledTimes(1);

    // Advance timer by 30 seconds
    vi.advanceTimersByTime(30000);

    expect(mockRefreshUnreadCount).toHaveBeenCalledTimes(2);

    // Advance another 30 seconds
    vi.advanceTimersByTime(30000);

    expect(mockRefreshUnreadCount).toHaveBeenCalledTimes(3);
  });

  it('should have correct aria attributes', () => {
    vi.mocked(storeModule.useUnreadNotificationCount).mockReturnValue(3);

    render(<NotificationBell />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-label', 'Notifications, 3 unread');
  });

  it('should update aria-expanded when dropdown is open', () => {
    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('should handle keyboard navigation', () => {
    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should have filled bell icon when there are unread notifications', () => {
    vi.mocked(storeModule.useUnreadNotificationCount).mockReturnValue(5);

    const { container } = render(<NotificationBell />);

    // The bell icon should have text-sky-500 class when there are unread
    expect(container.querySelector('.text-sky-500')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<NotificationBell className="custom-class" />);

    const wrapper = screen.getByRole('button', { name: /notifications/i }).parentElement;
    expect(wrapper).toHaveClass('custom-class');
  });
});
