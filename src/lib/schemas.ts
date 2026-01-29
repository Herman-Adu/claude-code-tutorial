/**
 * Zod Validation Schemas for Task Operations
 *
 * These schemas define validation rules for task data and ensure type safety
 * across the application. They match the Prisma schema enum values exactly.
 */

import { z } from 'zod';

// Validation constants - centralized for consistency with existing utils
export const VALIDATION = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAG_LENGTH: 30,
  MAX_TAGS: 10,
  MAX_CATEGORY_LENGTH: 50,
  MAX_CATEGORIES: 10,
  // Profile and settings validation
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 255,
  // Label validation
  MAX_LABEL_NAME_LENGTH: 100,
  MAX_LABELS_PER_TASK: 20,
  // Search and filter validation
  MAX_SEARCH_QUERY_LENGTH: 200,
  MAX_SEARCH_LIMIT: 100,
  MIN_SEARCH_LIMIT: 1,
  MAX_FILTER_PRESET_NAME_LENGTH: 50,
  // Comment validation (Phase 2C)
  MAX_COMMENT_LENGTH: 2000,
  MIN_COMMENT_LENGTH: 1,
} as const;

// Preset label colors for consistent UI
export const LABEL_COLOR_PRESETS = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'pink',
  'cyan',
] as const;

export type LabelColorPreset = (typeof LABEL_COLOR_PRESETS)[number];

/**
 * Priority enum matching Prisma schema values.
 * Values are uppercase to match database enum.
 */
export const PrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

/**
 * ColumnId enum matching Prisma schema values.
 * Values use underscore notation to match database enum.
 */
export const ColumnIdSchema = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']);

/**
 * Tags array schema with validation rules:
 * - Maximum 10 items in the array
 * - Each tag maximum 30 characters
 * - Trims whitespace from each tag
 * - Filters out empty strings
 */
export const TagsSchema = z
  .array(
    z
      .string()
      .trim()
      .max(VALIDATION.MAX_TAG_LENGTH, {
        message: `Tag must be ${VALIDATION.MAX_TAG_LENGTH} characters or less`,
      })
  )
  .max(VALIDATION.MAX_TAGS, {
    message: `Maximum ${VALIDATION.MAX_TAGS} tags allowed`,
  })
  .transform((tags) => tags.filter((tag) => tag.length > 0))
  .default([]);

/**
 * Categories array schema with validation rules:
 * - Maximum 10 items in the array
 * - Each category maximum 50 characters
 * - Trims whitespace from each category
 * - Filters out empty strings
 */
export const CategoriesSchema = z
  .array(
    z
      .string()
      .trim()
      .max(VALIDATION.MAX_CATEGORY_LENGTH, {
        message: `Category must be ${VALIDATION.MAX_CATEGORY_LENGTH} characters or less`,
      })
  )
  .max(VALIDATION.MAX_CATEGORIES, {
    message: `Maximum ${VALIDATION.MAX_CATEGORIES} categories allowed`,
  })
  .transform((categories) => categories.filter((cat) => cat.length > 0))
  .default([]);

// ============================================================================
// Calendar Field Schemas (Sprint 3)
// ============================================================================

/**
 * Regular expression for validating HH:MM time format.
 * Matches 00:00 through 23:59.
 */
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Schema for validating ISO date strings.
 * Accepts strings that can be parsed as valid dates.
 */
export const DueDateSchema = z
  .string()
  .refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date format. Expected ISO date string.' }
  )
  .optional();

/**
 * Schema for validating time in HH:MM format.
 * Only valid 24-hour times from 00:00 to 23:59 are accepted.
 */
export const DueTimeSchema = z
  .string()
  .regex(TIME_REGEX, {
    message: 'Invalid time format. Expected HH:MM (24-hour format).',
  })
  .optional();

/**
 * Schema for the isAllDay boolean flag.
 * Defaults to true when not provided.
 */
export const IsAllDaySchema = z.boolean().default(true).optional();

/**
 * Base Task schema with all fields.
 * Used as foundation for create/update schemas.
 */
export const TaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(VALIDATION.MAX_TITLE_LENGTH, {
      message: `Title must be ${VALIDATION.MAX_TITLE_LENGTH} characters or less`,
    }),
  description: z
    .string()
    .trim()
    .max(VALIDATION.MAX_DESCRIPTION_LENGTH, {
      message: `Description must be ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters or less`,
    })
    .default(''),
  priority: PrioritySchema.default('MEDIUM'),
  columnId: ColumnIdSchema.default('TODO'),
  tags: TagsSchema,
  categories: CategoriesSchema,
  // Calendar fields (Sprint 3)
  dueDate: DueDateSchema,
  dueTime: DueTimeSchema,
  isAllDay: IsAllDaySchema,
});

