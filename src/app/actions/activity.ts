'use server';

/**
 * Server Actions for Activity Log Management
 *
 * These server actions provide the API layer for retrieving activity logs.
 * Activities are automatically created by other server actions when tasks
 * are created, updated, moved, or when comments are added/edited/deleted.
 *
 * This module provides read-only access to activity data plus a helper
 * function for logging activities from other server actions.
 *
 * Security Features:
 * - Authentication required for all operations
 * - Ownership verification (user must own the task)
 * - No user input in activity creation (internal use only)
 *
 * CSRF Protection: Next.js server actions have built-in CSRF protection via
 * origin checking.
 */

import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { TaskIdSchema } from '@/lib/schemas';

// Activity type enum - matches Prisma schema
// Will be imported from generated Prisma client after migration
export type ActivityType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_MOVED'
  | 'TASK_DELETED'
  | 'COMMENT_ADDED'
  | 'COMMENT_UPDATED'
  | 'COMMENT_DELETED'
  | 'LABEL_ADDED'
  | 'LABEL_REMOVED';

// ============================================================================
// Response Types
// ============================================================================

/**
 * Standard action response format for consistent error handling.
 */
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Activity type returned from server actions.
 * Includes user information for display.
 */
export interface ActivityResponse {
  id: string;
  type: ActivityType;
  taskId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  data: Record<string, unknown>;
  createdAt: string;
}

/**
 * Paginated activities response with total count.
 */
export interface ActivityListResponse {
  activities: ActivityResponse[];
  total: number;
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
 * Transforms a Prisma Activity to the response format.
 */
function transformActivity(activity: {
  id: string;
  type: ActivityType;
  taskId: string;
  userId: string;
  data: unknown;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}): ActivityResponse {
  return {
    id: activity.id,
    type: activity.type,
    taskId: activity.taskId,
    userId: activity.userId,
    userName: activity.user?.name ?? null,
    userEmail: activity.user?.email ?? '',
    data: (activity.data as Record<string, unknown>) ?? {},
    createdAt: activity.createdAt.toISOString(),
  };
}

/**
 * Generic error message returned to clients.
 */
const GENERIC_ERROR_MESSAGE = 'An error occurred while processing your request. Please try again.';

/**
 * Handles database errors with secure error messaging.
 */
function handleDatabaseError(error: unknown, context: string): string {
  if (error instanceof Error) {
    console.error(`Database error in ${context}:`, {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } else {
    console.error(`Database error in ${context}:`, error);
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    const code = (error as { code: string }).code;
    if (code === 'P2025') {
      return 'The requested item was not found or you do not have permission to access it.';
    }
  }

  return GENERIC_ERROR_MESSAGE;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Retrieves activity timeline for a task with pagination.
 * User must own the task to view its activity.
 * Returns activities in reverse chronological order (newest first).
 *
 * @param taskId - UUID of the task
 * @param options - Pagination options (limit, offset)
 * @returns ActionResponse with activities and total count
 */
export async function getTaskActivity(
  taskId: string,
  options?: { limit?: number; offset?: number }
): Promise<ActionResponse<ActivityListResponse>> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Validate task ID
    const idValidation = TaskIdSchema.safeParse(taskId);
    if (!idValidation.success) {
      return { success: false, error: 'Invalid task ID format' };
    }

    // 3. Apply pagination limits
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
    const offset = Math.max(options?.offset ?? 0, 0);

    // 4. Verify task exists and user owns it
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        ownerId: userId,
      },
    });
    if (!task) {
      return {
        success: false,
        error: 'Task not found or you do not have permission to view it',
      };
    }

    // 5. Fetch activities with user info (newest first)
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { taskId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activity.count({ where: { taskId } }),
    ]);

    return {
      success: true,
      data: {
        activities: activities.map(transformActivity),
        total,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getTaskActivity'),
    };
  }
}

/**
 * Retrieves recent activity for the current user across all their tasks.
 * Useful for a global activity feed or dashboard.
 *
 * @param options - Pagination options (limit, offset)
 * @returns ActionResponse with activities and total count
 */
export async function getUserActivity(
  options?: { limit?: number; offset?: number }
): Promise<ActionResponse<ActivityListResponse>> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Apply pagination limits
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
    const offset = Math.max(options?.offset ?? 0, 0);

    // 3. Fetch activities for tasks owned by user (newest first)
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: {
          task: {
            ownerId: userId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activity.count({
        where: {
          task: {
            ownerId: userId,
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        activities: activities.map(transformActivity),
        total,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getUserActivity'),
    };
  }
}

/**
 * Internal function to log activity.
 * Called from other server actions (tasks, comments, labels).
 *
 * This function is designed to be non-blocking - it logs errors but
 * doesn't throw, so the main operation can still succeed even if
 * activity logging fails.
 *
 * @param type - The activity type
 * @param taskId - UUID of the task
 * @param userId - UUID of the user performing the action
 * @param data - Optional additional data about the activity
 */
export async function logTaskActivity(
  type: ActivityType,
  taskId: string,
  userId: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        type,
        taskId,
        userId,
        data: data ?? {},
      },
    });
  } catch (error) {
    // Log but don't throw - activity logging shouldn't block main operations
    console.error(`Failed to log activity (${type} on ${taskId}):`, error);
  }
}

/**
 * Gets activity counts by type for a task.
 * Useful for showing activity summary in UI.
 *
 * @param taskId - UUID of the task
 * @returns ActionResponse with counts by activity type
 */
export async function getTaskActivityCounts(
  taskId: string
): Promise<ActionResponse<Record<ActivityType, number>>> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Validate task ID
    const idValidation = TaskIdSchema.safeParse(taskId);
    if (!idValidation.success) {
      return { success: false, error: 'Invalid task ID format' };
    }

    // 3. Verify task exists and user owns it
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        ownerId: userId,
      },
    });
    if (!task) {
      return {
        success: false,
        error: 'Task not found or you do not have permission to view it',
      };
    }

    // 4. Get counts grouped by type
    const counts = await prisma.activity.groupBy({
      by: ['type'],
      where: { taskId },
      _count: true,
    });

    // 5. Transform to record format with all types initialized to 0
    const result: Record<ActivityType, number> = {
      TASK_CREATED: 0,
      TASK_UPDATED: 0,
      TASK_MOVED: 0,
      TASK_DELETED: 0,
      COMMENT_ADDED: 0,
      COMMENT_UPDATED: 0,
      COMMENT_DELETED: 0,
      LABEL_ADDED: 0,
      LABEL_REMOVED: 0,
    };

    for (const count of counts) {
      const activityType = count.type as ActivityType;
      result[activityType] = count._count;
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getTaskActivityCounts'),
    };
  }
}
