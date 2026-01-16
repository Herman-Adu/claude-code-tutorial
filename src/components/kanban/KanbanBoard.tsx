'use client';

import { useState, useCallback } from 'react';
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
import { useKanban } from '@/hooks/useKanban';
import { COLUMNS } from '@/constants';
import { Task, ColumnId } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCardOverlay } from './TaskCard';
import { TaskForm } from './TaskForm';
import { Modal } from '@/components/ui/Modal';

export function KanbanBoard() {
  const { tasks, isHydrated, addTask, updateTask, deleteTask, moveTask, getTasksByColumn } =
    useKanban();
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-slate-600 font-medium">Loading your board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8 md:mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Kanban Board
          </h1>
          <p className="mt-2 text-slate-500">Organize your tasks with drag and drop</p>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col md:flex-row gap-6 md:justify-center pb-4">
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
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
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
        <p className="mb-6 text-slate-600">
          Are you sure you want to delete this task? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteConfirmId(null)}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors shadow-sm"
          >
            Delete Task
          </button>
        </div>
      </Modal>
    </div>
  );
}
