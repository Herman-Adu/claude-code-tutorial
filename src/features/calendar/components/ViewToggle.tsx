'use client';

/**
 * ViewToggle Component
 *
 * Toggle between Kanban board and Calendar views.
 */

export type ViewType = 'kanban' | 'calendar';

interface ViewToggleProps {
  /** Current active view */
  activeView: ViewType;
  /** View change handler */
  onViewChange: (view: ViewType) => void;
}

/**
 * Toggle component for switching between Kanban and Calendar views.
 */
export function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-white/40">
      <button
        type="button"
        onClick={() => onViewChange('kanban')}
        className={`
          flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
          ${
            activeView === 'kanban'
              ? 'bg-white/90 text-gray-900 shadow-sm'
              : 'text-slate-700 hover:text-gray-900 hover:bg-white/40'
          }
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
        Board
      </button>
      <button
        type="button"
        onClick={() => onViewChange('calendar')}
        className={`
          flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
          ${
            activeView === 'calendar'
              ? 'bg-white/90 text-gray-900 shadow-sm'
              : 'text-slate-700 hover:text-gray-900 hover:bg-white/40'
          }
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Calendar
      </button>
    </div>
  );
}
