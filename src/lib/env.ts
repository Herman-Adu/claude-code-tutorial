/**
 * Environment Variable Validation
 *
 * This module validates all required environment variables at startup
 * using Zod schemas. This ensures that the application fails fast
 * with clear error messages if configuration is missing or invalid.
 *
 * Import this module early in the application lifecycle (e.g., in layout.tsx
 * or instrumentation.ts) to catch configuration errors immediately.
 */

import { z } from 'zod';

/**
 * Schema for server-side environment variables
 *
 * These variables are only available on the server and should never
 * be exposed to the client.
 */
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid URL'),

  // NextAuth.js core configuration
  NEXTAUTH_URL: z
    .string()
    .min(1, 'NEXTAUTH_URL is required')
    .url('NEXTAUTH_URL must be a valid URL'),

  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security'),

  // OAuth providers (optional - app works without them)
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),
  GOOGLE_ID: z.string().optional(),
  GOOGLE_SECRET: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

/**
 * Schema for client-side environment variables
 *
 * These variables are prefixed with NEXT_PUBLIC_ and are safe
 * to expose to the browser.
 */
const clientEnvSchema = z.object({
  // Add client-side env vars here as needed
  // NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

/**
 * Combined environment schema
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema);

/**
 * Type for validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 *
 * This object contains all environment variables after validation.
 * Access environment variables through this object instead of
 * directly using process.env for type safety.
 */
function validateEnv(): Env {
  // Skip validation during build time when env vars may not be available
  // This allows Next.js to build without all env vars present
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return process.env as unknown as Env;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  ${field}: ${messages?.join(', ')}`)
      .join('\n');

    console.error(
      '\n========================================\n' +
        'Invalid environment variables:\n' +
        errorMessages +
        '\n========================================\n'
    );

    throw new Error(
      `Invalid environment variables:\n${errorMessages}\n\n` +
        'Please check your .env file and ensure all required variables are set correctly.'
    );
  }

  return parsed.data;
}

/**
 * Validated environment variables
 *
 * Use this object to access environment variables with full type safety.
 *
 * @example
 * ```ts
 * import { env } from '@/lib/env';
 *
 * const dbUrl = env.DATABASE_URL;
 * const secret = env.NEXTAUTH_SECRET;
 * ```
 */
export const env = validateEnv();

/**
 * Check if OAuth provider is configured
 *
 * Utility functions to check if specific OAuth providers
 * have their credentials configured.
 */
export const isGitHubConfigured = (): boolean =>
  Boolean(env.GITHUB_ID && env.GITHUB_SECRET);

export const isGoogleConfigured = (): boolean =>
  Boolean(env.GOOGLE_ID && env.GOOGLE_SECRET);

/**
 * Get configured OAuth providers
 *
 * Returns a list of provider names that have valid configuration.
 */
export const getConfiguredProviders = (): string[] => {
  const providers: string[] = [];
  if (isGitHubConfigured()) providers.push('github');
  if (isGoogleConfigured()) providers.push('google');
  return providers;
};
