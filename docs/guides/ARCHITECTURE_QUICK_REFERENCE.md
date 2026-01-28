# Architecture Quick Reference Guide
## Kanban Board Application

For quick architecture lookup and guidance.

---

## Folder Structure at a Glance

```
src/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server actions (API layer)
│   ├── api/                      # REST endpoints
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page
│
├── components/ui/                # Shared UI primitives
│   ├── Button.tsx               # Generic button
│   ├── Badge.tsx                # Generic badge
│   └── Modal.tsx                # Generic modal
│
├── features/kanban/              # Feature: Kanban board
│   ├── components/               # Feature UI
│   │   ├── KanbanBoard.tsx       # Main board (316 lines)
│   │   ├── KanbanColumn.tsx      # Column (125 lines)
│   │   ├── TaskCard.tsx          # Task card (207 lines)
│   │   └── TaskForm.tsx          # Task form (201 lines)
│   ├── hooks/                    # Feature logic
│   │   └── useKanban.ts          # Main hook (340 lines)
│   └── index.ts                  # Public API ← Import from here!
│
├── store/                        # Global state
│   ├── kanban.ts                # Zustand store (575 lines)
│   └── index.ts                 # Store exports
│
├── lib/                          # Global utilities
│   ├── db/                       # Database connectivity
│   ├── utils.ts                 # Helpers (sanitization, cn, etc)
│   └── schemas.ts               # Zod validation schemas
│
├── hooks/                        # Global hooks
│   └── useLocalStorage.ts        # Storage hook (unused)
│
├── types/                        # Global types
│   └── index.ts                 # Task, Priority, ColumnId
│
├── constants/                    # Global constants
│   └── index.ts                 # Column defs, colors
│
├── __tests__/                    # Tests (mirror src structure)
│   ├── unit/                    # Unit tests
│   └── integration/             # Integration tests
│
└── generated/                    # Generated (Prisma)
    └── prisma/                   # Don't edit!
```

---

## Import Patterns: Quick Rules

### ✓ DO: Always Use These Patterns

```typescript
// 1. Import from barrel exports (feature level)
import { KanbanBoard, useKanban } from '@/features/kanban'

// 2. Use path aliases for global imports
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { Task, Priority } from '@/types'
import { COLUMNS } from '@/constants'

// 3. Store selector hooks
import { useTasksByColumn, useIsHydrated } from '@/store/kanban'

// 4. Server actions from app folder
import { createTask, updateTask } from '@/app/actions/tasks'

// 5. Relative imports within features (internal)
import { useKanban } from '../hooks/useKanban'  // Inside feature only
```

### ✗ DON'T: Avoid These Patterns

```typescript
// Wrong: Direct component imports from feature
import { KanbanBoard } from '@/features/kanban/components/KanbanBoard'

// Wrong: Relative paths for external modules
import { Button } from '../../../components/ui/Button'

// Wrong: Cross-feature imports
import SomeFeature from '@/features/other-feature'

// Wrong: Store direct access without selectors
import { useKanbanStore } from '@/store/kanban'  // Use selectors instead!
const store = useKanbanStore()

// Wrong: Direct access to utils
const result = require('@/lib/utils')
```

---

## Architecture Layers

### Layer 1: Presentation (React Components)
**Files:** `src/features/*/components/`, `src/components/ui/`

**Responsibilities:**
- Render UI
- Handle user interactions
- Call hooks for logic
- Display data from props

**What NOT to do:**
- Don't access store directly
- Don't call server actions
- Don't manipulate databases
- Don't know about persistence

**Example:**
```typescript
export function TaskCard({ task, onUpdate }: TaskCardProps) {
  // ✓ Call hook for logic
  const { updateTask } = useKanban();

  // ✓ Handle UI events
  const handleClick = () => {
    updateTask(task.id, { status: 'done' });
  };

  return <div onClick={handleClick}>{task.title}</div>;
}
```

### Layer 2: Business Logic (Hooks & Store)
**Files:** `src/features/*/hooks/`, `src/store/`

**Responsibilities:**
- Manage state
- Implement business rules
- Call server actions
- Handle optimistic updates

**What NOT to do:**
- Don't render anything
- Don't manipulate DOM
- Don't validate Prisma queries
- Don't access raw database

**Example:**
```typescript
export function useKanban() {
  const store = useKanbanStore();

  const updateTask = useCallback((id, updates) => {
    // ✓ Optimistic update
    store.updateTask(id, updates);

    // ✓ Call server action
    updateTaskAction(id, updates)
      .then(result => {
        if (!result.success) {
          // Rollback handled by store
        }
      });
  }, [store]);

  return { updateTask, /* ... */ };
}
```

