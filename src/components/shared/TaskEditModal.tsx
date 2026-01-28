'use client';

import { Modal } from '@/components/ui/Modal';
import { TaskForm } from '@/features/kanban';
import type { Task } from '@/types';

/**
 * Data structure for task form submission.
 * Excludes auto-generated fields (id, createdAt, updatedAt).
 */
export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

interface TaskEditModalProps {
  /** The task to edit, or null when creating a new task */
  task: Task | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed (cancel or backdrop click) */
  onClose: () => void;
  /** Callback when task data is submitted */
  onSave: (data: TaskFormData) => void;
}

/**
 * A shared modal component for editing tasks.
 * Wraps TaskForm in a Modal for consistent task editing experience across features.
 *
 * This component serves as a bridge between features (like calendar) and the kanban
 * feature's TaskForm, preventing direct cross-feature imports.
 */
export function TaskEditModal({ task, isOpen, onClose, onSave }: TaskEditModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create Task'}
    >
      <TaskForm
        initialData={task || undefined}
        onSubmit={onSave}
        onCancel={onClose}
      />
    </Modal>
  );
}
