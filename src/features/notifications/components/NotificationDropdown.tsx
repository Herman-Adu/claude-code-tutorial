'use client';

/**
 * NotificationDropdown Component
 *
 * Popover dropdown shown when clicking the notification bell.
 * Displays recent notifications with a link to see all.
 */

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNotificationState } from '@/store/notifications';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  /** Whether the dropdown is open */
  isOpen: boolean;
  /** Callback when dropdown should close */
  onClose: () => void;
  /** Custom class name for positioning */
  className?: string;
}

/**
 * Maximum number of notifications to show in dropdown.
 */
const MAX_DROPDOWN_NOTIFICATIONS = 10;

/**
 * NotificationDropdown displays a popover with recent notifications.
 */
export function NotificationDropdown({
  isOpen,
  onClose,
  className,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    loadNotifications,
  } = useNotificationState();

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Delay to prevent immediate close from the trigger click
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  if (!isOpen) {
    return null;
  }

  const recentNotifications = notifications.slice(0, MAX_DROPDOWN_NOTIFICATIONS);
  const hasMore = notifications.length > MAX_DROPDOWN_NOTIFICATIONS;

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      className={cn(
        'absolute top-full right-0 mt-2 z-50',
        'w-96 max-h-[32rem] flex flex-col',
        'bg-white/95 backdrop-blur-xl',
        'border border-white/40 rounded-2xl',
        'shadow-[0_8px_32px_rgba(100,100,140,0.2),0_2px_8px_rgba(100,100,140,0.1)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium text-sky-700 bg-sky-100/80 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className={cn(
                'text-xs font-medium text-sky-600 hover:text-sky-700',
                'transition-colors duration-200'
              )}
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className={cn(
              'w-7 h-7 flex items-center justify-center',
              'text-slate-400 hover:text-slate-600',
              'rounded-lg hover:bg-slate-100/50',
              'transition-all duration-200'
            )}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 mb-3">
              <svg
                className="w-6 h-6 text-slate-400"
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
            <p className="text-sm font-medium text-slate-600">No notifications</p>
            <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="py-2">
            {recentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={removeNotification}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with "See all" link */}
      {(hasMore || recentNotifications.length > 0) && (
        <div className="px-4 py-3 border-t border-slate-200/50 flex-shrink-0">
          <Link
            href="/notifications"
            onClick={onClose}
            className={cn(
              'block w-full text-center py-2 text-sm font-medium text-sky-600',
              'hover:text-sky-700 hover:bg-sky-50/50 rounded-lg',
              'transition-all duration-200'
            )}
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
