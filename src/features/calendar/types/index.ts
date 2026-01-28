/**
 * Calendar Event Types for Sprint 4A
 *
 * Types for react-big-calendar integration with task data.
 */

import type { Task, Priority } from '@/types';

/**
 * Calendar view modes supported by react-big-calendar.
 */
export type CalendarViewMode = 'month' | 'week' | 'agenda';

/**
 * Event object compatible with react-big-calendar.
 * Maps task data to the format expected by the calendar component.
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Task;
}

/**
 * Props for custom event components.
 */
export interface CalendarEventProps {
  event: CalendarEvent;
}

/**
 * Date range for fetching tasks.
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Calendar navigation actions.
 */
export type CalendarNavigationAction = 'PREV' | 'NEXT' | 'TODAY';

/**
 * Priority color mapping for calendar events.
 */
export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string }> = {
  low: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
  },
  medium: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  high: {
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-300',
  },
};

/**
 * View mode labels for UI display.
 */
export const VIEW_MODE_LABELS: Record<CalendarViewMode, string> = {
  month: 'Month',
  week: 'Week',
  agenda: 'Agenda',
};
