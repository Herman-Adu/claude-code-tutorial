/**
 * NotificationItem Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationItem } from '@/features/notifications/components/NotificationItem';
import type { StoreNotification } from '@/store/notifications';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => (
    <a href={href} onClick={onClick} data-testid="notification-link">
      {children}
    </a>
  ),
}));

describe('NotificationItem', () => {
  const mockOnMarkAsRead = vi.fn();
  const mockOnDelete = vi.fn();

  const createNotification = (overrides: Partial<StoreNotification> = {}): StoreNotification => ({
    id: 'notification-1',
    userId: 'user-1',
    eventType: 'COMMENT_ADDED_TO_TASK',
    taskId: 'task-1',
    isRead: false,
    readAt: null,
    title: 'New comment on task',
    message: 'Someone commented on your task',
    data: {},
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notification title and message', () => {
    const notification = createNotification();

    render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('New comment on task')).toBeInTheDocument();
    expect(screen.getByText('Someone commented on your task')).toBeInTheDocument();
  });

  it('should show unread indicator for unread notifications', () => {
    const notification = createNotification({ isRead: false });

    render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    );

    // The unread indicator is a small dot
    const unreadIndicator = document.querySelector('.bg-sky-500');
    expect(unreadIndicator).toBeInTheDocument();
  });

  it('should not show unread indicator for read notifications', () => {
    const notification = createNotification({ isRead: true });

    render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    );

    // There should be no unread indicator dot with bg-sky-500 class
    const unreadIndicator = document.querySelector('.w-1\\.5.h-1\\.5.bg-sky-500');
    expect(unreadIndicator).toBeNull();
  });

  it('should call onMarkAsRead when clicked on unread notification', () => {
    const notification = createNotification({ isRead: false });

    render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    );

    // Get the main clickable item by its specific aria-label
    const item = screen.getByRole('button', { name: /unread notification/i });
    fireEvent.click(item);

    expect(mockOnMarkAsRead).toHaveBeenCalledWith('notification-1');
  });

  it('should not call onMarkAsRead when clicked on read notification', () => {
    const notification = createNotification({ isRead: true });

    render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    );

    // Get the main clickable item by its specific aria-label
    const item = screen.getByRole('button', { name: /read notification/i });
    fireEvent.click(item);

    expect(mockOnMarkAsRead).not.toHaveBeenCalled();
  });

  it('should call onDelete when delete button is clicked', () => {
    const notification = createNotification();

    render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('notification-1');
  });

  it('should render as a link when taskId is provided', () => {
    const notification = createNotification({ taskId: 'task-123' });

    render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    );

    const link = screen.getByTestId('notification-link');
    expect(link).toHaveAttribute('href', '/?task=task-123');
  });

  it('should not render as a link when taskId is null', () => {
    const notification = createNotification({ taskId: null });

    render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    );

    const link = screen.queryByTestId('notification-link');
    expect(link).toBeNull();
  });

  it('should render in compact mode without message', () => {
    const notification = createNotification();

    render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
        compact
      />
    );

    expect(screen.getByText('New comment on task')).toBeInTheDocument();
    expect(screen.queryByText('Someone commented on your task')).toBeNull();
  });

  it('should handle keyboard navigation', () => {
    const notification = createNotification({ isRead: false });

    render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    );

    const item = screen.getByRole('button', { name: /unread notification/i });
    fireEvent.keyDown(item, { key: 'Enter' });

    expect(mockOnMarkAsRead).toHaveBeenCalledWith('notification-1');
  });

  it('should display correct icon for different event types', () => {
    const commentNotification = createNotification({ eventType: 'COMMENT_ADDED_TO_TASK' });

    const { container } = render(
      <NotificationItem
        notification={commentNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    );

    // Should have sky-colored icon for comment
    expect(container.querySelector('.text-sky-500')).toBeInTheDocument();
  });

  it('should display relative time for recent notifications', () => {
    const recentNotification = createNotification({
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    });

    render(
      <NotificationItem
        notification={recentNotification}
        onMarkAsRead={mockOnMarkAsRead}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/minutes ago/i)).toBeInTheDocument();
  });
});
