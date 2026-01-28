'use client';

/**
 * CalendarEvent Component
 *
 * Custom event renderer for react-big-calendar.
 * Displays task title with priority-based color coding.
 */

import type { CalendarEventProps, CalendarEvent as CalendarEventType } from '../types';
import { PRIORITY_COLORS } from '../types';

interface EventProps {
  event: CalendarEventType;
}

/**
 * Custom event component for calendar display.
 * Shows task title with priority color indicator.
 */
export function CalendarEvent({ event }: EventProps) {
  const task = event.resource;
  const colors = PRIORITY_COLORS[task.priority];

  return (
    <div
      className={`
        px-2 py-1 rounded text-xs font-medium truncate
        ${colors.bg} ${colors.text} ${colors.border}
        border-l-2 cursor-pointer
        hover:opacity-90 transition-opacity
      `}
      title={task.title}
    >
      {task.title}
    </div>
  );
}

/**
 * Event wrapper component for month view.
 * Provides consistent styling across views.
 */
export function CalendarEventWrapper({ event }: CalendarEventProps) {
  return <CalendarEvent event={event} />;
}
