/**
 * Labels Zustand Store
 *
 * This store manages label state with optimistic updates.
 * It integrates with server actions for persistence to PostgreSQL.
 *
 * Key features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic rollback on server errors
 * - Task-label relationship management
 * - Efficient selectors with shallow comparison
 * - DevTools integration for debugging
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { LabelResponse, ActionResponse } from '@/app/actions/labels';

// ============================================================================
// Types
// ============================================================================

/**
 * Label type used in the store.
 * Matches LabelResponse with string dates for consistency.
 */
export interface StoreLabel {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

/**
 * Input type for creating a new label.
 */
export interface CreateLabelData {
  name: string;
  color: string;
}

/**
 * Input type for updating an existing label.
 */
export interface UpdateLabelData {
  name?: string;
  color?: string;
}

/**
 * Labels store state interface.
 */
interface LabelsState {
  // Data
  labels: Map<string, StoreLabel>;
  taskLabels: Map<string, string[]>; // taskId -> labelIds

  // Status flags
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  // Label mutations
  setLabels: (labels: StoreLabel[]) => void;
  addLabel: (
    label: CreateLabelData,
    serverAction: (data: CreateLabelData) => Promise<ActionResponse<LabelResponse>>
  ) => Promise<string | null>;
  updateLabel: (
    id: string,
    updates: UpdateLabelData,
    serverAction: (id: string, data: UpdateLabelData) => Promise<ActionResponse<LabelResponse>>
  ) => Promise<boolean>;
  removeLabel: (
    id: string,
    serverAction: (id: string) => Promise<ActionResponse>
  ) => Promise<boolean>;

  // Task-label relationship mutations
  setTaskLabels: (taskId: string, labelIds: string[]) => void;
  addLabelToTask: (
    taskId: string,
    labelId: string,
    serverAction: (taskId: string, labelId: string) => Promise<ActionResponse>
  ) => Promise<boolean>;
  removeLabelFromTask: (
    taskId: string,
    labelId: string,
    serverAction: (taskId: string, labelId: string) => Promise<ActionResponse>
  ) => Promise<boolean>;
  clearLabelsForTask: (taskId: string) => void;

  // Status setters
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;

  // Selectors
  getLabelsArray: () => StoreLabel[];
  getLabelById: (id: string) => StoreLabel | undefined;
  getTaskLabels: (taskId: string) => string[];
  getTasksWithLabel: (labelId: string) => string[];
  getLabelsForTask: (taskId: string) => StoreLabel[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a temporary ID for optimistic updates.
 */
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Converts a LabelResponse from server to StoreLabel format.
 */
function transformLabelResponse(label: LabelResponse): StoreLabel {
  return {
    ...label,
    createdAt:
      label.createdAt instanceof Date
        ? label.createdAt.toISOString()
        : String(label.createdAt),
    updatedAt:
      label.updatedAt instanceof Date
        ? label.updatedAt.toISOString()
        : String(label.updatedAt),
  };
}

/**
 * Gets current ISO timestamp string.
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * Labels Zustand store with devtools middleware.
 */
export const useLabelsStore = create<LabelsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      labels: new Map(),
      taskLabels: new Map(),
      isHydrated: false,
      isLoading: false,
      error: null,

      // ========================================================================
      // State Setters
      // ========================================================================

      setLabels: (labels) => {
        const labelsMap = new Map<string, StoreLabel>();
        labels.forEach((label) => {
          labelsMap.set(label.id, label);
        });
        set({ labels: labelsMap, isHydrated: true }, false, 'setLabels');
      },

      setLoading: (loading) => {
        set({ isLoading: loading }, false, 'setLoading');
      },

      setError: (error) => {
        set({ error }, false, 'setError');
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated }, false, 'setHydrated');
      },

      // ========================================================================
      // Label Mutations with Optimistic Updates
      // ========================================================================

