# KanbanBoard Component Documentation

## Overview

The `KanbanBoard` component is the main orchestrator of the Kanban application. It manages the overall board state, coordinates drag-and-drop interactions, and handles all CRUD operations for tasks through modal dialogs.

**File Location**: `src/features/kanban/KanbanBoard.tsx`

---

## Component Hierarchy

```
KanbanBoard (Root Component)
├── Loading State (conditional)
│   └── Spinner + "Loading Board..." message
│
├── Header
│   ├── Title: "Kanban Board"
│   └── Subtitle: "Organize your tasks with drag and drop"
│
├── DndContext (Drag & Drop Provider)
│   ├── KanbanColumn (To-Do)
│   │   └── SortableContext
│   │       └── TaskCard × N (draggable)
│   │
│   ├── KanbanColumn (In Progress)
│   │   └── SortableContext
│   │       └── TaskCard × N (draggable)
│   │
│   ├── KanbanColumn (Completed)
│   │   └── SortableContext
│   │       └── TaskCard × N (draggable)
│   │
│   └── DragOverlay
│       └── TaskCardOverlay (visual feedback during drag)
│
├── Modal (Create/Edit Task)
│   └── TaskForm
│
└── Modal (Delete Confirmation)
    └── Cancel/Delete buttons
```

---

## State Management

The KanbanBoard manages four pieces of local state:

| State Variable | Type | Purpose |
|----------------|------|---------|
| `activeTask` | `Task \| null` | Currently dragged task (for DragOverlay) |
| `editingTask` | `Task \| null` | Task being edited (null = create mode) |
| `isModalOpen` | `boolean` | Controls create/edit modal visibility |
| `deleteConfirmId` | `string \| null` | Task ID pending deletion confirmation |

### State Flow Diagram

```
User Action                    State Changes
──────────────────────────────────────────────────────────────
Click "+" button        →  setEditingTask(null), setIsModalOpen(true)
Click edit on task      →  setEditingTask(task), setIsModalOpen(true)
Click delete on task    →  setDeleteConfirmId(taskId)
Start dragging          →  setActiveTask(task)
Drop task               →  setActiveTask(null), moveTask()
Submit form             →  addTask() or updateTask(), setIsModalOpen(false)
Confirm delete          →  deleteTask(), setDeleteConfirmId(null)
Cancel/Close modal      →  setIsModalOpen(false), setEditingTask(null)
```

---

## The useKanban Hook

The `useKanban` hook provides all task management functionality:

```typescript
interface UseKanbanReturn {
  tasks: Task[];                    // All tasks in the board
  isHydrated: boolean;              // True when localStorage data is loaded
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newColumnId: ColumnId, targetTaskId?: string) => void;
  getTasksByColumn: (columnId: ColumnId) => Task[];
}
```

### Key Features

- **Automatic Persistence**: All operations automatically save to localStorage
- **XSS Protection**: Input is sanitized before storage using `sanitizeTaskData()`
- **Hydration Handling**: `isHydrated` prevents SSR/client mismatch errors
- **Optimistic Updates**: State updates immediately for responsive UX

---

## Drag and Drop Implementation

### @dnd-kit Library Setup

The board uses `@dnd-kit` for accessible drag-and-drop functionality:

```typescript
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
```

### Sensor Configuration

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,  // Prevents accidental drags; requires 8px movement
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,  // Arrow key navigation
  })
);
```

### Collision Detection

The board uses `closestCorners` collision detection, which determines the drop target based on proximity to the corners of droppable areas. This works well for the vertical list layout.

### DragOverlay

The `DragOverlay` component renders a visual copy of the dragged task that follows the cursor:

```tsx
<DragOverlay>
  {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
</DragOverlay>
```

The `TaskCardOverlay` is a display-only version of the task card with a slight rotation and scale for visual feedback.

---

## Event Handlers

### handleDragStart

Called when a user begins dragging a task.

```typescript
const handleDragStart = useCallback(
  (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);  // Store for DragOverlay
    }
  },
  [tasks]
);
```

### handleDragEnd

Called when a drag operation completes. Handles two scenarios:

1. **Drop on Column**: Task moves to the end of the target column
2. **Drop on Task**: Task reorders to the position before the target task

```typescript
const handleDragEnd = useCallback(
  (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;  // Dropped outside valid area

    const taskId = active.id as string;
    const overId = over.id as string;

    if (taskId === overId) return;  // Dropped on itself

    // Check if dropped over a column
    if (COLUMNS.some((col) => col.id === overId)) {
      moveTask(taskId, overId as ColumnId);
      return;
    }

    // Dropped over another task - reorder
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      moveTask(taskId, overTask.columnId, overId);
    }
  },
  [moveTask, tasks]
);
```

### handleAddTask

Opens the modal in create mode:

```typescript
const handleAddTask = useCallback(() => {
  setEditingTask(null);  // null indicates create mode
  setIsModalOpen(true);
}, []);
```

### handleEditTask

Opens the modal in edit mode with pre-populated data:

```typescript
const handleEditTask = useCallback((task: Task) => {
  setEditingTask(task);  // Task data populates the form
  setIsModalOpen(true);
}, []);
```

### handleDeleteTask

Triggers the delete confirmation modal:

```typescript
const handleDeleteTask = useCallback((id: string) => {
  setDeleteConfirmId(id);  // Opens confirmation modal
}, []);
```

### confirmDelete

Executes the actual deletion after confirmation:

```typescript
const confirmDelete = useCallback(() => {
  if (deleteConfirmId) {
    deleteTask(deleteConfirmId);
    setDeleteConfirmId(null);
  }
}, [deleteConfirmId, deleteTask]);
```

### handleSubmitTask

Handles form submission for both create and edit operations:

```typescript
const handleSubmitTask = useCallback(
  (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);  // Edit mode
    } else {
      addTask(taskData);                      // Create mode
    }
    setIsModalOpen(false);
    setEditingTask(null);
  },
  [editingTask, addTask, updateTask]
);
```

---

## Modal Integration

### Create/Edit Modal

The same modal handles both operations, determined by `editingTask`:

```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => {
    setIsModalOpen(false);
    setEditingTask(null);
  }}
  title={editingTask ? 'Edit Task' : 'New Task'}
