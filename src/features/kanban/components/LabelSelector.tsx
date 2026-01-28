'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LabelBadge } from '@/components/ui/LabelBadge';
import { LabelManager } from './LabelManager';
import { useLabels } from '../hooks/useLabels';
import { VALIDATION } from '@/lib/schemas';

interface LabelSelectorProps {
  /** Currently selected label IDs */
  selectedLabelIds: string[];
  /** Callback when selection changes */
  onLabelChange: (labelIds: string[]) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * LabelSelector Component
 *
 * A dropdown component for selecting multiple labels for a task.
 * Features:
 * - Multi-select with checkboxes
 * - Shows label name with color indicator
 * - "+ Create New" option to open LabelManager
 * - Displays selected labels as badges
 */
export function LabelSelector({
  selectedLabelIds,
  onLabelChange,
  disabled = false,
  className,
}: LabelSelectorProps) {
  const { labels, isHydrated } = useLabels();
  const [isOpen, setIsOpen] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Toggle label selection
  const handleToggleLabel = useCallback(
    (labelId: string) => {
      if (disabled) return;

      const isSelected = selectedLabelIds.includes(labelId);
      const newSelection = isSelected
        ? selectedLabelIds.filter((id) => id !== labelId)
        : [...selectedLabelIds, labelId];

      onLabelChange(newSelection);
    },
    [selectedLabelIds, onLabelChange, disabled]
  );

  // Remove a specific label
  const handleRemoveLabel = useCallback(
    (labelId: string) => {
      if (disabled) return;
      onLabelChange(selectedLabelIds.filter((id) => id !== labelId));
    },
    [selectedLabelIds, onLabelChange, disabled]
  );

  // Get selected labels for display
  const selectedLabels = labels.filter((l) => selectedLabelIds.includes(l.id));

  // Check if max labels limit reached
  const isMaxLabelsReached = selectedLabelIds.length >= VALIDATION.MAX_LABELS_PER_TASK;

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, labelId?: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (labelId) {
          handleToggleLabel(labelId);
        } else {
          setIsOpen(!isOpen);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [handleToggleLabel, isOpen]
  );

  if (!isHydrated) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-10 bg-slate-200/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => handleKeyDown(e)}
        disabled={disabled}
        className={cn(
          'glass-input w-full px-4 py-3 text-left flex items-center justify-between',
          'text-slate-700 cursor-pointer transition-all',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-2 ring-sky-400'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select labels"
      >
        <span className="text-slate-400">
          {selectedLabels.length === 0
            ? 'Select labels...'
            : `${selectedLabels.length} label${selectedLabels.length !== 1 ? 's' : ''} selected`}
        </span>
        <svg
          className={cn(
            'w-5 h-5 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Selected labels display */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedLabels.map((label) => (
            <LabelBadge
              key={label.id}
              label={label}
              size="sm"
              onRemove={disabled ? undefined : () => handleRemoveLabel(label.id)}
            />
          ))}
        </div>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-full glass-lg shadow-xl max-h-60 overflow-auto"
          role="listbox"
          aria-multiselectable="true"
        >
          {labels.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              No labels available
            </div>
          ) : (
            <div className="py-1">
              {/* Max labels warning */}
              {isMaxLabelsReached && (
                <div className="px-4 py-2 text-xs text-amber-600 bg-amber-50/80 border-b border-amber-100">
                  Maximum {VALIDATION.MAX_LABELS_PER_TASK} labels reached
                </div>
              )}
              {labels.map((label) => {
                const isSelected = selectedLabelIds.includes(label.id);
                // Disable unselected labels when max is reached
                const isLabelDisabled = !isSelected && isMaxLabelsReached;

                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => !isLabelDisabled && handleToggleLabel(label.id)}
                    onKeyDown={(e) => !isLabelDisabled && handleKeyDown(e, label.id)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isLabelDisabled}
                    disabled={isLabelDisabled}
                    className={cn(
                      'w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors',
                      'hover:bg-slate-100/50 focus:bg-slate-100/50 focus:outline-none',
                      isSelected && 'bg-sky-50/50',
                      isLabelDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    {/* Checkbox */}
                    <span
                      className={cn(
                        'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-sky-500 border-sky-500'
                          : isLabelDisabled
                          ? 'bg-slate-100 border-slate-200'
                          : 'bg-white border-slate-300'
                      )}
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>

                    {/* Label badge */}
                    <LabelBadge label={label} size="sm" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Create new label option */}
          <div className="border-t border-slate-200/60 p-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowManager(true);
              }}
              className="w-full px-3 py-2 flex items-center gap-2 text-sm text-sky-600 font-medium rounded-lg hover:bg-sky-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Label
            </button>
          </div>
        </div>
      )}

      {/* Label manager modal */}
      <LabelManager
        isOpen={showManager}
        onClose={() => setShowManager(false)}
      />
    </div>
  );
}
