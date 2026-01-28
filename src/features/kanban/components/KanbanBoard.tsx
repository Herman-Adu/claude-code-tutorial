'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { COLUMNS } from '@/constants';
import { Task, ColumnId } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCardOverlay } from './TaskCard';
import { TaskForm } from './TaskForm';
import { Modal } from '@/components/ui/Modal';

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
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
    clearError,
  } = useKanban();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (editingTask) {
        updateTask(editingTask.id, taskData);
      } else {
        addTask(taskData);
      }
      setIsModalOpen(false);
      setEditingTask(null);
    },
    [editingTask, addTask, updateTask]
  );

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
          <header className="mb-8 md:mb-10 text-center">
            <div className="inline-block glass-lg px-8 py-4 mb-4">
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-clip-text text-transparent">
                Kanban Board
              </h1>
            </div>
            <p className="text-slate-500 font-medium tracking-wide" aria-live="polite">
              Organize your tasks with drag and drop
            </p>
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
                  tasks={getTasksByColumn(column.id)}
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
    </div>
  );
}
