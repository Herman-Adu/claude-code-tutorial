'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Task, Priority, ColumnId } from '@/types';
import { cn, VALIDATION } from '@/lib/utils';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import { LabelSelector } from './LabelSelector';
import { useLabels } from '../hooks/useLabels';

interface TaskFormData extends Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
  dueDate?: string;
  dueTime?: string;
  isAllDay?: boolean;
  labelIds?: string[];
}

interface TaskFormProps {
  initialData?: Task & { dueDate?: string; dueTime?: string; isAllDay?: boolean };
  /** Initial due date in ISO format (YYYY-MM-DD) */
  initialDueDate?: string;
  /** Initial due time in HH:MM format */
  initialDueTime?: string;
  /** Initial all-day flag (defaults to true when no time is set) */
  initialIsAllDay?: boolean;
  /** Initial label IDs for editing */
  initialLabelIds?: string[];
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string; selectedColor: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-white/60 text-slate-600', selectedColor: 'bg-gradient-to-br from-emerald-300 to-green-400 text-white' },
  { value: 'medium', label: 'Medium', color: 'bg-white/60 text-slate-600', selectedColor: 'bg-gradient-to-br from-amber-300 to-orange-400 text-white' },
  { value: 'high', label: 'High', color: 'bg-white/60 text-slate-600', selectedColor: 'bg-gradient-to-br from-rose-400 to-pink-500 text-white' },
];

