'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Priority } from '@/types';
import { cn } from '@/lib/utils';
import { getCategoryColor } from '@/components/ui/Badge';
import { LabelBadge } from '@/components/ui/LabelBadge';
import { useTaskLabels } from '@/store/labels';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const MAX_VISIBLE_LABELS = 3;

const PRIORITY_CONFIG: Record<Priority, { accent: string; badge: string; badgeBg: string; label: string }> = {
  low: {
    accent: 'bg-gradient-to-r from-emerald-300/40 to-transparent',
    badge: 'text-emerald-700',
    badgeBg: 'bg-emerald-100/80',
    label: 'Low',
  },
  medium: {
    accent: 'bg-gradient-to-r from-amber-300/40 to-transparent',
    badge: 'text-amber-700',
    badgeBg: 'bg-amber-100/80',
    label: 'Medium',
  },
  high: {
    accent: 'bg-gradient-to-r from-rose-300/40 to-transparent',
    badge: 'text-rose-700',
    badgeBg: 'bg-rose-100/80',
    label: 'High',
  },
};

// Display-only card for drag overlay
export function TaskCardOverlay({ task }: { task: Task }) {
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <div className="w-72 glass-sm p-4 rotate-2 scale-105">
      <div className={cn('absolute inset-y-0 left-0 w-1 rounded-l-xl', priority.accent.replace('to-transparent', ''))} />
      <h3 className="font-semibold text-slate-700 mb-2">{task.title}</h3>
      {task.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('px-2.5 py-1 text-xs font-medium rounded-lg', priority.badgeBg, priority.badge)}>
          {priority.label}
        </span>
        {task.tags.map((tag) => (
          <span key={tag} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-violet-100/70 text-violet-600">
            {tag}
          </span>
        ))}
      </div>
      {/* Categories section */}
      {task.categories && task.categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/50">
          <svg
            className="w-3 h-3 text-slate-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {task.categories.map((category) => (
            <span
              key={category}
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-md border backdrop-blur-sm',
                getCategoryColor(category)
              )}
            >
              {category}
            </span>
          ))}
        </div>
      )}
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

  // Get labels for this task (returns StoreLabel[] directly)
  const labelObjects = useTaskLabels(task.id);

  const visibleLabels = labelObjects.slice(0, MAX_VISIBLE_LABELS);
  const hiddenLabelCount = labelObjects.length - MAX_VISIBLE_LABELS;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-xl border border-dashed border-slate-300/60 bg-white/30 p-4"
      >
        <div className="h-4 w-3/4 rounded bg-slate-200/50 mb-2" />
        <div className="h-3 w-1/2 rounded bg-slate-200/40" />
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
        'relative glass-sm p-4 cursor-grab active:cursor-grabbing overflow-hidden',
        'hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(100,100,140,0.15)] transition-all duration-200'
      )}
    >
      {/* Priority accent bar */}
      <div className={cn('absolute inset-y-0 left-0 w-1 rounded-l-xl', priority.accent.replace('to-transparent', ''))} />

      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-slate-700 leading-snug">{task.title}</h3>
        <div className="flex gap-1.5" role="group" aria-label="Task actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-white/60 text-slate-500 border border-white/40 shadow-[0_2px_8px_rgba(100,100,140,0.08)] hover:bg-sky-50 hover:text-sky-600 hover:shadow-[0_4px_12px_rgba(100,150,230,0.15)] transition-all"
            aria-label={`Edit task: ${task.title}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-white/60 text-slate-500 border border-white/40 shadow-[0_2px_8px_rgba(100,100,140,0.08)] hover:bg-rose-50 hover:text-rose-500 hover:shadow-[0_4px_12px_rgba(240,150,150,0.15)] transition-all"
            aria-label={`Delete task: ${task.title}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {/* Priority and Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn('px-2.5 py-1 text-xs font-medium rounded-lg', priority.badgeBg, priority.badge)}>
          {priority.label}
        </span>
        {task.tags.map((tag) => (
          <span key={tag} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-violet-100/70 text-violet-600">
            {tag}
          </span>
        ))}
      </div>

      {/* Labels section */}
      {labelObjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/50">
          {visibleLabels.map((label) => (
            <LabelBadge key={label.id} label={label} size="sm" />
          ))}
          {hiddenLabelCount > 0 && (
            <span
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600"
              title={`${hiddenLabelCount} more label${hiddenLabelCount > 1 ? 's' : ''}`}
            >
              +{hiddenLabelCount}
            </span>
          )}
        </div>
      )}

      {/* Categories section - visually distinct from tags */}
      {task.categories && task.categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/50">
          <svg
            className="w-3 h-3 text-slate-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {task.categories.map((category) => (
            <span
              key={category}
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-md border backdrop-blur-sm',
                getCategoryColor(category)
              )}
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {/* Owner info */}
      {(task.ownerName || task.ownerEmail) && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/50">
          <svg
            className="w-3 h-3 text-slate-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span
            className="text-xs text-slate-600 font-medium truncate"
            title={task.ownerName || task.ownerEmail}
            aria-label={`Task owner: ${task.ownerName || task.ownerEmail}`}
          >
            {task.ownerName || task.ownerEmail}
          </span>
        </div>
      )}
    </div>
  );
}
