'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Task, ColumnId } from '@/types';
import { LOCAL_STORAGE_KEY } from '@/constants';
import { generateId, getTimestamp } from '@/lib/utils';

interface UseKanbanReturn {
  tasks: Task[];
  isHydrated: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newColumnId: ColumnId, targetTaskId?: string) => void;
  getTasksByColumn: (columnId: ColumnId) => Task[];
}

export function useKanban(): UseKanbanReturn {
  const [tasks, setTasks, isHydrated] = useLocalStorage<Task[]>(LOCAL_STORAGE_KEY, []);

  const addTask = useCallback(
    (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = getTimestamp();
      const newTask: Task = {
        ...taskData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      setTasks((prev) => [...prev, newTask]);
    },
    [setTasks]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? { ...task, ...updates, updatedAt: getTimestamp() }
            : task
        )
      );
    },
    [setTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    },
    [setTasks]
  );

  const moveTask = useCallback(
    (taskId: string, newColumnId: ColumnId, targetTaskId?: string) => {
      setTasks((prev) => {
        const taskToMove = prev.find((t) => t.id === taskId);
        if (!taskToMove) return prev;

        // Remove the task from its current position
        const withoutTask = prev.filter((t) => t.id !== taskId);

        // Update the task's column
        const updatedTask = {
          ...taskToMove,
          columnId: newColumnId,
          updatedAt: getTimestamp(),
        };

        // If we have a target task, insert before it
        if (targetTaskId) {
          const targetIndex = withoutTask.findIndex((t) => t.id === targetTaskId);
          if (targetIndex !== -1) {
            return [
              ...withoutTask.slice(0, targetIndex),
              updatedTask,
              ...withoutTask.slice(targetIndex),
            ];
          }
        }

        // No target task - find the right position to append within the column
        // We need to find where this column's tasks end in the array
        let insertIndex = withoutTask.length; // Default: end of array

        // Find the last task of the target column
        for (let i = withoutTask.length - 1; i >= 0; i--) {
          if (withoutTask[i].columnId === newColumnId) {
            insertIndex = i + 1; // Insert after the last task in this column
            break;
          }
        }

        // If no tasks in target column, find where to insert based on column order
        const columnTasks = withoutTask.filter((t) => t.columnId === newColumnId);
        if (columnTasks.length === 0) {
          // Find first task of a "later" column to insert before
          const columnOrder: ColumnId[] = ['todo', 'in-progress', 'completed'];
          const targetColumnIndex = columnOrder.indexOf(newColumnId);

          for (let i = 0; i < withoutTask.length; i++) {
            const taskColumnIndex = columnOrder.indexOf(withoutTask[i].columnId);
            if (taskColumnIndex > targetColumnIndex) {
              insertIndex = i;
              break;
            }
          }
        }

        return [
          ...withoutTask.slice(0, insertIndex),
          updatedTask,
          ...withoutTask.slice(insertIndex),
        ];
      });
    },
    [setTasks]
  );

  const getTasksByColumn = useCallback(
    (columnId: ColumnId) => {
      return tasks.filter((task) => task.columnId === columnId);
    },
    [tasks]
  );

  return {
    tasks,
    isHydrated,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
  };
}
