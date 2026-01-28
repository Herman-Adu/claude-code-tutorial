'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useKanban } from '../hooks/useKanban';
import { useLabels } from '../hooks/useLabels';
import { COLUMNS } from '@/constants';
import { Task, ColumnId } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCardOverlay } from './TaskCard';
import { TaskForm } from './TaskForm';
import { LabelFilter } from './LabelFilter';
import { LabelManager } from './LabelManager';
import { SearchFilterBar } from './SearchFilterBar';
import { FilterPanel } from './FilterPanel';
import { FilterChips } from './FilterChips';
import { SavedFiltersDropdown } from './SavedFiltersDropdown';
import { SaveFilterModal } from './SaveFilterModal';
import { Modal } from '@/components/ui/Modal';
import { useLabelsStore } from '@/store/labels';
import {
  useKanbanStore,
  useSearchQuery,
  useFilters,
  useHasActiveFilters,
  useActiveFilterCount,
  type StoreFilterOptions,
} from '@/store/kanban';
import { cn } from '@/lib/utils';

/**
 * Error Toast Component
 *
 * Displays dismissible error messages in a glassmorphic style.
 * Auto-dismisses after 5 seconds.
 */
interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - onDismiss intentionally excluded to prevent timer reset on re-renders

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 max-w-md animate-slide-up"
    >
      <div className="glass-lg bg-rose-50/90 border-rose-200/60 p-4 pr-12 shadow-[0_8px_32px_rgba(240,100,100,0.2)]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-[0_2px_8px_rgba(240,100,100,0.3)]">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-rose-800">Error</h3>
            <p className="text-sm text-rose-700 mt-0.5">{message}</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-200/50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Loading Spinner Component
 *
 * Shows during async operations (saving, deleting, moving tasks).
 */
