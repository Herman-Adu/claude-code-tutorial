'use client';

/**
 * Labels Hook - Zustand + Server Actions Integration
 *
 * This hook provides a convenient interface for managing labels
 * while internally using Zustand for state management and Server Actions
 * for database persistence.
 *
 * Key features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic rollback on server errors
 * - Hydration management for SSR compatibility
 * - Efficient re-render optimization via Zustand selectors
 */

import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  useLabelsStore,
  type StoreLabel,
  type CreateLabelData,
  type UpdateLabelData,
} from '@/store/labels';
import {
  getLabels,
  createLabel,
  updateLabel as updateLabelAction,
  deleteLabel as deleteLabelAction,
  addLabelToTask as addLabelToTaskAction,
  removeLabelFromTask as removeLabelFromTaskAction,
  getLabelsForTask,
  setLabelsForTask,
  type LabelResponse,
} from '@/app/actions/labels';

// ============================================================================
// Types
// ============================================================================

/**
 * Label type for external API.
 */
export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

/**
 * Return type for the useLabels hook.
 */
interface UseLabelsReturn {
  labels: Label[];
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  addLabel: (data: { name: string; color: string }) => Promise<string | null>;
  updateLabel: (id: string, updates: { name?: string; color?: string }) => Promise<boolean>;
  deleteLabel: (id: string) => Promise<boolean>;
  getTaskLabels: (taskId: string) => Label[];
  addLabelToTask: (taskId: string, labelId: string) => Promise<boolean>;
  removeLabelFromTask: (taskId: string, labelId: string) => Promise<boolean>;
  setTaskLabels: (taskId: string, labelIds: string[]) => Promise<boolean>;
  loadTaskLabels: (taskId: string) => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// Type Conversion Utilities
// ============================================================================

/**
 * Converts a StoreLabel to Label format.
 */
function toLabel(storeLabel: StoreLabel): Label {
  return {
    id: storeLabel.id,
    name: storeLabel.name,
    color: storeLabel.color,
    createdAt: storeLabel.createdAt,
    updatedAt: storeLabel.updatedAt,
    taskCount: storeLabel.taskCount,
  };
}

/**
 * Transforms LabelResponse array to StoreLabel array.
 */
function transformLabelResponses(labels: LabelResponse[]): StoreLabel[] {
  return labels.map((label) => ({
    ...label,
    createdAt:
      label.createdAt instanceof Date
        ? label.createdAt.toISOString()
        : String(label.createdAt),
    updatedAt:
      label.updatedAt instanceof Date
        ? label.updatedAt.toISOString()
        : String(label.updatedAt),
  }));
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Labels management hook.
 *
 * Uses Zustand for state management and Server Actions for persistence.
 */
export function useLabels(): UseLabelsReturn {
  // Store state and actions
  const labels = useLabelsStore(useShallow((state) => state.getLabelsArray()));
  const isHydrated = useLabelsStore((state) => state.isHydrated);
  const isLoading = useLabelsStore((state) => state.isLoading);
  const error = useLabelsStore((state) => state.error);
  const setLabels = useLabelsStore((state) => state.setLabels);
  const setHydrated = useLabelsStore((state) => state.setHydrated);
  const setError = useLabelsStore((state) => state.setError);
  const storeAddLabel = useLabelsStore((state) => state.addLabel);
  const storeUpdateLabel = useLabelsStore((state) => state.updateLabel);
  const storeRemoveLabel = useLabelsStore((state) => state.removeLabel);
  const storeSetTaskLabels = useLabelsStore((state) => state.setTaskLabels);
  const storeAddLabelToTask = useLabelsStore((state) => state.addLabelToTask);
  const storeRemoveLabelFromTask = useLabelsStore((state) => state.removeLabelFromTask);
  const getLabelsForTaskFromStore = useLabelsStore((state) => state.getLabelsForTask);

  // Track initialization
  const isInitializing = useRef(false);

  // Fetch labels on mount
  useEffect(() => {
    async function initializeLabels() {
      if (isHydrated || isInitializing.current) {
        return;
      }

      isInitializing.current = true;

      try {
        const result = await getLabels();

        if (result.success && result.data) {
          setLabels(transformLabelResponses(result.data));
        } else {
          setLabels([]);
          if (result.error) {
            setError(result.error);
          }
        }
      } catch (err) {
        console.error('Failed to fetch labels:', err);
        setLabels([]);
        setError('Failed to load labels');
      } finally {
        setHydrated(true);
        isInitializing.current = false;
      }
    }

    initializeLabels();
  }, [isHydrated, setLabels, setHydrated, setError]);

  // ========================================================================
  // Action Handlers
  // ========================================================================

  const addLabel = useCallback(
    async (data: CreateLabelData): Promise<string | null> => {
      return storeAddLabel(data, createLabel);
    },
    [storeAddLabel]
  );

  const updateLabel = useCallback(
    async (id: string, updates: UpdateLabelData): Promise<boolean> => {
      return storeUpdateLabel(id, updates, updateLabelAction);
    },
    [storeUpdateLabel]
  );

  const deleteLabel = useCallback(
    async (id: string): Promise<boolean> => {
      return storeRemoveLabel(id, deleteLabelAction);
    },
    [storeRemoveLabel]
  );

  const getTaskLabelsFromHook = useCallback(
    (taskId: string): Label[] => {
      return getLabelsForTaskFromStore(taskId).map(toLabel);
    },
    [getLabelsForTaskFromStore]
  );

  const addLabelToTaskHook = useCallback(
    async (taskId: string, labelId: string): Promise<boolean> => {
      return storeAddLabelToTask(taskId, labelId, addLabelToTaskAction);
    },
    [storeAddLabelToTask]
  );

  const removeLabelFromTaskHook = useCallback(
    async (taskId: string, labelId: string): Promise<boolean> => {
      return storeRemoveLabelFromTask(taskId, labelId, removeLabelFromTaskAction);
    },
    [storeRemoveLabelFromTask]
  );

  const setTaskLabelsHook = useCallback(
    async (taskId: string, labelIds: string[]): Promise<boolean> => {
      // Update store first for immediate UI feedback
      storeSetTaskLabels(taskId, labelIds);

      // Then sync with server
      try {
        const result = await setLabelsForTask(taskId, labelIds);
        if (!result.success) {
          setError(result.error || 'Failed to set task labels');
          return false;
        }
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to set task labels';
        setError(errorMessage);
        return false;
      }
    },
    [storeSetTaskLabels, setError]
  );

  const loadTaskLabels = useCallback(
    async (taskId: string): Promise<void> => {
      try {
        const result = await getLabelsForTask(taskId);
        if (result.success && result.data) {
          const labelIds = result.data.map((l) => l.id);
          storeSetTaskLabels(taskId, labelIds);
        }
      } catch (err) {
        console.error('Failed to load task labels:', err);
      }
    },
    [storeSetTaskLabels]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Convert labels to external format
  const labelsList = labels.map(toLabel);

  return {
    labels: labelsList,
    isHydrated,
    isLoading,
    error,
    addLabel,
    updateLabel,
    deleteLabel,
    getTaskLabels: getTaskLabelsFromHook,
    addLabelToTask: addLabelToTaskHook,
    removeLabelFromTask: removeLabelFromTaskHook,
    setTaskLabels: setTaskLabelsHook,
    loadTaskLabels,
    clearError,
  };
}

export default useLabels;
