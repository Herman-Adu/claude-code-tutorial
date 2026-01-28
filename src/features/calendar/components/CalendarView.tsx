'use client';

/**
 * CalendarView Component
 *
 * Main calendar component using react-big-calendar.
 * Displays tasks as events with Month, Week, and Agenda views.
 */

import { useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useCalendar } from '../hooks/useCalendar';
import { useTasksByDate } from '../hooks/useTasksByDate';
import { CalendarHeader } from './CalendarHeader';
import { CalendarEvent } from './CalendarEvent';
import type { CalendarEvent as CalendarEventType, CalendarViewMode } from '../types';

// Configure date-fns localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

interface CalendarViewProps {
  /** Optional callback when an event is clicked */
  onEventClick?: (event: CalendarEventType) => void;
  /** Optional callback when a date/slot is selected */
  onSlotSelect?: (slotInfo: { start: Date; end: Date }) => void;
}

/**
 * Maps CalendarViewMode to react-big-calendar View type.
 */
function mapViewMode(mode: CalendarViewMode): View {
  return mode as View;
}

/**
 * Main calendar view component.
 * Integrates react-big-calendar with task data.
 */
export function CalendarView({ onEventClick, onSlotSelect }: CalendarViewProps) {
  const {
    currentDate,
    viewMode,
    dateRange,
    handleNavigate,
    setViewMode,
    setCurrentDate,
  } = useCalendar();

  const { events, isLoading, error } = useTasksByDate(dateRange);

  // Handle event click
  const handleSelectEvent = useCallback(
    (event: CalendarEventType) => {
      onEventClick?.(event);
    },
    [onEventClick]
  );

  // Handle slot selection (clicking on empty date)
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; action: string }) => {
      if (slotInfo.action === 'click' || slotInfo.action === 'select') {
        onSlotSelect?.({ start: slotInfo.start, end: slotInfo.end });
      }
    },
    [onSlotSelect]
  );

  // Handle navigation from react-big-calendar
  const handleCalendarNavigate = useCallback(
    (newDate: Date) => {
      setCurrentDate(newDate);
    },
    [setCurrentDate]
  );

  // Handle view change from react-big-calendar
  const handleCalendarViewChange = useCallback(
    (view: View) => {
      setViewMode(view as CalendarViewMode);
    },
    [setViewMode]
  );

  // Custom event component
  const components = useMemo(
    () => ({
      event: CalendarEvent,
    }),
    []
  );

  // Custom styling for calendar slots
  const eventPropGetter = useCallback(() => {
    return {
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        padding: 0,
      },
    };
  }, []);

  return (
    <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-6 shadow-lg">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onNavigate={handleNavigate}
        onViewChange={setViewMode}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 font-medium">Failed to load tasks</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Calendar */}
      {!isLoading && !error && (
        <div className="calendar-container h-[400px] sm:h-[500px] md:h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            view={mapViewMode(viewMode)}
            onNavigate={handleCalendarNavigate}
            onView={handleCalendarViewChange}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            components={components}
            eventPropGetter={eventPropGetter}
            toolbar={false}
            popup
            views={['month', 'week', 'agenda']}
            formats={{
              monthHeaderFormat: 'MMMM yyyy',
              weekdayFormat: 'EEE',
              dayFormat: 'd',
              agendaDateFormat: 'EEE MMM d',
              agendaTimeFormat: 'h:mm a',
              agendaTimeRangeFormat: ({ start, end }) =>
                `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
            }}
          />
        </div>
      )}

      {/* Calendar Styles Override */}
      <style jsx global>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
        }

        .calendar-container .rbc-header {
          padding: 8px 4px;
          font-weight: 600;
          font-size: 0.875rem;
          color: #374151;
          background: rgba(255, 255, 255, 0.5);
          border-bottom: 1px solid rgba(229, 231, 235, 0.8);
        }

        .calendar-container .rbc-month-view {
          border: 1px solid rgba(229, 231, 235, 0.6);
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .calendar-container .rbc-day-bg {
          background: rgba(255, 255, 255, 0.3);
        }

        .calendar-container .rbc-day-bg.rbc-today {
          background: rgba(59, 130, 246, 0.1);
        }

        .calendar-container .rbc-off-range-bg {
          background: rgba(243, 244, 246, 0.5);
        }

        .calendar-container .rbc-date-cell {
          padding: 4px 8px;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .calendar-container .rbc-date-cell.rbc-now {
          font-weight: 700;
          color: #2563eb;
        }

        .calendar-container .rbc-event {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }

        .calendar-container .rbc-event:focus {
          outline: none;
        }

        .calendar-container .rbc-show-more {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          background: transparent;
        }

        .calendar-container .rbc-agenda-view {
          border: 1px solid rgba(229, 231, 235, 0.6);
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .calendar-container .rbc-agenda-table {
          border: none;
        }

        .calendar-container .rbc-agenda-date-cell,
        .calendar-container .rbc-agenda-time-cell {
          padding: 12px 16px;
          font-size: 0.875rem;
          color: #374151;
          white-space: nowrap;
        }

        .calendar-container .rbc-agenda-event-cell {
          padding: 8px 16px;
        }

        .calendar-container .rbc-time-view {
          border: 1px solid rgba(229, 231, 235, 0.6);
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .calendar-container .rbc-time-header-content {
          border-left: none;
        }

        .calendar-container .rbc-timeslot-group {
          min-height: 60px;
        }
      `}</style>
    </div>
  );
}
