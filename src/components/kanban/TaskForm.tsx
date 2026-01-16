'use client';

import { useState, FormEvent } from 'react';
import { Task, Priority, ColumnId } from '@/types';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'high', label: 'High', color: 'bg-rose-100 text-rose-700 border-rose-200' },
];

export function TaskForm({ initialData, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'medium');
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(', ') || '');
  const [columnId, setColumnId] = useState<ColumnId>(initialData?.columnId || 'todo');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onSubmit({
      title,
      description,
      priority,
      tags,
      columnId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
          Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          placeholder="What needs to be done?"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
          placeholder="Add more details..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Priority
        </label>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPriority(option.value)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all',
                priority === option.value
                  ? option.color
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1.5">
          Tags
        </label>
        <input
          type="text"
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          placeholder="design, frontend, urgent"
        />
        <p className="mt-1.5 text-xs text-slate-400">Separate tags with commas</p>
      </div>

      {initialData && (
        <div>
          <label htmlFor="columnId" className="block text-sm font-medium text-slate-700 mb-1.5">
            Status
          </label>
          <select
            id="columnId"
            value={columnId}
            onChange={(e) => setColumnId(e.target.value as ColumnId)}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
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
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {initialData ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
