# API and Actions Reference

This document provides comprehensive documentation for the Kanban board's state management API, including all available actions, function signatures, and usage examples.

---

## Table of Contents

- [useKanban Hook](#usekanban-hook)
  - [Overview](#overview)
  - [Return Value Interface](#return-value-interface)
- [Actions](#actions)
  - [addTask](#addtask)
  - [updateTask](#updatetask)
  - [deleteTask](#deletetask)
  - [moveTask](#movetask)
  - [getTasksByColumn](#gettasksbycolumn)
- [Data Flow](#data-flow)
- [Input Validation and Sanitization](#input-validation-and-sanitization)
  - [Sanitization Functions](#sanitization-functions)
  - [Validation Constants](#validation-constants)
- [Utility Functions](#utility-functions)

---

## useKanban Hook

### Overview

The `useKanban` hook is the primary state management interface for the Kanban board. It provides all CRUD operations for tasks and handles persistence to localStorage.

```typescript
import { useKanban } from '@/hooks/useKanban';

function KanbanBoard() {
  const {
    tasks,
    isHydrated,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
  } = useKanban();

  // Use the returned values and functions
}
```

**Source:** `src/hooks/useKanban.ts`

---

### Return Value Interface

```typescript
interface UseKanbanReturn {
  tasks: Task[];
  isHydrated: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newColumnId: ColumnId, targetTaskId?: string) => void;
  getTasksByColumn: (columnId: ColumnId) => Task[];
}
```

| Property | Type | Description |
|----------|------|-------------|
| `tasks` | `Task[]` | Array of all tasks in the Kanban board |
| `isHydrated` | `boolean` | Whether localStorage data has been loaded (prevents hydration mismatch) |
| `addTask` | `function` | Creates a new task |
| `updateTask` | `function` | Updates an existing task |
| `deleteTask` | `function` | Removes a task |
| `moveTask` | `function` | Moves a task between columns or reorders within a column |
| `getTasksByColumn` | `function` | Retrieves all tasks for a specific column |

---

## Actions

### addTask

Creates a new task and adds it to the Kanban board.

#### Signature

```typescript
addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task` | `Omit<Task, 'id' \| 'createdAt' \| 'updatedAt'>` | Yes | Task data without system-generated fields |

The `task` object must include:

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Task title (will be sanitized) |
| `description` | `string` | Task description (will be sanitized) |
| `priority` | `Priority` | `'low'`, `'medium'`, or `'high'` |
| `tags` | `string[]` | Array of tag strings (will be sanitized) |
| `columnId` | `ColumnId` | Initial column: `'todo'`, `'in-progress'`, or `'completed'` |

#### Return Value

`void` - The function does not return a value. State is updated asynchronously.

#### Behavior

1. Generates a unique ID using `generateId()`
2. Creates ISO timestamp for `createdAt` and `updatedAt`
3. Sanitizes all user-provided strings (title, description, tags)
4. Appends the new task to the existing tasks array
5. Persists to localStorage automatically

#### Example

```typescript
const { addTask } = useKanban();

// Add a new task
addTask({
  title: 'Implement login feature',
  description: 'Add OAuth2 authentication with Google provider',
  priority: 'high',
  tags: ['feature', 'security'],
  columnId: 'todo',
});
```

#### Notes

- The `id`, `createdAt`, and `updatedAt` fields are automatically generated
- Input is sanitized to prevent XSS attacks before storage
- The task is appended to the end of the tasks array

---

### updateTask

Updates an existing task with new values.

#### Signature

```typescript
updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | The unique identifier of the task to update |
| `updates` | `Partial<Omit<Task, 'id' \| 'createdAt'>>` | Yes | Object containing fields to update |

The `updates` object can include any combination of:

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | New task title |
| `description` | `string` | New task description |
| `priority` | `Priority` | New priority level |
| `tags` | `string[]` | New tags array |
| `columnId` | `ColumnId` | Move task to different column |

#### Return Value

`void` - The function does not return a value.

#### Behavior

1. Finds the task by ID in the tasks array
2. Sanitizes any string fields in the updates
3. Merges updates with existing task data
4. Updates the `updatedAt` timestamp
5. Persists to localStorage automatically
6. If no task matches the ID, no changes are made

#### Example

```typescript
const { updateTask } = useKanban();

// Update only the priority
updateTask('1706284800000-abc123xyz', {
  priority: 'high',
});

// Update multiple fields
updateTask('1706284800000-abc123xyz', {
  title: 'Updated title',
  description: 'New description',
  tags: ['urgent', 'frontend'],
});

// Move task to a different column
updateTask('1706284800000-abc123xyz', {
  columnId: 'completed',
});
```

#### Notes

- Only provided fields are updated; others remain unchanged
- The `id` and `createdAt` fields cannot be modified
- The `updatedAt` field is automatically set to the current timestamp

---

### deleteTask

Removes a task from the Kanban board.

#### Signature

```typescript
deleteTask: (id: string) => void
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | The unique identifier of the task to delete |

#### Return Value

`void` - The function does not return a value.

#### Behavior

1. Filters out the task with the matching ID
2. Updates the tasks array
3. Persists to localStorage automatically
4. If no task matches the ID, no changes are made

#### Example

```typescript
const { deleteTask } = useKanban();

// Delete a task
deleteTask('1706284800000-abc123xyz');

// With confirmation dialog
const handleDelete = (taskId: string) => {
  if (confirm('Are you sure you want to delete this task?')) {
    deleteTask(taskId);
  }
};
```

#### Notes

- Deletion is permanent and cannot be undone
- The UI should implement a confirmation dialog before calling this function

---

### moveTask

Moves a task to a different column or reorders it within the same column.

#### Signature

```typescript
moveTask: (taskId: string, newColumnId: ColumnId, targetTaskId?: string) => void
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | `string` | Yes | The ID of the task to move |
| `newColumnId` | `ColumnId` | Yes | The destination column ID |
| `targetTaskId` | `string` | No | Optional ID of task to insert before |

#### Return Value

`void` - The function does not return a value.

#### Behavior

1. Locates the task to move
2. Removes it from its current position
3. Updates the task's `columnId` and `updatedAt`
4. Inserts at the appropriate position:
   - If `targetTaskId` is provided: inserts before that task
   - If no `targetTaskId`: appends to the end of the target column
5. Maintains proper ordering based on column sequence

#### Example

```typescript
const { moveTask } = useKanban();

// Move task to a different column (append to end)
moveTask('task-123', 'in-progress');

// Move task to a specific position (before another task)
moveTask('task-123', 'todo', 'task-456');

// Reorder within the same column
moveTask('task-123', 'todo', 'task-789');
```

#### Drag and Drop Integration

```typescript
import { DragEndEvent } from '@dnd-kit/core';

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over) return;

  const taskId = active.id as string;
  const overId = over.id as string;

  // Determine if dropping on a column or another task
  if (COLUMN_IDS.includes(overId as ColumnId)) {
    // Dropping on empty column area
    moveTask(taskId, overId as ColumnId);
  } else {
    // Dropping on another task - insert before it
    const targetTask = tasks.find(t => t.id === overId);
    if (targetTask) {
      moveTask(taskId, targetTask.columnId, overId);
    }
  }
};
```

#### Notes

- This function is primarily used with drag-and-drop operations
- The `updatedAt` timestamp is updated when a task is moved
- Moving maintains the visual order seen in the UI

---

### getTasksByColumn

Retrieves all tasks belonging to a specific column.

#### Signature

```typescript
getTasksByColumn: (columnId: ColumnId) => Task[]
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `columnId` | `ColumnId` | Yes | The column ID to filter by |

#### Return Value

`Task[]` - Array of tasks in the specified column, preserving order.

#### Example

```typescript
const { getTasksByColumn } = useKanban();

// Get all tasks in the "To-Do" column
const todoTasks = getTasksByColumn('todo');

// Render tasks for each column
const columns = ['todo', 'in-progress', 'completed'] as const;

columns.forEach(columnId => {
  const columnTasks = getTasksByColumn(columnId);
  console.log(`${columnId}: ${columnTasks.length} tasks`);
});
```

#### Notes

- Returns an empty array if the column has no tasks
- The returned array maintains the order of tasks as stored
- This function is memoized with `useCallback` for performance

---

## Data Flow

The following diagram illustrates how data flows through the application:

```
User Interaction (click, drag, form submit)
              |
              v
+---------------------------+
|    Component Event        |
|    Handler                |
+---------------------------+
              |
              v
+---------------------------+
|    useKanban Hook         |
|    (addTask, updateTask,  |
|     deleteTask, moveTask) |
+---------------------------+
              |
              |  1. Sanitize input data
              |  2. Generate ID/timestamp if needed
              |  3. Update state
              v
+---------------------------+
|    useLocalStorage Hook   |
|    (setTasks)             |
+---------------------------+
              |
              |  1. Update React state
              |  2. Serialize to JSON
              |  3. Write to localStorage
              v
+---------------------------+
|    localStorage           |
|    (kanban-tasks)         |
+---------------------------+
              |
              |  State update triggers
              v
+---------------------------+
|    React Re-render        |
|    (UI updates)           |
+---------------------------+
```

### Hydration Protection

The `isHydrated` flag prevents hydration mismatches in Next.js:

```typescript
const { tasks, isHydrated } = useKanban();

// Show loading state until localStorage data is loaded
if (!isHydrated) {
  return <LoadingSpinner />;
}

// Safe to render tasks
return <TaskList tasks={tasks} />;
```

---

## Input Validation and Sanitization

### Sanitization Functions

All user input is sanitized before storage to prevent XSS attacks.

#### sanitizeString

Escapes HTML entities in a string.

```typescript
function sanitizeString(input: string): string
```

**Escaped Characters:**

| Character | Escaped As |
|-----------|------------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#x27;` |
| `/` | `&#x2F;` |

**Example:**

```typescript
import { sanitizeString } from '@/lib/utils';

sanitizeString('<script>alert("xss")</script>');
// Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'

sanitizeString('Normal text');
// Returns: 'Normal text'
```

#### sanitizeTaskData

Sanitizes all string fields in a task data object.

```typescript
function sanitizeTaskData<T extends {
  title?: string;
  description?: string;
  tags?: string[]
}>(data: T): T
```

**Sanitized Fields:**
- `title` - Task title
- `description` - Task description
- `tags` - Each tag in the array

**Example:**

```typescript
import { sanitizeTaskData } from '@/lib/utils';

const userInput = {
  title: '<b>Bold Title</b>',
  description: 'Description with <script>bad code</script>',
  tags: ['<tag>', 'normal-tag'],
};

const sanitized = sanitizeTaskData(userInput);
// Returns:
// {
//   title: '&lt;b&gt;Bold Title&lt;&#x2F;b&gt;',
//   description: 'Description with &lt;script&gt;bad code&lt;&#x2F;script&gt;',
//   tags: ['&lt;tag&gt;', 'normal-tag'],
// }
```

**Source:** `src/lib/utils.ts`

---

### Validation Constants

Use these constants to enforce input limits in your forms.

```typescript
import { VALIDATION } from '@/lib/utils';

export const VALIDATION = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAG_LENGTH: 30,
  MAX_TAGS: 10,
} as const;
```

#### Form Validation Example

```typescript
import { VALIDATION } from '@/lib/utils';

function validateTaskForm(data: {
  title: string;
  description: string;
  tags: string[];
}): string[] {
  const errors: string[] = [];

  if (!data.title.trim()) {
    errors.push('Title is required');
  } else if (data.title.length > VALIDATION.MAX_TITLE_LENGTH) {
    errors.push(`Title must be ${VALIDATION.MAX_TITLE_LENGTH} characters or less`);
  }

  if (data.description.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description must be ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters or less`);
  }

  if (data.tags.length > VALIDATION.MAX_TAGS) {
    errors.push(`Maximum ${VALIDATION.MAX_TAGS} tags allowed`);
  }

  const longTags = data.tags.filter(tag => tag.length > VALIDATION.MAX_TAG_LENGTH);
  if (longTags.length > 0) {
    errors.push(`Tags must be ${VALIDATION.MAX_TAG_LENGTH} characters or less`);
  }

  return errors;
}
```

---

## Utility Functions

### generateId

Generates a unique identifier for new tasks.

```typescript
function generateId(): string
```

**Format:** `{timestamp}-{random}`

**Example output:** `"1706284800000-abc123xyz"`

```typescript
import { generateId } from '@/lib/utils';

const id = generateId();
// "1706284800000-k7m2n9p4q"
```

---

### getTimestamp

Returns the current time as an ISO 8601 string.

```typescript
function getTimestamp(): string
```

**Example output:** `"2026-01-26T10:30:00.000Z"`

```typescript
import { getTimestamp } from '@/lib/utils';

const timestamp = getTimestamp();
// "2026-01-26T10:30:00.000Z"
```

---

### cn (className utility)

Combines CSS class names, filtering out falsy values.

```typescript
function cn(...classes: (string | boolean | undefined)[]): string
```

**Example:**

```typescript
import { cn } from '@/lib/utils';

cn('base-class', isActive && 'active', isDisabled && 'disabled');
// If isActive=true, isDisabled=false: "base-class active"

cn('btn', 'btn-primary', undefined, false, 'btn-large');
// "btn btn-primary btn-large"
```

---

## Complete Usage Example

```typescript
'use client';

import { useKanban } from '@/hooks/useKanban';
import { COLUMNS } from '@/constants';
import { VALIDATION } from '@/lib/utils';
import { Task, ColumnId, Priority } from '@/types';

export function KanbanExample() {
  const {
    tasks,
    isHydrated,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
  } = useKanban();

  // Wait for hydration
  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  // Add a new task
  const handleAdd = () => {
    addTask({
      title: 'New Task',
      description: 'Task description',
      priority: 'medium',
      tags: ['example'],
      columnId: 'todo',
    });
  };

  // Update task priority
  const handlePriorityChange = (taskId: string, priority: Priority) => {
    updateTask(taskId, { priority });
  };

  // Move task to completed
  const handleComplete = (taskId: string) => {
    moveTask(taskId, 'completed');
  };

  // Delete task with confirmation
  const handleDelete = (taskId: string) => {
    if (window.confirm('Delete this task?')) {
      deleteTask(taskId);
    }
  };

  return (
    <div>
      <button onClick={handleAdd}>Add Task</button>

      {COLUMNS.map(column => (
        <div key={column.id}>
          <h2>{column.title}</h2>
          {getTasksByColumn(column.id).map(task => (
            <div key={task.id}>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <button onClick={() => handleComplete(task.id)}>
                Complete
              </button>
              <button onClick={() => handleDelete(task.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

*Last Updated: January 2026*
