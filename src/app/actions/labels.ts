'use server';

/**
 * Server Actions for Label Management
 *
 * These server actions provide the API layer for label CRUD operations.
 * All inputs are sanitized and validated with Zod schemas before database storage.
 * Errors are handled gracefully with consistent response format.
 *
 * CSRF Protection: Next.js server actions have built-in CSRF protection via
 * origin checking. Server actions automatically verify that requests originate
 * from the same origin, preventing cross-site request forgery attacks.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import {
  CreateLabelSchema,
  UpdateLabelSchema,
  LabelIdSchema,
  AddLabelToTaskSchema,
  TaskIdSchema,
  VALIDATION,
  type CreateLabelInput,
  type UpdateLabelInput,
} from '@/lib/schemas';
import { sanitizeString } from '@/lib/utils';
import { checkRateLimit, getRateLimitErrorMessage } from '@/lib/rate-limit';

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
 * Label type returned from server actions.
 */
export interface LabelResponse {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  taskCount?: number;
}

/**
 * Label with associated task IDs for client state.
 */
export interface LabelWithTasksResponse extends LabelResponse {
  taskIds: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the current authenticated user's ID from the session.
 */
async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Transforms a Prisma Label to response format.
 */
function transformLabel(
  label: {
    id: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    _count?: { tasks: number };
  }
): LabelResponse {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
    createdAt: label.createdAt,
    updatedAt: label.updatedAt,
    taskCount: label._count?.tasks,
  };
}

/**
 * Generic error message returned to clients.
 */
const GENERIC_ERROR_MESSAGE = 'An error occurred while processing your request. Please try again.';

/**
 * Type guard to check if an error is a Prisma known request error.
 */
function isPrismaKnownError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

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

  if (isPrismaKnownError(error)) {
    switch (error.code) {
      case 'P2025':
        return 'The requested item was not found or you do not have permission to access it.';
      case 'P2002':
        return 'A label with this name already exists.';
      default:
        return GENERIC_ERROR_MESSAGE;
    }
  }

  return GENERIC_ERROR_MESSAGE;
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

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Creates a new label for the current user.
 *
 * @param data - Label data to create
 * @returns ActionResponse with created label or error
 */
export async function createLabel(
  data: CreateLabelInput
): Promise<ActionResponse<LabelResponse>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Check rate limit (uses Redis when configured, falls back to in-memory)
    const rateLimitResult = await checkRateLimit(userId, 'labels');
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: getRateLimitErrorMessage('labels'),
      };
    }

    // Validate input
    const validationResult = CreateLabelSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: formatZodErrors(validationResult.error.issues),
      };
    }

    const validatedData = validationResult.data;

    // Sanitize the label name
    const sanitizedName = sanitizeString(validatedData.name);

    // Create label in database
    const label = await prisma.label.create({
      data: {
        name: sanitizedName,
        color: validatedData.color,
        userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: transformLabel(label),
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'createLabel'),
    };
  }
}

/**
 * Updates an existing label.
 *
 * @param labelId - UUID of the label to update
 * @param data - Partial label data to update
 * @returns ActionResponse with updated label or error
 */
export async function updateLabel(
  labelId: string,
  data: UpdateLabelInput
): Promise<ActionResponse<LabelResponse>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate label ID
    const idValidation = LabelIdSchema.safeParse(labelId);
    if (!idValidation.success) {
      return {
        success: false,
        error: 'Invalid label ID format',
      };
    }

    // Skip update if no fields provided
    if (!data || Object.keys(data).length === 0) {
      return {
        success: false,
        error: 'No update data provided',
      };
    }

    // Validate input
    const validationResult = UpdateLabelSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: formatZodErrors(validationResult.error.issues),
      };
    }

    const validatedData = validationResult.data;

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (validatedData.name !== undefined) {
      updateData.name = sanitizeString(validatedData.name);
    }
    if (validatedData.color !== undefined) {
      updateData.color = validatedData.color;
    }

    // Update label with ownership check
    const label = await prisma.label.update({
      where: {
        id: labelId,
        userId, // Ownership check
      },
      data: updateData,
    });

    revalidatePath('/');

    return {
      success: true,
      data: transformLabel(label),
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'updateLabel'),
    };
  }
}

/**
 * Deletes a label.
 * TaskLabel entries are automatically deleted via cascade.
 *
 * @param labelId - UUID of the label to delete
 * @returns ActionResponse indicating success or error
 */
export async function deleteLabel(labelId: string): Promise<ActionResponse> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate label ID
    const idValidation = LabelIdSchema.safeParse(labelId);
    if (!idValidation.success) {
      return {
        success: false,
        error: 'Invalid label ID format',
      };
    }

    // Delete label with ownership check (cascade deletes TaskLabel entries)
    await prisma.label.delete({
      where: {
        id: labelId,
        userId,
      },
    });

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'deleteLabel'),
    };
  }
}

/**
 * Gets all labels for the current user with task counts.
 *
 * @returns ActionResponse with array of labels or error
 */
export async function getLabels(): Promise<ActionResponse<LabelResponse[]>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Fetch labels with task count
    const labels = await prisma.label.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return {
      success: true,
      data: labels.map(transformLabel),
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getLabels'),
    };
  }
}

/**
 * Gets a single label by ID.
 *
 * @param labelId - UUID of the label to retrieve
 * @returns ActionResponse with label or error
 */
