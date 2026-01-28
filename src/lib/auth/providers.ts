/**
 * OAuth Provider Configurations
 *
 * This module configures OAuth providers for authentication.
 * Supports GitHub, Google, and Credentials-based authentication.
 */

import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { Provider } from 'next-auth/providers';
import { isGitHubConfigured, isGoogleConfigured } from '@/lib/env';

// ============================================================================
// Rate Limiting for Login Attempts
// ============================================================================

/**
 * In-memory store for login attempt tracking.
 * Tracks attempts per email to prevent brute-force attacks.
 *
 * Note: This is a simple in-memory implementation suitable for single-instance
 * deployments. For multi-instance/clustered deployments, use Redis or similar.
 */
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

/**
 * Maximum allowed login attempts before rate limiting kicks in.
 */
const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Duration in milliseconds before the rate limit resets (15 minutes).
 */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Checks if a login attempt should be allowed based on rate limiting.
 * Returns false if the email has exceeded the maximum number of attempts
 * within the rate limit window.
 *
 * @param email - The email address attempting to log in
 * @returns true if the attempt is allowed, false if rate limited
 */
function checkRateLimit(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const attempts = loginAttempts.get(normalizedEmail);

  // No previous attempts or window has expired - allow and start new window
  if (!attempts || now > attempts.resetTime) {
    loginAttempts.set(normalizedEmail, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  // Check if rate limit exceeded
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }

  // Increment attempt counter
  attempts.count++;
  return true;
}

/**
 * Resets the rate limit counter for a specific email.
 * Called after successful authentication to allow immediate re-login.
 *
 * @param email - The email address to reset
 */
function resetRateLimit(email: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  loginAttempts.delete(normalizedEmail);
}

/**
 * Periodically cleans up expired rate limit entries to prevent memory leaks.
 * Runs every 5 minutes.
 */
setInterval(() => {
  const now = Date.now();
  for (const [email, attempts] of loginAttempts.entries()) {
    if (now > attempts.resetTime) {
      loginAttempts.delete(email);
    }
  }
}, 5 * 60 * 1000);

/**
 * GitHub OAuth Provider
 *
 * Requires GITHUB_ID and GITHUB_SECRET environment variables.
 * Users can sign in with their GitHub account.
 */
const gitHubProvider = GitHub({
  clientId: process.env.GITHUB_ID!,
  clientSecret: process.env.GITHUB_SECRET!,
  // Request additional profile information
  profile(profile) {
    return {
      id: profile.id.toString(),
      name: profile.name ?? profile.login,
      email: profile.email,
      image: profile.avatar_url,
    };
  },
});

/**
 * Google OAuth Provider
 *
 * Requires GOOGLE_ID and GOOGLE_SECRET environment variables.
 * Users can sign in with their Google account.
 */
const googleProvider = Google({
  clientId: process.env.GOOGLE_ID!,
  clientSecret: process.env.GOOGLE_SECRET!,
  // Request additional profile information
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
});

/**
 * Dummy password hash for timing attack prevention
 *
 * This hash is used when a user is not found to ensure that the
 * bcrypt comparison always runs, preventing timing-based user enumeration.
 * The hash corresponds to an empty string and will never match real input.
 */
const DUMMY_PASSWORD_HASH =
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.Y6V5VZlHlCqL/HKUWS';

/**
 * Credentials Provider
 *
 * Enables email/password authentication.
 * Validates credentials against the database using bcrypt for password comparison.
 *
 * Security considerations:
 * - Always runs bcrypt comparison to prevent timing attacks
 * - Wraps database operations in try-catch for graceful error handling
 * - Never exposes internal error details to the client
 */
const credentialsProvider = Credentials({
  name: 'credentials',
  credentials: {
    email: {
      label: 'Email',
      type: 'email',
      placeholder: 'your@email.com',
    },
    password: {
      label: 'Password',
      type: 'password',
      placeholder: 'Your password',
    },
  },
  async authorize(credentials) {
    try {
      // Validate that credentials were provided
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = credentials.email as string;
      const password = credentials.password as string;

      // Check rate limit before processing login attempt
      if (!checkRateLimit(email)) {
        console.warn(`Rate limit exceeded for email: ${email.substring(0, 3)}***`);
        return null;
      }

      // Dynamic import to avoid issues during build time when Prisma hasn't generated yet
      const { prisma } = await import('@/lib/db/prisma');

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          passwordHash: true,
          emailVerified: true,
        },
      });

      // Determine which hash to compare against
      // Always run bcrypt.compare to prevent timing attacks that could enumerate users
      const hashToCompare = user?.passwordHash ?? DUMMY_PASSWORD_HASH;

      // Verify password using bcrypt
      // This runs even if user is not found to prevent timing-based user enumeration
      const isValidPassword = await bcrypt.compare(password, hashToCompare);

      // User not found or password doesn't match
      if (!user || !isValidPassword) {
        return null;
      }

      // User doesn't have a password (OAuth-only account)
      // Check after bcrypt comparison to maintain constant time
      if (!user.passwordHash) {
        return null;
      }

      // Reset rate limit on successful login
      resetRateLimit(email);

      // Return user object (without password hash)
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    } catch (error) {
      // Log error for debugging but don't expose details to client
      // In production, use a proper logging service
      console.error('Credentials authorization error:', error);
      return null;
    }
  },
});

/**
 * All configured authentication providers
 *
 * Export as an array for use in NextAuth configuration.
 * Order determines the display order on the sign-in page.
 *
 * OAuth providers are only included if their credentials are configured
 * in environment variables. This prevents runtime errors when OAuth
 * credentials are not available.
 */
export const providers: Provider[] = [
  // Only include GitHub if configured
  ...(isGitHubConfigured() ? [gitHubProvider] : []),
  // Only include Google if configured
  ...(isGoogleConfigured() ? [googleProvider] : []),
  // Credentials provider is always available
  credentialsProvider,
];

/**
 * Provider metadata for UI rendering
 *
 * Useful for building custom sign-in pages with provider buttons.
 */
export const providerMetadata = {
  github: {
    name: 'GitHub',
    icon: 'github',
    bgColor: 'bg-slate-800',
    hoverBgColor: 'hover:bg-slate-700',
    textColor: 'text-white',
  },
  google: {
    name: 'Google',
    icon: 'google',
    bgColor: 'bg-white',
    hoverBgColor: 'hover:bg-gray-50',
    textColor: 'text-slate-700',
  },
  credentials: {
    name: 'Email',
    icon: 'email',
    bgColor: 'bg-sky-500',
    hoverBgColor: 'hover:bg-sky-600',
    textColor: 'text-white',
  },
} as const;
