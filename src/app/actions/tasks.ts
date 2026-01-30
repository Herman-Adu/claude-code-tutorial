'use server';

/**
 * Server Actions for Task Management
 *
 * These server actions provide the API layer for task CRUD operations.
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
  CreateTaskSchema,
  UpdateTaskSchema,
  MoveTaskSchema,
  TaskIdSchema,
  ColumnIdSchema,
  SearchTasksInputSchema,
  SaveFilterPresetSchema,
  FilterPresetIdSchema,
  type CreateTaskRawInput,
  type UpdateTaskInput,
  type MoveTaskInput,
  type ColumnId,
  type SearchTasksInput,
  type SaveFilterPresetInput,
} from '@/lib/schemas';
import { sanitizeString } from '@/lib/utils';
import { checkRateLimit, getRateLimitErrorMessage } from '@/lib/rate-limit';
import type { Priority, ColumnId as DbColumnId } from '@/generated/prisma/enums';
import type { InputJsonValue } from '@/generated/prisma/internal/prismaNamespace';

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
 * Task type returned from server actions.
 * Matches Prisma model with JSON fields typed as string arrays.
 */
export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  columnId: DbColumnId;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
  // Calendar fields (Sprint 3)
  dueDate: Date | null;
  dueTime: string | null;
  isAllDay: boolean;
  // Owner fields
  ownerName: string | null;
  ownerEmail: string;
}

/**
 * Search result type for paginated task searches.
 */
export interface SearchResultResponse {
  tasks: TaskResponse[];
  total: number;
}

/**
 * Saved filter preset type returned from server actions.
 */
export interface FilterPresetResponse {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Internal type for Prisma Task with proper JSON typing.
 */
interface PrismaTaskRecord {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  tags: unknown;
  columnId: DbColumnId;
  categories: unknown;
  createdAt: Date;
  updatedAt: Date;
  // Calendar fields (Sprint 3)
  dueDate: Date | null;
  dueTime: string | null;
  isAllDay: boolean;
  // Owner relation
  owner?: {
    name: string | null;
    email: string;
  } | null;
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
 * Transforms a Prisma Task model to the response format.
 * Handles JSON field conversion from Prisma's JsonValue to string[].
 */
function transformTask(task: PrismaTaskRecord): TaskResponse {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    tags: Array.isArray(task.tags) ? (task.tags as string[]) : [],
    columnId: task.columnId,
    categories: Array.isArray(task.categories) ? (task.categories as string[]) : [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    isAllDay: task.isAllDay,
    ownerName: task.owner?.name ?? null,
    ownerEmail: task.owner?.email ?? '',
  };
}

/**
 * Sanitizes task input data to prevent XSS attacks.
 * Applies sanitization to title, description, tags, and categories.
 */
function sanitizeTaskInput<T extends Partial<CreateTaskRawInput>>(data: T): T {
  const sanitized = { ...data };

  if (data.title !== undefined) {
    sanitized.title = sanitizeString(data.title);
  }

  if (data.description !== undefined) {
    sanitized.description = sanitizeString(data.description);
  }

  if (data.tags !== undefined) {
    sanitized.tags = data.tags.map(sanitizeString);
  }

  if (data.categories !== undefined) {
    sanitized.categories = data.categories.map(sanitizeString);
  }

  return sanitized;
}

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
 * Generic error message returned to clients.
 * Prevents information disclosure by not revealing internal error details.
 */
const GENERIC_ERROR_MESSAGE = 'An error occurred while processing your request. Please try again.';

/**
 * Handles database errors with secure error messaging.
 * Logs detailed error information server-side while returning
 * generic messages to clients to prevent information disclosure.
 *
 * Security considerations:
 * - Never expose Prisma error codes or database structure to clients
 * - Never expose internal error messages that could reveal implementation details
 * - Log all errors server-side for debugging and monitoring
 *
 * @param error - The error that occurred
 * @param context - The operation context for logging (e.g., 'createTask', 'updateTask')
 * @returns A user-friendly error message that doesn't reveal internals
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

  // Handle Prisma known errors - return safe messages without exposing codes
  if (isPrismaKnownError(error)) {
    // Only expose safe, user-friendly messages for specific error cases
    switch (error.code) {
      case 'P2025':
        // Record not found - safe to tell user
        return 'The requested item was not found or you do not have permission to access it.';
      case 'P2002':
        // Unique constraint violation - safe to tell user
        return 'This item already exists.';
      default:
        // For all other Prisma errors, return generic message
        return GENERIC_ERROR_MESSAGE;
    }
  }

  // For all other errors, return generic message
  return GENERIC_ERROR_MESSAGE;
}


/**
 * Formats Zod validation errors into a readable string.
 * Compatible with Zod 4.x which uses PropertyKey[] for paths.
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
 * Creates a new task in the database.
 *
 * @param data - Task data to create
 * @returns ActionResponse with created task or error
 */
export async function createTask(
  data: CreateTaskRawInput
): Promise<ActionResponse<TaskResponse>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Sanitize input first to prevent malicious data from reaching validation
    const sanitizedInput = sanitizeTaskInput(data);

