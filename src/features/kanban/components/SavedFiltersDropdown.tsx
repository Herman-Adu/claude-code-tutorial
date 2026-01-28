'use client';

/**
 * SavedFiltersDropdown Component
 *
 * Dropdown menu for managing saved filter presets.
 * Allows loading, creating, and deleting filter presets.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useKanbanStore,
  useSavedFilterPresets,
  useFilters,
  useHasActiveFilters,
  type StoreSavedFilterPreset,
} from '@/store/kanban';
import { getSavedFilterPresets, saveFilterPreset, deleteFilterPreset } from '@/app/actions/tasks';
import { cn } from '@/lib/utils';

interface SavedFiltersDropdownProps {
  /** Custom class name for the container */
  className?: string;
}

/**
 * SavedFiltersDropdown component for managing filter presets.
 */
export function SavedFiltersDropdown({ className }: SavedFiltersDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const savedPresets = useSavedFilterPresets();
  const currentFilters = useFilters();
  const hasActiveFilters = useHasActiveFilters();
  const setSavedFilterPresets = useKanbanStore((state) => state.setSavedFilterPresets);
  const loadSavedPreset = useKanbanStore((state) => state.loadSavedPreset);

  // Fetch presets function (reusable for retry)
  const fetchPresets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getSavedFilterPresets();
      if (result.success && result.data) {
        const presets: StoreSavedFilterPreset[] = result.data.map((preset) => ({
          id: preset.id,
          name: preset.name,
          filters: preset.filters as StoreSavedFilterPreset['filters'],
          createdAt: preset.createdAt.toISOString(),
        }));
        setSavedFilterPresets(presets);
        setError(null);
      } else {
        // Show error to user when fetch fails
        setError(result.error || 'Failed to load saved filters');
        setSavedFilterPresets([]);
      }
    } catch (err) {
      console.error('Failed to fetch filter presets:', err);
      setError('Failed to load saved filters. Please try again.');
      setSavedFilterPresets([]);
    } finally {
      setIsLoading(false);
    }
  }, [setSavedFilterPresets]);

  // Fetch saved presets on mount
  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setShowSaveForm(false);
        setError(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSaveForm(false);
        setError(null);
      }
    };

    if (isOpen) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setShowSaveForm(false);
    setError(null);
  }, []);

  const handleLoadPreset = useCallback(
    (preset: StoreSavedFilterPreset) => {
      loadSavedPreset(preset);
      setIsOpen(false);
    },
    [loadSavedPreset]
  );

  const handleDeletePreset = useCallback(
    async (presetId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const result = await deleteFilterPreset(presetId);
        if (result.success) {
          setSavedFilterPresets(savedPresets.filter((p) => p.id !== presetId));
        } else {
          setError(result.error || 'Failed to delete preset');
        }
      } catch (err) {
        console.error('Failed to delete preset:', err);
        setError('Failed to delete preset');
      }
    },
    [savedPresets, setSavedFilterPresets]
  );

  const handleSavePreset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = presetName.trim();

      if (!trimmedName) {
        setError('Please enter a name for the preset');
        return;
      }

      if (!hasActiveFilters) {
        setError('No active filters to save');
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        // Convert string dates to Date objects if present
        const filtersToSave: {
          searchQuery?: string;
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
          columnId?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | null;
          categories?: string[];
          dateRange?: { start: Date; end: Date };
          limit?: number;
          offset?: number;
        } = {
          ...currentFilters,
          dateRange: currentFilters.dateRange
            ? {
                start: new Date(currentFilters.dateRange.start),
                end: new Date(currentFilters.dateRange.end),
              }
            : undefined,
        };

        const result = await saveFilterPreset({
          name: trimmedName,
          filters: filtersToSave,
        });

        if (result.success && result.data) {
          const newPreset: StoreSavedFilterPreset = {
            id: result.data.id,
            name: result.data.name,
            filters: result.data.filters as StoreSavedFilterPreset['filters'],
            createdAt: result.data.createdAt.toISOString(),
          };
          setSavedFilterPresets([newPreset, ...savedPresets]);
          setPresetName('');
          setShowSaveForm(false);
        } else {
          setError(result.error || 'Failed to save preset');
        }
      } catch (err) {
        console.error('Failed to save preset:', err);
        setError('Failed to save preset');
      } finally {
        setIsSaving(false);
      }
    },
    [presetName, hasActiveFilters, currentFilters, savedPresets, setSavedFilterPresets]
  );

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Saved filter presets"
        className={cn(
          'flex items-center justify-center w-9 h-9',
          'text-slate-500 hover:text-slate-700',
          'bg-white/60 backdrop-blur-sm hover:bg-white/80',
          'border border-white/40 rounded-xl',
          'shadow-[0_2px_8px_rgba(100,100,140,0.08)]',
          'hover:shadow-[0_4px_12px_rgba(100,100,140,0.12)]',
          'transition-all duration-200',
          isOpen && 'bg-white/80 shadow-[0_4px_12px_rgba(100,100,140,0.12)]'
        )}
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
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute top-full right-0 mt-2 z-50',
            'w-64 py-2',
            'bg-white/90 backdrop-blur-xl',
            'border border-white/40 rounded-xl',
            'shadow-[0_8px_32px_rgba(100,100,140,0.15),0_2px_8px_rgba(100,100,140,0.1)]'
          )}
        >
          {/* Header */}
          <div className="px-3 pb-2 mb-2 border-b border-slate-200/50">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saved Filters
            </h3>
          </div>

          {/* Error message with retry option */}
          {error && (
            <div className="px-3 py-2 mx-2 mb-2 text-xs bg-rose-50 rounded-lg">
              <p className="text-rose-600">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  fetchPresets();
                }}
                className={cn(
                  'mt-1 text-xs font-medium text-rose-600 hover:text-rose-700',
                  'underline underline-offset-2',
                  'transition-colors duration-200'
                )}
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="px-3 py-4 text-center text-sm text-slate-500">
              Loading presets...
            </div>
          )}

          {/* Save form */}
          {showSaveForm ? (
            <form onSubmit={handleSavePreset} className="px-3 py-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter preset name..."
                maxLength={50}
                autoFocus
                className={cn(
                  'w-full px-3 py-2 text-sm',
                  'bg-white/60 border border-slate-200/50 rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-sky-400/30',
                  'placeholder:text-slate-400'
                )}
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveForm(false);
                    setPresetName('');
                    setError(null);
                  }}
                  className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !presetName.trim()}
                  className={cn(
                    'px-3 py-1 text-xs font-medium text-white',
                    'bg-sky-500 hover:bg-sky-600 rounded-md',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors duration-200'
                  )}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Preset list */}
              {!isLoading && savedPresets.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-slate-500">
                  No saved presets yet
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {savedPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleLoadPreset(preset)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2',
                        'text-sm text-slate-700 hover:bg-slate-100/50',
                        'transition-colors duration-200'
                      )}
                    >
                      <span className="truncate">{preset.name}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeletePreset(preset.id, e)}
                        aria-label={`Delete ${preset.name} preset`}
                        className={cn(
                          'ml-2 p-1 text-slate-400 hover:text-rose-500',
                          'rounded hover:bg-rose-50',
                          'transition-colors duration-200'
                        )}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </button>
                  ))}
                </div>
              )}

              {/* Save current filters button */}
              {hasActiveFilters && (
                <div className="pt-2 mt-2 border-t border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setShowSaveForm(true)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2',
                      'text-sm font-medium text-sky-600 hover:text-sky-700',
                      'hover:bg-sky-50/50',
                      'transition-colors duration-200'
                    )}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Save Current Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
