# Types and Constants Reference

This document provides comprehensive documentation for all TypeScript types, interfaces, and constants used in the Kanban board application.

---

## Table of Contents

- [Type Definitions](#type-definitions)
  - [Priority](#priority)
  - [ColumnId](#columnid)
  - [Task](#task)
  - [Column](#column)
  - [KanbanState](#kanbanstate)
- [Constants](#constants)
  - [COLUMNS](#columns)
  - [COLUMN_IDS](#column_ids)
  - [PRIORITY_COLORS](#priority_colors)
  - [LOCAL_STORAGE_KEY](#local_storage_key)
  - [VALIDATION](#validation)
- [Type Usage Examples](#type-usage-examples)
- [Type Safety Considerations](#type-safety-considerations)

---

## Type Definitions

### Priority

A union type representing the priority level of a task.

```typescript
type Priority = 'low' | 'medium' | 'high';
```

| Value | Description | Visual Indicator |
|-------|-------------|------------------|
| `'low'` | Low urgency tasks | Emerald/green badge |
| `'medium'` | Standard priority tasks | Amber/yellow badge |
| `'high'` | Urgent tasks requiring immediate attention | Rose/red badge |

**Source:** `src/types/index.ts`

---

### ColumnId

A union type representing the unique identifier for each Kanban column.

```typescript
type ColumnId = 'todo' | 'in-progress' | 'completed';
```

| Value | Description | Workflow Stage |
|-------|-------------|----------------|
| `'todo'` | Tasks not yet started | Initial stage |
| `'in-progress'` | Tasks currently being worked on | Active stage |
| `'completed'` | Finished tasks | Final stage |

**Source:** `src/types/index.ts`

---

### Task

The primary interface representing a task in the Kanban board.

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  columnId: ColumnId;
  createdAt: string;
  updatedAt: string;
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier generated using timestamp and random string (e.g., `"1706284800000-abc123xyz"`) |
| `title` | `string` | The task title (max 100 characters). Required field, sanitized for XSS prevention |
| `description` | `string` | Detailed task description (max 500 characters). Sanitized for XSS prevention |
| `priority` | `Priority` | Task priority level: `'low'`, `'medium'`, or `'high'` |
| `tags` | `string[]` | Array of tag strings (max 10 tags, each max 30 characters). Each tag is sanitized |
| `columnId` | `ColumnId` | The column where the task resides: `'todo'`, `'in-progress'`, or `'completed'` |
| `createdAt` | `string` | ISO 8601 timestamp when the task was created (e.g., `"2026-01-26T10:30:00.000Z"`) |
| `updatedAt` | `string` | ISO 8601 timestamp of the last modification |

**Source:** `src/types/index.ts`

---

### Column

Interface representing a Kanban column configuration.

```typescript
interface Column {
  id: ColumnId;
  title: string;
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | `ColumnId` | Unique column identifier matching the `ColumnId` type |
| `title` | `string` | Human-readable display title for the column |

**Source:** `src/types/index.ts`

---

### KanbanState

Interface representing the overall Kanban board state.

```typescript
interface KanbanState {
  tasks: Task[];
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `tasks` | `Task[]` | Array of all tasks across all columns |

**Source:** `src/types/index.ts`

---

## Constants

### COLUMNS

Predefined array of column configurations defining the Kanban board structure.

```typescript
import { Column, ColumnId } from '@/types';

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'To-Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' },
];
```

**Usage:** Iterate over this array to render columns in the UI.

**Source:** `src/constants/index.ts`

---

### COLUMN_IDS

Array of all valid column identifiers for validation and iteration.

```typescript
export const COLUMN_IDS: ColumnId[] = ['todo', 'in-progress', 'completed'];
```

**Usage:** Validate that a column ID is valid, or iterate over column IDs.

**Source:** `src/constants/index.ts`

---

### PRIORITY_COLORS

Mapping of priority levels to Tailwind CSS classes for visual styling.

```typescript
export const PRIORITY_COLORS = {
  low: 'bg-emerald-100/80 text-emerald-700',
  medium: 'bg-amber-100/80 text-amber-700',
  high: 'bg-rose-100/80 text-rose-700',
} as const;
```

| Priority | Background | Text Color |
|----------|------------|------------|
| `low` | Semi-transparent emerald | Dark emerald |
| `medium` | Semi-transparent amber | Dark amber |
| `high` | Semi-transparent rose | Dark rose |

**Usage:**
```typescript
import { PRIORITY_COLORS } from '@/constants';

const priorityClass = PRIORITY_COLORS[task.priority];
// Returns: 'bg-emerald-100/80 text-emerald-700' for 'low' priority
```

**Source:** `src/constants/index.ts`

---

### LOCAL_STORAGE_KEY

The key used for persisting tasks in the browser's localStorage.

```typescript
export const LOCAL_STORAGE_KEY = 'kanban-tasks';
```

**Usage:** This key is used internally by the `useLocalStorage` hook to save and retrieve task data.

**Source:** `src/constants/index.ts`

---

### VALIDATION

Constants defining input validation limits for task fields.

```typescript
export const VALIDATION = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAG_LENGTH: 30,
  MAX_TAGS: 10,
} as const;
```

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_TITLE_LENGTH` | `100` | Maximum characters allowed for task title |
| `MAX_DESCRIPTION_LENGTH` | `500` | Maximum characters allowed for task description |
| `MAX_TAG_LENGTH` | `30` | Maximum characters allowed per tag |
| `MAX_TAGS` | `10` | Maximum number of tags per task |

**Usage:**
```typescript
import { VALIDATION } from '@/lib/utils';

if (title.length > VALIDATION.MAX_TITLE_LENGTH) {
  // Show validation error
}
```

**Source:** `src/lib/utils.ts`

---

## Type Usage Examples

### Creating a New Task Object

```typescript
import { Task, Priority, ColumnId } from '@/types';
import { generateId, getTimestamp } from '@/lib/utils';

const newTask: Task = {
  id: generateId(),
  title: 'Implement user authentication',
  description: 'Add OAuth2 login with Google and GitHub providers',
  priority: 'high' as Priority,
  tags: ['security', 'feature', 'backend'],
  columnId: 'todo' as ColumnId,
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
};
```

### Type-Safe Priority Selection

```typescript
import { Priority } from '@/types';
import { PRIORITY_COLORS } from '@/constants';

function getPriorityBadge(priority: Priority): string {
  return PRIORITY_COLORS[priority];
}

// TypeScript will error if an invalid priority is passed
getPriorityBadge('urgent'); // Error: Argument of type '"urgent"' is not assignable
getPriorityBadge('high');   // OK
```

### Filtering Tasks by Column

```typescript
import { Task, ColumnId } from '@/types';

function getTasksByColumn(tasks: Task[], columnId: ColumnId): Task[] {
  return tasks.filter(task => task.columnId === columnId);
}

const todoTasks = getTasksByColumn(allTasks, 'todo');
const inProgressTasks = getTasksByColumn(allTasks, 'in-progress');
```

### Iterating Over Columns

```typescript
import { COLUMNS } from '@/constants';

COLUMNS.forEach(column => {
  console.log(`Column: ${column.title} (ID: ${column.id})`);
});
// Output:
// Column: To-Do (ID: todo)
// Column: In Progress (ID: in-progress)
// Column: Completed (ID: completed)
```

### Partial Task Updates

```typescript
import { Task } from '@/types';

// When updating a task, use Partial to allow updating specific fields
type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt'>>;

const updates: TaskUpdate = {
  title: 'Updated title',
  priority: 'medium',
  // Other fields remain unchanged
};
```

---

## Type Safety Considerations

### 1. Immutable Constants with `as const`

The `PRIORITY_COLORS` and `VALIDATION` objects use `as const` assertion to ensure:
- Values cannot be modified at runtime
- TypeScript infers literal types instead of broader types
- Object properties are readonly

```typescript
// Without 'as const'
const COLORS = { low: 'green' };  // Type: { low: string }

// With 'as const'
const COLORS = { low: 'green' } as const;  // Type: { readonly low: 'green' }
```

### 2. Union Types for Constrained Values

Using union types (`Priority`, `ColumnId`) instead of plain strings ensures:
- Only valid values can be assigned
- IDE autocomplete suggests valid options
- Compile-time errors catch typos

```typescript
// This will cause a TypeScript error:
const task: Task = {
  priority: 'urgent', // Error: Type '"urgent"' is not assignable to type 'Priority'
  columnId: 'done',   // Error: Type '"done"' is not assignable to type 'ColumnId'
  // ...
};
```

### 3. Omit Utility for Derived Types

The codebase uses `Omit<Task, 'id' | 'createdAt' | 'updatedAt'>` to:
- Prevent accidental overwriting of system-generated fields
- Make the API cleaner for consumers
- Enforce that certain fields are always set by the system

```typescript
// When adding a task, you don't provide id, createdAt, or updatedAt
type NewTaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

// The hook handles these fields internally
addTask({
  title: 'New task',
  description: 'Description',
  priority: 'medium',
  tags: [],
  columnId: 'todo',
});
```

### 4. Strict Null Checking

All task fields are required (no optional properties), ensuring:
- No undefined field access errors
- Consistent data structure
- Simpler component logic without null checks

### 5. Type Guards for Runtime Validation

While TypeScript provides compile-time safety, consider adding runtime guards for external data:

```typescript
function isValidColumnId(value: string): value is ColumnId {
  return ['todo', 'in-progress', 'completed'].includes(value);
}

function isValidPriority(value: string): value is Priority {
  return ['low', 'medium', 'high'].includes(value);
}
```

---

*Last Updated: January 2026*