export async function getLabelById(
  labelId: string
): Promise<ActionResponse<LabelWithTasksResponse>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate label ID
    const idValidation = LabelIdSchema.safeParse(labelId);
    if (!idValidation.success) {
      return {
        success: false,
        error: 'Invalid label ID format',
      };
    }

    // Fetch label with tasks
    const label = await prisma.label.findUnique({
      where: {
        id: labelId,
        userId,
      },
      include: {
        tasks: {
          select: { taskId: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!label) {
      return {
        success: false,
        error: 'Label not found',
      };
    }

    return {
      success: true,
      data: {
        ...transformLabel(label),
        taskIds: label.tasks.map((t: { taskId: string }) => t.taskId),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getLabelById'),
    };
  }
}

/**
 * Adds a label to a task.
 *
 * @param taskId - UUID of the task
 * @param labelId - UUID of the label to add
 * @returns ActionResponse indicating success or error
 */
export async function addLabelToTask(
  taskId: string,
  labelId: string
): Promise<ActionResponse> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate inputs
    const inputValidation = AddLabelToTaskSchema.safeParse({ taskId, labelId });
    if (!inputValidation.success) {
      return {
        success: false,
        error: formatZodErrors(inputValidation.error.issues),
      };
    }

    // Verify task ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { ownerId: true },
    });

    if (!task || task.ownerId !== userId) {
      return {
        success: false,
        error: 'Task not found or access denied',
      };
    }

    // Verify label ownership
    const label = await prisma.label.findUnique({
      where: { id: labelId },
      select: { userId: true },
    });

    if (!label || label.userId !== userId) {
      return {
        success: false,
        error: 'Label not found or access denied',
      };
    }

    // Check if already linked
    const existingLink = await prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: { taskId, labelId },
      },
    });

    if (existingLink) {
      return {
        success: false,
        error: 'Label is already attached to this task',
      };
    }

    // Create the link
    await prisma.taskLabel.create({
      data: { taskId, labelId },
    });

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'addLabelToTask'),
    };
  }
}

/**
 * Removes a label from a task.
 *
 * @param taskId - UUID of the task
 * @param labelId - UUID of the label to remove
 * @returns ActionResponse indicating success or error
 */
export async function removeLabelFromTask(
  taskId: string,
  labelId: string
): Promise<ActionResponse> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate inputs
    const taskIdValidation = TaskIdSchema.safeParse(taskId);
    const labelIdValidation = LabelIdSchema.safeParse(labelId);

    if (!taskIdValidation.success || !labelIdValidation.success) {
      return {
        success: false,
        error: 'Invalid task or label ID format',
      };
    }

    // Verify task ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { ownerId: true },
    });

    if (!task || task.ownerId !== userId) {
      return {
        success: false,
        error: 'Task not found or access denied',
      };
    }

    // Delete the link (no need to verify label ownership since we verify task ownership)
    await prisma.taskLabel.delete({
      where: {
        taskId_labelId: { taskId, labelId },
      },
    });

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'removeLabelFromTask'),
    };
  }
}

/**
 * Gets labels for a specific task.
 *
 * @param taskId - UUID of the task
 * @returns ActionResponse with array of labels or error
 */
export async function getLabelsForTask(
  taskId: string
): Promise<ActionResponse<LabelResponse[]>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate task ID
    const idValidation = TaskIdSchema.safeParse(taskId);
    if (!idValidation.success) {
      return {
        success: false,
        error: 'Invalid task ID format',
      };
    }

    // Verify task ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { ownerId: true },
    });

    if (!task || task.ownerId !== userId) {
      return {
        success: false,
        error: 'Task not found or access denied',
      };
    }

    // Fetch labels for the task
    const taskLabels = await prisma.taskLabel.findMany({
      where: { taskId },
      include: {
        label: true,
      },
      orderBy: {
        label: { name: 'asc' },
      },
    });

    return {
      success: true,
      data: taskLabels.map((tl: { label: { id: string; name: string; color: string; userId: string; createdAt: Date; updatedAt: Date; } }) => transformLabel(tl.label)),
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getLabelsForTask'),
    };
  }
}

/**
 * Sets labels for a task, replacing any existing labels.
 * This is useful for batch updates from the TaskForm.
 *
 * @param taskId - UUID of the task
 * @param labelIds - Array of label IDs to set
 * @returns ActionResponse indicating success or error
 */
export async function setLabelsForTask(
  taskId: string,
  labelIds: string[]
): Promise<ActionResponse> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate task ID
    const taskIdValidation = TaskIdSchema.safeParse(taskId);
    if (!taskIdValidation.success) {
      return {
        success: false,
        error: 'Invalid task ID format',
      };
    }

    // Validate max labels per task
    if (labelIds.length > VALIDATION.MAX_LABELS_PER_TASK) {
      return {
        success: false,
        error: `Maximum ${VALIDATION.MAX_LABELS_PER_TASK} labels allowed per task`,
      };
    }

    // Validate all label IDs
    for (const labelId of labelIds) {
      const labelIdValidation = LabelIdSchema.safeParse(labelId);
      if (!labelIdValidation.success) {
        return {
          success: false,
          error: 'Invalid label ID format',
        };
      }
    }

    // Verify task ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { ownerId: true },
    });

    if (!task || task.ownerId !== userId) {
      return {
        success: false,
        error: 'Task not found or access denied',
      };
    }

    // Verify all labels belong to user
    if (labelIds.length > 0) {
      const labels = await prisma.label.findMany({
        where: {
          id: { in: labelIds },
          userId,
        },
        select: { id: true },
      });

      if (labels.length !== labelIds.length) {
        return {
          success: false,
          error: 'One or more labels not found or access denied',
        };
      }
    }

    // Use transaction to replace labels atomically
    await prisma.$transaction([
      // Delete existing task-label links
      prisma.taskLabel.deleteMany({
        where: { taskId },
      }),
      // Create new links
      ...(labelIds.length > 0
        ? [
            prisma.taskLabel.createMany({
              data: labelIds.map((labelId) => ({ taskId, labelId })),
            }),
          ]
        : []),
    ]);

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'setLabelsForTask'),
    };
  }
}
