import { Column, ColumnId } from '@/types';

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'To-Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' },
];

export const COLUMN_IDS: ColumnId[] = ['todo', 'in-progress', 'completed'];

export const PRIORITY_COLORS = {
  low: 'bg-emerald-100/80 text-emerald-700',
  medium: 'bg-amber-100/80 text-amber-700',
  high: 'bg-rose-100/80 text-rose-700',
} as const;

export const LOCAL_STORAGE_KEY = 'kanban-tasks';
