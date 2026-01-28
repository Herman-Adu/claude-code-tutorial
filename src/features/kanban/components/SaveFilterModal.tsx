'use client';

/**
 * SaveFilterModal Component
 *
 * Modal dialog for saving the current filter configuration as a named preset.
 * Provides form validation and feedback for the save operation.
 */

import { useCallback, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  useKanbanStore,
  useSavedFilterPresets,
  useFilters,
  useSearchQuery,
  type StoreSavedFilterPreset,
} from '@/store/kanban';
import { saveFilterPreset } from '@/app/actions/tasks';
import { cn } from '@/lib/utils';

interface SaveFilterModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
}

/**
 * SaveFilterModal component for saving filter configurations.
 */
export function SaveFilterModal({ isOpen, onClose }: SaveFilterModalProps) {
  const [presetName, setPresetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentFilters = useFilters();
  const searchQuery = useSearchQuery();
  const savedPresets = useSavedFilterPresets();
  const setSavedFilterPresets = useKanbanStore((state) => state.setSavedFilterPresets);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = presetName.trim();

      if (!trimmedName) {
        setError('Please enter a name for the preset');
        return;
      }

      if (trimmedName.length > 50) {
        setError('Name must be 50 characters or less');
        return;
      }

      // Check for duplicate names
      if (savedPresets.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        setError('A preset with this name already exists');
        return;
      }

      setIsLoading(true);
      setError(null);

      // Combine search query with filters, converting string dates to Date objects
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
        searchQuery: searchQuery || undefined,
        // Convert string dates to Date objects if present
        dateRange: currentFilters.dateRange
          ? {
              start: new Date(currentFilters.dateRange.start),
              end: new Date(currentFilters.dateRange.end),
            }
          : undefined,
      };

      try {
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
          onClose();
        } else {
          setError(result.error || 'Failed to save preset');
        }
      } catch (err) {
        console.error('Failed to save preset:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    },
    [presetName, currentFilters, searchQuery, savedPresets, setSavedFilterPresets, onClose]
  );

  const handleClose = useCallback(() => {
    setPresetName('');
    setError(null);
    onClose();
  }, [onClose]);

  // Build summary of current filters for display
  const filterSummary = [];
  if (searchQuery) filterSummary.push(`Search: "${searchQuery}"`);
  if (currentFilters.priority) filterSummary.push(`Priority: ${currentFilters.priority}`);
  if (currentFilters.columnId) filterSummary.push(`Status: ${currentFilters.columnId}`);
  if (currentFilters.categories?.length) {
    filterSummary.push(`Categories: ${currentFilters.categories.join(', ')}`);
  }
  if (currentFilters.dateRange) {
    filterSummary.push(`Date Range: ${currentFilters.dateRange.start} to ${currentFilters.dateRange.end}`);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Save Filter Preset">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preset name input */}
        <div className="space-y-1.5">
          <label
            htmlFor="preset-name"
            className="block text-sm font-medium text-slate-700"
          >
            Preset Name
          </label>
          <input
            id="preset-name"
            type="text"
            value={presetName}
            onChange={(e) => {
              setPresetName(e.target.value);
              setError(null);
            }}
            placeholder="Enter a name for this filter preset..."
            maxLength={50}
            autoFocus
            className={cn(
              'w-full px-4 py-3 text-slate-700',
              'bg-white/60 backdrop-blur-[10px]',
              'border border-white/40 rounded-xl',
              'shadow-[inset_0_2px_4px_rgba(100,100,140,0.05)]',
              'transition-all duration-250',
              'placeholder:text-slate-400',
              'focus:bg-white/75 focus:border-sky-200/60',
              'focus:shadow-[0_0_0_3px_rgba(180,210,240,0.25),inset_0_2px_4px_rgba(100,100,140,0.05)]',
              'focus:outline-none',
              error ? 'border-rose-300 focus:border-rose-300' : ''
            )}
          />
          {error && (
            <p className="text-xs text-rose-500" role="alert">
              {error}
            </p>
          )}
          <p className="text-xs text-slate-500">
            {presetName.length}/50 characters
          </p>
        </div>

        {/* Current filters summary */}
        {filterSummary.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Filters to Save
            </label>
            <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-200/50">
              <ul className="space-y-1">
                {filterSummary.map((item, index) => (
                  <li key={index} className="text-sm text-slate-600">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* No filters warning */}
        {filterSummary.length === 0 && (
          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/50">
            <p className="text-sm text-amber-700">
              No active filters to save. Apply some filters first.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !presetName.trim() || filterSummary.length === 0}
          >
            {isLoading ? 'Saving...' : 'Save Preset'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
