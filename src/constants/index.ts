import { Column, ColumnId } from '@/types';

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'To-Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' },
];

export const COLUMN_IDS: ColumnId[] = ['todo', 'in-progress', 'completed'];

export const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
} as const;

export const LOCAL_STORAGE_KEY = 'kanban-tasks';
