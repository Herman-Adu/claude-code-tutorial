'use server';

/**
 * Server Actions for Notification Management
 *
 * These server actions provide the API layer for notification CRUD operations.
 * All inputs are validated and sanitized before database storage.
 * Errors are handled gracefully with consistent response format.
 *
 * CSRF Protection: Next.js server actions have built-in CSRF protection via
 * origin checking. Server actions automatically verify that requests originate
 * from the same origin, preventing cross-site request forgery attacks.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import type { InputJsonValue } from '@/generated/prisma/internal/prismaNamespace';

// NotificationEventType enum matching the Prisma schema
// Defined locally to avoid dependency on generated types during development
export type NotificationEventType =
  | 'COMMENT_ADDED_TO_TASK'
  | 'TASK_MOVED_TO_COMPLETED'
  | 'TASK_MODIFIED';

// ============================================================================
// Response Types
// ============================================================================

/**
 * Standard action response format for consistent error handling.
 * All server actions return this shape.
 */
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Notification type returned from server actions.
 * Matches Prisma model with JSON fields typed appropriately.
 */
export interface NotificationResponse {
  id: string;
  userId: string;
  eventType: NotificationEventType;
  taskId: string | null;
  isRead: boolean;
  readAt: string | null;
  title: string;
  message: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the current authenticated user's ID from the session.
 * Returns null if the user is not authenticated.
 */
async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Transforms a Prisma Notification model to the response format.
 * Handles Date to string conversion and JSON field typing.
 */
function transformNotification(notification: {
  id: string;
  userId: string;
  eventType: NotificationEventType;
  taskId: string | null;
  isRead: boolean;
  readAt: Date | null;
  title: string;
  message: string;
  data: unknown;
  createdAt: Date;
}): NotificationResponse {
  return {
    id: notification.id,
    userId: notification.userId,
    eventType: notification.eventType,
    taskId: notification.taskId,
    isRead: notification.isRead,
    readAt: notification.readAt?.toISOString() ?? null,
    title: notification.title,
    message: notification.message,
    data: (notification.data as Record<string, unknown>) || {},
    createdAt: notification.createdAt.toISOString(),
  };
}

/**
 * Generic error message returned to clients.
 * Prevents information disclosure by not revealing internal error details.
 */
const GENERIC_ERROR_MESSAGE = 'An error occurred while processing your request. Please try again.';

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get notifications for current user (paginated, newest first).
 * Optionally filter to unread only.
 *
 * @param options - Pagination and filter options
 * @returns ActionResponse with notifications array and total count
 */
export async function getNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<ActionResponse<{ notifications: NotificationResponse[]; total: number }>> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Validate and sanitize options
    const limit = Math.min(Math.max(options?.limit || 50, 1), 100);
    const offset = Math.max(options?.offset || 0, 0);

    // 3. Build where clause
    const where: { userId: string; isRead?: boolean } = { userId };
    if (options?.unreadOnly) {
      where.isRead = false;
    }

    // 4. Fetch notifications (newest first) with pagination
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      success: true,
      data: {
        notifications: notifications.map(transformNotification),
        total,
      },
    };
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return {
      success: false,
      error: 'An error occurred while fetching notifications. Please try again.',
    };
  }
}

/**
 * Get count of unread notifications (lightweight query for badge).
 *
 * @returns ActionResponse with unread count
 */
export async function getUnreadNotificationCount(): Promise<ActionResponse<number>> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Count unread notifications
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { success: true, data: count };
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return {
      success: false,
      error: 'An error occurred. Please try again.',
    };
  }
}

/**
 * Mark single notification as read.
 *
 * @param notificationId - UUID of the notification to mark as read
 * @returns ActionResponse indicating success or error
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<ActionResponse> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Validate notification ID format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(notificationId)) {
      return { success: false, error: 'Invalid notification ID format' };
    }

    // 3. Verify ownership and update in single query
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId, // Verify user owns this notification
      },
    });

    if (!notification) {
      return {
        success: false,
        error: 'Notification not found or you do not have permission to update it',
      };
    }

    // 4. Mark as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return {
      success: false,
      error: 'An error occurred while updating the notification. Please try again.',
    };
  }
}

/**
 * Mark all notifications as read for current user.
 *
 * @returns ActionResponse indicating success or error with count
 */
export async function markAllNotificationsAsRead(): Promise<ActionResponse<string>> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Update all unread notifications for this user
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: `Marked ${result.count} notifications as read`,
    };
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return {
      success: false,
      error: 'An error occurred. Please try again.',
    };
  }
}

/**
 * Delete notification (hard delete).
 * Users can remove notifications from their list.
 *
 * @param notificationId - UUID of the notification to delete
 * @returns ActionResponse indicating success or error
 */
export async function deleteNotification(
  notificationId: string
): Promise<ActionResponse> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Validate notification ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(notificationId)) {
      return { success: false, error: 'Invalid notification ID format' };
    }

    // 3. Verify ownership
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return {
        success: false,
        error: 'Notification not found or you do not have permission to delete it',
      };
    }

    // 4. Delete notification
    await prisma.notification.delete({
      where: { id: notificationId },
    });

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return {
      success: false,
      error: 'An error occurred while deleting the notification. Please try again.',
    };
  }
}

/**
 * Internal function: Create notification for an event.
 * Called from other server actions (e.g., when comment added).
 *
 * This function is designed to fail silently - notification creation
 * should never block the main operation.
 *
 * @param userId - User ID to notify
 * @param eventType - Type of notification event
 * @param title - Notification title (max 200 chars)
 * @param message - Notification message (max 500 chars)
 * @param taskId - Optional task ID for linking
 * @param data - Optional metadata
 */
export async function createNotification(
  userId: string,
  eventType: NotificationEventType,
  title: string,
  message: string,
  taskId?: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    // Validate and sanitize inputs
    const sanitizedTitle = title.slice(0, 200);
    const sanitizedMessage = message.slice(0, 500);

    await prisma.notification.create({
      data: {
        userId,
        eventType,
        title: sanitizedTitle,
        message: sanitizedMessage,
        taskId: taskId || null,
        data: (data || {}) as InputJsonValue,
      },
    });
  } catch (error) {
    // Log but don't throw - notification creation shouldn't block main operation
    console.error('Failed to create notification:', error);
  }
}
