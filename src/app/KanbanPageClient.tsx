'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { KanbanBoard } from '@/features/kanban';
import { ViewToggle, type ViewType } from '@/features/calendar';

/**
 * Client component for the Kanban board page.
 * Contains all the interactive UI logic for the kanban view.
 */
export default function KanbanPageClient() {
  const router = useRouter();

  const handleViewChange = useCallback(
    (view: ViewType) => {
      if (view === 'calendar') {
        router.push('/calendar');
      }
    },
    [router]
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="inline-block glass-lg px-8 py-4 mb-4">
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-clip-text text-transparent">
                  Kanban Board
                </h1>
              </div>
              <p className="text-slate-500 font-medium tracking-wide">
                Organize your tasks with drag and drop
              </p>
            </div>
            <ViewToggle activeView="kanban" onViewChange={handleViewChange} />
          </div>
        </header>
      </div>
      <KanbanBoard showHeader={false} />
    </div>
  );
}
