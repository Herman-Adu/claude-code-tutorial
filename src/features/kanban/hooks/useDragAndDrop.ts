'use client';

import { useState, useCallback } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task, ColumnId } from '@/types';
import { COLUMNS } from '@/constants';

/**
 * Return type for the useDragAndDrop hook
 */
export interface DragAndDropResult {
  /** Configured sensors for DndContext */
  sensors: ReturnType<typeof useSensors>;
  /** Currently dragged task (for overlay) */
  activeTask: Task | null;
  /** Handler for drag start event */
  handleDragStart: (event: DragStartEvent) => void;
  /** Handler for drag end event */
  handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * Drag and Drop Hook
 *
 * Encapsulates all drag-and-drop configuration and handlers for the Kanban board.
 *
 * Features:
 * - Pointer and keyboard sensor configuration
 * - Distance activation constraint (8px) to prevent accidental drags
 * - Active task state management for drag overlay
 * - Column and task drop handling
 *
 * @param tasks - Array of all tasks
 * @param moveTask - Function to move a task to a new column/position
 */
export function useDragAndDrop(
  tasks: Task[],
  moveTask: (taskId: string, columnId: ColumnId, targetTaskId?: string) => void
): DragAndDropResult {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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

  return {
    sensors,
    activeTask,
    handleDragStart,
    handleDragEnd,
  };
}
