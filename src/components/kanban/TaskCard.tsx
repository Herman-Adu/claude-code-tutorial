'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Priority } from '@/types';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_CONFIG: Record<Priority, { border: string; badge: string; label: string }> = {
  low: {
    border: 'border-l-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Low',
  },
  medium: {
    border: 'border-l-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Medium',
  },
  high: {
    border: 'border-l-rose-400',
    badge: 'bg-rose-100 text-rose-700',
    label: 'High',
  },
};

// Display-only card for drag overlay
export function TaskCardOverlay({ task }: { task: Task }) {
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <div className={cn(
      'w-72 rounded-xl bg-white p-4 shadow-2xl border-l-4 rotate-2',
      priority.border
    )}>
      <h3 className="font-medium text-slate-800 mb-2">{task.title}</h3>
      {task.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('px-2 py-1 rounded-md text-xs font-medium', priority.badge)}>
          {priority.label}
        </span>
        {task.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = PRIORITY_CONFIG[task.priority];

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-100/50 p-4 opacity-50"
      >
        <div className="h-5 w-3/4 rounded bg-slate-200 mb-2" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group rounded-xl bg-white p-4 shadow-sm border-l-4 cursor-grab active:cursor-grabbing',
        'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        priority.border
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-slate-800 leading-snug">{task.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('px-2 py-1 rounded-md text-xs font-medium', priority.badge)}>
          {priority.label}
        </span>
        {task.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