      addLabel: async (labelData, serverAction) => {
        const tempId = generateTempId();
        const now = getTimestamp();
        const previousLabels = new Map(get().labels);

        // Optimistic update
        const optimisticLabel: StoreLabel = {
          ...labelData,
          id: tempId,
          createdAt: now,
          updatedAt: now,
          taskCount: 0,
        };

        const newLabels = new Map(previousLabels);
        newLabels.set(tempId, optimisticLabel);

        set(
          { labels: newLabels, isLoading: true, error: null },
          false,
          'addLabel/optimistic'
        );

        try {
          const result = await serverAction(labelData);

          if (result.success && result.data) {
            const serverLabel = transformLabelResponse(result.data);
            const updatedLabels = new Map(get().labels);
            updatedLabels.delete(tempId);
            updatedLabels.set(serverLabel.id, serverLabel);

            set(
              { labels: updatedLabels, isLoading: false },
              false,
              'addLabel/success'
            );
            return serverLabel.id;
          } else {
            set(
              { labels: previousLabels, isLoading: false, error: result.error || 'Failed to add label' },
              false,
              'addLabel/rollback'
            );
            return null;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add label';
          set(
            { labels: previousLabels, isLoading: false, error: errorMessage },
            false,
            'addLabel/error'
          );
          return null;
        }
      },

      updateLabel: async (id, updates, serverAction) => {
        const previousLabels = new Map(get().labels);
        const existingLabel = previousLabels.get(id);

        if (!existingLabel) {
          set({ error: 'Label not found' }, false, 'updateLabel/notFound');
          return false;
        }

        // Optimistic update
        const updatedLabel: StoreLabel = {
          ...existingLabel,
          ...updates,
          updatedAt: getTimestamp(),
        };

        const newLabels = new Map(previousLabels);
        newLabels.set(id, updatedLabel);

        set(
          { labels: newLabels, isLoading: true, error: null },
          false,
          'updateLabel/optimistic'
        );

        try {
          const result = await serverAction(id, updates);

          if (result.success && result.data) {
            const serverLabel = transformLabelResponse(result.data);
            const currentLabels = new Map(get().labels);
            currentLabels.set(id, serverLabel);

            set(
              { labels: currentLabels, isLoading: false },
              false,
              'updateLabel/success'
            );
            return true;
          } else {
            set(
              { labels: previousLabels, isLoading: false, error: result.error || 'Failed to update label' },
              false,
              'updateLabel/rollback'
            );
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update label';
          set(
            { labels: previousLabels, isLoading: false, error: errorMessage },
            false,
            'updateLabel/error'
          );
          return false;
        }
      },

      removeLabel: async (id, serverAction) => {
        const previousLabels = new Map(get().labels);
        const previousTaskLabels = new Map(get().taskLabels);

        if (!previousLabels.has(id)) {
          set({ error: 'Label not found' }, false, 'removeLabel/notFound');
          return false;
        }

        // Optimistic update - remove label and all task associations
        const newLabels = new Map(previousLabels);
        newLabels.delete(id);

        const newTaskLabels = new Map(previousTaskLabels);
        newTaskLabels.forEach((labelIds, taskId) => {
          const filtered = labelIds.filter((labelId) => labelId !== id);
          if (filtered.length > 0) {
            newTaskLabels.set(taskId, filtered);
          } else {
            newTaskLabels.delete(taskId);
          }
        });

        set(
          { labels: newLabels, taskLabels: newTaskLabels, isLoading: true, error: null },
          false,
          'removeLabel/optimistic'
        );

        try {
          const result = await serverAction(id);

          if (result.success) {
            set({ isLoading: false }, false, 'removeLabel/success');
            return true;
          } else {
            set(
              { labels: previousLabels, taskLabels: previousTaskLabels, isLoading: false, error: result.error || 'Failed to delete label' },
              false,
              'removeLabel/rollback'
            );
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete label';
          set(
            { labels: previousLabels, taskLabels: previousTaskLabels, isLoading: false, error: errorMessage },
            false,
            'removeLabel/error'
          );
          return false;
        }
      },

      // ========================================================================
      // Task-Label Relationship Mutations
      // ========================================================================

      setTaskLabels: (taskId, labelIds) => {
        const newTaskLabels = new Map(get().taskLabels);
        if (labelIds.length > 0) {
          newTaskLabels.set(taskId, labelIds);
        } else {
          newTaskLabels.delete(taskId);
        }
        set({ taskLabels: newTaskLabels }, false, 'setTaskLabels');
      },

      addLabelToTask: async (taskId, labelId, serverAction) => {
        const previousTaskLabels = new Map(get().taskLabels);
        const currentLabels = previousTaskLabels.get(taskId) || [];

        // Check if already linked
        if (currentLabels.includes(labelId)) {
          return true;
        }

        // Optimistic update
        const newTaskLabels = new Map(previousTaskLabels);
        newTaskLabels.set(taskId, [...currentLabels, labelId]);

        // Update task count on label
        const labels = new Map(get().labels);
        const label = labels.get(labelId);
        if (label) {
          labels.set(labelId, {
            ...label,
            taskCount: (label.taskCount || 0) + 1,
          });
        }

        set(
          { taskLabels: newTaskLabels, labels, isLoading: true, error: null },
          false,
          'addLabelToTask/optimistic'
        );

        try {
          const result = await serverAction(taskId, labelId);

          if (result.success) {
            set({ isLoading: false }, false, 'addLabelToTask/success');
            return true;
          } else {
            // Rollback
            const rollbackLabels = new Map(get().labels);
            const rollbackLabel = rollbackLabels.get(labelId);
            if (rollbackLabel && rollbackLabel.taskCount) {
              rollbackLabels.set(labelId, {
                ...rollbackLabel,
                taskCount: rollbackLabel.taskCount - 1,
              });
            }

            set(
              { taskLabels: previousTaskLabels, labels: rollbackLabels, isLoading: false, error: result.error || 'Failed to add label to task' },
              false,
              'addLabelToTask/rollback'
            );
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add label to task';
          set(
            { taskLabels: previousTaskLabels, isLoading: false, error: errorMessage },
            false,
            'addLabelToTask/error'
          );
          return false;
        }
      },

      removeLabelFromTask: async (taskId, labelId, serverAction) => {
        const previousTaskLabels = new Map(get().taskLabels);
        const currentLabels = previousTaskLabels.get(taskId) || [];

        // Check if linked
        if (!currentLabels.includes(labelId)) {
          return true;
        }

        // Optimistic update
        const newTaskLabels = new Map(previousTaskLabels);
        const filteredLabels = currentLabels.filter((id) => id !== labelId);
        if (filteredLabels.length > 0) {
          newTaskLabels.set(taskId, filteredLabels);
        } else {
          newTaskLabels.delete(taskId);
        }

        // Update task count on label
        const labels = new Map(get().labels);
        const label = labels.get(labelId);
        if (label && label.taskCount) {
          labels.set(labelId, {
            ...label,
            taskCount: label.taskCount - 1,
          });
        }

        set(
          { taskLabels: newTaskLabels, labels, isLoading: true, error: null },
          false,
          'removeLabelFromTask/optimistic'
        );

        try {
          const result = await serverAction(taskId, labelId);

          if (result.success) {
            set({ isLoading: false }, false, 'removeLabelFromTask/success');
            return true;
          } else {
            // Rollback
            const rollbackLabels = new Map(get().labels);
            const rollbackLabel = rollbackLabels.get(labelId);
            if (rollbackLabel) {
              rollbackLabels.set(labelId, {
                ...rollbackLabel,
                taskCount: (rollbackLabel.taskCount || 0) + 1,
              });
            }

            set(
              { taskLabels: previousTaskLabels, labels: rollbackLabels, isLoading: false, error: result.error || 'Failed to remove label from task' },
              false,
              'removeLabelFromTask/rollback'
            );
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to remove label from task';
          set(
            { taskLabels: previousTaskLabels, isLoading: false, error: errorMessage },
            false,
            'removeLabelFromTask/error'
          );
          return false;
        }
      },

      clearLabelsForTask: (taskId) => {
        const newTaskLabels = new Map(get().taskLabels);
        newTaskLabels.delete(taskId);
        set({ taskLabels: newTaskLabels }, false, 'clearLabelsForTask');
      },

      // ========================================================================
      // Selectors
      // ========================================================================

      getLabelsArray: () => {
        return Array.from(get().labels.values());
      },

      getLabelById: (id) => {
        return get().labels.get(id);
      },

      getTaskLabels: (taskId) => {
        return get().taskLabels.get(taskId) || [];
      },

      getTasksWithLabel: (labelId) => {
        const taskIds: string[] = [];
        get().taskLabels.forEach((labelIds, taskId) => {
          if (labelIds.includes(labelId)) {
            taskIds.push(taskId);
          }
        });
        return taskIds;
      },

      getLabelsForTask: (taskId) => {
        const labelIds = get().taskLabels.get(taskId) || [];
        const labels = get().labels;
        return labelIds
          .map((id) => labels.get(id))
          .filter((label): label is StoreLabel => label !== undefined);
      },
    }),
    {
      name: 'labels-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selector Hooks
// ============================================================================

/**
 * Hook to get all labels as an array.
 * Uses shallow comparison to prevent unnecessary re-renders.
 */
export function useLabels(): StoreLabel[] {
  return useLabelsStore(useShallow((state) => state.getLabelsArray()));
}

/**
 * Hook to get a single label by ID.
 */
export function useLabelById(id: string): StoreLabel | undefined {
  return useLabelsStore((state) => state.getLabelById(id));
}

/**
 * Hook to get label IDs for a task.
 */
export function useTaskLabelIds(taskId: string): string[] {
  return useLabelsStore(useShallow((state) => state.getTaskLabels(taskId)));
}

/**
 * Hook to get labels for a task.
 */
export function useTaskLabels(taskId: string): StoreLabel[] {
  return useLabelsStore(useShallow((state) => state.getLabelsForTask(taskId)));
}

/**
 * Hook to get task IDs that have a specific label.
 */
export function useTasksWithLabel(labelId: string): string[] {
  return useLabelsStore(useShallow((state) => state.getTasksWithLabel(labelId)));
}

/**
 * Hook to select labels store hydration status.
 */
export function useLabelsHydrated(): boolean {
  return useLabelsStore((state) => state.isHydrated);
}

/**
 * Hook to select labels store loading status.
 */
export function useLabelsLoading(): boolean {
  return useLabelsStore((state) => state.isLoading);
}

/**
 * Hook to select labels store error state.
 */
export function useLabelsError(): string | null {
  return useLabelsStore((state) => state.error);
}

/**
 * Hook to select multiple labels state values with shallow comparison.
 */
export function useLabelsStatus() {
  return useLabelsStore(
    useShallow((state) => ({
      isHydrated: state.isHydrated,
      isLoading: state.isLoading,
      error: state.error,
    }))
  );
}

// Export store for direct access
export default useLabelsStore;