export function TaskForm({
  initialData,
  initialDueDate,
  initialDueTime,
  initialIsAllDay,
  initialLabelIds,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const { loadTaskLabels, getTaskLabels } = useLabels();

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'medium');
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(', ') || '');
  const [categoriesInput, setCategoriesInput] = useState(initialData?.categories?.join(', ') || '');
  const [columnId, setColumnId] = useState<ColumnId>(initialData?.columnId || 'todo');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(initialLabelIds || []);

  // Date/time state - prefer explicit props over initialData fields
  const [dueDate, setDueDate] = useState(
    initialDueDate ?? initialData?.dueDate ?? ''
  );
  const [dueTime, setDueTime] = useState(
    initialDueTime ?? initialData?.dueTime ?? ''
  );
  // Default isAllDay to true when no time is set
  const [isAllDay, setIsAllDay] = useState(
    initialIsAllDay ?? initialData?.isAllDay ?? (initialDueTime ? false : true)
  );

  // Load labels for existing task
  useEffect(() => {
    if (initialData?.id && !initialLabelIds) {
      loadTaskLabels(initialData.id).then(() => {
        const labels = getTaskLabels(initialData.id);
        if (labels.length > 0) {
          setSelectedLabelIds(labels.map((l) => l.id));
        }
      });
    }
  }, [initialData?.id, initialLabelIds, loadTaskLabels, getTaskLabels]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validate and sanitize title (trim whitespace)
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    // Parse and validate tags
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0 && tag.length <= VALIDATION.MAX_TAG_LENGTH)
      .slice(0, VALIDATION.MAX_TAGS)
      // Remove duplicates
      .filter((tag, index, self) => self.indexOf(tag) === index);

    // Parse and validate categories
    const categories = categoriesInput
      .split(',')
      .map((cat) => cat.trim())
      .filter((cat) => cat.length > 0 && cat.length <= VALIDATION.MAX_CATEGORY_LENGTH)
      .slice(0, VALIDATION.MAX_CATEGORIES)
      // Remove duplicates
      .filter((cat, index, self) => self.indexOf(cat) === index);

    onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      priority,
      tags,
      categories,
      columnId,
      dueDate: dueDate || undefined,
      dueTime: isAllDay ? undefined : dueTime || undefined,
      isAllDay,
      labelIds: selectedLabelIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-2">
          Title <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={VALIDATION.MAX_TITLE_LENGTH}
          aria-describedby="title-hint"
          className="glass-input w-full px-4 py-3 text-slate-700 placeholder:text-slate-400"
          placeholder="What needs to be done?"
        />
        <p id="title-hint" className="mt-1 text-xs text-slate-400">
          {title.length}/{VALIDATION.MAX_TITLE_LENGTH} characters
        </p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={VALIDATION.MAX_DESCRIPTION_LENGTH}
          aria-describedby="description-hint"
          className="glass-input w-full px-4 py-3 text-slate-700 placeholder:text-slate-400 resize-none"
          placeholder="Add more details..."
        />
        <p id="description-hint" className="mt-1 text-xs text-slate-400">
          {description.length}/{VALIDATION.MAX_DESCRIPTION_LENGTH} characters
        </p>
      </div>

      <div>
        <label id="priority-label" className="block text-sm font-medium text-slate-600 mb-2">
          Priority
        </label>
        <div className="flex gap-2" role="group" aria-labelledby="priority-label">
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPriority(option.value)}
              aria-pressed={priority === option.value}
              aria-label={`Set priority to ${option.label}`}
              className={cn(
                'flex-1 py-2.5 px-3 text-sm font-medium rounded-xl border border-white/40 transition-all duration-200',
                priority === option.value
                  ? `${option.selectedColor} shadow-[0_4px_16px_rgba(100,100,140,0.2)]`
                  : `${option.color} shadow-[0_4px_12px_rgba(100,100,140,0.08)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(100,100,140,0.12)]`
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Labels
        </label>
        <LabelSelector
          selectedLabelIds={selectedLabelIds}
          onLabelChange={setSelectedLabelIds}
        />
        <p className="mt-2 text-xs text-slate-400">
          Color-coded labels for organizing tasks
        </p>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-slate-600 mb-2">
          Tags
        </label>
        <input
          type="text"
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          aria-describedby="tags-hint"
          className="glass-input w-full px-4 py-3 text-slate-700 placeholder:text-slate-400"
          placeholder="design, frontend, urgent"
        />
        <p id="tags-hint" className="mt-2 text-xs text-slate-400">
          Separate tags with commas (max {VALIDATION.MAX_TAGS} tags, {VALIDATION.MAX_TAG_LENGTH} chars each)
        </p>
      </div>

      <div>
        <label htmlFor="categories" className="block text-sm font-medium text-slate-600 mb-2">
          Categories
        </label>
        <input
          type="text"
          id="categories"
          value={categoriesInput}
          onChange={(e) => setCategoriesInput(e.target.value)}
          aria-describedby="categories-hint"
          className="glass-input w-full px-4 py-3 text-slate-700 placeholder:text-slate-400"
          placeholder="Frontend, Backend, DevOps"
        />
        <p id="categories-hint" className="mt-2 text-xs text-slate-400">
          Separate categories with commas (max {VALIDATION.MAX_CATEGORIES} categories, {VALIDATION.MAX_CATEGORY_LENGTH} chars each)
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-600">
          Due Date
        </label>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[160px]">
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
              placeholder="Select date"
            />
          </div>
          {!isAllDay && (
            <div className="w-32">
              <TimePicker
                value={dueTime}
                onChange={setDueTime}
                placeholder="Time"
              />
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={(e) => {
              setIsAllDay(e.target.checked);
              if (e.target.checked) setDueTime('');
            }}
            className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
          />
          <span className="text-sm text-slate-600">All day</span>
        </label>
      </div>

      {initialData && (
        <div>
          <label htmlFor="columnId" className="block text-sm font-medium text-slate-600 mb-2">
            Status
          </label>
          <select
            id="columnId"
            value={columnId}
            onChange={(e) => setColumnId(e.target.value as ColumnId)}
            aria-label="Task status"
            className="glass-input w-full px-4 py-3 text-slate-700"
          >
            <option value="todo">To-Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="glass-btn px-5 py-2.5 font-medium text-sm text-slate-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-5 py-2.5 font-medium text-sm text-white rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 border border-white/20 shadow-[0_4px_16px_rgba(100,150,230,0.3)] hover:shadow-[0_8px_24px_rgba(100,150,230,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_16px_rgba(100,150,230,0.3)] transition-all"
        >
          {initialData ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
