'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useCallback, useMemo } from 'react';

/**
 * Authentication hook providing a clean interface to NextAuth functionality.
 *
 * Wraps NextAuth's useSession hook with additional utilities for:
 * - Loading state management
 * - User information access
 * - Sign in/out operations
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 *
 * if (isLoading) return <Spinner />;
 * if (!isAuthenticated) return <LoginPrompt />;
 * return <Dashboard user={user} />;
 * ```
 */
export function useAuth() {
  const { data: session, status } = useSession();

  /**
   * Indicates whether the authentication state is still being determined.
   * True during initial load or when checking session validity.
   */
  const isLoading = status === 'loading';

  /**
   * Indicates whether the user is authenticated.
   * Only true when we have a valid session with user data.
   */
  const isAuthenticated = status === 'authenticated' && !!session?.user;

  // Extract user properties for explicit memoization dependencies
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;
  const userImage = session?.user?.image;

  /**
   * The current user's information, or null if not authenticated.
   * Includes id, email, name, and image from the session.
   */
  const user = useMemo(() => {
    if (!isAuthenticated || !userId || !userEmail) return null;

    return {
      id: userId,
      email: userEmail,
      name: userName ?? null,
      image: userImage ?? null,
    };
  }, [isAuthenticated, userId, userEmail, userName, userImage]);

  /**
   * Initiates OAuth sign-in with the specified provider.
   *
   * @param provider - The OAuth provider ID (e.g., 'github', 'google')
   * @param callbackUrl - Optional URL to redirect to after sign-in
   */
  const loginWithOAuth = useCallback(
    async (provider: 'github' | 'google', callbackUrl?: string) => {
      await signIn(provider, {
        callbackUrl: callbackUrl ?? '/',
      });
    },
    []
  );

  /**
   * Initiates credentials-based sign-in with email and password.
   *
   * @param email - User's email address
   * @param password - User's password
   * @param callbackUrl - Optional URL to redirect to after sign-in
   * @returns Object containing error message if sign-in failed
   */
  const loginWithCredentials = useCallback(
    async (
      email: string,
      password: string,
      callbackUrl?: string
    ): Promise<{ error?: string }> => {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: callbackUrl ?? '/',
      });

      if (result?.error) {
        return { error: 'Invalid email or password' };
      }

      // Successful login - redirect manually since we used redirect: false
      if (result?.ok) {
        window.location.href = callbackUrl ?? '/';
      }

      return {};
    },
    []
  );

  /**
   * Signs out the current user and redirects to the home page.
   *
   * @param callbackUrl - Optional URL to redirect to after sign-out
   */
  const logout = useCallback(async (callbackUrl?: string) => {
    await signOut({
      callbackUrl: callbackUrl ?? '/',
    });
  }, []);

  return {
    // State
    user,
    session,
    isLoading,
    isAuthenticated,
    status,

    // Actions
    loginWithOAuth,
    loginWithCredentials,
    logout,
    signIn,
    signOut,
  };
}

/**
 * Type for the user object returned by useAuth.
 */
export type AuthUser = NonNullable<ReturnType<typeof useAuth>['user']>;
