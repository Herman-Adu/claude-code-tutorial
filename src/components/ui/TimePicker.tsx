'use client';

import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

interface TimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  /** Time value in HH:MM format */
  value: string;
  /** Callback when time changes */
  onChange: (value: string) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Custom class name for the container */
  containerClassName?: string;
}

/**
 * TimePicker component with glassmorphic styling.
 * Uses native HTML5 time input with custom styling for consistency.
 */
export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      value,
      onChange,
      disabled = false,
      containerClassName,
      className,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = providedId || generatedId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className={cn('relative', containerClassName)}>
        <input
          ref={ref}
          type="time"
          id={inputId}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-label={props['aria-label'] || 'Select time'}
          className={cn(
            // Base glassmorphic styling matching glass-input
            'w-full px-4 py-3 text-slate-700',
            'bg-white/60 backdrop-blur-[10px]',
            'border border-white/40 rounded-xl',
            'shadow-[inset_0_2px_4px_rgba(100,100,140,0.05)]',
            'transition-all duration-250',
            // Focus state
            'focus:bg-white/75 focus:border-sky-200/60',
            'focus:shadow-[0_0_0_3px_rgba(180,210,240,0.25),inset_0_2px_4px_rgba(100,100,140,0.05)]',
            'focus:outline-none',
            // Disabled state
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Custom time input styling
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
            '[&::-webkit-calendar-picker-indicator]:opacity-60',
            '[&::-webkit-calendar-picker-indicator]:hover:opacity-100',
            '[&::-webkit-calendar-picker-indicator]:transition-opacity',
            // Placeholder styling when empty
            !value && 'text-slate-400',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

TimePicker.displayName = 'TimePicker';
