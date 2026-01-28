# Feature Components Documentation

This document provides comprehensive documentation for the Kanban board feature components. These components implement the core functionality of the task management application, including drag-and-drop, task CRUD operations, and form handling.

---

## Table of Contents

- [Overview](#overview)
- [KanbanColumn Component](#kanbancolumn-component)
- [TaskCard Component](#taskcard-component)
- [TaskForm Component](#taskform-component)
- [Component Composition Patterns](#component-composition-patterns)
- [State Management](#state-management)
- [Event Handling](#event-handling)

---

## Overview

Feature components are located in `src/features/kanban/` and implement the domain-specific functionality of the Kanban board. Unlike UI primitives, these components contain business logic and are tightly coupled to the application's data models.

### Component Hierarchy

```
KanbanBoard (Orchestrator)
├── Modal (Create/Edit Task)
│   └── TaskForm
├── Modal (Delete Confirmation)
├── DndContext (Drag & Drop Provider)
│   └── KanbanColumn x 3
│       └── SortableContext
│           └── TaskCard x N
└── DragOverlay
    └── TaskCardOverlay
```

### Dependencies

- **@dnd-kit/core**: Core drag-and-drop functionality
- **@dnd-kit/sortable**: Sortable list functionality
- **@dnd-kit/utilities**: CSS transform utilities

### Type Definitions

```typescript
// src/types/index.ts
type Priority = 'low' | 'medium' | 'high';
type ColumnId = 'todo' | 'in-progress' | 'completed';

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

interface Column {
  id: ColumnId;
  title: string;
}
```

---

## KanbanColumn Component

**File:** `src/features/kanban/KanbanColumn.tsx`

A droppable column container that displays tasks and provides visual feedback during drag operations.

### Props Interface

```typescript
interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}
```

### Props Table

| Prop | Type | Description |
|------|------|-------------|
| `column` | `Column` | Column configuration (id and title) |
| `tasks` | `Task[]` | Array of tasks to display in this column |
| `onAddTask` | `() => void` | Callback to open the create task modal |
| `onEditTask` | `(task: Task) => void` | Callback when edit is clicked on a task |
| `onDeleteTask` | `(id: string) => void` | Callback when delete is clicked on a task |

### Column Configuration

Each column has a unique visual style defined in `COLUMN_CONFIG`:

```typescript
const COLUMN_CONFIG = {
  'todo': {
    glassClass: 'glass-sky',
    headerGradient: 'from-sky-200/80 to-blue-200/80',
    iconBg: 'bg-gradient-to-br from-sky-300 to-blue-400',
    icon: <CircleIcon />,
  },
  'in-progress': {
    glassClass: 'glass-peach',
    headerGradient: 'from-amber-200/80 to-orange-200/80',
    iconBg: 'bg-gradient-to-br from-amber-300 to-orange-400',
    icon: <LightningIcon />,
  },
  'completed': {
    glassClass: 'glass-mint',
    headerGradient: 'from-emerald-200/80 to-green-200/80',
    iconBg: 'bg-gradient-to-br from-emerald-300 to-green-400',
    icon: <CheckIcon />,
  },
} as const;
```

### Drag-Drop Integration

The component uses `@dnd-kit/core`'s `useDroppable` hook:

```typescript
const { setNodeRef, isOver } = useDroppable({
  id: column.id,
});
```

| Hook Return | Purpose |
|-------------|---------|
| `setNodeRef` | Attaches droppable behavior to the task list container |
| `isOver` | Boolean indicating if a draggable is currently over this column |

### Visual Feedback

When a task is dragged over a column (`isOver === true`):

```typescript
className={cn(
  'bento-block flex min-h-[400px] md:min-h-[520px] w-full flex-col transition-all duration-300',
  config.glassClass,
  isOver && 'scale-[1.02] shadow-[0_20px_60px_rgba(100,100,140,0.2)]'
)}
```

### Structure

```tsx
<section aria-label={`${column.title} column with ${tasks.length} tasks`}>
  {/* Header with icon, title, task count, and add button */}
  <div className="header">
    <div className="icon-container">{config.icon}</div>
    <div>
      <h2>{column.title}</h2>
      <p>{tasks.length} tasks</p>
    </div>
    {column.id === 'todo' && <AddButton onClick={onAddTask} />}
  </div>

  {/* Task List */}
  <div ref={setNodeRef} className="flex-1 space-y-3 overflow-y-auto p-4">
    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        tasks.map(task => (
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
```

### Usage Example

```tsx
import { KanbanColumn } from '@/features/kanban/KanbanColumn';

<KanbanColumn
  column={{ id: 'todo', title: 'To-Do' }}
  tasks={todoTasks}
  onAddTask={() => setIsModalOpen(true)}
  onEditTask={(task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  }}
  onDeleteTask={(id) => setDeleteConfirmId(id)}
/>
```

### Accessibility Features

- Uses `<section>` element with descriptive `aria-label`
- Task count included in ARIA label for screen readers
- Empty state has `role="status"` for announcements
- Add button has `aria-label="Add new task"`
- Decorative icons use `aria-hidden="true"`

---

## TaskCard Component

**File:** `src/features/kanban/TaskCard.tsx`

A draggable task card that displays task information and provides edit/delete actions.

### Props Interface

```typescript
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}
```

### Props Table

| Prop | Type | Description |
|------|------|-------------|
| `task` | `Task` | Task data to display |
| `onEdit` | `(task: Task) => void` | Callback when edit button is clicked |
| `onDelete` | `(id: string) => void` | Callback when delete button is clicked |

### Draggable Behavior

The component uses `@dnd-kit/sortable`'s `useSortable` hook:

```typescript
const {
  attributes,    // ARIA attributes for accessibility
  listeners,     // Event listeners for drag initiation
  setNodeRef,    // Ref callback for the draggable element
  transform,     // Current transform state
  transition,    // CSS transition string
  isDragging,    // Boolean indicating active drag
} = useSortable({ id: task.id });

const style = {
  transform: CSS.Transform.toString(transform),
  transition,
};
```

### Priority Configuration

```typescript
const PRIORITY_CONFIG: Record<Priority, {
  accent: string;
  badge: string;
  badgeBg: string;
  label: string;
}> = {
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
```

### Drag States

#### Normal State
Full card rendering with all content and interactions.

#### Dragging State (Placeholder)
When actively dragging, a placeholder is shown in the original position:

```tsx
if (isDragging) {
  return (
    <div ref={setNodeRef} style={style}
      className="rounded-xl border border-dashed border-slate-300/60 bg-white/30 p-4">
      <div className="h-4 w-3/4 rounded bg-slate-200/50 mb-2" />
      <div className="h-3 w-1/2 rounded bg-slate-200/40" />
    </div>
  );
}
```

### TaskCardOverlay Component

A separate display-only component used for the drag overlay:

```typescript
export function TaskCardOverlay({ task }: { task: Task }) {
  // Renders a slightly rotated and scaled version
  // className="w-72 glass-sm p-4 rotate-2 scale-105"
}
```

### Event Handling

Action buttons use `stopPropagation` to prevent drag initiation:

```tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    onEdit(task);
  }}
  onPointerDown={(e) => e.stopPropagation()}
  aria-label={`Edit task: ${task.title}`}
>
  <EditIcon />
</button>
```

### Structure

```tsx
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  className="relative glass-sm p-4 cursor-grab active:cursor-grabbing"
>
  {/* Priority accent bar */}
  <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl {priority.accent}" />

  {/* Header with title and actions */}
  <div className="flex items-start justify-between gap-2 mb-2">
    <h3>{task.title}</h3>
    <div role="group" aria-label="Task actions">
      <EditButton />
      <DeleteButton />
    </div>
  </div>

  {/* Description (optional) */}
  {task.description && <p className="line-clamp-2">{task.description}</p>}

  {/* Badges */}
  <div className="flex flex-wrap items-center gap-1.5">
    <PriorityBadge />
    {task.tags.map(tag => <TagBadge key={tag} />)}
  </div>
</div>
```

### Usage Example

```tsx
import { TaskCard, TaskCardOverlay } from '@/features/kanban/TaskCard';

// In SortableContext
<TaskCard
  task={task}
  onEdit={(task) => handleEditTask(task)}
  onDelete={(id) => handleDeleteTask(id)}
/>

// In DragOverlay
<DragOverlay>
  {activeTask && <TaskCardOverlay task={activeTask} />}
</DragOverlay>
```

### Accessibility Features

- Action buttons have descriptive `aria-label` including task title
- Action group has `role="group"` with `aria-label="Task actions"`
- Decorative icons use `aria-hidden="true"`
- Cursor changes to `grab`/`grabbing` for drag indication

---

## TaskForm Component

**File:** `src/features/kanban/TaskForm.tsx`

A form component for creating and editing tasks with validation and glassmorphic styling.

### Props Interface

```typescript
interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}
```

### Props Table

| Prop | Type | Description |
|------|------|-------------|
| `initialData` | `Task \| undefined` | Existing task for edit mode (undefined for create) |
| `onSubmit` | `(data) => void` | Callback with validated form data |
| `onCancel` | `() => void` | Callback when cancel is clicked |

### Form State

```typescript
const [title, setTitle] = useState(initialData?.title || '');
const [description, setDescription] = useState(initialData?.description || '');
const [priority, setPriority] = useState<Priority>(initialData?.priority || 'medium');
const [tagsInput, setTagsInput] = useState(initialData?.tags.join(', ') || '');
const [columnId, setColumnId] = useState<ColumnId>(initialData?.columnId || 'todo');
```

### Validation

The form implements validation using constants from `@/lib/utils`:

```typescript
export const VALIDATION = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAG_LENGTH: 30,
  MAX_TAGS: 10,
} as const;
```

#### Title Validation
- Required field (submit disabled if empty after trim)
- Maximum 100 characters
- Whitespace trimmed

#### Description Validation
- Optional field
- Maximum 500 characters
- Whitespace trimmed

#### Tags Validation
- Comma-separated input
- Each tag trimmed
- Empty tags filtered out
- Maximum 30 characters per tag
- Maximum 10 tags
- Duplicates removed

```typescript
const tags = tagsInput
  .split(',')
  .map((tag) => tag.trim())
  .filter((tag) => tag.length > 0 && tag.length <= VALIDATION.MAX_TAG_LENGTH)
  .slice(0, VALIDATION.MAX_TAGS)
  .filter((tag, index, self) => self.indexOf(tag) === index);
```

### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Title | text input | Yes | Max 100 chars |
| Description | textarea | No | Max 500 chars |
| Priority | button group | Yes | Low/Medium/High |
| Tags | text input | No | Comma-separated, max 10 tags |
| Status | select | No (edit only) | Todo/In Progress/Completed |

### Priority Selector

The priority field uses toggle buttons with visual feedback:

```typescript
const PRIORITY_OPTIONS = [
  {
    value: 'low',
    label: 'Low',
    color: 'bg-white/60 text-slate-600',
    selectedColor: 'bg-gradient-to-br from-emerald-300 to-green-400 text-white'
  },
  {
    value: 'medium',
    label: 'Medium',
    color: 'bg-white/60 text-slate-600',
    selectedColor: 'bg-gradient-to-br from-amber-300 to-orange-400 text-white'
  },
  {
    value: 'high',
    label: 'High',
    color: 'bg-white/60 text-slate-600',
    selectedColor: 'bg-gradient-to-br from-rose-400 to-pink-500 text-white'
  },
];
```

### Form Submission

```typescript
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();

  const trimmedTitle = title.trim();
  if (!trimmedTitle) return;

  // Parse and validate tags
  const tags = /* validation logic */;

  onSubmit({
    title: trimmedTitle,
    description: description.trim(),
    priority,
    tags,
    columnId,
  });
};
```

### Structure

```tsx
<form onSubmit={handleSubmit} className="space-y-5">
  {/* Title Field */}
  <div>
    <label htmlFor="title">Title <span className="text-rose-400">*</span></label>
    <input
      type="text"
      id="title"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      required
      maxLength={VALIDATION.MAX_TITLE_LENGTH}
      aria-describedby="title-hint"
      className="glass-input w-full"
    />
    <p id="title-hint">{title.length}/{VALIDATION.MAX_TITLE_LENGTH} characters</p>
  </div>

  {/* Description Field */}
  <div>
    <label htmlFor="description">Description</label>
    <textarea
      id="description"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      maxLength={VALIDATION.MAX_DESCRIPTION_LENGTH}
      aria-describedby="description-hint"
      className="glass-input w-full"
    />
    <p id="description-hint">{description.length}/{VALIDATION.MAX_DESCRIPTION_LENGTH} characters</p>
  </div>

  {/* Priority Selector */}
  <div>
    <label id="priority-label">Priority</label>
    <div role="group" aria-labelledby="priority-label">
      {PRIORITY_OPTIONS.map(option => (
        <button
          type="button"
          onClick={() => setPriority(option.value)}
          aria-pressed={priority === option.value}
          aria-label={`Set priority to ${option.label}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>

  {/* Tags Field */}
  <div>
    <label htmlFor="tags">Tags</label>
    <input
      type="text"
      id="tags"
      value={tagsInput}
      onChange={(e) => setTagsInput(e.target.value)}
      aria-describedby="tags-hint"
      className="glass-input w-full"
    />
    <p id="tags-hint">Separate tags with commas (max 10 tags, 30 chars each)</p>
  </div>

  {/* Status Field (Edit mode only) */}
  {initialData && (
    <div>
      <label htmlFor="columnId">Status</label>
      <select id="columnId" value={columnId} onChange={(e) => setColumnId(e.target.value)}>
        <option value="todo">To-Do</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  )}

  {/* Action Buttons */}
  <div className="flex justify-end gap-3">
    <button type="button" onClick={onCancel} className="glass-btn">
      Cancel
    </button>
    <button type="submit" disabled={!title.trim()}>
      {initialData ? 'Save Changes' : 'Create Task'}
    </button>
  </div>
</form>
```

### Usage Example

```tsx
import { TaskForm } from '@/features/kanban/TaskForm';

// Create mode
<Modal isOpen={isOpen} onClose={onClose} title="Create Task">
  <TaskForm
    onSubmit={(data) => {
      addTask(data);
      onClose();
    }}
    onCancel={onClose}
  />
</Modal>

// Edit mode
<Modal isOpen={isOpen} onClose={onClose} title="Edit Task">
  <TaskForm
    initialData={editingTask}
    onSubmit={(data) => {
      updateTask(editingTask.id, data);
      onClose();
    }}
    onCancel={onClose}
  />
</Modal>
```

### Accessibility Features

- All inputs have associated `<label>` elements
- Required fields marked with visual indicator and `required` attribute
- Character counts linked via `aria-describedby`
- Priority buttons use `aria-pressed` for toggle state
- Priority group uses `role="group"` with `aria-labelledby`
- Submit button disabled when validation fails

---

## Component Composition Patterns

### KanbanBoard Orchestration

The `KanbanBoard` component (not documented here but referenced) acts as the orchestrator:

```tsx
function KanbanBoard() {
  const { tasks, addTask, updateTask, deleteTask, moveTask, getTasksByColumn } = useKanban();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bento-grid grid-cols-1 md:grid-cols-3">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByColumn(column.id)}
            onAddTask={() => { setEditingTask(null); setIsModalOpen(true); }}
            onEditTask={(task) => { setEditingTask(task); setIsModalOpen(true); }}
            onDeleteTask={(id) => setDeleteConfirmId(id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCardOverlay task={activeTask} />}
      </DragOverlay>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={...}>
        <TaskForm
          initialData={editingTask}
          onSubmit={handleSubmitTask}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Task">
        {/* Confirmation UI */}
      </Modal>
    </DndContext>
  );
}
```

### Data Flow Pattern

```
User Action
    |
    v
KanbanBoard (Event Handler)
    |
    v
useKanban Hook (Sanitization + State Update)
    |
    v
useLocalStorage Hook (Persistence)
    |
    v
localStorage (JSON)
    |
    v
React Re-render
    |
    v
Component Update
```

---

## State Management

### useKanban Hook

The `useKanban` hook manages all task operations:

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

### Hydration Protection

Components wait for hydration before rendering task data to prevent SSR mismatches:

```typescript
const { tasks, isHydrated, ... } = useKanban();

if (!isHydrated) {
  return <LoadingSkeleton />;
}
```

### XSS Protection

All user input is sanitized before storage:

```typescript
// src/lib/utils.ts
export function sanitizeString(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}
```

---

## Event Handling

### Drag Events

```typescript
// In KanbanBoard
const handleDragStart = (event: DragStartEvent) => {
  const task = tasks.find(t => t.id === event.active.id);
  setActiveTask(task || null);
};

const handleDragEnd = (event: DragEndEvent) => {
  setActiveTask(null);

  const { active, over } = event;
  if (!over) return;

  const taskId = active.id as string;
  const overId = over.id as string;

  // Determine target column and position
  // Call moveTask with appropriate parameters
};
```

### Task CRUD Events

| Action | Handler | Hook Method |
|--------|---------|-------------|
| Create | `handleAddTask` | `addTask(data)` |
| Update | `handleEditTask` + `handleSubmitTask` | `updateTask(id, updates)` |
| Delete | `handleDeleteTask` + confirmation | `deleteTask(id)` |
| Move | `handleDragEnd` | `moveTask(taskId, columnId, targetId)` |

### Button Event Propagation

Action buttons in TaskCard must stop event propagation to prevent triggering drag:

```typescript
onClick={(e) => {
  e.stopPropagation();      // Prevents event bubbling
  onEdit(task);
}}
onPointerDown={(e) => e.stopPropagation()}  // Prevents drag initiation
```

---

## Testing Considerations

### Unit Tests

```typescript
// TaskCard rendering
test('renders task title and description', () => {
  render(<TaskCard task={mockTask} onEdit={jest.fn()} onDelete={jest.fn()} />);
  expect(screen.getByText(mockTask.title)).toBeInTheDocument();
});

// TaskForm validation
test('disables submit when title is empty', () => {
  render(<TaskForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
  expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
});

// KanbanColumn empty state
test('shows empty state when no tasks', () => {
  render(<KanbanColumn column={mockColumn} tasks={[]} ... />);
  expect(screen.getByText('No tasks yet')).toBeInTheDocument();
});
```

### Integration Tests

```typescript
// Drag and drop
test('moves task between columns on drop', async () => {
  // Test with @dnd-kit testing utilities
});

// Form submission
test('creates task with valid data', async () => {
  const onSubmit = jest.fn();
  render(<TaskForm onSubmit={onSubmit} onCancel={jest.fn()} />);

  await userEvent.type(screen.getByLabelText(/title/i), 'New Task');
  await userEvent.click(screen.getByRole('button', { name: /create/i }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    title: 'New Task',
  }));
});
```

---

*Last Updated: January 2026*