    // Validate sanitized input
    const validationResult = CreateTaskSchema.safeParse(sanitizedInput);
    if (!validationResult.success) {
      return {
        success: false,
        error: formatZodErrors(validationResult.error.issues),
      };
    }

    const sanitizedData = validationResult.data;

    // Create task in database with owner
    const task = await prisma.task.create({
      data: {
        title: sanitizedData.title,
        description: sanitizedData.description ?? '',
        priority: sanitizedData.priority,
        columnId: sanitizedData.columnId,
        tags: sanitizedData.tags ?? [],
        categories: sanitizedData.categories ?? [],
        dueDate: sanitizedData.dueDate ? new Date(sanitizedData.dueDate) : null,
        dueTime: sanitizedData.dueTime ?? null,
        isAllDay: sanitizedData.isAllDay ?? true,
        ownerId: userId,
      },
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
    });

    // Invalidate cached task lists
    revalidatePath('/');

    return {
      success: true,
      data: transformTask(task),
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'createTask'),
    };
  }
}

/**
 * Updates an existing task by ID.
 *
 * @param id - UUID of the task to update
 * @param data - Partial task data to update
 * @returns ActionResponse with updated task or error
 */
export async function updateTask(
  id: string,
  data: UpdateTaskInput
): Promise<ActionResponse<TaskResponse>> {
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
    const idValidation = TaskIdSchema.safeParse(id);
    if (!idValidation.success) {
      return {
        success: false,
        error: 'Invalid task ID format',
      };
    }

    // Skip update if no fields provided in original input
    // Check original data first because Zod's partial() schema may add defaults
    if (!data || Object.keys(data).length === 0) {
      return {
        success: false,
        error: 'No update data provided',
      };
    }

    // Sanitize input first to prevent malicious data from reaching validation
    const sanitizedInput = sanitizeTaskInput(data);

    // Validate sanitized input
    const validationResult = UpdateTaskSchema.safeParse(sanitizedInput);
    if (!validationResult.success) {
      return {
        success: false,
        error: formatZodErrors(validationResult.error.issues),
      };
    }

    const sanitizedData = validationResult.data;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (sanitizedData.title !== undefined) updateData.title = sanitizedData.title;
    if (sanitizedData.description !== undefined) updateData.description = sanitizedData.description;
    if (sanitizedData.priority !== undefined) updateData.priority = sanitizedData.priority;
    if (sanitizedData.columnId !== undefined) updateData.columnId = sanitizedData.columnId;
    if (sanitizedData.tags !== undefined) updateData.tags = sanitizedData.tags;
    if (sanitizedData.categories !== undefined) updateData.categories = sanitizedData.categories;
    // Calendar fields
    if (sanitizedData.dueDate !== undefined) {
      updateData.dueDate = sanitizedData.dueDate ? new Date(sanitizedData.dueDate) : null;
    }
    if (sanitizedData.dueTime !== undefined) updateData.dueTime = sanitizedData.dueTime;
    if (sanitizedData.isAllDay !== undefined) updateData.isAllDay = sanitizedData.isAllDay;

    // Update task in database with ownership check at DB level to prevent race conditions
    const task = await prisma.task.update({
      where: {
        id,
        ownerId: userId,
      },
      data: updateData,
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
    });

    // Invalidate cached task lists
    revalidatePath('/');

    return {
      success: true,
      data: transformTask(task),
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'updateTask'),
    };
  }
}

/**
 * Deletes a task by ID.
 *
 * @param id - UUID of the task to delete
 * @returns ActionResponse indicating success or error
 */
export async function deleteTask(id: string): Promise<ActionResponse> {
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
    const idValidation = TaskIdSchema.safeParse(id);
    if (!idValidation.success) {
      return {
        success: false,
        error: 'Invalid task ID format',
      };
    }

    // Delete task from database with ownership check at DB level to prevent race conditions
    await prisma.task.delete({
      where: {
        id,
        ownerId: userId,
      },
    });

    // Invalidate cached task lists
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'deleteTask'),
    };
  }
}

/**
 * Moves a task to a new column and optionally reorders it.
 *
 * Note: This implementation updates the columnId. For true reordering,
 * you would need a position/order field in the schema. Currently,
 * the targetTaskId parameter is reserved for future ordering implementation.
 *
 * @param input - Move task input with taskId, newColumnId, and optional targetTaskId
 * @returns ActionResponse with updated task or error
 */
