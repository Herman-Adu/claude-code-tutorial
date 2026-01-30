'use client';

import { useState, useCallback } from 'react';
import { Task } from '@/types';

/**
 * Return type for the useModalState hook
 */
export interface ModalStateResult {
  // Task form modal state
  /** Whether the task form modal is open */
  isTaskModalOpen: boolean;
  /** The task being edited (null for new task) */
  editingTask: Task | null;
  /** Open the task form modal for a new task */
  openNewTaskModal: () => void;
  /** Open the task form modal for editing a task */
  openEditTaskModal: (task: Task) => void;
  /** Close the task form modal */
  closeTaskModal: () => void;

  // Delete confirmation modal state
  /** ID of task pending deletion (null if not confirming) */
  deleteConfirmId: string | null;
  /** Open the delete confirmation modal */
  openDeleteConfirm: (taskId: string) => void;
  /** Close the delete confirmation modal */
  closeDeleteConfirm: () => void;

  // Label manager modal state
  /** Whether the label manager modal is open */
  showLabelManager: boolean;
  /** Open the label manager modal */
  openLabelManager: () => void;
  /** Close the label manager modal */
  closeLabelManager: () => void;

  // Filter panel state
  /** Whether the filter panel is open */
  showFilterPanel: boolean;
  /** Toggle the filter panel */
  toggleFilterPanel: () => void;
  /** Close the filter panel */
  closeFilterPanel: () => void;

  // Save filter modal state
  /** Whether the save filter modal is open */
  showSaveFilterModal: boolean;
  /** Open the save filter modal */
  openSaveFilterModal: () => void;
  /** Close the save filter modal */
  closeSaveFilterModal: () => void;
}

/**
 * Modal State Management Hook
 *
 * Centralizes all modal/dialog state management for the Kanban board.
 * This includes:
 * - Task creation/edit modal
 * - Delete confirmation modal
 * - Label manager modal
 * - Filter panel popover
 * - Save filter modal
 */
export function useModalState(): ModalStateResult {
  // Task form modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Label manager modal state
  const [showLabelManager, setShowLabelManager] = useState(false);

  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Save filter modal state
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);

  // Task modal handlers
  const openNewTaskModal = useCallback(() => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  }, []);

  const openEditTaskModal = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  }, []);

  // Delete confirmation handlers
  const openDeleteConfirm = useCallback((taskId: string) => {
    setDeleteConfirmId(taskId);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  // Label manager handlers
  const openLabelManager = useCallback(() => {
    setShowLabelManager(true);
  }, []);

  const closeLabelManager = useCallback(() => {
    setShowLabelManager(false);
  }, []);

  // Filter panel handlers
  const toggleFilterPanel = useCallback(() => {
    setShowFilterPanel((prev) => !prev);
  }, []);

  const closeFilterPanel = useCallback(() => {
    setShowFilterPanel(false);
  }, []);

  // Save filter modal handlers
  const openSaveFilterModal = useCallback(() => {
    setShowSaveFilterModal(true);
  }, []);

  const closeSaveFilterModal = useCallback(() => {
    setShowSaveFilterModal(false);
  }, []);

  return {
    // Task modal
    isTaskModalOpen,
    editingTask,
    openNewTaskModal,
    openEditTaskModal,
    closeTaskModal,

    // Delete confirmation
    deleteConfirmId,
    openDeleteConfirm,
    closeDeleteConfirm,

    // Label manager
    showLabelManager,
    openLabelManager,
    closeLabelManager,

    // Filter panel
    showFilterPanel,
    toggleFilterPanel,
    closeFilterPanel,

    // Save filter modal
    showSaveFilterModal,
    openSaveFilterModal,
    closeSaveFilterModal,
  };
}
