import { Metadata } from 'next';
import { NotificationCenter } from '@/features/notifications';

export const metadata: Metadata = {
  title: 'Notifications | Kanban Board',
  description: 'View and manage your notifications',
};

/**
 * Notifications page displaying the full notification center.
 */
export default function NotificationsPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <NotificationCenter />
    </main>
  );
}
