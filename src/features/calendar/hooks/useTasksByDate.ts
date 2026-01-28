'use client';

/**
 * useTasksByDate Hook
 *
 * Fetches tasks within a date range using the getTasksByDateRange server action.
 * Transforms task data into calendar event format.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTasksByDateRange, type TaskResponse } from '@/app/actions/tasks';
import type { Task, Priority, ColumnId } from '@/types';
import type { CalendarEvent, DateRange } from '../types';

interface UseTasksByDateReturn {
  /** Calendar events transformed from tasks */
  events: CalendarEvent[];
  /** Raw tasks data */
  tasks: Task[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch tasks for current date range */
  refetch: () => Promise<void>;
}

/**
 * Maps database priority to frontend priority.
 */
function mapPriority(dbPriority: string): Priority {
  const priorityMap: Record<string, Priority> = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  };
  return priorityMap[dbPriority] || 'medium';
}

/**
 * Maps database columnId to frontend columnId.
 */
function mapColumnId(dbColumnId: string): ColumnId {
  const columnMap: Record<string, ColumnId> = {
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
  };
  return columnMap[dbColumnId] || 'todo';
}

/**
 * Transforms a TaskResponse from the server to a frontend Task.
 */
function transformTaskResponse(taskResponse: TaskResponse): Task {
  return {
    id: taskResponse.id,
    title: taskResponse.title,
    description: taskResponse.description,
    priority: mapPriority(taskResponse.priority),
    tags: taskResponse.tags,
    columnId: mapColumnId(taskResponse.columnId),
    categories: taskResponse.categories,
    createdAt: taskResponse.createdAt.toISOString(),
    updatedAt: taskResponse.updatedAt.toISOString(),
    dueDate: taskResponse.dueDate?.toISOString(),
    dueTime: taskResponse.dueTime ?? undefined,
    isAllDay: taskResponse.isAllDay,
    ownerName: taskResponse.ownerName,
    ownerEmail: taskResponse.ownerEmail,
  };
}

/**
 * Transforms a Task into a CalendarEvent for react-big-calendar.
 */
function taskToCalendarEvent(task: Task): CalendarEvent | null {
  if (!task.dueDate) {
    return null;
  }

  const dueDate = new Date(task.dueDate);

  // If task has a specific time, create a 1-hour event
  // Otherwise, create an all-day event
  let start: Date;
  let end: Date;

  if (task.isAllDay || !task.dueTime) {
    // All-day event
    start = dueDate;
    end = dueDate;
  } else {
    // Timed event - parse HH:MM format
    const [hours, minutes] = task.dueTime.split(':').map(Number);
    start = new Date(dueDate);
    start.setHours(hours, minutes, 0, 0);
    end = new Date(start);
    end.setHours(start.getHours() + 1); // Default 1-hour duration
  }

  return {
    id: task.id,
    title: task.title,
    start,
    end,
    allDay: task.isAllDay ?? true,
    resource: task,
  };
}

/**
 * Hook to fetch and transform tasks within a date range.
 *
 * @param dateRange - Start and end dates for fetching tasks
 * @returns Tasks as calendar events with loading/error state
 */
export function useTasksByDate(dateRange: DateRange): UseTasksByDateReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getTasksByDateRange(
        dateRange.start.toISOString(),
        dateRange.end.toISOString()
      );

      if (response.success && response.data) {
        const transformedTasks = response.data.map(transformTaskResponse);
        setTasks(transformedTasks);
      } else {
        setError(response.error || 'Failed to fetch tasks');
        setTasks([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  // Fetch tasks when date range changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Transform tasks to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    return tasks
      .map(taskToCalendarEvent)
      .filter((event): event is CalendarEvent => event !== null);
  }, [tasks]);

  return {
    events,
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
  };
}
