'use client';

import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { useKanban } from '../hooks/useKanban';
import { useFilterUrlSync } from '../hooks/useFilterUrlSync';
import { useTaskFiltering } from '../hooks/useTaskFiltering';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useModalState } from '../hooks/useModalState';
import { useTaskHandlers, type TaskFormData } from '../hooks/useTaskHandlers';
import { COLUMNS } from '@/constants';
import { KanbanColumn } from './KanbanColumn';
import { TaskCardOverlay } from './TaskCard';
import { TaskForm } from './TaskForm';
import { LabelManager } from './LabelManager';
import { SaveFilterModal } from './SaveFilterModal';
import { Modal } from '@/components/ui/Modal';
import { ErrorToast, LoadingIndicator, BoardLoadingSkeleton } from './FeedbackComponents';
import { BoardHeader, DeleteConfirmModal } from './BoardHeader';

interface KanbanBoardProps {
  /** Whether to show the header. Defaults to true. */
  showHeader?: boolean;
}

/**
 * KanbanBoard Component
 *
 * Main orchestrator component for the Kanban board feature.
 * Composes multiple hooks and child components to provide:
 * - Drag-and-drop task management
 * - Search and filter functionality
 * - Task CRUD operations
 * - Label management
 *
 * This component was refactored from 769 lines to under 200 lines
 * by extracting logic into reusable hooks and components.
 */
export function KanbanBoard({ showHeader = true }: KanbanBoardProps) {
  // Core kanban state and operations
  const {
    tasks,
    isHydrated,
    isLoading,
    error,
    moveTask,
    getTasksByColumn,
    clearError,
  } = useKanban();

  // URL-synced filter state
  useFilterUrlSync();

  // Label filter state (kept local as it's UI-only, not persisted to URL)
  const [labelFilterIds, setLabelFilterIds] = useState<string[]>([]);

  // Modal/dialog state management
  const modalState = useModalState();

  // Task filtering with all active filters
  const {
    getFilteredTasksByColumn,
    hasNonLabelFilters,
    filteredTaskIdsWithoutLabelFilter,
    hasActiveFilters,
    activeFilterCount,
  } = useTaskFiltering(tasks, getTasksByColumn, labelFilterIds, COLUMNS);

  // Drag-and-drop configuration and handlers
  const { sensors, activeTask, handleDragStart, handleDragEnd } = useDragAndDrop(
    tasks,
    moveTask
  );

  // Task CRUD handlers
  const { handleSubmitTask, confirmDelete } = useTaskHandlers(modalState.closeTaskModal);

  // Wrapper for form submission with editing task context
  const onTaskFormSubmit = async (taskData: TaskFormData) => {
    await handleSubmitTask(taskData, modalState.editingTask);
  };

  // Wrapper for delete confirmation
  const onConfirmDelete = () => {
    confirmDelete(modalState.deleteConfirmId);
    modalState.closeDeleteConfirm();
  };

  // Show loading skeleton during hydration
  if (!isHydrated) {
    return <BoardLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* Loading indicator for async operations */}
      {isLoading && <LoadingIndicator />}

      {/* Error toast for displaying errors */}
      {error && <ErrorToast message={error} onDismiss={clearError} />}

      <div className={`mx-auto max-w-7xl px-4 ${showHeader ? 'py-6 md:py-10' : 'py-0'} md:px-8`}>
        {showHeader && (
          <BoardHeader
            showFilterPanel={modalState.showFilterPanel}
            onToggleFilterPanel={modalState.toggleFilterPanel}
            onCloseFilterPanel={modalState.closeFilterPanel}
            activeFilterCount={activeFilterCount}
            labelFilterIds={labelFilterIds}
            onLabelFilter={setLabelFilterIds}
            filteredTaskIds={filteredTaskIdsWithoutLabelFilter}
            hasOtherFilters={hasNonLabelFilters}
            onOpenLabelManager={modalState.openLabelManager}
            hasActiveFilters={hasActiveFilters}
            onOpenSaveFilterModal={modalState.openSaveFilterModal}
          />
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
                  onAddTask={modalState.openNewTaskModal}
                  onEditTask={modalState.openEditTaskModal}
                  onDeleteTask={modalState.openDeleteConfirm}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        </main>
      </div>

      {/* Task Form Modal */}
      <Modal
        isOpen={modalState.isTaskModalOpen}
        onClose={modalState.closeTaskModal}
        title={modalState.editingTask ? 'Edit Task' : 'New Task'}
      >
        <TaskForm
          initialData={modalState.editingTask || undefined}
          onSubmit={onTaskFormSubmit}
          onCancel={modalState.closeTaskModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!modalState.deleteConfirmId}
        onClose={modalState.closeDeleteConfirm}
        onConfirm={onConfirmDelete}
      />

      {/* Label Manager Modal */}
      <LabelManager
        isOpen={modalState.showLabelManager}
        onClose={modalState.closeLabelManager}
      />

      {/* Save Filter Preset Modal */}
      <SaveFilterModal
        isOpen={modalState.showSaveFilterModal}
        onClose={modalState.closeSaveFilterModal}
      />
    </div>
  );
}
