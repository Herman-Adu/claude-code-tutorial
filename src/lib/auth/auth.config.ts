/**
 * NextAuth.js Configuration Options
 *
 * This module contains the core authentication configuration options
 * that can be shared between the Edge runtime and Node.js runtime.
 *
 * Separating the config allows for use in middleware (Edge) while
 * keeping database-dependent logic in the main auth.ts file.
 */

import type { NextAuthConfig } from 'next-auth';

/**
 * Custom pages configuration
 *
 * Override default NextAuth pages with custom routes.
 * These pages should be created in the app directory.
 */
const pages = {
  signIn: '/auth/login',
  signOut: '/auth/signout',
  error: '/auth/error',
  verifyRequest: '/auth/verify-request',
  newUser: '/auth/new-user',
} as const;

/**
 * Session configuration
 *
 * Using JWT strategy for stateless sessions.
 * Session data is stored in an encrypted cookie.
 */
const session = {
  strategy: 'jwt' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days
  updateAge: 24 * 60 * 60, // 24 hours - how often the session is updated
};

/**
 * Callbacks for customizing authentication behavior
 *
 * These callbacks allow you to modify tokens, sessions,
 * and control access to pages.
 */
const callbacks: NextAuthConfig['callbacks'] = {
  /**
   * JWT callback - called when JWT is created or updated
   *
   * Use this to add custom claims to the JWT token.
   * The token is then available in the session callback.
   */
  async jwt({ token, user, account }) {
    // Initial sign-in: add user ID to token
    if (user) {
      token.id = user.id;
    }

    // Add provider information for OAuth accounts
    if (account) {
      token.provider = account.provider;
    }

    return token;
  },

  /**
   * Session callback - called when session is accessed
   *
   * Use this to add custom properties to the session object.
   * Only return data that should be accessible client-side.
   */
  async session({ session, token }) {
    // Add user ID to session for easy access
    if (token && session.user) {
      session.user.id = token.id as string;
    }

    return session;
  },

  /**
   * Authorized callback - controls access to pages
   *
   * Used by middleware to protect routes.
   * Return true to allow access, false to redirect to sign-in.
   *
   * Protected routes (require authentication):
   * - / (Kanban Board)
   * - /calendar
   * - /articles
   * - /docs
   * - /tutorials
   *
   * Public routes (no authentication required):
   * - /auth/* (authentication pages)
   * - /api/auth/* (NextAuth API routes)
   * - /api/health (health check endpoint)
   */
  async authorized({ auth, request: { nextUrl } }) {
    const isLoggedIn = !!auth?.user;

    // Public routes that don't require authentication
    const publicRoutes = ['/auth', '/api/auth', '/api/health'];
    const isPublicRoute = publicRoutes.some((route) =>
      nextUrl.pathname.startsWith(route)
    );

    // Redirect logged-in users away from auth pages to home
    if (nextUrl.pathname.startsWith('/auth') && isLoggedIn) {
      return Response.redirect(new URL('/', nextUrl));
    }

    // Allow access to public routes without authentication
    if (isPublicRoute) {
      return true;
    }

    // All other routes require authentication
    if (!isLoggedIn) {
      return Response.redirect(new URL('/auth/login', nextUrl));
    }

    return true;
  },
};

/**
 * Event handlers for authentication events
 *
 * Use these to perform side effects after authentication events.
 */
const events: NextAuthConfig['events'] = {
  /**
   * Called when a user signs in
   */
  async signIn({ user, account, isNewUser }) {
    // Log sign-in events (in production, use proper logging service)
    if (process.env.NODE_ENV === 'development') {
      console.log(`User signed in: ${user.id} via ${account?.provider}`);
      if (isNewUser) {
        console.log(`New user created: ${user.id}`);
      }
    }
  },

  /**
   * Called when a user signs out
   */
  async signOut() {
    if (process.env.NODE_ENV === 'development') {
      console.log('User signed out');
    }
  },

  /**
   * Called when a new OAuth account is linked
   */
  async linkAccount({ user, account }) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Account linked: ${user.id} with ${account.provider}`);
    }
  },
};

/**
 * Base authentication configuration
 *
 * This configuration is used as a base and extended with providers
 * in the main auth.ts file. The providers array is empty here
 * because providers are added dynamically in auth.ts.
 */
export const authConfig = {
  pages,
  session,
  callbacks,
  events,
  providers: [], // Providers are added in auth.ts
  // Security options
  useSecureCookies: process.env.NODE_ENV === 'production',
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;

export default authConfig;