export async function moveTask(
  input: MoveTaskInput
): Promise<ActionResponse<TaskResponse>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate input
    const validationResult = MoveTaskSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: formatZodErrors(validationResult.error.issues),
      };
    }

    const { taskId, newColumnId, targetTaskId } = validationResult.data;

    // Verify target task exists if provided (for future ordering support)
    if (targetTaskId) {
      const targetTask = await prisma.task.findUnique({
        where: { id: targetTaskId },
        select: { id: true },
      });

      if (!targetTask) {
        return {
          success: false,
          error: 'Target task not found',
        };
      }
    }

    // Update task column with ownership check at DB level to prevent race conditions
    const task = await prisma.task.update({
      where: {
        id: taskId,
        ownerId: userId,
      },
      data: { columnId: newColumnId },
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
    });

    // Invalidate cached task lists
    revalidatePath('/');

    return {
      success: true,
      data: transformTask(task),
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'moveTask'),
    };
  }
}

/**
 * Retrieves all tasks from the database.
 * Tasks are ordered by creation date (newest first).
 *
 * @returns ActionResponse with array of all tasks or error
 */
export async function getTasks(): Promise<ActionResponse<TaskResponse[]>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Fetch only tasks belonging to the current user
    const tasks = await prisma.task.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
    });

    return {
      success: true,
      data: tasks.map(transformTask),
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getTasks'),
    };
  }
}

/**
 * Retrieves tasks filtered by column ID.
 * Tasks are ordered by creation date (newest first).
 *
 * @param columnId - Column to filter by (TODO, IN_PROGRESS, COMPLETED)
 * @returns ActionResponse with array of tasks in the column or error
 */
export async function getTasksByColumn(
  columnId: ColumnId
): Promise<ActionResponse<TaskResponse[]>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate column ID
    const validationResult = ColumnIdSchema.safeParse(columnId);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Invalid column ID',
      };
    }

    // Fetch only tasks belonging to the current user in the specified column
    const tasks = await prisma.task.findMany({
      where: {
        columnId: validationResult.data,
        ownerId: userId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
    });

    return {
      success: true,
      data: tasks.map(transformTask),
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getTasksByColumn'),
    };
  }
}

/**
 * Retrieves tasks within a date range.
 * Used for calendar view to fetch tasks with due dates.
 *
 * @param startDate - ISO date string for range start (inclusive)
 * @param endDate - ISO date string for range end (inclusive)
 * @returns ActionResponse with array of tasks in the date range or error
 */
export async function getTasksByDateRange(
  startDate: string,
  endDate: string
): Promise<ActionResponse<TaskResponse[]>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate date inputs
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      return {
        success: false,
        error: 'Invalid start date format',
      };
    }

    if (isNaN(end.getTime())) {
      return {
        success: false,
        error: 'Invalid end date format',
      };
    }

    if (start > end) {
      return {
        success: false,
        error: 'Start date must be before or equal to end date',
      };
    }

    // Validate date range does not exceed 90 days
    const maxRangeDays = 90;
    const rangeDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (rangeDays > maxRangeDays) {
      return {
        success: false,
        error: `Date range cannot exceed ${maxRangeDays} days`,
      };
    }

    // Query tasks with due dates in the range for the current user
    const tasks = await prisma.task.findMany({
      where: {
        ownerId: userId,
        dueDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
    });

    return {
      success: true,
      data: tasks.map(transformTask),
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getTasksByDateRange'),
    };
  }
}

// ============================================================================
// Search and Filter Server Actions (Phase 2B)
// ============================================================================

/**
 * Searches tasks with filters and pagination.
 * Supports full-text search on title and description using PostgreSQL ILIKE.
 *
 * @param input - Search parameters including query, filters, limit, and offset
 * @returns ActionResponse with filtered tasks and total count
 */
