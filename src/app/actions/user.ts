'use server';

/**
 * Server Actions for User Profile and Settings Management
 *
 * These server actions provide the API layer for user profile updates,
 * password changes, and account deletion.
 * All inputs are validated with Zod schemas before processing.
 * Rate limiting prevents abuse of sensitive operations.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import bcrypt from 'bcryptjs';
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
  DeleteAccountSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type DeleteAccountInput,
} from '@/lib/schemas';
import { sanitizeString } from '@/lib/utils';
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
 * User profile data returned from server actions.
 */
export interface UserProfileResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  accounts: Array<{
    provider: string;
    displayName: string;
  }>;
  hasPassword: boolean;
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
 * Generic error message returned to clients.
 * Prevents information disclosure by not revealing internal error details.
 */
const GENERIC_ERROR_MESSAGE =
  'An error occurred while processing your request. Please try again.';

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

/**
 * Safely compares passwords using bcrypt with timing attack prevention.
 * Always runs the comparison to prevent timing-based enumeration.
 *
 * @param inputPassword - The password provided by the user
 * @param hashPassword - The stored bcrypt hash
 * @returns true if passwords match, false otherwise
 */
async function comparePasswords(
  inputPassword: string,
  hashPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(inputPassword, hashPassword);
  } catch (error) {
    // If comparison fails, return false
    console.error('Password comparison error:', error);
    return false;
  }
}

/**
 * Hashes a password using bcrypt with a cost factor of 10.
 *
 * @param password - The plain text password
 * @returns The bcrypt hash
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Retrieves the current user's profile information including OAuth connections.
 *
 * @returns ActionResponse with user profile or error
 */
export async function getUserProfile(): Promise<ActionResponse<UserProfileResponse>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Transform accounts to display format
    const accounts = user.accounts.map((account) => ({
      provider: account.provider,
      displayName:
        account.provider.charAt(0).toUpperCase() +
        account.provider.slice(1),
    }));

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        accounts,
        hasPassword: !!user.passwordHash,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getUserProfile'),
    };
  }
}

/**
 * Updates the user's profile information (name only).
 * Email changes require verification and are deferred to Phase 2+.
 *
 * @param input - Profile update data
 * @returns ActionResponse with success or error
 */
export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Check rate limit (uses Redis when configured, falls back to in-memory)
    const rateLimitResult = await checkRateLimit(userId, 'updateProfile');
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: getRateLimitErrorMessage('updateProfile'),
      };
    }

    // Sanitize input
    const sanitized = {
      name: sanitizeString(input.name),
    };

    // Validate with Zod
    const result = UpdateProfileSchema.safeParse(sanitized);
    if (!result.success) {
      return {
        success: false,
        error: formatZodErrors(result.error.issues),
      };
    }

    // Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: result.data.name,
      },
    });

    // Revalidate profile page
    revalidatePath('/profile');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'updateProfile'),
    };
  }
}

/**
 * Changes the user's password.
 * Requires verification of current password and new password strength validation.
 *
 * @param input - Password change data
 * @returns ActionResponse with success or error
 */
export async function changePassword(
  input: ChangePasswordInput
): Promise<ActionResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Check rate limit (uses Redis when configured, falls back to in-memory)
    const rateLimitResult = await checkRateLimit(userId, 'changePassword');
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: getRateLimitErrorMessage('changePassword'),
      };
    }

    // Validate with Zod
    const result = ChangePasswordSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        error: formatZodErrors(result.error.issues),
      };
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Check if user has a password (credentials login)
    if (!user.passwordHash) {
      return {
        success: false,
        error: 'This account uses OAuth authentication. Password changes are not available.',
      };
    }

    // Verify current password (timing attack resistant)
    const currentPasswordValid = await comparePasswords(
      result.data.currentPassword,
      user.passwordHash
    );

    if (!currentPasswordValid) {
      return {
        success: false,
        error: 'Current password is incorrect.',
      };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(result.data.newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // Revalidate settings page
    revalidatePath('/settings');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'changePassword'),
    };
  }
}

/**
 * Deletes the user's account permanently.
 * Requires password verification and explicit "DELETE" confirmation.
 * Cascades deletion to related data (tasks, sessions, etc.).
 *
 * @param input - Account deletion data
 * @returns ActionResponse with success or error
 */
export async function deleteAccount(
  input: DeleteAccountInput
): Promise<ActionResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Check rate limit (uses Redis when configured, falls back to in-memory)
    const rateLimitResult = await checkRateLimit(userId, 'deleteAccount');
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: getRateLimitErrorMessage('deleteAccount'),
      };
    }

    // Validate with Zod
    const result = DeleteAccountSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        error: formatZodErrors(result.error.issues),
      };
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // If user has a password, verify it
    if (user.passwordHash) {
      const passwordValid = await comparePasswords(
        result.data.password,
        user.passwordHash
      );

      if (!passwordValid) {
        return {
          success: false,
          error: 'Password is incorrect. Account deletion cancelled.',
        };
      }
    } else {
      // OAuth-only accounts still need the confirmation text
      // Password field is ignored for OAuth accounts
      if (!result.data.confirmation || result.data.confirmation !== 'DELETE') {
        return {
          success: false,
          error: 'Type "DELETE" to confirm account deletion',
        };
      }
    }

    // Delete user account (cascades to tasks, sessions, etc.)
    await prisma.user.delete({
      where: { id: userId },
    });

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'deleteAccount'),
    };
  }
}
