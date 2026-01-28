# Kanban Board Architecture Document

**Version:** 1.0
**Last Updated:** January 2026
**Status:** Production Ready

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Tech Stack Decisions](#2-tech-stack-decisions)
3. [File Structure](#3-file-structure)
4. [Component Hierarchy](#4-component-hierarchy)
5. [State Management Strategy](#5-state-management-strategy)
6. [API Contracts](#6-api-contracts)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture Diagram

```
+------------------------------------------------------------------+
|                        BROWSER ENVIRONMENT                        |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------------------------------------------------+  |
|  |                     Next.js App Router                      |  |
|  |  +-------------------------------------------------------+  |  |
|  |  |                    RootLayout                          |  |  |
|  |  |  - HTML/Body wrapper                                   |  |  |
|  |  |  - Font configuration (Geist Sans/Mono)               |  |  |
|  |  |  - Global CSS import                                   |  |  |
|  |  +-------------------------------------------------------+  |  |
|  |                           |                                  |  |
|  |                           v                                  |  |
|  |  +-------------------------------------------------------+  |  |
|  |  |                    Home Page                            |  |  |
|  |  |  - Server Component (minimal)                          |  |  |
|  |  |  - Renders KanbanBoard                                 |  |  |
|  |  +-------------------------------------------------------+  |  |
|  +------------------------------------------------------------+  |
|                              |                                    |
|                              v                                    |
|  +------------------------------------------------------------+  |
|  |                  CLIENT COMPONENTS LAYER                    |  |
|  |  +-------------------------------------------------------+  |  |
|  |  |                   KanbanBoard                          |  |  |
|  |  |  - DnD Context Provider                               |  |  |
|  |  |  - State Orchestration                                |  |  |
|  |  |  - Modal Management                                   |  |  |
|  |  +-------------------------------------------------------+  |  |
|  |       |              |              |              |          |  |
|  |       v              v              v              v          |  |
|  |  +---------+   +---------+   +---------+   +----------+      |  |
|  |  | Column  |   | Column  |   | Column  |   |  Modal   |      |  |
|  |  | (todo)  |   | (prog)  |   | (done)  |   | Overlay  |      |  |
|  |  +---------+   +---------+   +---------+   +----------+      |  |
|  |       |              |              |              |          |  |
|  |       v              v              v              v          |  |
|  |  +--------------------------------------------------+        |  |
|  |  |              TaskCard (n instances)              |        |  |
|  |  |  - Sortable wrapper                              |        |  |
|  |  |  - Edit/Delete actions                           |        |  |
|  |  +--------------------------------------------------+        |  |
|  +------------------------------------------------------------+  |
|                              |                                    |
|                              v                                    |
|  +------------------------------------------------------------+  |
|  |                    CUSTOM HOOKS LAYER                       |  |
|  |  +------------------------+  +---------------------------+  |  |
|  |  |      useKanban         |  |    useLocalStorage        |  |  |
|  |  |  - CRUD operations     |  |  - Persistence logic      |  |  |
|  |  |  - Move/reorder        |  |  - Hydration state        |  |  |
|  |  |  - Column filtering    |  |  - SSR safety             |  |  |
|  |  +------------------------+  +---------------------------+  |  |
|  +------------------------------------------------------------+  |
|                              |                                    |
|                              v                                    |
|  +------------------------------------------------------------+  |
|  |                    PERSISTENCE LAYER                        |  |
|  |  +-------------------------------------------------------+  |  |
|  |  |                 localStorage API                        |  |  |
|  |  |  Key: "kanban-tasks"                                   |  |  |
|  |  |  Value: JSON.stringify(Task[])                         |  |  |
|  |  +-------------------------------------------------------+  |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### 1.2 Component Interaction Flow

```
User Action                    System Response
-----------                    ---------------

[Drag Task]
    |
    v
+-------------------+
| PointerSensor     |-----> Activation constraint (8px)
+-------------------+
    |
    v
+-------------------+
| DndContext        |-----> onDragStart: setActiveTask
+-------------------+       onDragEnd: determine drop target
    |
    |-- Drop on Column ------> moveTask(taskId, columnId)
    |
    |-- Drop on Task --------> moveTask(taskId, columnId, targetTaskId)
    |
    v
+-------------------+
| useKanban.moveTask|-----> Updates task array order
+-------------------+       Persists to localStorage
    |
    v
+-------------------+
| React Re-render   |-----> Columns receive filtered tasks
+-------------------+       UI reflects new state


[Create/Edit Task]
    |
    v
+-------------------+
| Button Click      |-----> setIsModalOpen(true)
+-------------------+       setEditingTask(task | null)
    |
    v
+-------------------+
| Modal + TaskForm  |-----> User fills form
+-------------------+       Validates input
    |
    v
+-------------------+
| onSubmit          |-----> editingTask ? updateTask : addTask
+-------------------+       Sanitizes data
    |                       Closes modal
    v
+-------------------+
| useKanban hook    |-----> Updates state
+-------------------+       Persists to localStorage


[Delete Task]
    |
    v
+-------------------+
| Delete Button     |-----> setDeleteConfirmId(taskId)
+-------------------+
    |
    v
+-------------------+
| Confirmation Modal|-----> User confirms
+-------------------+
    |
    v
+-------------------+
| deleteTask(id)    |-----> Filters task from array
+-------------------+       Persists to localStorage
```

### 1.3 Data Flow Diagram

```
+------------------------------------------------------------------+
|                         DATA FLOW                                 |
+------------------------------------------------------------------+

                    INITIALIZATION FLOW
                    -------------------

[App Mount]
     |
     v
+------------------+     +------------------+
| useState(init)   |---->| storedValue = [] |  (Server-safe default)
+------------------+     +------------------+
     |
     v
+------------------+     +------------------+
| useEffect        |---->| Check localStorage|
+------------------+     +------------------+
     |                          |
     |                          v
     |                   +------------------+
     |                   | Parse JSON data  |
     |                   +------------------+
     |                          |
     v                          v
+------------------+     +------------------+
| setIsHydrated    |     | setStoredValue   |
| (true)           |     | (persisted data) |
+------------------+     +------------------+
     |                          |
     +------------+-------------+
                  |
                  v
         +------------------+
         | Render Kanban    |
         | with real data   |
         +------------------+


                    MUTATION FLOW
                    -------------

[User Action]
     |
     v
+------------------+
| Hook Method      |  (addTask, updateTask, deleteTask, moveTask)
+------------------+
     |
     +---> Sanitize input data (XSS prevention)
     |
     v
+------------------+
| setTasks((prev)  |  Functional update for latest state
| => newTasks)     |
+------------------+
     |
     +--> Update React state
     |
     v
+------------------+
| localStorage     |  Synchronous write
| .setItem()       |
+------------------+
     |
     v
+------------------+
| Component        |  Automatic via React
| Re-render        |
+------------------+


                    READ FLOW (per column)
                    ----------------------

+------------------+
| tasks (from hook)|
+------------------+
     |
     v
+------------------+
| getTasksByColumn |----> tasks.filter(t => t.columnId === columnId)
| (columnId)       |
+------------------+
     |
     v
+------------------+
| Memoized result  |----> Returns Task[] for that column
+------------------+
     |
     v
+------------------+
| KanbanColumn     |----> Maps tasks to TaskCard components
| render           |
+------------------+
```

---

## 2. Tech Stack Decisions

### 2.1 Next.js 16.x with App Router

**Version:** 16.1.2

**Why Chosen:**

| Feature | Benefit |
|---------|---------|
| **App Router** | Simplified routing with file-system based structure; layouts and nested routing built-in |
| **Server Components** | Reduced client-side JavaScript bundle by default; improved initial load performance |
| **Built-in Optimization** | Automatic image optimization, font optimization (Geist fonts), code splitting |
| **TypeScript First** | Native TypeScript support without additional configuration |
| **Fast Refresh** | Instant feedback during development with preserved component state |

**App Router Usage in This Project:**

```
src/app/
├── layout.tsx      # Root layout - Server Component
│                   # Handles: fonts, metadata, global CSS
│
├── page.tsx        # Home page - Server Component
│                   # Renders: KanbanBoard (client component)
│
└── globals.css     # Global styles imported via layout
```

**Key Architectural Decision:** The page component remains a Server Component that immediately renders a single Client Component (`KanbanBoard`). This approach:

1. Minimizes the server-rendered HTML
2. Allows the entire Kanban functionality to be client-interactive
3. Avoids hydration mismatches by keeping localStorage logic client-side

### 2.2 React 19.x

**Version:** 19.2.3

**Features Used:**

| Feature | Implementation |
|---------|----------------|
| **Hooks** | `useState`, `useEffect`, `useCallback`, `useRef`, `useId` |
| **Client Directives** | `'use client'` at top of interactive components |
| **Functional Components** | All components are function-based |
| **forwardRef** | Used in `Button` component for ref forwarding |

**React 19 Specific Patterns:**

```typescript
// useId for accessible unique IDs (Modal.tsx)
const titleId = useId();
// Generates: :r0:, :r1:, etc. - stable across SSR/client

// Strict Mode compatible patterns
// All effects properly clean up subscriptions
useEffect(() => {
  document.addEventListener('keydown', handleEscape);
  return () => {
    document.removeEventListener('keydown', handleEscape);
  };
}, [handleEscape]);
```

### 2.3 TypeScript 5.x

**Version:** ^5 (latest 5.x)

**Strict Mode Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,           // Enables all strict type checks
    "noEmit": true,           // Next.js handles compilation
    "isolatedModules": true,  // Required for SWC/esbuild
    "jsx": "react-jsx",       // New JSX transform (no import React)
    "moduleResolution": "bundler"  // Modern resolution algorithm
  }
}
```

**Type Safety Benefits Demonstrated:**

```typescript
// Strict union types for domain values
export type Priority = 'low' | 'medium' | 'high';
export type ColumnId = 'todo' | 'in-progress' | 'completed';

// Comprehensive interface definitions
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

// Utility types for partial updates
type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt'>>;
type NewTaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
```

**Path Mapping:**

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

Enables clean imports: `import { Task } from '@/types'`

### 2.4 Tailwind CSS v4

**Version:** ^4

**Why Utility-First:**

| Traditional CSS | Tailwind Utility-First |
|-----------------|------------------------|
| Separate CSS files | Styles in component |
| Class name invention | Standardized vocabulary |
| Specificity wars | Flat utility classes |
| Dead CSS accumulation | Only used styles shipped |

**Configuration Approach:**

Tailwind v4 uses CSS-based configuration via `globals.css`:

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

**Custom Design System:**

The project implements a glassmorphic design system with CSS custom properties:

```css
/* Glassmorphic base classes */
.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow), var(--glass-shadow-inset);
}

/* Semantic variants */
.glass-sky    { /* To-Do column */ }
.glass-peach  { /* In Progress column */ }
.glass-mint   { /* Completed column */ }
```

**Responsive Design:**

```css
/* Mobile-first breakpoints */
.bento-grid {
  display: grid;
  gap: 1.25rem;
}

@media (min-width: 768px) {
  .bento-grid {
    gap: 1.5rem;
  }
}
```

### 2.5 @dnd-kit Library

**Packages:**
- `@dnd-kit/core`: ^6.3.1
- `@dnd-kit/sortable`: ^10.0.0
- `@dnd-kit/utilities`: ^3.2.2

**Why @dnd-kit Over Alternatives:**

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **@dnd-kit** | Tree-shakeable, accessible, React 18/19 ready, TypeScript native, sensors API | Newer, smaller community | **Selected** |
| react-beautiful-dnd | Popular, well-documented | Deprecated, no React 18+ support, large bundle | Rejected |
| react-dnd | Flexible, backend-agnostic | Complex API, boilerplate heavy, steeper learning curve | Rejected |

**@dnd-kit Architecture:**

```
+------------------+
|   DndContext     |  Root provider
+------------------+
        |
        +--- sensors: [PointerSensor, KeyboardSensor]
        |
        +--- collisionDetection: closestCorners
        |
        +--- onDragStart / onDragEnd handlers
        |
        v
+------------------+
|   useDroppable   |  Column drop zones
+------------------+
        |
        v
+------------------+
| SortableContext  |  Task list per column
+------------------+
        |
        v
+------------------+
|   useSortable    |  Individual task cards
+------------------+
        |
        v
+------------------+
|   DragOverlay    |  Visual feedback during drag
+------------------+
```

**Sensor Configuration:**

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    // 8px movement required to start drag
    // Prevents accidental drags on click
    activationConstraint: {
      distance: 8,
    },
  }),
  useSensor(KeyboardSensor, {
    // Enables keyboard-based drag and drop
    // Arrow keys to move, Space/Enter to pick up/drop
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

**Accessibility Features:**

- Full keyboard navigation support
- Screen reader announcements
- Focus management during drag operations
- ARIA attributes automatically applied

---

## 3. File Structure

```
src/
├── app/                              # Next.js App Router directory
│   ├── globals.css                   # Global styles and Tailwind config
│   │                                 # - CSS custom properties for glassmorphic design
│   │                                 # - Utility classes (.glass, .glass-sm, .glass-lg)
│   │                                 # - Bento grid layout system
│   │                                 # - Form input and button base styles
│   │
│   ├── layout.tsx                    # Root layout component (Server Component)
│   │                                 # - HTML document structure
│   │                                 # - Geist font configuration
│   │                                 # - Metadata (title, description)
│   │                                 # - Children wrapper
│   │
│   └── page.tsx                      # Home page (Server Component)
│                                     # - Single responsibility: render KanbanBoard
│                                     # - No business logic
│
├── components/
│   └── ui/                           # Reusable UI primitives only
│       ├── Badge.tsx                 # Badge/tag component
│       │                             # - Variants: default, priority, tag
│       │                             # - Glassmorphic styling
│       │                             # Lines: ~24 | Complexity: Low
│       │
│       ├── Button.tsx                # Button component with forwardRef
│       │                             # - Variants: primary, secondary, danger, ghost
│       │                             # - Sizes: sm, md, lg
│       │                             # - Full accessibility support
│       │                             # Lines: ~44 | Complexity: Low
│       │
│       └── Modal.tsx                 # Accessible modal component
│                                     # - Focus trap implementation
│                                     # - Escape key handling
│                                     # - Body scroll lock
│                                     # - Focus restoration
│                                     # - useId for ARIA labelledby
│                                     # Lines: ~126 | Complexity: Medium
│
├── features/
│   └── kanban/                       # Kanban feature components
│       ├── KanbanBoard.tsx           # Main orchestrator component
│       │                             # - DndContext provider
│       │                             # - Consumes useKanban hook
│       │                             # - Manages modal state
│       │                             # - Drag event handlers
│       │                             # - Hydration loading state
│       │                             # Lines: ~213 | Complexity: High
│       │
│       ├── KanbanColumn.tsx          # Individual column component
│       │                             # - useDroppable for drop zone
│       │                             # - SortableContext for task ordering
│       │                             # - Column-specific styling config
│       │                             # - Empty state rendering
│       │                             # Lines: ~126 | Complexity: Medium
│       │
│       ├── TaskCard.tsx              # Task item component
│       │                             # - useSortable for drag capability
│       │                             # - Priority-based styling
│       │                             # - Edit/Delete action buttons
│       │                             # - Exports TaskCardOverlay for DragOverlay
│       │                             # Lines: ~153 | Complexity: Medium
│       │
│       └── TaskForm.tsx              # Task creation/edit form
│                                     # - Controlled form inputs
│                                     # - Input validation
│                                     # - Priority selector
│                                     # - Tag parsing
│                                     # Lines: ~173 | Complexity: Medium
│
├── constants/
│   └── index.ts                      # Application constants
│                                     # - COLUMNS: Column definitions
│                                     # - COLUMN_IDS: Valid column identifiers
│                                     # - PRIORITY_COLORS: Color mappings
│                                     # - LOCAL_STORAGE_KEY: Persistence key
│                                     # Lines: ~18 | Complexity: Low
│
├── hooks/
│   ├── useKanban.ts                  # Kanban domain logic hook
│   │                                 # - Task CRUD operations
│   │                                 # - Move/reorder logic
│   │                                 # - Column filtering
│   │                                 # - Data sanitization
│   │                                 # Lines: ~141 | Complexity: High
│   │
│   └── useLocalStorage.ts            # Generic localStorage hook
│                                     # - SSR-safe implementation
│                                     # - Hydration state tracking
│                                     # - Type-safe generic API
│                                     # - Error handling
│                                     # Lines: ~42 | Complexity: Medium
│
├── lib/
│   └── utils.ts                      # Utility functions
│                                     # - generateId(): Unique ID generation
│                                     # - getTimestamp(): ISO timestamp
│                                     # - cn(): Class name merger
│                                     # - sanitizeString(): XSS prevention
│                                     # - sanitizeTaskData(): Task sanitization
│                                     # - VALIDATION: Input constraints
│                                     # Lines: ~49 | Complexity: Low
│
└── types/
    └── index.ts                      # TypeScript type definitions
                                      # - Priority: Union type
                                      # - ColumnId: Union type
                                      # - Task: Main entity interface
                                      # - Column: Column definition interface
                                      # - KanbanState: State shape interface
                                      # Lines: ~23 | Complexity: Low
```

---

## 4. Component Hierarchy

### 4.1 Visual Hierarchy Tree

```
RootLayout (Server)
│
└── Home (Server)
    │
    └── KanbanBoard (Client) ─────────────────────────────────┐
        │                                                      │
        ├── [Header Section]                                   │
        │   └── Title + Subtitle                               │
        │                                                      │
        ├── [DndContext]                                       │
        │   │                                                  │
        │   ├── KanbanColumn (todo) ──────────────────────┐    │
        │   │   │                                          │    │
        │   │   ├── [Header]                               │    │
        │   │   │   ├── Icon                               │    │
        │   │   │   ├── Title                              │    │
        │   │   │   ├── Count                              │    │
        │   │   │   └── AddButton (only todo column)       │    │
        │   │   │                                          │    │
        │   │   └── [SortableContext]                      │    │
        │   │       ├── TaskCard ──────────────────────┐   │    │
        │   │       │   ├── Priority Bar              │   │    │
        │   │       │   ├── Title                     │   │    │
        │   │       │   ├── Description               │   │    │
        │   │       │   ├── Edit Button               │   │    │
        │   │       │   ├── Delete Button             │   │    │
        │   │       │   └── Tags                      │   │    │
        │   │       │                                 │   │    │
        │   │       ├── TaskCard                      │   │    │
        │   │       └── ...                           │   │    │
        │   │                                              │    │
        │   ├── KanbanColumn (in-progress)                 │    │
        │   │   └── [Same structure as above]              │    │
        │   │                                              │    │
        │   ├── KanbanColumn (completed)                   │    │
        │   │   └── [Same structure as above]              │    │
        │   │                                              │    │
        │   └── DragOverlay                                │    │
        │       └── TaskCardOverlay (when dragging)        │    │
        │                                                       │
        ├── Modal (Task Form) ─────────────────────────────┘    │
        │   └── TaskForm                                        │
        │       ├── Title Input                                 │
        │       ├── Description Textarea                        │
        │       ├── Priority Buttons                            │
        │       ├── Tags Input                                  │
        │       ├── Status Select (edit only)                   │
        │       └── Action Buttons                              │
        │                                                       │
        └── Modal (Delete Confirmation) ────────────────────────┘
            ├── Confirmation Text
            └── Cancel/Delete Buttons
```

### 4.2 Props Flow Documentation

```
KanbanBoard
│
│  [Receives no props - top-level orchestrator]
│
│  Internal State:
│  ├── tasks: Task[]                    (from useKanban)
│  ├── isHydrated: boolean              (from useKanban)
│  ├── isModalOpen: boolean             (local state)
│  ├── editingTask: Task | null         (local state)
│  ├── activeTask: Task | null          (local state - drag)
│  └── deleteConfirmId: string | null   (local state)
│
├──> KanbanColumn
│    Props:
│    ├── column: Column                  # { id: ColumnId, title: string }
│    ├── tasks: Task[]                   # Filtered tasks for this column
│    ├── onAddTask: () => void           # Opens modal with no editingTask
│    ├── onEditTask: (task: Task) => void    # Opens modal with task
│    └── onDeleteTask: (id: string) => void  # Sets deleteConfirmId
│    │
│    └──> TaskCard
│         Props:
│         ├── task: Task                 # Full task object
│         ├── onEdit: (task: Task) => void   # Passed from KanbanColumn
│         └── onDelete: (id: string) => void # Passed from KanbanColumn
│
├──> DragOverlay
│    └──> TaskCardOverlay
│         Props:
│         └── task: Task                 # Active task being dragged
│
└──> Modal (x2)
     Props:
     ├── isOpen: boolean                 # Controls visibility
     ├── onClose: () => void             # Cleanup handler
     ├── title: string                   # Modal header text
     └── children: React.ReactNode       # Modal content
     │
     └──> TaskForm (in task modal)
          Props:
          ├── initialData?: Task         # Pre-fill for edit mode
          ├── onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
          └── onCancel: () => void       # Closes modal
```

### 4.3 State Ownership

| State | Owner | Purpose | Consumers |
|-------|-------|---------|-----------|
| `tasks` | useKanban (via useLocalStorage) | Complete task list | KanbanBoard, filtered to columns |
| `isHydrated` | useLocalStorage | SSR safety flag | KanbanBoard (loading state) |
| `isModalOpen` | KanbanBoard | Form modal visibility | Modal component |
| `editingTask` | KanbanBoard | Edit vs create mode | TaskForm |
| `activeTask` | KanbanBoard | Currently dragged task | DragOverlay |
| `deleteConfirmId` | KanbanBoard | Pending deletion | Confirmation modal |
| `isOver` | KanbanColumn (via useDroppable) | Drop zone highlight | Column styling |
| `isDragging` | TaskCard (via useSortable) | Placeholder state | Card rendering |
| Form inputs | TaskForm | Form values | Input elements |

---

## 5. State Management Strategy

### 5.1 Why Custom Hooks Over Redux/Zustand

**Decision Matrix:**

| Criterion | Redux | Zustand | Custom Hooks | Winner |
|-----------|-------|---------|--------------|--------|
| **Bundle Size** | ~7KB+ | ~1KB | 0KB (built-in) | Custom Hooks |
| **Boilerplate** | High (actions, reducers, store) | Low | Minimal | Custom Hooks |
| **Learning Curve** | Steep | Gentle | None (React native) | Custom Hooks |
| **DevTools** | Yes | Yes | React DevTools | Tie |
| **Server State** | No | No | No | Tie |
| **Complexity Match** | Over-engineered | Slight overkill | Perfect fit | Custom Hooks |

**Rationale:**

This Kanban board is a **single-page, client-side application** with:
- No server state synchronization
- No complex state dependencies
- Single source of truth (localStorage)
- Localized state consumption (3 columns + modals)

Custom hooks provide:

1. **Zero Additional Dependencies** - Uses only React's built-in hooks
2. **Type Safety** - Full TypeScript inference without extra types
3. **Encapsulation** - Domain logic isolated in `useKanban`
4. **Testability** - Hooks can be tested with `@testing-library/react-hooks`
5. **Composability** - `useKanban` composes `useLocalStorage`

**When to Consider Zustand:**
- Multiple unrelated components need same state
- Complex derived state calculations
- State needs to be accessed outside React tree

**When to Consider Redux:**
- Large team needing strict patterns
- Complex async workflows (with Redux Saga/Thunk)
- Need for time-travel debugging

### 5.2 localStorage as Persistence Layer

**Implementation:**

```typescript
// useLocalStorage.ts - Generic, reusable hook
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  // 1. State initialized with default (SSR-safe)
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // 2. Effect runs only on client, after mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // 3. Write-through: update state AND localStorage together
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    },
    [key, storedValue]
  );

  return [storedValue, setValue, isHydrated];
}
```

**Persistence Strategy:**

```
┌─────────────────────────────────────────────────────────────┐
│                    WRITE PATH                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Action                                                 │
│       │                                                      │
│       v                                                      │
│  useKanban.addTask/updateTask/deleteTask/moveTask           │
│       │                                                      │
│       v                                                      │
│  sanitizeTaskData() ─────> XSS prevention                   │
│       │                                                      │
│       v                                                      │
│  setTasks((prev) => newTasks) ─────┐                        │
│       │                             │                        │
│       │   Synchronous               │                        │
│       v                             v                        │
│  React State Update         localStorage.setItem()          │
│       │                             │                        │
│       v                             v                        │
│  Component Re-render        Persisted to disk               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    READ PATH                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  App Mount (Client)                                          │
│       │                                                      │
│       v                                                      │
│  useEffect runs (once)                                       │
│       │                                                      │
│       v                                                      │
│  localStorage.getItem('kanban-tasks')                       │
│       │                                                      │
│       ├── null ─────> Use initialValue ([])                 │
│       │                                                      │
│       └── string ───> JSON.parse()                          │
│             │                                                │
│             v                                                │
│       setStoredValue(parsedData)                            │
│             │                                                │
│             v                                                │
│       setIsHydrated(true)                                   │
│             │                                                │
│             v                                                │
│       Kanban renders with real data                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Data Integrity:**

- JSON serialization ensures clean data structure
- Validation on read (try/catch with fallback)
- Sanitization on write (XSS prevention)
- No partial writes (full array replaced atomically)

### 5.3 Hydration Handling for SSR

**The Problem:**

Next.js Server Components render on the server where `localStorage` is undefined. If we try to access it during SSR:

```typescript
// BAD - Causes hydration mismatch
const [tasks] = useState(() => {
  const saved = localStorage.getItem('kanban-tasks'); // ERROR on server!
  return saved ? JSON.parse(saved) : [];
});
```

**The Solution:**

```typescript
// GOOD - SSR-safe pattern
const [storedValue, setStoredValue] = useState<T>(initialValue); // Server-safe default
const [isHydrated, setIsHydrated] = useState(false);

// Only runs on client after hydration
useEffect(() => {
  const item = window.localStorage.getItem(key);
  if (item) setStoredValue(JSON.parse(item));
  setIsHydrated(true);
}, []);
```

**Hydration Flow:**

```
┌──────────────────────────────────────────────────────────────────┐
│  SERVER RENDER                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Next.js renders KanbanBoard                                   │
│  2. useState(initialValue) returns [] for tasks                   │
│  3. isHydrated = false                                            │
│  4. Loading skeleton rendered                                     │
│  5. HTML sent to client                                           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              v
┌──────────────────────────────────────────────────────────────────┐
│  CLIENT HYDRATION                                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. React hydrates with same values (no mismatch!)                │
│  2. useEffect fires (after hydration complete)                    │
│  3. localStorage.getItem('kanban-tasks') called                   │
│  4. Real data loaded into state                                   │
│  5. isHydrated = true                                             │
│  6. Kanban re-renders with real data                              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Loading State Implementation:**

```tsx
// KanbanBoard.tsx
if (!isHydrated) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-8 glass-lg">
        <div
          className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-sky-400"
          aria-hidden="true"
        />
        <p className="text-slate-600 font-medium">Loading Board...</p>
      </div>
    </div>
  );
}
```

**Why This Approach:**

1. **No Flash of Wrong Content** - Loading state shown until real data ready
2. **No Hydration Errors** - Server and client initial render match
3. **Accessible** - Loading state has proper ARIA attributes
4. **Performant** - Effect runs once, no unnecessary re-renders

---

## 6. API Contracts

### 6.1 Hook Interfaces

#### useLocalStorage<T>

```typescript
/**
 * Generic localStorage hook with SSR safety and hydration tracking.
 *
 * @template T - The type of value to store
 * @param key - localStorage key name
 * @param initialValue - Default value (used during SSR and if no stored value)
 * @returns Tuple of [currentValue, setter, isHydrated]
 *
 * @example
 * const [tasks, setTasks, isHydrated] = useLocalStorage<Task[]>('kanban-tasks', []);
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [
  T,                                    // Current value (reactive)
  (value: T | ((prev: T) => T)) => void,  // Setter (supports functional updates)
  boolean                               // true after client-side hydration
];
```

#### useKanban

```typescript
/**
 * Domain-specific hook for Kanban board state management.
 * Encapsulates all task CRUD operations with localStorage persistence.
 *
 * @returns Object containing state and operations
 *
 * @example
 * const { tasks, addTask, moveTask, isHydrated } = useKanban();
 */
interface UseKanbanReturn {
  /** Complete array of all tasks across all columns */
  tasks: Task[];

  /** True after localStorage data has been loaded */
  isHydrated: boolean;

  /**
   * Creates a new task with auto-generated ID and timestamps.
   * Sanitizes input data for XSS prevention.
   */
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;

  /**
   * Updates existing task fields.
   * Automatically updates the updatedAt timestamp.
   * Sanitizes updated fields.
   */
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;

  /**
   * Removes a task by ID.
   */
  deleteTask: (id: string) => void;

  /**
   * Moves a task to a new column and optionally reorders.
   * @param taskId - ID of task to move
   * @param newColumnId - Target column
   * @param targetTaskId - Optional: ID of task to insert before
   */
  moveTask: (taskId: string, newColumnId: ColumnId, targetTaskId?: string) => void;

  /**
   * Filters tasks by column ID.
   * Memoized for performance.
   */
  getTasksByColumn: (columnId: ColumnId) => Task[];
}

function useKanban(): UseKanbanReturn;
```

### 6.2 Component Prop Interfaces

#### KanbanBoard

```typescript
/**
 * Root Kanban board component.
 * No props required - self-contained orchestrator.
 *
 * @remarks
 * - Must be used as a Client Component ('use client')
 * - Provides DndContext for all child components
 * - Manages modal state for task form and delete confirmation
 */
function KanbanBoard(): JSX.Element;
```

#### KanbanColumn

```typescript
interface KanbanColumnProps {
  /** Column definition with ID and display title */
  column: Column;

  /** Tasks filtered for this column (from parent) */
  tasks: Task[];

  /** Callback to open the task creation modal */
  onAddTask: () => void;

  /** Callback to open task edit modal with pre-filled data */
  onEditTask: (task: Task) => void;

  /** Callback to initiate task deletion (triggers confirmation) */
  onDeleteTask: (id: string) => void;
}

/**
 * Individual Kanban column with drop zone and sortable task list.
 *
 * @remarks
 * - Implements useDroppable for column-level drops
 * - Wraps tasks in SortableContext for reordering
 * - Only the "todo" column shows the add button
 */
function KanbanColumn(props: KanbanColumnProps): JSX.Element;
```

#### TaskCard

```typescript
interface TaskCardProps {
  /** Complete task data */
  task: Task;

  /** Edit button callback */
  onEdit: (task: Task) => void;

  /** Delete button callback */
  onDelete: (id: string) => void;
}

/**
 * Draggable task card with edit/delete actions.
 *
 * @remarks
 * - Implements useSortable for drag-and-drop
 * - Shows placeholder skeleton when actively being dragged
 * - Action buttons prevent drag initiation via stopPropagation
 */
function TaskCard(props: TaskCardProps): JSX.Element;

/**
 * Display-only version of TaskCard for DragOverlay.
 * No interactivity - purely visual feedback.
 */
function TaskCardOverlay(props: { task: Task }): JSX.Element;
```

#### TaskForm

```typescript
interface TaskFormProps {
  /** Pre-filled data for edit mode (undefined = create mode) */
  initialData?: Task;

  /** Form submission handler */
  onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;

  /** Cancel button handler */
  onCancel: () => void;
}

/**
 * Task creation/editing form.
 *
 * @remarks
 * - Controlled inputs with local state
 * - Validates title (required, trimmed)
 * - Parses comma-separated tags
 * - Status selector only shown in edit mode
 */
function TaskForm(props: TaskFormProps): JSX.Element;
```

#### Modal

```typescript
interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;

  /** Close handler (Escape key, backdrop click, close button) */
  onClose: () => void;

  /** Modal header title */
  title: string;

  /** Modal body content */
  children: React.ReactNode;
}

/**
 * Accessible modal dialog component.
 *
 * @remarks
 * - Implements focus trap (Tab/Shift+Tab cycles within modal)
 * - Closes on Escape key press
 * - Locks body scroll when open
 * - Restores focus to trigger element on close
 * - Uses useId for unique ARIA labelledby
 */
function Modal(props: ModalProps): JSX.Element | null;
```

#### Badge

```typescript
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'priority' | 'tag';
}

/**
 * Inline badge/label component.
 *
 * @remarks
 * - 'priority' variant expects color classes via className
 * - 'tag' variant has built-in violet styling
 */
function Badge(props: BadgeProps): JSX.Element;
```

#### Button

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';

  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Glassmorphic button component with forwarded ref.
 *
 * @remarks
 * - Extends native button attributes
 * - Supports ref forwarding for focus management
 * - Includes disabled state styling
 */
const Button: ForwardRefExoticComponent<
  ButtonProps & RefAttributes<HTMLButtonElement>
>;
```

### 6.3 Event Handler Signatures

#### Drag and Drop Events

```typescript
/** Fired when drag operation begins */
type DragStartHandler = (event: DragStartEvent) => void;
// Implementation extracts task from event.active.id

/** Fired when drag operation ends (drop or cancel) */
type DragEndHandler = (event: DragEndEvent) => void;
// Implementation determines target: column or task position

interface DragStartEvent {
  active: {
    id: string | number;  // Task ID
    data: DataRef;
  };
}

interface DragEndEvent {
  active: {
    id: string | number;  // Dragged task ID
  };
  over: {
    id: string | number;  // Drop target ID (column or task)
  } | null;               // null if dropped outside valid zone
}
```

#### Task Operations

```typescript
/** Add new task */
type AddTaskHandler = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;

/** Update existing task */
type UpdateTaskHandler = (
  id: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt'>>
) => void;

/** Delete task by ID */
type DeleteTaskHandler = (id: string) => void;

/** Move task to column with optional reordering */
type MoveTaskHandler = (
  taskId: string,
  newColumnId: ColumnId,
  targetTaskId?: string  // Insert before this task
) => void;
```

#### UI Event Handlers

```typescript
/** Open task creation modal */
type AddTaskUIHandler = () => void;

/** Open task edit modal */
type EditTaskUIHandler = (task: Task) => void;

/** Trigger delete confirmation */
type DeleteTaskUIHandler = (id: string) => void;

/** Close modal and reset state */
type CloseModalHandler = () => void;

/** Form submission */
type FormSubmitHandler = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
```

### 6.4 Type Definitions Reference

```typescript
// types/index.ts

/** Task priority levels */
export type Priority = 'low' | 'medium' | 'high';

/** Column identifiers */
export type ColumnId = 'todo' | 'in-progress' | 'completed';

/** Complete task entity */
export interface Task {
  /** Unique identifier (timestamp + random) */
  id: string;

  /** Task title (max 100 chars, required) */
  title: string;

  /** Optional description (max 500 chars) */
  description: string;

  /** Priority level */
  priority: Priority;

  /** Array of tag strings (max 10 tags, 30 chars each) */
  tags: string[];

  /** Current column placement */
  columnId: ColumnId;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ISO 8601 last update timestamp */
  updatedAt: string;
}

/** Column definition */
export interface Column {
  id: ColumnId;
  title: string;
}

/** Root state shape (for potential future use) */
export interface KanbanState {
  tasks: Task[];
}
```

---

## Appendix A: Validation Constants

```typescript
// lib/utils.ts

export const VALIDATION = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAG_LENGTH: 30,
  MAX_TAGS: 10,
} as const;
```

## Appendix B: Security Considerations

### XSS Prevention

All user input is sanitized before storage:

```typescript
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

### Input Validation

- Title: Required, trimmed whitespace, max 100 chars
- Description: Optional, trimmed, max 500 chars
- Tags: Parsed from comma-separated string, duplicates removed, max 10 tags, 30 chars each
- Priority: Constrained to union type values
- ColumnId: Constrained to union type values

---

**Document End**
