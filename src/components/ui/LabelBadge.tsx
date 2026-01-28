'use client';

import { cn } from '@/lib/utils';

/**
 * Color mapping for preset label colors.
 * Maps preset names to Tailwind classes for background and text.
 */
const LABEL_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  red: {
    bg: 'bg-red-400/50',
    text: 'text-red-800',
    border: 'border-red-300/60',
  },
  blue: {
    bg: 'bg-blue-400/50',
    text: 'text-blue-800',
    border: 'border-blue-300/60',
  },
  green: {
    bg: 'bg-green-400/50',
    text: 'text-green-800',
    border: 'border-green-300/60',
  },
  yellow: {
    bg: 'bg-yellow-400/50',
    text: 'text-yellow-800',
    border: 'border-yellow-300/60',
  },
  purple: {
    bg: 'bg-purple-400/50',
    text: 'text-purple-800',
    border: 'border-purple-300/60',
  },
  orange: {
    bg: 'bg-orange-400/50',
    text: 'text-orange-800',
    border: 'border-orange-300/60',
  },
  pink: {
    bg: 'bg-pink-400/50',
    text: 'text-pink-800',
    border: 'border-pink-300/60',
  },
  cyan: {
    bg: 'bg-cyan-400/50',
    text: 'text-cyan-800',
    border: 'border-cyan-300/60',
  },
};

/**
 * Label data structure.
 */
export interface LabelData {
  id: string;
  name: string;
  color: string;
}

interface LabelBadgeProps {
  /** The label to display */
  label: LabelData;
  /** Callback when remove button is clicked */
  onRemove?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Gets CSS classes for a label color.
 * Supports preset color names and hex codes.
 */
function getLabelColorClasses(color: string): { bg: string; text: string; border: string } {
  // Check if it's a preset color
  const preset = LABEL_COLOR_MAP[color.toLowerCase()];
  if (preset) {
    return preset;
  }

  // For hex colors, we can't generate Tailwind classes dynamically,
  // so we use inline styles (handled in the component)
  return {
    bg: '',
    text: 'text-white',
    border: 'border-white/30',
  };
}

/**
 * Determines if a color should use dark text based on brightness.
 * For hex colors, calculates luminance to decide text color.
 */
function shouldUseDarkText(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance (ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use dark text for light backgrounds
  return luminance > 0.5;
}

/**
 * LabelBadge Component
 *
 * Displays a color-coded label badge with optional remove button.
 * Supports preset colors (red, blue, green, etc.) and custom hex colors.
 * Uses glassmorphic design consistent with the application.
 */
export function LabelBadge({
  label,
  onRemove,
  size = 'md',
  className,
}: LabelBadgeProps) {
  const colorClasses = getLabelColorClasses(label.color);
  const isHexColor = label.color.startsWith('#');

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const buttonSizeClasses = {
    sm: 'w-3.5 h-3.5 -mr-0.5',
    md: 'w-4 h-4 -mr-1',
  };

  // Determine text color for hex backgrounds
  const hexTextColor = isHexColor && shouldUseDarkText(label.color)
    ? 'text-slate-800'
    : 'text-white';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full backdrop-blur-sm border transition-all',
        sizeClasses[size],
        colorClasses.bg,
        isHexColor ? hexTextColor : colorClasses.text,
        colorClasses.border,
        className
      )}
      style={isHexColor ? { backgroundColor: `${label.color}80` } : undefined}
    >
      {/* Color indicator dot */}
      <span
        className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          !isHexColor && 'bg-current opacity-60'
        )}
        style={isHexColor ? { backgroundColor: label.color } : undefined}
        aria-hidden="true"
      />

      {/* Label name */}
      <span className="truncate max-w-[120px]">{label.name}</span>

      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            'flex items-center justify-center rounded-full hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-current transition-colors',
            buttonSizeClasses[size]
          )}
          aria-label={`Remove label: ${label.name}`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

/**
 * Export color utilities for use in other components.
 */
export { LABEL_COLOR_MAP, getLabelColorClasses, shouldUseDarkText };