>
  <TaskForm
    initialData={editingTask || undefined}
    onSubmit={handleSubmitTask}
    onCancel={() => {
      setIsModalOpen(false);
      setEditingTask(null);
    }}
  />
</Modal>
```

### Delete Confirmation Modal

A dedicated modal for delete confirmation:

```tsx
<Modal
  isOpen={!!deleteConfirmId}
  onClose={() => setDeleteConfirmId(null)}
  title="Delete Task"
>
  <p>Are you sure you want to delete this task? This cannot be undone.</p>
  <div>
    <button onClick={() => setDeleteConfirmId(null)}>Cancel</button>
    <button onClick={confirmDelete}>Delete</button>
  </div>
</Modal>
```

### Modal Features

- Focus trap (Tab cycles within modal)
- Escape key closes modal
- Click outside (backdrop) closes modal
- Focus restoration on close
- `aria-modal="true"` and `aria-labelledby` for accessibility

---

## Responsive Design

### Breakpoint Behavior

| Element | Mobile (default) | Tablet/Desktop (md:) |
|---------|------------------|----------------------|
| Container padding | `px-4 py-6` | `px-8 py-10` |
| Column grid | `grid-cols-1` (stacked) | `grid-cols-3` (side-by-side) |
| Column min-height | `min-h-[400px]` | `min-h-[520px]` |
| Header title | `text-3xl` | `text-5xl` |

### CSS Classes Used

```tsx
<div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
  {/* Responsive container */}
</div>

<div className="bento-grid grid-cols-1 md:grid-cols-3 pb-4">
  {/* Columns stack on mobile, side-by-side on tablet+ */}
</div>
```

---

## Loading State

Before localStorage data is hydrated, a loading spinner is shown:

```tsx
if (!isHydrated) {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 p-8 glass-lg">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-sky-400" />
        <p>Loading Board...</p>
      </div>
    </div>
  );
}
```

This prevents hydration mismatches between server-rendered content and client-side localStorage data.

---

## Complete Usage Example

### Basic Integration

```tsx
// src/app/page.tsx
import { KanbanBoard } from '@/features/kanban/KanbanBoard';

export default function Home() {
  return <KanbanBoard />;
}
```

### Task Data Structure

```typescript
interface Task {
  id: string;           // Auto-generated: "1706284800000-abc123def"
  title: string;        // Required, max 100 chars
  description: string;  // Optional, max 500 chars
  priority: Priority;   // 'low' | 'medium' | 'high'
  tags: string[];       // Max 10 tags, 30 chars each
  columnId: ColumnId;   // 'todo' | 'in-progress' | 'completed'
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}
```

### Creating a Task Programmatically

```typescript
// Inside a component with useKanban hook
const { addTask } = useKanban();

addTask({
  title: 'Implement feature X',
  description: 'Add the new dashboard widget',
  priority: 'high',
  tags: ['frontend', 'urgent'],
  columnId: 'todo',
});
```

### Moving a Task Programmatically

```typescript
const { moveTask } = useKanban();

// Move to end of column
moveTask('task-id-123', 'in-progress');

// Reorder before specific task
moveTask('task-id-123', 'in-progress', 'task-id-456');
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@dnd-kit/core` | Latest | Drag and drop primitives |
| `@dnd-kit/sortable` | Latest | Sortable list functionality |
| `@dnd-kit/utilities` | Latest | CSS transform utilities |
| `react` | 19.x | UI library |
| `next` | 16.x | React framework |

---

## Related Components

| Component | File | Description |
|-----------|------|-------------|
| KanbanColumn | `src/features/kanban/KanbanColumn.tsx` | Column container with droppable area |
| TaskCard | `src/features/kanban/TaskCard.tsx` | Draggable task card |
| TaskForm | `src/features/kanban/TaskForm.tsx` | Create/edit form |
| Modal | `src/components/ui/Modal.tsx` | Accessible modal dialog |

---

## Architecture Decisions

1. **Feature-based Structure**: Kanban components are grouped in `src/features/kanban/` for cohesion
2. **Custom Hook for State**: `useKanban` encapsulates all task logic and persistence
3. **Controlled Modals**: Modal state is managed by parent (KanbanBoard) for coordination
4. **Optimistic Updates**: Changes apply immediately; localStorage syncs automatically
5. **Hydration Protection**: Loading state prevents SSR/client mismatch errors
