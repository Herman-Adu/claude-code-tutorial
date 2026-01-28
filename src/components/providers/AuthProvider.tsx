'use client';

/**
 * Authentication Session Provider
 *
 * Wraps the application with NextAuth's SessionProvider to enable
 * client-side session access via useSession hook.
 *
 * This component must be used in a Client Component and should wrap
 * the entire application or relevant subtree that needs session access.
 */

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

interface AuthProviderProps {
  /**
   * Child components that will have access to session context
   */
  children: ReactNode;
  /**
   * Initial session data from server-side rendering
   * Pass this to avoid an extra request on initial load
   */
  session?: Session | null;
}

/**
 * AuthProvider Component
 *
 * Provides session context to client components.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * import { AuthProvider } from '@/components/providers';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In a client component
 * 'use client';
 * import { useSession, signIn, signOut } from 'next-auth/react';
 *
 * export function UserButton() {
 *   const { data: session, status } = useSession();
 *
 *   if (status === 'loading') return <div>Loading...</div>;
 *
 *   if (session) {
 *     return (
 *       <div>
 *         <span>Welcome, {session.user.name}</span>
 *         <button onClick={() => signOut()}>Sign out</button>
 *       </div>
 *     );
 *   }
 *
 *   return <button onClick={() => signIn()}>Sign in</button>;
 * }
 * ```
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider
      session={session}
      // Refetch session every 5 minutes to keep it fresh
      refetchInterval={5 * 60}
      // Refetch session when window gains focus
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}

export default AuthProvider;
