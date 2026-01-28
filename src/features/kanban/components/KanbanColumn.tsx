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
    glassClass: 'glass-sky',
    headerGradient: 'from-sky-200/80 to-blue-200/80',
    iconBg: 'bg-gradient-to-br from-sky-300 to-blue-400',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  'in-progress': {
    glassClass: 'glass-peach',
    headerGradient: 'from-amber-200/80 to-orange-200/80',
    iconBg: 'bg-gradient-to-br from-amber-300 to-orange-400',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  'completed': {
    glassClass: 'glass-mint',
    headerGradient: 'from-emerald-200/80 to-green-200/80',
    iconBg: 'bg-gradient-to-br from-emerald-300 to-green-400',
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
    <section
      aria-label={`${column.title} column with ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}
      className={cn(
        'bento-block flex min-h-[400px] md:min-h-[520px] w-full flex-col transition-all duration-300',
        config.glassClass,
        isOver && 'scale-[1.02] shadow-[0_20px_60px_rgba(100,100,140,0.2)]'
      )}
    >
      {/* Header */}
      <div className={cn('p-4 border-b border-white/30 bg-gradient-to-r backdrop-blur-sm', config.headerGradient)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)]', config.iconBg)}>
              {config.icon}
            </div>
            <div>
              <h2 className="font-semibold text-slate-700 text-base tracking-tight">{column.title}</h2>
              <p className="text-xs text-slate-500">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p>
            </div>
          </div>
          {column.id === 'todo' && (
            <button
              onClick={onAddTask}
              aria-label="Add new task"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/70 text-slate-600 border border-white/40 shadow-[0_4px_12px_rgba(100,100,140,0.1)] hover:bg-white/90 hover:shadow-[0_6px_20px_rgba(100,100,140,0.15)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 rounded-xl border border-dashed border-slate-300/60 bg-white/30" role="status">
              <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
    </section>
  );
}