function LoadingIndicator() {
  return (
    <div className="fixed bottom-6 left-6 z-50" role="status" aria-live="polite" aria-label="Loading">
      <div className="glass-sm px-4 py-3 flex items-center gap-3 shadow-[0_8px_24px_rgba(100,150,230,0.2)]">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-slate-600">Saving...</span>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  /** Whether to show the header. Defaults to true. */
  showHeader?: boolean;
}

export function KanbanBoard({ showHeader = true }: KanbanBoardProps) {
  const {
    tasks,
    isHydrated,
    isLoading,
    error,
    addTaskAsync,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
    clearError,
  } = useKanban();
  const { setTaskLabels } = useLabels();
  const taskLabelsMap = useLabelsStore((state) => state.taskLabels);
  const storeSetTaskLabels = useLabelsStore((state) => state.setTaskLabels);

  // Search and filter state from Zustand
  const searchQuery = useSearchQuery();
  const filters = useFilters();
  const hasActiveFilters = useHasActiveFilters();
  const activeFilterCount = useActiveFilterCount();
  const setSearchQuery = useKanbanStore((state) => state.setSearchQuery);
  const setFilters = useKanbanStore((state) => state.setFilters);
  const setFilter = useKanbanStore((state) => state.setFilter);
  const getFilteredTasks = useKanbanStore((state) => state.getFilteredTasks);

  // URL query params for shareable filters
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [labelFilterIds, setLabelFilterIds] = useState<string[]>([]);

  // Load filters from URL on mount
  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    const urlSearch = searchParams.get('search');
    const urlPriority = searchParams.get('priority');
    const urlColumn = searchParams.get('column');
    const urlCategories = searchParams.get('categories');
    const urlStart = searchParams.get('start');
    const urlEnd = searchParams.get('end');

    const filtersFromUrl: StoreFilterOptions = {};

    if (urlSearch) {
      setSearchQuery(urlSearch);
    }

    if (urlPriority && ['LOW', 'MEDIUM', 'HIGH'].includes(urlPriority.toUpperCase())) {
      filtersFromUrl.priority = urlPriority.toUpperCase() as StoreFilterOptions['priority'];
    }

    if (urlColumn && ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(urlColumn.toUpperCase())) {
      filtersFromUrl.columnId = urlColumn.toUpperCase() as StoreFilterOptions['columnId'];
    }

    if (urlCategories) {
      // Decode URL-encoded categories to handle special characters like commas, ampersands, etc.
      filtersFromUrl.categories = urlCategories
        .split(',')
        .filter(Boolean)
        .map((cat) => decodeURIComponent(cat));
    }

    if (urlStart && urlEnd) {
      filtersFromUrl.dateRange = { start: urlStart, end: urlEnd };
    }

    if (Object.keys(filtersFromUrl).length > 0) {
      setFilters(filtersFromUrl);
    }
  }, [searchParams, setSearchQuery, setFilters]);

  // Update URL when filters change (debounced)
  useEffect(() => {
    if (isInitialMount.current) return;

    // Clear existing timeout
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }

    // Debounce URL updates
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      if (filters.priority) {
        params.set('priority', filters.priority.toLowerCase());
      }

      if (filters.columnId) {
        params.set('column', filters.columnId.toLowerCase().replace('_', '-'));
      }

      if (filters.categories && filters.categories.length > 0) {
        // Encode each category to handle special characters (commas, ampersands, equals, percent, hash, spaces, unicode)
        const encodedCategories = filters.categories
          .map((cat) => encodeURIComponent(cat))
          .join(',');
        params.set('categories', encodedCategories);
      }

      if (filters.dateRange) {
        params.set('start', filters.dateRange.start);
        params.set('end', filters.dateRange.end);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // Update URL without causing navigation
      router.replace(newUrl, { scroll: false });
    }, 500);

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [searchQuery, filters, pathname, router]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = tasks.find((t) => t.id === active.id);
      if (task) {
        setActiveTask(task);
      }
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      // Don't do anything if dropped on itself
      if (taskId === overId) return;

      // Check if dropped over a column (empty area)
      if (COLUMNS.some((col) => col.id === overId)) {
        moveTask(taskId, overId as ColumnId);
        return;
      }

      // Dropped over another task - reorder
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        moveTask(taskId, overTask.columnId, overId);
      }
    },
    [moveTask, tasks]
  );

  const handleAddTask = useCallback(() => {
    setEditingTask(null);
    setIsModalOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteConfirmId) {
      deleteTask(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteTask]);

  const handleSubmitTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { labelIds?: string[] }) => {
      const { labelIds, ...taskDataWithoutLabels } = taskData;

      if (editingTask) {
        updateTask(editingTask.id, taskDataWithoutLabels);
        // Update labels if provided
        if (labelIds) {
          try {
            await setTaskLabels(editingTask.id, labelIds);
          } catch (error) {
            console.error('Failed to save labels:', error);
            // Error is already handled by setTaskLabels which sets store error
          }
        }
      } else {
        // For new tasks, wait for the task to be created then set labels
        const newTaskId = await addTaskAsync(taskDataWithoutLabels);

        // If task was created and labels were selected, persist them
        if (newTaskId && labelIds && labelIds.length > 0) {
          try {
            // Update store immediately for optimistic UI
            storeSetTaskLabels(newTaskId, labelIds);

            // Persist to database
            const success = await setTaskLabels(newTaskId, labelIds);
            if (!success) {
              // Rollback store if persistence failed
              storeSetTaskLabels(newTaskId, []);
              // Error message is already shown via setTaskLabels
            }
          } catch (error) {
            console.error('Failed to save labels for new task:', error);
            // Rollback store on error
            storeSetTaskLabels(newTaskId, []);
            // The error will be shown via the labels store error state
          }
        }
      }
      setIsModalOpen(false);
      setEditingTask(null);
    },
    [editingTask, addTaskAsync, updateTask, setTaskLabels, storeSetTaskLabels]
  );

  // Filter tasks by search, filters, and labels
  const getFilteredTasksByColumn = useCallback(
    (columnId: ColumnId) => {
      let columnTasks = getTasksByColumn(columnId);

      // Apply search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        columnTasks = columnTasks.filter(
          (task) =>
            task.title.toLowerCase().includes(query) ||
            task.description.toLowerCase().includes(query)
        );
      }

      // Apply priority filter
      if (filters.priority) {
        columnTasks = columnTasks.filter(
          (task) => task.priority.toLowerCase() === filters.priority!.toLowerCase()
        );
      }

      // Apply categories filter
      if (filters.categories && filters.categories.length > 0) {
        columnTasks = columnTasks.filter((task) => {
          const taskCategories = task.categories || [];
          return filters.categories!.every((cat) =>
            taskCategories.some((tc) => tc.toLowerCase() === cat.toLowerCase())
          );
        });
      }

      // Apply date range filter
      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        columnTasks = columnTasks.filter((task) => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= startDate && dueDate <= endDate;
        });
      }

      // Apply label filter (if any labels selected)
      if (labelFilterIds.length > 0) {
        columnTasks = columnTasks.filter((task) => {
          const taskLabelIds = taskLabelsMap.get(task.id) || [];
          return taskLabelIds.some((labelId) => labelFilterIds.includes(labelId));
        });
      }

      return columnTasks;
    },
    [getTasksByColumn, searchQuery, filters, labelFilterIds, taskLabelsMap]
  );

  // Count filtered tasks for column headers
  const getFilteredTaskCount = useMemo(() => {
    const counts: Record<string, number> = {};
    COLUMNS.forEach((column) => {
      counts[column.id] = getFilteredTasksByColumn(column.id).length;
    });
    return counts;
  }, [getFilteredTasksByColumn]);

  // Check if non-label filters are active (for label filter count display)
  const hasNonLabelFilters = useMemo(() => {
    return !!(
      searchQuery.trim() ||
      filters.priority ||
      (filters.categories && filters.categories.length > 0) ||
      filters.dateRange
    );
  }, [searchQuery, filters]);

  // Get task IDs filtered by non-label filters (for label filter count calculation)
  const filteredTaskIdsWithoutLabelFilter = useMemo(() => {
    if (!hasNonLabelFilters) {
      return undefined; // No need to calculate if no filters active
    }

    const allFilteredTaskIds: string[] = [];

    tasks.forEach((task) => {
      // Apply search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (
          !task.title.toLowerCase().includes(query) &&
          !task.description.toLowerCase().includes(query)
        ) {
          return; // Skip this task
        }
      }

      // Apply priority filter
      if (filters.priority) {
        if (task.priority.toLowerCase() !== filters.priority.toLowerCase()) {
          return;
        }
      }

      // Apply categories filter
      if (filters.categories && filters.categories.length > 0) {
        const taskCategories = task.categories || [];
        const hasAllCategories = filters.categories.every((cat) =>
          taskCategories.some((tc) => tc.toLowerCase() === cat.toLowerCase())
        );
        if (!hasAllCategories) {
          return;
        }
      }

      // Apply date range filter
      if (filters.dateRange) {
        if (!task.dueDate) {
          return;
        }
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        const dueDate = new Date(task.dueDate);
        if (dueDate < startDate || dueDate > endDate) {
          return;
        }
      }

      // Task passed all filters (except label filter)
      allFilteredTaskIds.push(task.id);
    });

    return allFilteredTaskIds;
  }, [tasks, searchQuery, filters, hasNonLabelFilters]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4 p-8 glass-lg">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-sky-400" aria-hidden="true" />
          <p className="text-slate-600 font-medium tracking-wide">Loading Board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Loading indicator for async operations */}
      {isLoading && <LoadingIndicator />}

      {/* Error toast for displaying errors */}
      {error && <ErrorToast message={error} onDismiss={clearError} />}

      <div className={`mx-auto max-w-7xl px-4 ${showHeader ? 'py-6 md:py-10' : 'py-0'} md:px-8`}>
        {showHeader && (
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
              {/* Search bar row */}
              <div className="flex items-center gap-3">
                {/* Search bar - takes most space */}
                <div className="flex-1 max-w-md">
                  <SearchFilterBar placeholder="Search tasks by title or description..." />
                </div>

                {/* Filter button with popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
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
                    {/* Active filter badge */}
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
                  <FilterPanel
                    isOpen={showFilterPanel}
                    onClose={() => setShowFilterPanel(false)}
                  />
                </div>

                {/* Saved filters dropdown */}
                <SavedFiltersDropdown />

                {/* Divider */}
                <div className="w-px h-6 bg-slate-200" aria-hidden="true" />

                {/* Label filter */}
                <LabelFilter
                  selectedLabelIds={labelFilterIds}
                  onFilter={setLabelFilterIds}
                  filteredTaskIds={filteredTaskIdsWithoutLabelFilter}
                  hasOtherFilters={hasNonLabelFilters}
                />

                {/* Manage labels button */}
                <button
                  type="button"
                  onClick={() => setShowLabelManager(true)}
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Manage Labels</span>
                </button>
              </div>

              {/* Active filter chips */}
              {hasActiveFilters && (
                <div className="flex items-center gap-3">
                  <FilterChips maxChips={5} />
                  {/* Save current filters button */}
                  <button
                    type="button"
                    onClick={() => setShowSaveFilterModal(true)}
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
        )}

        <main aria-label="Kanban board columns">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="bento-grid grid-cols-1 md:grid-cols-3 pb-4">
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={getFilteredTasksByColumn(column.id)}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <TaskForm
          initialData={editingTask || undefined}
          onSubmit={handleSubmitTask}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Task"
      >
        <p className="mb-6 text-slate-600" id="delete-description">
          Are you sure you want to delete this task? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3" role="group" aria-label="Confirmation actions">
          <button
            onClick={() => setDeleteConfirmId(null)}
            className="glass-btn px-5 py-2.5 font-medium text-sm text-slate-700"
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-5 py-2.5 font-medium text-sm text-white rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-[0_4px_16px_rgba(240,150,150,0.3)] hover:shadow-[0_8px_24px_rgba(240,150,150,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
            aria-label="Confirm deletion"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* Label Manager Modal */}
      <LabelManager
        isOpen={showLabelManager}
        onClose={() => setShowLabelManager(false)}
      />

      {/* Save Filter Preset Modal */}
      <SaveFilterModal
        isOpen={showSaveFilterModal}
        onClose={() => setShowSaveFilterModal(false)}
      />
    </div>
  );
}
