'use server';

/**
 * Server Actions for Comment Management
 *
 * These server actions provide the API layer for comment CRUD operations.
 * All inputs are sanitized and validated with Zod schemas before database storage.
 * Errors are handled gracefully with consistent response format.
 *
 * Security Features:
 * - Authentication required for all operations
 * - Rate limiting (50 comments/hour per user)
 * - Input sanitization to prevent XSS
 * - Ownership verification for edit/delete
 * - Activity logging for audit trail
 *
 * CSRF Protection: Next.js server actions have built-in CSRF protection via
 * origin checking. Server actions automatically verify that requests originate
 * from the same origin, preventing cross-site request forgery attacks.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import {
  CreateCommentSchema,
  UpdateCommentSchema,
  CommentIdSchema,
  TaskIdSchema,
  type CreateCommentInput,
  type UpdateCommentInput,
} from '@/lib/schemas';
import { sanitizeString } from '@/lib/utils';
import { createNotification } from '@/app/actions/notifications';
import { checkRateLimit, getRateLimitErrorMessage } from '@/lib/rate-limit';

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
 * Comment type returned from server actions.
 * Includes author information for display.
 */
export interface CommentResponse {
  id: string;
  text: string;
  taskId: string;
  authorId: string;
  authorName: string | null;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
}

/**
 * Paginated comments response with total count.
 */
export interface CommentsListResponse {
  comments: CommentResponse[];
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
 * Sanitizes comment text to prevent XSS attacks.
 */
function sanitizeCommentInput(text: string): string {
  return sanitizeString(text.trim());
}

/**
 * Transforms a Prisma Comment to the response format.
 * Handles author relation and date serialization.
 */
function transformComment(comment: {
  id: string;
  text: string;
  taskId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  author?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}): CommentResponse {
  return {
    id: comment.id,
    text: comment.text,
    taskId: comment.taskId,
    authorId: comment.authorId,
    authorName: comment.author?.name ?? null,
    authorEmail: comment.author?.email ?? '',
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    editedAt: comment.editedAt?.toISOString() ?? null,
  };
}

/**
 * Formats Zod validation errors into a readable string.
 */
function formatZodErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>
): string {
  return issues
    .map((issue) => {
      const pathStr = issue.path.map(String).join('.');
      const prefix = pathStr.length > 0 ? `${pathStr}: ` : '';
      return `${prefix}${issue.message}`;
    })
    .join('; ');
}

/**
 * Generic error message returned to clients.
 * Prevents information disclosure by not revealing internal error details.
 */
const GENERIC_ERROR_MESSAGE = 'An error occurred while processing your request. Please try again.';

/**
 * Handles database errors with secure error messaging.
 */
function handleDatabaseError(error: unknown, context: string): string {
  // Log detailed error server-side for debugging
  if (error instanceof Error) {
    console.error(`Database error in ${context}:`, {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } else {
    console.error(`Database error in ${context}:`, error);
  }

  // Check for Prisma known errors
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    const code = (error as { code: string }).code;
    switch (code) {
      case 'P2025':
        return 'The requested item was not found or you do not have permission to access it.';
      case 'P2002':
        return 'This item already exists.';
      default:
        return GENERIC_ERROR_MESSAGE;
    }
  }

  return GENERIC_ERROR_MESSAGE;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Creates a new comment on a task.
 * User must own the task to comment on it.
 *
 * @param input - Comment data with text and taskId
 * @returns ActionResponse with created comment or error
 */
export async function createComment(
  input: CreateCommentInput
): Promise<ActionResponse<CommentResponse>> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Rate limiting (uses Redis when configured, falls back to in-memory)
    const rateLimitResult = await checkRateLimit(userId, 'comments');
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: getRateLimitErrorMessage('comments'),
      };
    }

    // 3. Sanitization
    const sanitized = {
      text: sanitizeCommentInput(input.text),
      taskId: input.taskId.trim(),
    };

    // 4. Validation
    const validationResult = CreateCommentSchema.safeParse(sanitized);
    if (!validationResult.success) {
      return {
        success: false,
        error: formatZodErrors(validationResult.error.issues),
      };
    }

    // 5. Verify task exists and user owns it
    const task = await prisma.task.findFirst({
      where: {
        id: validationResult.data.taskId,
        ownerId: userId,
      },
    });
    if (!task) {
      return {
        success: false,
        error: 'Task not found or you do not have permission to comment on it',
      };
    }

    // 6. Create comment with author info
    const comment = await prisma.comment.create({
      data: {
        text: validationResult.data.text,
        taskId: validationResult.data.taskId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 7. Log activity
    await prisma.activity.create({
      data: {
        type: 'COMMENT_ADDED',
        taskId: task.id,
        userId,
        data: {
          commentId: comment.id,
          preview: validationResult.data.text.substring(0, 100),
        },
      },
    });

    // 8. Trigger notification for task owner (if not their own comment)
    if (task.ownerId !== userId) {
      await createNotification(
        task.ownerId,
        'COMMENT_ADDED_TO_TASK',
        `New comment on "${task.title}"`,
        `${comment.author?.name || 'Someone'} commented: "${validationResult.data.text.substring(0, 50)}..."`,
        task.id,
        {
          commentId: comment.id,
          authorId: userId,
          authorName: comment.author?.name,
        }
      );
    }

    // 9. Revalidate cache
    revalidatePath('/');

    return { success: true, data: transformComment(comment) };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'createComment'),
    };
  }
}

