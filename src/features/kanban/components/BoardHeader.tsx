'use client';

import { LabelFilter } from './LabelFilter';
import { SearchFilterBar } from './SearchFilterBar';
import { FilterPanel } from './FilterPanel';
import { FilterChips } from './FilterChips';
import { SavedFiltersDropdown } from './SavedFiltersDropdown';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

// ============================================================================
// Board Header Component
// ============================================================================

export interface BoardHeaderProps {
  showFilterPanel: boolean;
  onToggleFilterPanel: () => void;
  onCloseFilterPanel: () => void;
  activeFilterCount: number;
  labelFilterIds: string[];
  onLabelFilter: (ids: string[]) => void;
  filteredTaskIds: string[] | undefined;
  hasOtherFilters: boolean;
  onOpenLabelManager: () => void;
  hasActiveFilters: boolean;
  onOpenSaveFilterModal: () => void;
}

/**
 * Board Header Component
 *
 * Renders the header with title, search bar, and filter controls.
 */
export function BoardHeader({
  showFilterPanel,
  onToggleFilterPanel,
  onCloseFilterPanel,
  activeFilterCount,
  labelFilterIds,
  onLabelFilter,
  filteredTaskIds,
  hasOtherFilters,
  onOpenLabelManager,
  hasActiveFilters,
  onOpenSaveFilterModal,
}: BoardHeaderProps) {
  return (
    <header className="mb-8 md:mb-10">
      <div className="text-center mb-4">
        <div className="inline-block glass-lg px-8 py-4 mb-4">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-clip-text text-transparent">
            Kanban Board
          </h1>
        </div>
        <p className="text-slate-500 font-medium tracking-wide" aria-live="polite">
          Organize your tasks with drag and drop
        </p>
      </div>

      {/* Search and Filter Toolbar */}
      <div className="space-y-3 mt-6">
        <FilterToolbar
          showFilterPanel={showFilterPanel}
          onToggleFilterPanel={onToggleFilterPanel}
          onCloseFilterPanel={onCloseFilterPanel}
          activeFilterCount={activeFilterCount}
          labelFilterIds={labelFilterIds}
          onLabelFilter={onLabelFilter}
          filteredTaskIds={filteredTaskIds}
          hasOtherFilters={hasOtherFilters}
          onOpenLabelManager={onOpenLabelManager}
        />

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3">
            <FilterChips maxChips={5} />
            <button
              type="button"
              onClick={onOpenSaveFilterModal}
              className={cn(
                'text-xs font-medium text-sky-600 hover:text-sky-700',
                'underline underline-offset-2',
                'transition-colors duration-200'
              )}
            >
              Save filters
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================================================
// Filter Toolbar Component
// ============================================================================

interface FilterToolbarProps {
  showFilterPanel: boolean;
  onToggleFilterPanel: () => void;
  onCloseFilterPanel: () => void;
  activeFilterCount: number;
  labelFilterIds: string[];
  onLabelFilter: (ids: string[]) => void;
  filteredTaskIds: string[] | undefined;
  hasOtherFilters: boolean;
  onOpenLabelManager: () => void;
}

/**
 * Filter Toolbar Component
 *
 * Renders search bar and filter controls in a horizontal layout.
 */
function FilterToolbar({
  showFilterPanel,
  onToggleFilterPanel,
  onCloseFilterPanel,
  activeFilterCount,
  labelFilterIds,
  onLabelFilter,
  filteredTaskIds,
  hasOtherFilters,
  onOpenLabelManager,
}: FilterToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Search bar */}
      <div className="flex-1 max-w-md">
        <SearchFilterBar placeholder="Search tasks by title or description..." />
      </div>

      {/* Filter button with popover */}
      <div className="relative">
        <button
          type="button"
          onClick={onToggleFilterPanel}
          className={cn(
            'flex items-center justify-center w-9 h-9',
            'text-slate-500 hover:text-slate-700',
            'bg-white/60 backdrop-blur-sm hover:bg-white/80',
            'border border-white/40 rounded-xl',
            'shadow-[0_2px_8px_rgba(100,100,140,0.08)]',
            'hover:shadow-[0_4px_12px_rgba(100,100,140,0.12)]',
            'transition-all duration-200',
            showFilterPanel && 'bg-white/80 shadow-[0_4px_12px_rgba(100,100,140,0.12)]'
          )}
          aria-label={`Filter tasks${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
          aria-expanded={showFilterPanel}
          aria-haspopup="dialog"
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {activeFilterCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 w-4 h-4',
                'flex items-center justify-center',
                'text-[10px] font-bold text-white',
                'bg-gradient-to-br from-sky-400 to-indigo-500',
                'rounded-full shadow-[0_2px_8px_rgba(100,150,230,0.4)]'
              )}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
        <FilterPanel isOpen={showFilterPanel} onClose={onCloseFilterPanel} />
      </div>

      {/* Saved filters dropdown */}
      <SavedFiltersDropdown />

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200" aria-hidden="true" />

      {/* Label filter */}
      <LabelFilter
        selectedLabelIds={labelFilterIds}
        onFilter={onLabelFilter}
        filteredTaskIds={filteredTaskIds}
        hasOtherFilters={hasOtherFilters}
      />

      {/* Manage labels button */}
      <button
        type="button"
        onClick={onOpenLabelManager}
        className="glass-btn px-3 py-2 flex items-center gap-2 text-sm font-medium text-slate-600"
        aria-label="Manage labels"
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden sm:inline">Manage Labels</span>
      </button>
    </div>
  );
}

// ============================================================================
// Delete Confirmation Modal
// ============================================================================

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Delete Confirmation Modal
 *
 * Confirms task deletion with cancel/confirm actions.
 */
export function DeleteConfirmModal({ isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Task">
      <p className="mb-6 text-slate-600" id="delete-description">
        Are you sure you want to delete this task? This cannot be undone.
      </p>
      <div className="flex justify-end gap-3" role="group" aria-label="Confirmation actions">
        <button
          onClick={onClose}
          className="glass-btn px-5 py-2.5 font-medium text-sm text-slate-700"
          aria-label="Cancel deletion"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2.5 font-medium text-sm text-white rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-[0_4px_16px_rgba(240,150,150,0.3)] hover:shadow-[0_8px_24px_rgba(240,150,150,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
          aria-label="Confirm deletion"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}
