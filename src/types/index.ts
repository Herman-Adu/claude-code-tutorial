/**
 * Type definitions for the Kanban application.
 *
 * Note: These types support both frontend (lowercase) and database (uppercase)
 * enum values for backwards compatibility during the migration to Prisma.
 */

// ============================================================================
// Frontend Types (lowercase - for UI components)
// ============================================================================

export type Priority = 'low' | 'medium' | 'high';
export type ColumnId = 'todo' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  columnId: ColumnId;
  categories: string[];
  createdAt: string;
  updatedAt: string;
  // Calendar fields (Sprint 3)
  dueDate?: string;   // ISO date string
  dueTime?: string;   // "HH:MM" format
  isAllDay?: boolean;
  // Owner fields
  ownerName?: string | null;
  ownerEmail?: string;
}

export interface Column {
  id: ColumnId;
  title: string;
}

export interface KanbanState {
  tasks: Task[];
}

// ============================================================================
// Database Types (uppercase - matching Prisma schema)
// ============================================================================

export type DbPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type DbColumnId = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface DbTask {
  id: string;
  title: string;
  description: string;
  priority: DbPriority;
  tags: string[];
  columnId: DbColumnId;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
  // Calendar fields (Sprint 3)
  dueDate?: Date | null;
  dueTime?: string | null;
  isAllDay?: boolean;
}

// ============================================================================
// Type Conversion Utilities
// ============================================================================

/**
 * Maps database priority values to frontend priority values.
 */
export const priorityToFrontend: Record<DbPriority, Priority> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

/**
 * Maps frontend priority values to database priority values.
 */
export const priorityToDb: Record<Priority, DbPriority> = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
};

/**
 * Maps database columnId values to frontend columnId values.
 */
export const columnIdToFrontend: Record<DbColumnId, ColumnId> = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

/**
 * Maps frontend columnId values to database columnId values.
 */
export const columnIdToDb: Record<ColumnId, DbColumnId> = {
  'todo': 'TODO',
  'in-progress': 'IN_PROGRESS',
  'completed': 'COMPLETED',
};

/**
 * Converts a database task to a frontend task.
 */
export function dbTaskToFrontend(dbTask: DbTask): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    priority: priorityToFrontend[dbTask.priority],
    tags: dbTask.tags,
    columnId: columnIdToFrontend[dbTask.columnId],
    categories: dbTask.categories,
    createdAt: dbTask.createdAt.toISOString(),
    updatedAt: dbTask.updatedAt.toISOString(),
    // Calendar fields (Sprint 3)
    dueDate: dbTask.dueDate ? dbTask.dueDate.toISOString() : undefined,
    dueTime: dbTask.dueTime ?? undefined,
    isAllDay: dbTask.isAllDay,
  };
}

/**
 * Converts a frontend task to database format.
 * Note: id, createdAt, and updatedAt are handled by the database.
 */
export function frontendTaskToDb(
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): Omit<DbTask, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: task.title,
    description: task.description,
    priority: priorityToDb[task.priority],
    tags: task.tags,
    columnId: columnIdToDb[task.columnId],
    categories: task.categories,
    // Calendar fields (Sprint 3)
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    dueTime: task.dueTime,
    isAllDay: task.isAllDay,
  };
}
