import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import CalendarPageClient from './CalendarPageClient';

/**
 * Calendar Page - Server Component Wrapper
 *
 * This server component performs authentication checks before rendering
 * the client-side Calendar view. This provides backup server-side protection
 * in addition to any client-side or middleware auth guards.
 */
export default async function CalendarPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return <CalendarPageClient />;
}
