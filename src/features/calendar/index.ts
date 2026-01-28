/**
 * Calendar Feature Barrel Export
 *
 * Main entry point for the calendar feature.
 * Exports all public components, hooks, and types.
 */

// Components
export {
  CalendarView,
  CalendarHeader,
  CalendarEvent,
  CalendarEventWrapper,
  ViewToggle,
  type ViewType,
} from './components';

// Hooks
export { useCalendar } from './hooks/useCalendar';
export { useTasksByDate } from './hooks/useTasksByDate';

// Types
export type {
  CalendarViewMode,
  CalendarEvent as CalendarEventType,
  CalendarEventProps,
  DateRange,
  CalendarNavigationAction,
} from './types';
export { PRIORITY_COLORS, VIEW_MODE_LABELS } from './types';
