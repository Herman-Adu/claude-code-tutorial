'use client';

import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  /** Date value in ISO format (YYYY-MM-DD) */
  value: string;
  /** Callback when date changes */
  onChange: (value: string) => void;
  /** Placeholder text shown when no date is selected */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to show the clear button */
  showClear?: boolean;
  /** Custom class name for the container */
  containerClassName?: string;
}

/**
 * DatePicker component with glassmorphic styling.
 * Uses native HTML5 date input with custom styling for consistency.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Select date',
      disabled = false,
      showClear = true,
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

    const handleClear = () => {
      onChange('');
    };

    return (
      <div className={cn('relative', containerClassName)}>
        <input
          ref={ref}
          type="date"
          id={inputId}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-label={props['aria-label'] || placeholder}
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
            // Custom date input styling
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
            '[&::-webkit-calendar-picker-indicator]:opacity-60',
            '[&::-webkit-calendar-picker-indicator]:hover:opacity-100',
            '[&::-webkit-calendar-picker-indicator]:transition-opacity',
            // Placeholder styling when empty
            !value && 'text-slate-400',
            // Add padding for clear button
            showClear && value && 'pr-10',
            className
          )}
          {...props}
        />
        {/* Clear button */}
        {showClear && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear date"
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'w-6 h-6 flex items-center justify-center',
              'text-slate-400 hover:text-slate-600',
              'rounded-full hover:bg-slate-100/50',
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
    );
  }
);

DatePicker.displayName = 'DatePicker';
