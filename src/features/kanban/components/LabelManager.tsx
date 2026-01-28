'use client';

import { useState, useCallback, FormEvent } from 'react';
import { LabelBadge } from '@/components/ui/LabelBadge';
import { ColorPicker, getColorName } from '@/components/ui/ColorPicker';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useLabels, type Label } from '../hooks/useLabels';
import { VALIDATION } from '@/lib/schemas';

interface LabelManagerProps {
  /** Whether the manager modal is open */
  isOpen: boolean;
  /** Callback to close the manager */
  onClose: () => void;
}

/**
 * LabelManager Component
 *
 * A modal component for managing user labels.
 * Provides functionality to:
 * - View all labels with task counts
 * - Create new labels
 * - Edit existing labels
 * - Delete labels with confirmation
 */
export function LabelManager({ isOpen, onClose }: LabelManagerProps) {
  const {
    labels,
    isLoading,
    error,
    addLabel,
    updateLabel,
    deleteLabel,
    clearError,
  } = useLabels();

  // Form state
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form state
  const resetForm = useCallback(() => {
    setName('');
    setColor('blue');
    setEditingLabel(null);
    setFormError(null);
    setMode('list');
  }, []);

  // Handle modal close
  const handleClose = useCallback(() => {
    resetForm();
    clearError();
    onClose();
  }, [resetForm, clearError, onClose]);

  // Start creating a new label
  const handleStartCreate = useCallback(() => {
    resetForm();
    setMode('create');
  }, [resetForm]);

  // Start editing a label
  const handleStartEdit = useCallback((label: Label) => {
    setEditingLabel(label);
    setName(label.name);
    setColor(label.color);
    setFormError(null);
    setMode('edit');
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setFormError(null);

      const trimmedName = name.trim();
      if (!trimmedName) {
        setFormError('Label name is required');
        return;
      }

      if (trimmedName.length > VALIDATION.MAX_LABEL_NAME_LENGTH) {
        setFormError(`Label name must be ${VALIDATION.MAX_LABEL_NAME_LENGTH} characters or less`);
        return;
      }

      // Client-side duplicate name check to prevent unnecessary server round-trips
      const nameLower = trimmedName.toLowerCase();
      const duplicateLabel = labels.find(
        (l) =>
          l.name.toLowerCase() === nameLower &&
          // Allow same name when editing the same label (no name change)
          (mode !== 'edit' || l.id !== editingLabel?.id)
      );
      if (duplicateLabel) {
        setFormError('A label with this name already exists');
        return;
      }

      try {
        if (mode === 'create') {
          const result = await addLabel({ name: trimmedName, color });
          if (result) {
            resetForm();
          }
        } else if (mode === 'edit' && editingLabel) {
          const updates: { name?: string; color?: string } = {};
          if (trimmedName !== editingLabel.name) {
            updates.name = trimmedName;
          }
          if (color !== editingLabel.color) {
            updates.color = color;
          }

          if (Object.keys(updates).length > 0) {
            const success = await updateLabel(editingLabel.id, updates);
            if (success) {
              resetForm();
            }
          } else {
            resetForm();
          }
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'An error occurred');
      }
    },
    [mode, name, color, editingLabel, labels, addLabel, updateLabel, resetForm]
  );

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmId) return;

    const success = await deleteLabel(deleteConfirmId);
    if (success) {
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteLabel]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        mode === 'create'
          ? 'Create Label'
          : mode === 'edit'
          ? 'Edit Label'
          : 'Manage Labels'
      }
    >
      {/* Error display */}
      {(error || formError) && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {formError || error}
        </div>
      )}

      {/* List view */}
      {mode === 'list' && (
        <div className="space-y-4">
          {/* Labels list */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {labels.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No labels yet. Create your first label to get started.
              </p>
            ) : (
              labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-white/40"
                >
                  <div className="flex items-center gap-3">
                    <LabelBadge label={label} />
                    <span className="text-sm text-slate-500">
                      {label.taskCount || 0} task{(label.taskCount || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(label)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      aria-label={`Edit label: ${label.name}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(label.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      aria-label={`Delete label: ${label.name}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create button */}
          <div className="pt-2 border-t border-slate-200">
            <Button
              type="button"
              onClick={handleStartCreate}
              className="w-full"
              disabled={isLoading}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Label
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit form */}
      {(mode === 'create' || mode === 'edit') && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name input */}
          <div>
            <label htmlFor="label-name" className="block text-sm font-medium text-slate-600 mb-2">
              Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              id="label-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={VALIDATION.MAX_LABEL_NAME_LENGTH}
              className="glass-input w-full px-4 py-3 text-slate-700 placeholder:text-slate-400"
              placeholder="Enter label name"
              autoFocus
            />
            <p className="mt-1 text-xs text-slate-400">
              {name.length}/{VALIDATION.MAX_LABEL_NAME_LENGTH} characters
            </p>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Color
            </label>
            <ColorPicker
              value={color}
              onChange={setColor}
              showCustomInput={true}
            />
            <p className="mt-2 text-sm text-slate-500">
              Selected: <span className="font-medium">{getColorName(color)}</span>
            </p>
          </div>

          {/* Preview */}
          {name.trim() && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Preview
              </label>
              <LabelBadge
                label={{ id: 'preview', name: name.trim(), color }}
              />
            </div>
          )}

          {/* Form actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : mode === 'create' ? (
                'Create Label'
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Label"
      >
        <p className="mb-6 text-slate-600">
          Are you sure you want to delete this label? It will be removed from all tasks.
          This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setDeleteConfirmId(null)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </Modal>
  );
}
