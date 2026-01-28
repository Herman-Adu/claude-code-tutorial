'use client';

import { useCallback, useId } from 'react';
import { cn } from '@/lib/utils';

export interface DateRange {
  start: string; // ISO date string (YYYY-MM-DD)
  end: string;   // ISO date string (YYYY-MM-DD)
}

interface DateRangeInputProps {
  /** Current date range value */
  value?: DateRange;
  /** Callback when date range changes */
  onChange: (range: DateRange | undefined) => void;
  /** Placeholder for start date */
  startPlaceholder?: string;
  /** Placeholder for end date */
  endPlaceholder?: string;
  /** Whether the inputs are disabled */
  disabled?: boolean;
  /** Minimum selectable date (ISO format) */
  minDate?: string;
  /** Maximum selectable date (ISO format) */
  maxDate?: string;
  /** Custom class name for the container */
  className?: string;
  /** Error message to display */
  error?: string;
}

/**
 * DateRangeInput component with glassmorphic styling.
 * Provides two date inputs for selecting a start and end date.
 * Validates that start date is before or equal to end date.
 */
export function DateRangeInput({
  value,
  onChange,
  startPlaceholder = 'Start date',
  endPlaceholder = 'End date',
  disabled = false,
  minDate,
  maxDate,
  className,
  error,
}: DateRangeInputProps) {
  const startId = useId();
  const endId = useId();

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStart = e.target.value;
      if (!newStart) {
        // If start is cleared, clear the entire range
        onChange(undefined);
        return;
      }

      const currentEnd = value?.end || '';

      // If end exists and new start is after end, adjust end to match start
      if (currentEnd && newStart > currentEnd) {
        onChange({ start: newStart, end: newStart });
      } else {
        onChange({ start: newStart, end: currentEnd || newStart });
      }
    },
    [value, onChange]
  );

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newEnd = e.target.value;
      const currentStart = value?.start || '';

      if (!newEnd) {
        // If end is cleared but start exists, keep just the start as a single-day range
        if (currentStart) {
          onChange({ start: currentStart, end: currentStart });
        } else {
          onChange(undefined);
        }
        return;
      }

      // If start exists and new end is before start, adjust start to match end
      if (currentStart && newEnd < currentStart) {
        onChange({ start: newEnd, end: newEnd });
      } else {
        onChange({ start: currentStart || newEnd, end: newEnd });
      }
    },
    [value, onChange]
  );

  const handleClear = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  const inputBaseStyles = cn(
    // Base glassmorphic styling
    'w-full px-3 py-2 text-sm text-slate-700',
    'bg-white/60 backdrop-blur-[10px]',
    'border border-white/40 rounded-lg',
    'shadow-[inset_0_2px_4px_rgba(100,100,140,0.05)]',
    'transition-all duration-250',
    // Focus state
    'focus:bg-white/75 focus:border-sky-200/60',
    'focus:shadow-[0_0_0_3px_rgba(180,210,240,0.25),inset_0_2px_4px_rgba(100,100,140,0.05)]',
    'focus:outline-none',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Date input styling
    '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
    '[&::-webkit-calendar-picker-indicator]:opacity-60',
    '[&::-webkit-calendar-picker-indicator]:hover:opacity-100',
    '[&::-webkit-calendar-picker-indicator]:transition-opacity'
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        {/* Start date input */}
        <div className="flex-1">
          <label htmlFor={startId} className="sr-only">
            {startPlaceholder}
          </label>
          <input
            id={startId}
            type="date"
            value={value?.start || ''}
            onChange={handleStartChange}
            disabled={disabled}
            min={minDate}
            max={value?.end || maxDate}
            aria-label={startPlaceholder}
            className={cn(
              inputBaseStyles,
              !value?.start && 'text-slate-400'
            )}
          />
        </div>

        {/* Separator */}
        <span className="text-slate-400 text-sm font-medium px-1">to</span>

        {/* End date input */}
        <div className="flex-1">
          <label htmlFor={endId} className="sr-only">
            {endPlaceholder}
          </label>
          <input
            id={endId}
            type="date"
            value={value?.end || ''}
            onChange={handleEndChange}
            disabled={disabled}
            min={value?.start || minDate}
            max={maxDate}
            aria-label={endPlaceholder}
            className={cn(
              inputBaseStyles,
              !value?.end && 'text-slate-400'
            )}
          />
        </div>

        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear date range"
            className={cn(
              'flex-shrink-0 w-8 h-8 flex items-center justify-center',
              'text-slate-400 hover:text-slate-600',
              'rounded-lg hover:bg-slate-100/50',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-sky-400/30'
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-rose-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
