'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { LABEL_COLOR_PRESETS } from '@/lib/schemas';

/**
 * Color configuration for preset colors.
 * Maps preset names to their display values.
 */
const COLOR_CONFIG: Record<string, { hex: string; name: string }> = {
  red: { hex: '#ef4444', name: 'Red' },
  blue: { hex: '#3b82f6', name: 'Blue' },
  green: { hex: '#22c55e', name: 'Green' },
  yellow: { hex: '#eab308', name: 'Yellow' },
  purple: { hex: '#a855f7', name: 'Purple' },
  orange: { hex: '#f97316', name: 'Orange' },
  pink: { hex: '#ec4899', name: 'Pink' },
  cyan: { hex: '#06b6d4', name: 'Cyan' },
};

interface ColorPickerProps {
  /** Current selected color (preset name or hex) */
  value: string;
  /** Callback when color changes */
  onChange: (color: string) => void;
  /** Whether to show custom hex input */
  showCustomInput?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * ColorPicker Component
 *
 * A color selection component with preset colors and optional custom hex input.
 * Uses a grid layout with glassmorphic checkmark overlay for selection.
 */
export function ColorPicker({
  value,
  onChange,
  showCustomInput = false,
  className,
  disabled = false,
}: ColorPickerProps) {
  const [customHex, setCustomHex] = useState(
    value.startsWith('#') ? value : ''
  );
  const [isCustomMode, setIsCustomMode] = useState(value.startsWith('#'));

  const handlePresetClick = useCallback(
    (color: string) => {
      if (disabled) return;
      setIsCustomMode(false);
      onChange(color);
    },
    [disabled, onChange]
  );

  const handleCustomChange = useCallback(
    (hex: string) => {
      setCustomHex(hex);
      // Validate hex format
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        setIsCustomMode(true);
        onChange(hex);
      }
    },
    [onChange]
  );

  const isSelected = (color: string) => {
    if (isCustomMode) return false;
    return value === color;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preset colors grid */}
      <div
        className="grid grid-cols-4 gap-2"
        role="radiogroup"
        aria-label="Select label color"
      >
        {LABEL_COLOR_PRESETS.map((color) => {
          const config = COLOR_CONFIG[color];
          const selected = isSelected(color);

          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={config.name}
              disabled={disabled}
              onClick={() => handlePresetClick(color)}
              className={cn(
                'relative w-10 h-10 rounded-lg transition-all duration-200',
                'border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400',
                selected
                  ? 'border-slate-600 scale-110 shadow-lg'
                  : 'border-transparent hover:scale-105 hover:shadow-md',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{ backgroundColor: config.hex }}
            >
              {/* Selection checkmark */}
              {selected && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                    <svg
                      className="w-3 h-3 text-slate-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom hex input */}
      {showCustomInput && (
        <div className="flex items-center gap-2">
          <label htmlFor="custom-color" className="text-sm text-slate-600 whitespace-nowrap">
            Custom:
          </label>
          <div className="relative flex-1">
            <input
              type="text"
              id="custom-color"
              value={customHex}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="#RRGGBB"
              disabled={disabled}
              maxLength={7}
              className={cn(
                'glass-input w-full px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 font-mono',
                isCustomMode && /^#[0-9a-fA-F]{6}$/.test(customHex) && 'border-sky-400',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-describedby="custom-color-hint"
            />
            {/* Color preview */}
            {isCustomMode && /^#[0-9a-fA-F]{6}$/.test(customHex) && (
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-slate-300"
                style={{ backgroundColor: customHex }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Gets the display hex color for a color value (preset or hex).
 */
export function getColorHex(color: string): string {
  if (color.startsWith('#')) {
    return color;
  }
  return COLOR_CONFIG[color]?.hex ?? '#94a3b8'; // Default to slate if not found
}

/**
 * Gets the display name for a color value (preset or hex).
 */
export function getColorName(color: string): string {
  if (color.startsWith('#')) {
    return color;
  }
  return COLOR_CONFIG[color]?.name ?? color;
}

export { COLOR_CONFIG };
