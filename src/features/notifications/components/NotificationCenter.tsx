'use client';

/**
 * NotificationCenter Component
 *
 * Full page/modal view for all notifications with pagination,
 * filtering, and bulk actions.
 */

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNotificationState } from '@/store/notifications';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/Button';

interface NotificationCenterProps {
  /** Custom class name for styling */
  className?: string;
}

/**
 * Filter options for notification list.
 */
type FilterOption = 'all' | 'unread';

/**
 * NotificationCenter displays a full list of notifications with controls.
 */
export function NotificationCenter({ className }: NotificationCenterProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    loadNotifications,
    clearError,
  } = useNotificationState();

  // Load notifications on mount
  useEffect(() => {
    loadNotifications(filter === 'unread');
  }, [filter, loadNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleFilterChange = useCallback((newFilter: FilterOption) => {
    setFilter(newFilter);
  }, []);

  const handleRetry = useCallback(() => {
    clearError();
    loadNotifications(filter === 'unread');
  }, [clearError, filter, loadNotifications]);

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'You\'re all caught up!'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
        <button
          type="button"
          onClick={() => handleFilterChange('all')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            filter === 'all'
              ? 'bg-white text-slate-700 shadow-[0_2px_8px_rgba(100,100,140,0.1)]'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          )}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => handleFilterChange('unread')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2',
            filter === 'unread'
              ? 'bg-white text-slate-700 shadow-[0_2px_8px_rgba(100,100,140,0.1)]'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          )}
        >
          Unread
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium text-sky-700 bg-sky-100/80 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50/80 border border-rose-200/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-rose-100">
              <svg
                className="w-4 h-4 text-rose-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <p className="text-sm text-rose-700">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      )}

      {/* Notification list */}
      <div
        className={cn(
          'bg-white/70 backdrop-blur-sm rounded-2xl border border-white/40',
          'shadow-[0_4px_24px_rgba(100,100,140,0.08)]'
        )}
      >
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-slate-100 mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-slate-600">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {filter === 'unread'
                ? 'You\'ve read all your notifications!'
                : 'When you receive notifications, they\'ll appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={removeNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination info */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-center">
          <p className="text-sm text-slate-500">
            Showing {filteredNotifications.length} notification
            {filteredNotifications.length === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  );
}
