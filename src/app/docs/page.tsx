import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { DocsLibrary } from '@/features/docs';

/**
 * Documentation Page - Server Component Wrapper
 *
 * Performs authentication checks before rendering the client-side
 * DocsLibrary component. Provides server-side protection in addition
 * to any client-side or middleware auth guards.
 */
export default async function DocsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <DocsLibrary />
      </div>
    </main>
  );
}
