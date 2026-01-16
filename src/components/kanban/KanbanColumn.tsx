'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Task } from '@/types';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const COLUMN_CONFIG = {
  'todo': {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50/50',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
      </svg>
    ),
  },
  'in-progress': {
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50/50',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  'completed': {
    gradient: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-50/50',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
} as const;

export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const config = COLUMN_CONFIG[column.id];

  return (
    <div
      className={cn(
        'flex min-h-[400px] md:min-h-[550px] w-full md:w-80 flex-shrink-0 flex-col rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-200',
        isOver && 'ring-2 ring-indigo-400 ring-offset-2 bg-white/90'
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br text-white shadow-sm', config.gradient)}>
              {config.icon}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">{column.title}</h2>
              <p className="text-xs text-slate-400">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p>
            </div>
          </div>
          {column.id === 'todo' && (
            <button
              onClick={onAddTask}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div
        ref={setNodeRef}
        className={cn('flex-1 space-y-3 overflow-y-auto px-4 pb-4', config.bg)}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-slate-200 bg-white/50">
              <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-slate-400">No tasks yet</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
