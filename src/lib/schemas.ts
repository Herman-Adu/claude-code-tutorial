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
} as const;

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