/**
 * Schema for creating a new task.
 * All fields except title have defaults.
 */
export const CreateTaskSchema = TaskSchema;

/**
 * Schema for updating an existing task.
 * All fields are optional - only provided fields will be updated.
 */
export const UpdateTaskSchema = TaskSchema.partial();

/**
 * Schema for moving a task between columns or reordering.
 * - taskId: Required UUID of the task to move
 * - newColumnId: Required target column
 * - targetTaskId: Optional task to insert before (for reordering)
 */
export const MoveTaskSchema = z.object({
  taskId: z.string().uuid({ message: 'Invalid task ID format' }),
  newColumnId: ColumnIdSchema,
  targetTaskId: z.string().uuid({ message: 'Invalid target task ID format' }).optional(),
});

/**
 * Schema for validating a single task ID parameter.
 */
export const TaskIdSchema = z.string().uuid({ message: 'Invalid task ID format' });

// ============================================================================
// Profile and Settings Schemas (Phase 1)
// ============================================================================

/**
 * Password validation with strength requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
function validatePasswordStrength(password: string): boolean {
  return (
    password.length >= VALIDATION.MIN_PASSWORD_LENGTH &&
    /[A-Z]/.test(password) && // Uppercase
    /[a-z]/.test(password) && // Lowercase
    /\d/.test(password) // Number
  );
}

/**
 * Schema for updating user profile information.
 * Only name can be updated via profile (email requires verification flow).
 */
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(VALIDATION.MIN_NAME_LENGTH, {
      message: 'Name is required',
    })
    .max(VALIDATION.MAX_NAME_LENGTH, {
      message: `Name must be ${VALIDATION.MAX_NAME_LENGTH} characters or less`,
    }),
});

/**
 * Schema for password changes.
 * Requires current password verification and new password with strength validation.
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'Current password is required' }),
    newPassword: z
      .string()
      .min(VALIDATION.MIN_PASSWORD_LENGTH, {
        message: `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`,
      })
      .max(VALIDATION.MAX_PASSWORD_LENGTH, {
        message: `Password must be ${VALIDATION.MAX_PASSWORD_LENGTH} characters or less`,
      })
      .refine(validatePasswordStrength, {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Schema for account deletion.
 * Requires password verification and explicit "DELETE" confirmation.
 */
export const DeleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
  confirmation: z
    .string()
    .refine((val) => val === 'DELETE', {
      message: 'Type "DELETE" to confirm account deletion',
    }),
});

// ============================================================================
// Label Schemas (Phase 2A)
// ============================================================================

/**
 * Schema for validating label colors.
 * Accepts either a preset color name or a valid hex code.
 */
export const LabelColorSchema = z.union([
  z.enum(LABEL_COLOR_PRESETS),
  z.string().regex(/^#[0-9a-fA-F]{6}$/, {
    message: 'Invalid color format. Use a preset color or hex code (#RRGGBB)',
  }),
]);

/**
 * Schema for creating a new label.
 */
export const CreateLabelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Label name is required' })
    .max(VALIDATION.MAX_LABEL_NAME_LENGTH, {
      message: `Label name must be ${VALIDATION.MAX_LABEL_NAME_LENGTH} characters or less`,
    }),
  color: LabelColorSchema,
});

/**
 * Schema for updating an existing label.
 * All fields are optional.
 */
export const UpdateLabelSchema = CreateLabelSchema.partial();

/**
 * Schema for adding a label to a task.
 */
export const AddLabelToTaskSchema = z.object({
  taskId: z.string().uuid({ message: 'Invalid task ID format' }),
  labelId: z.string().uuid({ message: 'Invalid label ID format' }),
});

/**
 * Schema for removing a label from a task.
 */
export const RemoveLabelFromTaskSchema = AddLabelToTaskSchema;

/**
 * Schema for validating a single label ID parameter.
 */
export const LabelIdSchema = z.string().uuid({ message: 'Invalid label ID format' });

// ============================================================================
// Search and Filter Schemas (Phase 2B)
// ============================================================================

/**
 * Schema for date range filtering.
 * Accepts either Date objects or ISO date strings.
 * Validates that start date is before or equal to end date.
 */
export const DateRangeSchema = z.object({
  start: z.union([z.date(), z.string()]).transform((val) => val instanceof Date ? val : new Date(val)),
  end: z.union([z.date(), z.string()]).transform((val) => val instanceof Date ? val : new Date(val)),
}).refine((data) => data.start <= data.end, {
  message: 'Start date must be before or equal to end date',
  path: ['end'],
});

/**
 * Schema for date range filtering with string inputs (for store/UI).
 * Accepts string dates and validates format.
 */