### Layer 3: Persistence (Server Actions)
**Files:** `src/app/actions/`

**Responsibilities:**
- Validate input with Zod
- Sanitize user input
- Call Prisma
- Return formatted responses

**What NOT to do:**
- Don't render anything
- Don't call client hooks
- Don't access browser APIs
- Don't use window/localStorage

**Example:**
```typescript
'use server';

export async function updateTask(
  id: string,
  data: UpdateTaskInput
): Promise<ActionResponse<TaskResponse>> {
  try {
    // ✓ Validate
    const validated = UpdateTaskSchema.parse(data);

    // ✓ Sanitize
    const sanitized = sanitizeTaskInput(validated);

    // ✓ Persist
    const task = await prisma.task.update({
      where: { id },
      data: sanitized,
    });

    return { success: true, data: transformTask(task) };
  } catch (error) {
    return { success: false, error: 'Update failed' };
  }
}
```

### Layer 4: Database (Prisma)
**Files:** `src/lib/db/`, `prisma/`

**Responsibilities:**
- Define schema
- Create migrations
- Provide type-safe client

**What NOT to do:**
- Don't add business logic
- Don't validate in schema
- Don't manipulate in app code

---

## Adding a New Feature

### Step 1: Create Folder Structure
```bash
mkdir -p src/features/[feature-name]/{components,hooks}
touch src/features/[feature-name]/index.ts
```

### Step 2: Create Public API (index.ts)
```typescript
// src/features/[feature-name]/index.ts

// Components
export { MainComponent } from './components/MainComponent';
export { SubComponent } from './components/SubComponent';

// Hooks
export { useFeatureLogic } from './hooks/useFeatureLogic';
```

### Step 3: Implement Components
```typescript
// src/features/[feature-name]/components/MainComponent.tsx

import { useFeatureLogic } from '../hooks/useFeatureLogic';

export function MainComponent() {
  const { data, actions } = useFeatureLogic();

  return <div>{/* UI */}</div>;
}
```

### Step 4: Implement Hook
```typescript
// src/features/[feature-name]/hooks/useFeatureLogic.ts

export function useFeatureLogic() {
  // Implement business logic
  return { data: {}, actions: {} };
}
```

### Step 5: Use in App
```typescript
// src/app/page.tsx
import { MainComponent } from '@/features/[feature-name]';

export default function Page() {
  return <MainComponent />;
}
```

### Important Rules
- ✓ All public APIs exported in `index.ts`
- ✓ Only import from `@/features/[feature-name]` (barrel export)
- ✓ Don't import from other features
- ✓ Use global utilities: `@/lib`, `@/components`, `@/types`

---

## State Management Pattern

### Using the Kanban Store

```typescript
// ✓ CORRECT: Use selector hooks
import { useTasksByColumn, useIsHydrated } from '@/store/kanban';

export function MyComponent() {
  const tasks = useTasksByColumn('TODO');
  const isHydrated = useIsHydrated();

  // Component only re-renders when returned values change
}

// ✗ WRONG: Direct store access
import { useKanbanStore } from '@/store/kanban';

export function BadComponent() {
  const state = useKanbanStore();  // Re-renders on ANY store change!
}
```

### Updating State (Optimistic)

```typescript
import { useKanban } from '@/features/kanban';

export function TaskCard({ task }: Props) {
  const { updateTask } = useKanban();

  const handleUpdate = () => {
    // 1. UI updates immediately (optimistic)
    // 2. Server action called in background
    // 3. Auto-rollback if fails
    updateTask(task.id, { title: 'New Title' });
  };

  return <button onClick={handleUpdate}>Update</button>;
}
```

---

## Validation Strategy

### Frontend Validation (TaskForm)
```typescript
// User-facing validation
const [errors, setErrors] = useState({});

if (!title.trim()) {
  setErrors({ title: 'Title required' });
}
```

### Hook Validation (useKanban)
```typescript
// Business logic validation
const validated = CreateTaskSchema.parse(data);
```

### Server Validation (actions/tasks.ts)
```typescript
// Server-side re-validation (never trust client!)
const validated = CreateTaskSchema.parse(data);
const sanitized = sanitizeTaskInput(validated);

// Database-level constraints
const task = await prisma.task.create({ data: sanitized });
```

**Key Principle:** Validate at every layer (defense in depth)

---

## File Size Guidelines

| File Type | Ideal | Max | Action at Max |
|-----------|-------|-----|---------------|
| Component | <150 | 300 | Extract sub-components |
| Hook | <200 | 400 | Split or refactor |
| Store | <400 | 600 | Split mutations/selectors |
| Server Action | <100 | 200 | Create helper functions |
| Schema | <200 | 300 | Group by domain |

