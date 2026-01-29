'use client';

/**
 * NotificationBell Component
 *
 * Bell icon button for the navigation bar that shows unread notification count
 * and opens the notification dropdown when clicked.
 */

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNotificationsStore, useUnreadNotificationCount } from '@/store/notifications';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  /** Custom class name for styling */
  className?: string;
}

/**
 * Polling interval for refreshing unread count (30 seconds).
 */
const POLL_INTERVAL_MS = 30000;

/**
 * NotificationBell displays a bell icon with unread badge and dropdown.
 */
export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useUnreadNotificationCount();
  const refreshUnreadCount = useNotificationsStore((state) => state.refreshUnreadCount);

  // Refresh unread count on mount and periodically
  useEffect(() => {
    // Initial fetch
    refreshUnreadCount();

    // Set up polling interval
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'relative flex items-center justify-center w-10 h-10',
          'rounded-xl bg-white/60 text-slate-600',
          'border border-white/40 shadow-[0_4px_12px_rgba(100,100,140,0.08)]',
          'hover:bg-white/80 hover:shadow-[0_6px_16px_rgba(100,100,140,0.12)]',
          'transition-all focus:outline-none focus:ring-2 focus:ring-sky-400/50',
          isOpen && 'bg-white/80 shadow-[0_6px_16px_rgba(100,100,140,0.12)]'
        )}
      >
        {/* Bell icon */}
        <svg
          className={cn(
            'w-5 h-5 transition-colors',
            unreadCount > 0 ? 'text-sky-500' : 'text-slate-600'
          )}
          fill={unreadCount > 0 ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={unreadCount > 0 ? 0 : 1.5}
          aria-hidden="true"
        >
          {unreadCount > 0 ? (
            // Filled bell icon when there are unread notifications
            <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5ZM12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" />
          ) : (
            // Outline bell icon when no unread notifications
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          )}
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center',
              'min-w-[1.25rem] h-5 px-1 text-xs font-semibold text-white',
              'bg-gradient-to-br from-rose-400 to-pink-500 rounded-full',
              'shadow-[0_2px_8px_rgba(240,150,150,0.4)]',
              'animate-pulse'
            )}
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <NotificationDropdown isOpen={isOpen} onClose={handleClose} />
    </div>
  );
}