/**
 * Updates an existing comment.
 * Only the comment author can update their comment.
 *
 * @param commentId - UUID of the comment to update
 * @param input - New comment text
 * @returns ActionResponse with updated comment or error
 */
export async function updateComment(
  commentId: string,
  input: UpdateCommentInput
): Promise<ActionResponse<CommentResponse>> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Validate comment ID
    const idValidation = CommentIdSchema.safeParse(commentId);
    if (!idValidation.success) {
      return { success: false, error: 'Invalid comment ID format' };
    }

    // 3. Sanitization
    const sanitizedText = sanitizeCommentInput(input.text);

    // 4. Validation
    const validationResult = UpdateCommentSchema.safeParse({ text: sanitizedText });
    if (!validationResult.success) {
      return {
        success: false,
        error: formatZodErrors(validationResult.error.issues),
      };
    }

    // 5. Verify comment exists and user is author
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        authorId: userId,
      },
    });
    if (!existingComment) {
      return {
        success: false,
        error: 'Comment not found or you do not have permission to edit it',
      };
    }

    // 6. Update comment with editedAt timestamp
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        text: validationResult.data.text,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 7. Log activity
    await prisma.activity.create({
      data: {
        type: 'COMMENT_UPDATED',
        taskId: updated.taskId,
        userId,
        data: {
          commentId: updated.id,
          oldText: existingComment.text.substring(0, 100),
          newText: updated.text.substring(0, 100),
        },
      },
    });

    // 8. Revalidate cache
    revalidatePath('/');

    return { success: true, data: transformComment(updated) };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'updateComment'),
    };
  }
}

/**
 * Deletes a comment.
 * Either the comment author or the task owner can delete a comment.
 *
 * @param commentId - UUID of the comment to delete
 * @returns ActionResponse indicating success or error
 */
export async function deleteComment(commentId: string): Promise<ActionResponse> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Validate comment ID
    const idValidation = CommentIdSchema.safeParse(commentId);
    if (!idValidation.success) {
      return { success: false, error: 'Invalid comment ID format' };
    }

    // 3. Verify comment exists and get task info
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          select: { ownerId: true },
        },
      },
    });
    if (!comment) {
      return { success: false, error: 'Comment not found' };
    }

    // 4. Verify authorization: author OR task owner
    const isAuthor = comment.authorId === userId;
    const isTaskOwner = comment.task.ownerId === userId;
    if (!isAuthor && !isTaskOwner) {
      return {
        success: false,
        error: 'You do not have permission to delete this comment',
      };
    }

    // 5. Store info for activity log before deletion
    const taskId = comment.taskId;
    const textPreview = comment.text.substring(0, 100);
    const authorId = comment.authorId;

    // 6. Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    // 7. Log activity
    await prisma.activity.create({
      data: {
        type: 'COMMENT_DELETED',
        taskId,
        userId,
        data: {
          commentId,
          authorId,
          textPreview,
          deletedBy: isAuthor ? 'author' : 'task_owner',
        },
      },
    });

    // 8. Revalidate cache
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'deleteComment'),
    };
  }
}

/**
 * Retrieves all comments for a task with pagination.
 * User must own the task to view its comments.
 *
 * @param taskId - UUID of the task
 * @param options - Pagination options (limit, offset)
 * @returns ActionResponse with comments and total count
 */
export async function getCommentsByTask(
  taskId: string,
  options?: { limit?: number; offset?: number }
): Promise<ActionResponse<CommentsListResponse>> {
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

    // 5. Fetch comments with author info (oldest first for conversation flow)
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { taskId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.comment.count({ where: { taskId } }),
    ]);

    return {
      success: true,
      data: {
        comments: comments.map(transformComment),
        total,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getCommentsByTask'),
    };
  }
}

/**
 * Gets a single comment by ID.
 * User must own the task that the comment belongs to.
 *
 * @param commentId - UUID of the comment
 * @returns ActionResponse with comment or error
 */
export async function getComment(
  commentId: string
): Promise<ActionResponse<CommentResponse>> {
  try {
    // 1. Authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Validate comment ID
    const idValidation = CommentIdSchema.safeParse(commentId);
    if (!idValidation.success) {
      return { success: false, error: 'Invalid comment ID format' };
    }

    // 3. Fetch comment with authorization check via task ownership
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        task: {
          ownerId: userId,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!comment) {
      return {
        success: false,
        error: 'Comment not found or you do not have permission to view it',
      };
    }

    return { success: true, data: transformComment(comment) };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getComment'),
    };
  }
}