**Current Status:**
- KanbanBoard.tsx: 316 lines (at threshold, recommend extraction)
- useKanban.ts: 340 lines (good, monitor)
- store/kanban.ts: 575 lines (acceptable, has plan)

---

## Common Patterns

### Pattern 1: Form Submission
```typescript
export function TaskForm({ onSubmit }: Props) {
  const { addTask, error, clearError } = useKanban();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    try {
      // Optimistic update happens in hook
      addTask({ title, description, /* ... */ });
    } catch (err) {
      setError(err.message);
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### Pattern 2: List Display
```typescript
export function TaskList({ columnId }: Props) {
  const tasks = useTasksByColumn(columnId);

  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
```

### Pattern 3: Error Handling
```typescript
export function KanbanBoard() {
  const { error, clearError } = useKanban();

  return (
    <>
      {error && (
        <ErrorToast
          message={error}
          onDismiss={clearError}
        />
      )}
      {/* Board content */}
    </>
  );
}
```

### Pattern 4: Loading State
```typescript
export function KanbanBoard() {
  const { isLoading, isHydrated } = useKanban();

  if (!isHydrated) {
    return <LoadingIndicator />;
  }

  return <div>{/* Board */}</div>;
}
```

---

## Testing Structure

### Unit Test Location
```
src/__tests__/unit/components/kanban/TaskCard.test.tsx
src/__tests__/unit/hooks/useKanban.test.ts
```

### Integration Test Location
```
src/__tests__/integration/kanban-workflows.test.tsx
src/__tests__/integration/store/kanban.test.ts
```

### Test Imports
```typescript
import { KanbanBoard, useKanban } from '@/features/kanban';
import { Button } from '@/components/ui/Button';
import { render, screen } from '@testing-library/react';
```

---

## Troubleshooting

### Issue: "Cannot find module '@/features/...'"
**Cause:** Importing from internal path instead of barrel export
**Fix:** Use feature-level import
```typescript
// ✗ Wrong
import { KanbanBoard } from '@/features/kanban/components/KanbanBoard'

// ✓ Right
import { KanbanBoard } from '@/features/kanban'
```

### Issue: Component not updating when store changes
**Cause:** Using full store access instead of selectors
**Fix:** Use selector hooks
```typescript
// ✗ Wrong (re-renders on any store change)
const state = useKanbanStore();

// ✓ Right (only re-renders on relevant changes)
const tasks = useTasksByColumn(columnId);
```

### Issue: Circular dependency warning
**Cause:** Feature importing from another feature
**Fix:** Use global utilities instead
```typescript
// ✗ Wrong
import Feature1 from '@/features/other-feature'

// ✓ Right (use global utilities)
import { shared } from '@/lib/utils'
```

### Issue: TypeScript error on server action
**Cause:** Forgetting 'use server' directive
**Fix:** Add directive at top
```typescript
'use server';

export async function myAction() { /* ... */ }
```

---

## Key Files Reference

| Need | File | Import |
|------|------|--------|
| Button component | `src/components/ui/Button.tsx` | `import { Button } from '@/components/ui/Button'` |
| Task types | `src/types/index.ts` | `import { Task, Priority } from '@/types'` |
| Validation | `src/lib/schemas.ts` | `import { CreateTaskSchema } from '@/lib/schemas'` |
| Utilities | `src/lib/utils.ts` | `import { cn, sanitizeString } from '@/lib/utils'` |
| Constants | `src/constants/index.ts` | `import { COLUMNS } from '@/constants'` |
| Kanban feature | `src/features/kanban/index.ts` | `import { KanbanBoard } from '@/features/kanban'` |
| Kanban store | `src/store/kanban.ts` | `import { useTasksByColumn } from '@/store/kanban'` |
| Server actions | `src/app/actions/tasks.ts` | `import { createTask } from '@/app/actions/tasks'` |

---

## Architecture Score Summary

| Dimension | Score | Status |
|-----------|-------|--------|
| Feature Isolation | 9.5/10 | ✓ Excellent |
| Import Patterns | 9.5/10 | ✓ Excellent |
| Type Safety | 9.5/10 | ✓ Excellent |
| Separation of Concerns | 9.0/10 | ✓ Excellent |
| Code Organization | 9.0/10 | ✓ Excellent |
| Scalability | 8.5/10 | ✓ Good |

**Overall: 9.2/10** - Production Ready ✓

---

**Last Updated:** January 26, 2026
**For Questions:** See ARCHITECTURE_REVIEW.md and ARCHITECTURE_REVIEW_VALIDATION.md
