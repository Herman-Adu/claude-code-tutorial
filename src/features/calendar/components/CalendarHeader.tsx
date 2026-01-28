'use client';

/**
 * CalendarHeader Component
 *
 * Navigation controls for the calendar.
 * Includes prev/next/today buttons and view mode toggle.
 */

import { format } from 'date-fns';
import type { CalendarViewMode, CalendarNavigationAction } from '../types';
import { VIEW_MODE_LABELS } from '../types';

interface CalendarHeaderProps {
  /** Current date being displayed */
  currentDate: Date;
  /** Current view mode */
  viewMode: CalendarViewMode;
  /** Navigation handler */
  onNavigate: (action: CalendarNavigationAction) => void;
  /** View mode change handler */
  onViewChange: (mode: CalendarViewMode) => void;
}

/**
 * Formats the header title based on view mode.
 */
function getHeaderTitle(date: Date, viewMode: CalendarViewMode): string {
  if (viewMode === 'month' || viewMode === 'agenda') {
    return format(date, 'MMMM yyyy');
  }
  // Week view - show date range
  return format(date, 'MMM d, yyyy');
}

/**
 * Calendar header with navigation and view mode controls.
 */
export function CalendarHeader({
  currentDate,
  viewMode,
  onNavigate,
  onViewChange,
}: CalendarHeaderProps) {
  const viewModes: CalendarViewMode[] = ['month', 'week', 'agenda'];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate('TODAY')}
          aria-label="Go to today"
          className="
            px-3 py-1.5 text-sm font-medium
            bg-white/60 hover:bg-white/80
            border border-white/40
            rounded-lg transition-colors
          "
        >
          Today
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNavigate('PREV')}
            className="
              p-1.5 rounded-lg
              bg-white/60 hover:bg-white/80
              border border-white/40
              transition-colors
            "
            aria-label="Previous period"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('NEXT')}
            className="
              p-1.5 rounded-lg
              bg-white/60 hover:bg-white/80
              border border-white/40
              transition-colors
            "
            aria-label="Next period"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 ml-2">
          {getHeaderTitle(currentDate, viewMode)}
        </h2>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 bg-white/40 p-1 rounded-lg border border-white/30">
        {viewModes.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewChange(mode)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-colors
              ${
                viewMode === mode
                  ? 'bg-white/80 text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
              }
            `}
          >
            {VIEW_MODE_LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}
