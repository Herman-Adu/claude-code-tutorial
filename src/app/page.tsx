import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import KanbanPageClient from './KanbanPageClient';

/**
 * Kanban Board Page - Server Component Wrapper
 *
 * This server component performs authentication checks before rendering
 * the client-side Kanban board. This provides backup server-side protection
 * in addition to any client-side or middleware auth guards.
 */
export default async function KanbanPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return <KanbanPageClient />;
}
