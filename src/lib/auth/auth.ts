/**
 * NextAuth.js Main Configuration
 *
 * This is the main authentication configuration file that combines
 * the base config with providers and the Prisma adapter.
 *
 * Exports the auth handler, signIn, signOut, and auth functions
 * for use throughout the application.
 */

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';
import { authConfig } from './auth.config';
import { providers } from './providers';

/**
 * NextAuth.js Configuration
 *
 * Combines:
 * - Base configuration (auth.config.ts)
 * - Authentication providers (providers.ts)
 * - Prisma adapter for database storage
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers,
  // Type assertion needed because Prisma 7.x has slightly different types
  // The adapter is fully compatible with NextAuth.js
  adapter: PrismaAdapter(prisma) as ReturnType<typeof PrismaAdapter>,
  // Explicitly pass the secret for JWT signing and encryption
  secret: env.NEXTAUTH_SECRET,
  // Trust the host header in production (required for some deployment platforms)
  trustHost: true,
});

/**
 * Get the current session on the server
 *
 * Use this in Server Components and API routes to get the current user.
 *
 * @example
 * ```tsx
 * import { auth } from '@/lib/auth/auth';
 *
 * export default async function Page() {
 *   const session = await auth();
 *   if (!session?.user) {
 *     redirect('/auth/signin');
 *   }
 *   return <div>Welcome, {session.user.name}</div>;
 * }
 * ```
 */
export { auth as getServerSession };

/**
 * Type augmentation for NextAuth
 *
 * Extend the default session and JWT types to include custom properties.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface JWT {
    id?: string;
    provider?: string;
  }
}
