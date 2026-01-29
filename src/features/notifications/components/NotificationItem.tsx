'use client';

/**
 * NotificationItem Component
 *
 * Displays a single notification with read status indicator,
 * title, message, timestamp, and action buttons.
 */

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { StoreNotification } from '@/store/notifications';

interface NotificationItemProps {
  /** The notification to display */
  notification: StoreNotification;
  /** Callback when notification is clicked to mark as read */
  onMarkAsRead: (id: string) => void;
  /** Callback when delete button is clicked */
  onDelete: (id: string) => void;
  /** Whether to show compact view (for dropdown) */
  compact?: boolean;
}

/**
 * Formats a date string to relative time (e.g., "2 minutes ago").
 * Falls back to absolute date for older notifications.
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Gets icon for notification event type.
 */
function getEventIcon(eventType: string): React.ReactNode {
  switch (eventType) {
    case 'COMMENT_ADDED_TO_TASK':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
      );
    case 'TASK_MOVED_TO_COMPLETED':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case 'TASK_MODIFIED':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
      );
  }
}

/**
 * Gets icon color for notification event type.
 */
function getEventIconColor(eventType: string): string {
  switch (eventType) {
    case 'COMMENT_ADDED_TO_TASK':
      return 'text-sky-500 bg-sky-100/80';
    case 'TASK_MOVED_TO_COMPLETED':
      return 'text-emerald-500 bg-emerald-100/80';
    case 'TASK_MODIFIED':
      return 'text-amber-500 bg-amber-100/80';
    default:
      return 'text-slate-500 bg-slate-100/80';
  }
}

/**
 * NotificationItem displays a single notification.
 */
export const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const handleClick = useCallback(() => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  }, [notification.id, notification.isRead, onMarkAsRead]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete(notification.id);
    },
    [notification.id, onDelete]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const content = (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${notification.isRead ? 'Read' : 'Unread'} notification: ${notification.title}`}
      className={cn(
        'group relative flex gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer',
        'hover:bg-white/60',
        !notification.isRead && 'bg-sky-50/50'
      )}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div
          className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sky-500"
          aria-hidden="true"
        />
      )}

      {/* Event icon */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full',
          getEventIconColor(notification.eventType)
        )}
        aria-hidden="true"
      >
        {getEventIcon(notification.eventType)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium text-slate-700 truncate',
            !notification.isRead && 'font-semibold'
          )}
        >
          {notification.title}
        </p>
        {!compact && (
          <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-slate-400 mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        aria-label={`Delete notification: ${notification.title}`}
        className={cn(
          'flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg',
          'text-slate-400 hover:text-rose-500 hover:bg-rose-50',
          'opacity-0 group-hover:opacity-100 transition-all duration-200',
          'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-400/50'
        )}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  // If notification has a taskId, wrap in a link
  if (notification.taskId) {
    return (
      <Link
        href={`/?task=${notification.taskId}`}
        className="block"
        onClick={handleClick}
      >
        {content}
      </Link>
    );
  }

  return content;
});
