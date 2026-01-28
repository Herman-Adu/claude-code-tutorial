'use client';

/**
 * useCalendar Hook
 *
 * Manages calendar state including current date and view mode.
 * Provides navigation functions for calendar controls.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from 'date-fns';
import type { CalendarViewMode, DateRange, CalendarNavigationAction } from '../types';

interface UseCalendarReturn {
  /** Currently displayed date (center of view) */
  currentDate: Date;
  /** Current view mode (month/week/agenda) */
  viewMode: CalendarViewMode;
  /** Date range visible in current view */
  dateRange: DateRange;
  /** Navigate to previous period */
  navigatePrev: () => void;
  /** Navigate to next period */
  navigateNext: () => void;
  /** Navigate to today */
  navigateToday: () => void;
  /** Handle navigation action */
  handleNavigate: (action: CalendarNavigationAction) => void;
  /** Change view mode */
  setViewMode: (mode: CalendarViewMode) => void;
  /** Set current date directly */
  setCurrentDate: (date: Date) => void;
}

/**
 * Hook for managing calendar navigation and view state.
 *
 * @param initialDate - Starting date for the calendar (defaults to today)
 * @param initialViewMode - Starting view mode (defaults to 'month')
 * @returns Calendar state and navigation functions
 */
export function useCalendar(
  initialDate: Date = new Date(),
  initialViewMode: CalendarViewMode = 'month'
): UseCalendarReturn {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);

  /**
   * Calculate the visible date range based on view mode.
   * Includes buffer days for month view (shows days from adjacent months).
   */
  const dateRange = useMemo<DateRange>(() => {
    if (viewMode === 'month') {
      // Month view shows full weeks, so we need start of first week to end of last week
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 0 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
      };
    }

    if (viewMode === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    }

    // Agenda view - show one month ahead
    return {
      start: currentDate,
      end: addMonths(currentDate, 1),
    };
  }, [currentDate, viewMode]);

  const navigatePrev = useCallback(() => {
    setCurrentDate((prev) => {
      if (viewMode === 'month' || viewMode === 'agenda') {
        return subMonths(prev, 1);
      }
      return subWeeks(prev, 1);
    });
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    setCurrentDate((prev) => {
      if (viewMode === 'month' || viewMode === 'agenda') {
        return addMonths(prev, 1);
      }
      return addWeeks(prev, 1);
    });
  }, [viewMode]);

  const navigateToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleNavigate = useCallback(
    (action: CalendarNavigationAction) => {
      switch (action) {
        case 'PREV':
          navigatePrev();
          break;
        case 'NEXT':
          navigateNext();
          break;
        case 'TODAY':
          navigateToday();
          break;
      }
    },
    [navigatePrev, navigateNext, navigateToday]
  );

  return {
    currentDate,
    viewMode,
    dateRange,
    navigatePrev,
    navigateNext,
    navigateToday,
    handleNavigate,
    setViewMode,
    setCurrentDate,
  };
}
