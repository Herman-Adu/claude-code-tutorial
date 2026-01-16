export type Priority = 'low' | 'medium' | 'high';
export type ColumnId = 'todo' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  columnId: ColumnId;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: ColumnId;
  title: string;
}

export interface KanbanState {
  tasks: Task[];
}
