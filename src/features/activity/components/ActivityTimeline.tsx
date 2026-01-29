'use client';

/**
 * ActivityTimeline Component
 *
 * Displays a vertical timeline of activity events for a task.
 *
 * Features:
 * - Chronological activity display (newest first)
 * - Loading and empty states
 * - Error handling
 * - Refresh functionality
 * - Activity type filtering (optional)
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ActivityItem } from './ActivityItem';
import {
  useActivityStore,
  useTaskActivity,
  useActivityLoading,
  useActivityError,
} from '@/store/activity';
import type { ActivityType } from '@/app/actions/activity';

interface ActivityTimelineProps {
  /** Task ID to display activity for */
  taskId: string;
  /** Maximum height before scrolling */
  maxHeight?: string;
  /** Filter to specific activity types */
  filterTypes?: ActivityType[];
  /** Whether to show activity details */
  showDetails?: boolean;
  /** Maximum number of activities to show */
  limit?: number;
  /** Custom class name */
  className?: string;
}

export function ActivityTimeline({
  taskId,
  maxHeight = '400px',
  filterTypes,
  showDetails = true,
  limit,
  className,
}: ActivityTimelineProps) {
  const activities = useTaskActivity(taskId);
  const isLoading = useActivityLoading();
  const error = useActivityError();

  const loadTaskActivity = useActivityStore((state) => state.loadTaskActivity);
  const clearError = useActivityStore((state) => state.clearError);

  const [showAll, setShowAll] = useState(false);

  // Load activity on mount
  useEffect(() => {
    loadTaskActivity(taskId);
  }, [taskId, loadTaskActivity]);

  // Apply filters
  let filteredActivities = activities;
  if (filterTypes && filterTypes.length > 0) {
    filteredActivities = activities.filter((a) => filterTypes.includes(a.type));
  }

  // Apply limit
  const displayLimit = showAll ? undefined : limit;
  const displayedActivities = displayLimit
    ? filteredActivities.slice(0, displayLimit)
    : filteredActivities;
  const hasMore = displayLimit && filteredActivities.length > displayLimit;

  // Loading skeleton
  if (isLoading && activities.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Activity
          {filteredActivities.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
              {filteredActivities.length}
            </span>
          )}
        </h3>

        {/* Refresh button */}
        <button
          type="button"
          onClick={() => loadTaskActivity(taskId)}
          disabled={isLoading}
          className={cn(
            'p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Refresh activity"
        >
          <svg
            className={cn('w-4 h-4', isLoading && 'animate-spin')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm"
          role="alert"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="p-1 rounded hover:bg-rose-100 transition-colors"
            aria-label="Dismiss error"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Activity timeline */}
      <div
        className={cn('overflow-y-auto', maxHeight && `max-h-[${maxHeight}]`)}
        style={{ maxHeight }}
        role="feed"
        aria-label="Activity timeline"
      >
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs mt-1">Activity will appear here as changes are made</p>
          </div>
        ) : (
          <div className="space-y-0">
            {displayedActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                showConnector={index < displayedActivities.length - 1}
                showDetails={showDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Show more button */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
        >
          Show {filteredActivities.length - displayLimit!} more activities
        </button>
      )}

      {/* Show less button when expanded */}
      {showAll && limit && filteredActivities.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="w-full py-2 text-sm text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}

export default ActivityTimeline;