export async function searchTasks(
  input: SearchTasksInput
): Promise<ActionResponse<SearchResultResponse>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Rate limiting: 20 searches per minute per user (uses Redis when configured)
    const rateLimitResult = await checkRateLimit(userId, 'search');
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: getRateLimitErrorMessage('search'),
      };
    }

    // Validate input
    const validationResult = SearchTasksInputSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: formatZodErrors(validationResult.error.issues),
      };
    }

    const { query, filters, limit, offset } = validationResult.data;

    // Build where clause for filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: Record<string, any> = {
      ownerId: userId,
    };

    // Text search on title and description using ILIKE for case-insensitive matching
    //
    // PERFORMANCE NOTE (Technical Debt):
    // Current approach: Prisma's `contains` with mode: 'insensitive' translates to PostgreSQL ILIKE.
    // - Acceptable for datasets < 10K tasks with ~200ms p95 response time
    // - ILIKE queries don't efficiently use B-tree indexes, causing full table scans
    //
    // TODO: For datasets > 10K tasks, migrate to PostgreSQL full-text search (tsvector):
    // 1. Add generated tsvector column: ALTER TABLE tasks ADD COLUMN search_vector tsvector
    //    GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || description)) STORED;
    // 2. Create GiST index: CREATE INDEX idx_tasks_search ON tasks USING GiST(search_vector);
    // 3. Use ts_query for searches: WHERE search_vector @@ to_tsquery('english', $1)
    // Expected performance gain: ~50x faster for large datasets
    //
    if (query && query.trim().length > 0) {
      const searchTerm = query.trim();
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Apply additional search query from filters if present
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const searchTerm = filters.searchQuery.trim();
      // If we already have an OR clause from query, we need to AND them
      if (whereClause.OR) {
        whereClause.AND = [
          { OR: whereClause.OR },
          {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        ];
        delete whereClause.OR;
      } else {
        whereClause.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    // Priority filter
    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    // Column/status filter
    if (filters.columnId) {
      whereClause.columnId = filters.columnId;
    }

    // Categories filter (JSON array containment)
    // Tasks must have ALL specified categories
    //
    // PERFORMANCE NOTE:
    // Current approach creates N separate AND conditions for N categories.
    // Example for 3 categories: WHERE categories @> '["cat1"]' AND categories @> '["cat2"]' AND categories @> '["cat3"]'
    //
    // This is acceptable for typical usage (1-5 categories) with GIN index on categories column.
    // For optimization with many categories, consider:
    // 1. Use a single array containment check: categories @> '["cat1","cat2","cat3"]'::jsonb
    //    This checks if all categories are contained in one operation.
    // 2. For < 100 tasks, client-side filtering may be faster than multiple DB conditions.
    // 3. Create GIN index if not exists: CREATE INDEX idx_tasks_categories ON tasks USING GIN(categories);
    //
    if (filters.categories && filters.categories.length > 0) {
      whereClause.AND = whereClause.AND || [];
      // Use Prisma's JsonArray operations to check if categories contains all specified values
      // Each category is checked individually to ensure ALL are present
      filters.categories.forEach((category) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (whereClause.AND as any[]).push({
          categories: {
            array_contains: [category],
          },
        });
      });
    }

    // Date range filter
    if (filters.dateRange) {
      whereClause.dueDate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    // Execute count query for total (for pagination)
    const total = await prisma.task.count({ where: whereClause });

    // Execute main query with pagination
    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
    });

    return {
      success: true,
      data: {
        tasks: tasks.map(transformTask),
        total,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'searchTasks'),
    };
  }
}

/**
 * Retrieves all saved filter presets for the current user.
 *
 * @returns ActionResponse with array of filter presets
 */
export async function getSavedFilterPresets(): Promise<
  ActionResponse<FilterPresetResponse[]>
> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const presets = await prisma.savedFilterPreset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: presets.map((preset: { id: string; name: string; filters: unknown; createdAt: Date }) => ({
        id: preset.id,
        name: preset.name,
        filters: preset.filters as Record<string, unknown>,
        createdAt: preset.createdAt,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getSavedFilterPresets'),
    };
  }
}

/**
 * Saves a new filter preset for the current user.
 *
 * @param input - Preset name and filter configuration
 * @returns ActionResponse with created preset or error
 */
export async function saveFilterPreset(
  input: SaveFilterPresetInput
): Promise<ActionResponse<FilterPresetResponse>> {
  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate input
    const validationResult = SaveFilterPresetSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: formatZodErrors(validationResult.error.issues),
      };
    }

    const { name, filters } = validationResult.data;

    // Sanitize the preset name
    const sanitizedName = sanitizeString(name);

    // Create the preset (serialize filters to JSON)
    const preset = await prisma.savedFilterPreset.create({
      data: {
        name: sanitizedName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filters: filters as any,
        userId,
      },
    });

    return {
      success: true,
      data: {
        id: preset.id,
        name: preset.name,
        filters: preset.filters as Record<string, unknown>,
        createdAt: preset.createdAt,
      },
    };
  } catch (error) {
    // Check for unique constraint violation (duplicate name)
    if (isPrismaKnownError(error) && error.code === 'P2002') {
      return {
        success: false,
        error: 'A preset with this name already exists',
      };
    }
    return {
      success: false,
      error: handleDatabaseError(error, 'saveFilterPreset'),
    };
  }
}

/**
 * Deletes a saved filter preset.
 *
 * @param presetId - UUID of the preset to delete
 * @returns ActionResponse indicating success or error
 */
export async function deleteFilterPreset(
  presetId: string
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

    // Validate preset ID
    const idValidation = FilterPresetIdSchema.safeParse(presetId);
    if (!idValidation.success) {
      return {
        success: false,
        error: 'Invalid preset ID format',
      };
    }

    // Delete with ownership check
    await prisma.savedFilterPreset.delete({
      where: {
        id: presetId,
        userId, // Ownership verification
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'deleteFilterPreset'),
    };
  }
}
