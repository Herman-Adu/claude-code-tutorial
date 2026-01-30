'use client';

import { useCallback } from 'react';
import { Task } from '@/types';
import { useKanban } from './useKanban';
import { useLabels } from './useLabels';
import { useLabelsStore } from '@/store/labels';

/**
 * Task data for form submission
 */
export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & {
  labelIds?: string[];
};

/**
 * Return type for the useTaskHandlers hook
 */
export interface TaskHandlersResult {
  /** Handler for form submission (create or update) */
  handleSubmitTask: (taskData: TaskFormData, editingTask: Task | null) => Promise<void>;
  /** Handler for confirming task deletion */
  confirmDelete: (deleteConfirmId: string | null) => void;
}

/**
 * Task Handlers Hook
 *
 * Provides handlers for task CRUD operations including:
 * - Task creation with label assignment
 * - Task update with label sync
 * - Task deletion
 *
 * Manages optimistic updates and error handling for label operations.
 *
 * @param onComplete - Callback when operation completes (e.g., close modal)
 */
export function useTaskHandlers(
  onComplete?: () => void
): TaskHandlersResult {
  const { addTaskAsync, updateTask, deleteTask } = useKanban();
  const { setTaskLabels } = useLabels();
  const storeSetTaskLabels = useLabelsStore((state) => state.setTaskLabels);

  const handleSubmitTask = useCallback(
    async (taskData: TaskFormData, editingTask: Task | null) => {
      const { labelIds, ...taskDataWithoutLabels } = taskData;

      if (editingTask) {
        // Update existing task
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
        // Create new task
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

      onComplete?.();
    },
    [addTaskAsync, updateTask, setTaskLabels, storeSetTaskLabels, onComplete]
  );

  const confirmDelete = useCallback(
    (deleteConfirmId: string | null) => {
      if (deleteConfirmId) {
        deleteTask(deleteConfirmId);
      }
    },
    [deleteTask]
  );

  return {
    handleSubmitTask,
    confirmDelete,
  };
}