export const DateRangeStringSchema = z.object({
  start: z.string(),
  end: z.string(),
}).refine((data) => new Date(data.start) <= new Date(data.end), {
  message: 'Start date must be before or equal to end date',
  path: ['end'],
});

/**
 * Schema for filter options used in task search.
 * All fields are optional, enabling flexible filter combinations.
 */
export const FilterOptionsSchema = z.object({
  searchQuery: z
    .string()
    .max(VALIDATION.MAX_SEARCH_QUERY_LENGTH, {
      message: `Search query must be ${VALIDATION.MAX_SEARCH_QUERY_LENGTH} characters or less`,
    })
    .optional(),
  priority: PrioritySchema.nullable().optional(),
  columnId: ColumnIdSchema.nullable().optional(),
  categories: z
    .array(z.string().max(VALIDATION.MAX_CATEGORY_LENGTH))
    .optional(),
  // Accept both Date and string for date range (will be coerced to Date)
  dateRange: z.object({
    start: z.union([z.date(), z.string()]),
    end: z.union([z.date(), z.string()]),
  }).optional(),
  limit: z
    .number()
    .int()
    .min(VALIDATION.MIN_SEARCH_LIMIT, {
      message: `Limit must be at least ${VALIDATION.MIN_SEARCH_LIMIT}`,
    })
    .max(VALIDATION.MAX_SEARCH_LIMIT, {
      message: `Limit cannot exceed ${VALIDATION.MAX_SEARCH_LIMIT}`,
    })
    .optional(),
  offset: z
    .number()
    .int()
    .min(0, { message: 'Offset must be non-negative' })
    .optional(),
});

/**
 * Schema for search tasks input.
 * Extends filter options with query parameter.
 */
export const SearchTasksInputSchema = z.object({
  query: z
    .string()
    .max(VALIDATION.MAX_SEARCH_QUERY_LENGTH, {
      message: `Search query must be ${VALIDATION.MAX_SEARCH_QUERY_LENGTH} characters or less`,
    })
    .optional()
    .default(''),
  filters: FilterOptionsSchema.optional().default({}),
  limit: z
    .number()
    .int()
    .min(VALIDATION.MIN_SEARCH_LIMIT)
    .max(VALIDATION.MAX_SEARCH_LIMIT)
    .optional()
    .default(50),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
});

/**
 * Schema for saving a filter preset.
 * Name must be unique per user.
 */
export const SaveFilterPresetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Preset name is required' })
    .max(VALIDATION.MAX_FILTER_PRESET_NAME_LENGTH, {
      message: `Preset name must be ${VALIDATION.MAX_FILTER_PRESET_NAME_LENGTH} characters or less`,
    }),
  filters: FilterOptionsSchema,
});

/**
 * Schema for validating a filter preset ID.
 */
export const FilterPresetIdSchema = z.string().uuid({ message: 'Invalid preset ID format' });

// Export inferred TypeScript types from schemas
export type TaskInput = z.infer<typeof TaskSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type MoveTaskInput = z.infer<typeof MoveTaskSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type ColumnId = z.infer<typeof ColumnIdSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
export type CreateLabelInput = z.infer<typeof CreateLabelSchema>;
export type UpdateLabelInput = z.infer<typeof UpdateLabelSchema>;
export type AddLabelToTaskInput = z.infer<typeof AddLabelToTaskSchema>;
export type LabelColor = z.infer<typeof LabelColorSchema>;
export type FilterOptions = z.infer<typeof FilterOptionsSchema>;
export type SearchTasksInput = z.infer<typeof SearchTasksInputSchema>;
export type SaveFilterPresetInput = z.infer<typeof SaveFilterPresetSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;

// ============================================================================
// Comment Schemas (Phase 2C - Comments & Activity System)
// ============================================================================

/**
 * Schema for creating a new comment on a task.
 * Validates text length and task ID format.
 */
export const CreateCommentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(VALIDATION.MIN_COMMENT_LENGTH, { message: 'Comment cannot be empty' })
    .max(VALIDATION.MAX_COMMENT_LENGTH, {
      message: `Comment must be ${VALIDATION.MAX_COMMENT_LENGTH} characters or less`,
    }),
  taskId: z.string().uuid({ message: 'Invalid task ID' }),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

/**
 * Schema for updating an existing comment.
 * Only the text field can be updated.
 */
export const UpdateCommentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(VALIDATION.MIN_COMMENT_LENGTH, { message: 'Comment cannot be empty' })
    .max(VALIDATION.MAX_COMMENT_LENGTH, {
      message: `Comment must be ${VALIDATION.MAX_COMMENT_LENGTH} characters or less`,
    }),
});

export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;

/**
 * Schema for validating a comment ID parameter.
 */
export const CommentIdSchema = z.string().uuid({ message: 'Invalid comment ID format' });
