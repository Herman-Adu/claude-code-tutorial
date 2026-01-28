'use client';

import { forwardRef, InputHTMLAttributes, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Current search value */
  value: string;
  /** Callback when search value changes (after debounce) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Whether to show loading spinner */
  isLoading?: boolean;
  /** Custom class name for the container */
  containerClassName?: string;
}

/**
 * SearchBar component with glassmorphic styling and debounced input.
 * Includes magnifying glass icon, clear button, and loading indicator.
 */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Search...',
      disabled = false,
      debounceMs = 300,
      isLoading = false,
      containerClassName,
      className,
      ...props
    },
    ref
  ) => {
    // Internal state for immediate input updates
    const [internalValue, setInternalValue] = useState(value);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync internal value when external value changes
    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Debounced onChange handler
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);

        // Clear existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Set new timer for debounced callback
        debounceTimerRef.current = setTimeout(() => {
          onChange(newValue);
        }, debounceMs);
      },
      [onChange, debounceMs]
    );

    // Clear handler
    const handleClear = useCallback(() => {
      setInternalValue('');
      onChange('');
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    }, [onChange]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    const showClearButton = internalValue.length > 0 && !disabled;

    return (
      <div className={cn('relative', containerClassName)}>
        {/* Magnifying glass icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>

        {/* Search input */}
        <input
          ref={ref}
          type="text"
          value={internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={props['aria-label'] || 'Search'}
          className={cn(
            // Base glassmorphic styling
            'w-full pl-10 pr-10 py-2.5 text-sm text-slate-700',
            'bg-white/60 backdrop-blur-[10px]',
            'border border-white/40 rounded-xl',
            'shadow-[inset_0_2px_4px_rgba(100,100,140,0.05)]',
            'transition-all duration-250',
            // Placeholder styling
            'placeholder:text-slate-400',
            // Focus state
            'focus:bg-white/75 focus:border-sky-200/60',
            'focus:shadow-[0_0_0_3px_rgba(180,210,240,0.25),inset_0_2px_4px_rgba(100,100,140,0.05)]',
            'focus:outline-none',
            // Disabled state
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />

        {/* Right side icons container */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {/* Loading spinner */}
          {isLoading && (
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500"
              role="status"
              aria-label="Searching"
            />
          )}

          {/* Clear button */}
          {showClearButton && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className={cn(
                'w-5 h-5 flex items-center justify-center',
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
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
