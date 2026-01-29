'use client';

/**
 * ActivityItem Component
 *
 * Displays a single activity entry in the timeline.
 *
 * Features:
 * - Activity type icon with color coding
 * - Actor name and action description
 * - Relative/absolute timestamp
 * - Expandable details for some activity types
 */

import { cn } from '@/lib/utils';
import {
  type StoreActivity,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_COLORS,
  formatActivityDescription,
} from '@/store/activity';
import type { ActivityType } from '@/app/actions/activity';

interface ActivityItemProps {
  /** The activity to display */
  activity: StoreActivity;
  /** Whether to show the connector line to next item */
  showConnector?: boolean;
  /** Whether to show expanded details */
  showDetails?: boolean;
}

/**
 * Formats a timestamp for display.
 * Shows relative time for recent activities, absolute date for older ones.
 */
function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Returns the appropriate SVG icon for an activity type.
 */
function ActivityIcon({ type }: { type: ActivityType }) {
  const iconProps = {
    className: 'w-3.5 h-3.5',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    strokeWidth: 2,
    'aria-hidden': true,
  };

  switch (type) {
    case 'TASK_CREATED':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    case 'TASK_UPDATED':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      );
    case 'TASK_MOVED':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      );
    case 'TASK_DELETED':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      );
    case 'COMMENT_ADDED':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      );
    case 'COMMENT_UPDATED':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      );
    case 'COMMENT_DELETED':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      );
    case 'LABEL_ADDED':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      );
    case 'LABEL_REMOVED':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      );
    default:
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

/**
 * Renders additional details based on activity type.
 */
function ActivityDetails({ activity }: { activity: StoreActivity }) {
  const { type, data } = activity;

  switch (type) {
    case 'TASK_MOVED': {
      const from = data.fromColumn as string | undefined;
      const to = data.toColumn as string | undefined;
      if (from && to) {
        return (
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">{from}</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">{to}</span>
          </div>
        );
      }
      return null;
    }

    case 'TASK_UPDATED': {
      const fields = data.updatedFields as string[] | undefined;
      if (fields && fields.length > 0) {
        return (
          <div className="text-xs text-slate-500 mt-1">
            Updated: {fields.join(', ')}
          </div>
        );
      }
      return null;
    }

    case 'COMMENT_ADDED': {
      const preview = data.preview as string | undefined;
      if (preview) {
        return (
          <div className="text-xs text-slate-500 mt-1 italic line-clamp-2">
            &ldquo;{preview}&rdquo;
          </div>
        );
      }
      return null;
    }

    case 'LABEL_ADDED':
    case 'LABEL_REMOVED': {
      const labelName = data.labelName as string | undefined;
      const labelColor = data.labelColor as string | undefined;
      if (labelName) {
        return (
          <div className="flex items-center gap-1 mt-1">
            <span
              className="w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: labelColor || '#8b5cf6' }}
              aria-hidden="true"
            />
            <span className="text-xs text-slate-600 font-medium">{labelName}</span>
          </div>
        );
      }
      return null;
    }

    default:
      return null;
  }
}

export function ActivityItem({
  activity,
  showConnector = true,
  showDetails = true,
}: ActivityItemProps) {
  const colorClasses = ACTIVITY_TYPE_COLORS[activity.type];
  const description = formatActivityDescription(activity);
  const timestamp = formatTimestamp(activity.createdAt);

  return (
    <div className="relative flex gap-3 pb-4">
      {/* Timeline connector */}
      {showConnector && (
        <div
          className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200"
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          'relative z-10 flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0',
          colorClasses
        )}
      >
        <ActivityIcon type={activity.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-700 leading-snug">{description}</p>
          <time
            className="text-xs text-slate-500 flex-shrink-0"
            dateTime={activity.createdAt}
            title={new Date(activity.createdAt).toLocaleString()}
          >
            {timestamp}
          </time>
        </div>

        {/* Activity-specific details */}
        {showDetails && <ActivityDetails activity={activity} />}
      </div>
    </div>
  );
}

export default ActivityItem;
