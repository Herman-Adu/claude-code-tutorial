# Technical Decisions - Architecture Decision Records (ADRs)

> **Document Purpose**: This document captures all significant technical decisions made during the Kanban board implementation. Each decision is documented in ADR format to provide context, rationale, and trade-offs for future maintainers.

---

## ADR Summary Table

| ADR | Title | Status | Category |
|-----|-------|--------|----------|
| ADR-001 | [Framework Choice: Next.js 16.x with App Router](#adr-001-framework-choice-nextjs-16x-with-app-router) | Accepted | Architecture |
| ADR-002 | [State Management: Custom Hooks](#adr-002-state-management-custom-hooks-usekanban-uselocalstorage) | Accepted | State |
| ADR-003 | [Drag and Drop Library: @dnd-kit](#adr-003-drag-and-drop-library-dnd-kit) | Accepted | Libraries |
| ADR-004 | [Styling Approach: Tailwind CSS v4 with Glassmorphic Design](#adr-004-styling-approach-tailwind-css-v4-with-glassmorphic-design) | Accepted | Styling |
| ADR-005 | [Persistence Strategy: localStorage with Hydration Protection](#adr-005-persistence-strategy-localstorage-with-hydration-protection) | Accepted | Data |
| ADR-006 | [Type System: TypeScript with Strict Mode](#adr-006-type-system-typescript-with-strict-mode) | Accepted | Type Safety |
| ADR-007 | [Component Architecture: Feature-based Organization](#adr-007-component-architecture-feature-based-organization) | Accepted | Architecture |
| ADR-008 | [Security: XSS Prevention via Sanitization](#adr-008-security-xss-prevention-via-sanitization) | Accepted | Security |
| ADR-009 | [Accessibility: WCAG 2.1 AA Compliance](#adr-009-accessibility-wcag-21-aa-compliance) | Accepted | Accessibility |
| ADR-010 | [ID Generation: Timestamp + Random String](#adr-010-id-generation-timestamp--random-string) | Accepted | Data |
| ADR-011 | [Form Handling: Controlled Components](#adr-011-form-handling-controlled-components) | Accepted | Forms |
| ADR-012 | [Error Handling Strategy](#adr-012-error-handling-strategy) | Accepted | Error Handling |

---

## ADR-001: Framework Choice: Next.js 16.x with App Router

### Status
**Accepted**

### Context
The Kanban board application required a modern React framework that provides:
- Server-side rendering capabilities for SEO and initial load performance
- Built-in routing and code organization patterns
- Modern React features support (React 19.x)
- Production-ready build tooling
- Strong TypeScript support
- Active maintenance and community support

Several frameworks were evaluated for this client-side interactive application.

### Decision
We chose **Next.js 16.1.2** with the **App Router** architecture.

**Implementation Evidence:**
```json
// package.json
{
  "dependencies": {
    "next": "16.1.2",
    "react": "19.2.3",
    "react-dom": "19.2.3"
  }
}
```

All components use the `'use client'` directive to enable client-side interactivity:
```typescript
// src/components/kanban/KanbanBoard.tsx
'use client';
```

### Consequences

**Positive:**
- **React 19 Support**: Next.js 16.x provides first-class React 19 support, enabling use of the latest React features
- **App Router Architecture**: Provides intuitive file-based routing with support for layouts, loading states, and error boundaries
- **Server Components Awareness**: While this implementation uses client components, the architecture is ready for future optimization with Server Components
- **Built-in Optimization**: Automatic code splitting, image optimization, and font optimization
- **TypeScript First**: Excellent TypeScript support with automatic type checking during builds
- **Development Experience**: Fast Refresh, detailed error overlays, and comprehensive DevTools support
- **Production Ready**: Built-in performance optimizations, security headers, and deployment flexibility

**Negative:**
- **Bundle Size**: Next.js adds framework overhead compared to vanilla React (~90KB base)
- **Complexity**: App Router has a learning curve for developers familiar only with Pages Router
- **Over-engineering**: For a single-page Kanban board, some Next.js features (SSR, file-based routing) are underutilized
- **Build Time**: Slightly longer build times compared to lighter frameworks like Vite

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **Plain React + Vite** | Minimal bundle, fast builds, simple setup | No SSR, manual routing, less structure | Lacks production optimizations and conventions for larger teams |
| **Remix** | Excellent data loading, nested routing | Smaller ecosystem, SSR-focused | Heavier focus on server-side patterns not needed for this client-heavy app |
| **Create React App** | Simple setup, familiar | Deprecated, no longer maintained | Not recommended for new projects |
| **Astro** | Great for static content, Island architecture | Less suited for highly interactive apps | Kanban boards require extensive client-side interactivity |

---

## ADR-002: State Management: Custom Hooks (useKanban, useLocalStorage)

### Status
**Accepted**

### Context
The application needed state management for:
- Task data (CRUD operations)
- Persistence to localStorage
- UI state (modals, drag state)
- Hydration state for SSR compatibility

The state complexity is moderate:
- Single data entity (Tasks)
- Local-first persistence
- No server synchronization
- No cross-component state sharing beyond prop drilling

### Decision
We chose to implement **custom React hooks** for state management:

1. **`useLocalStorage`**: Generic hook for persisted state with hydration protection
2. **`useKanban`**: Domain-specific hook encapsulating all task operations

**Implementation:**
```typescript
// src/hooks/useLocalStorage.ts
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);
  // ... hydration and persistence logic
}

// src/hooks/useKanban.ts
export function useKanban(): UseKanbanReturn {
  const [tasks, setTasks, isHydrated] = useLocalStorage<Task[]>(LOCAL_STORAGE_KEY, []);
  // ... CRUD operations with useCallback
}
```

### Consequences

**Positive:**
- **Simplicity**: No external dependencies, easy to understand and debug
- **Co-location**: State logic lives close to where it is used
- **Type Safety**: Full TypeScript inference without library-specific types
- **Bundle Size**: Zero additional bundle size from state management libraries
- **Testability**: Hooks can be tested in isolation with `@testing-library/react-hooks`
- **Flexibility**: Easy to refactor or extend without library constraints
- **Learning Curve**: Standard React patterns, no additional concepts to learn

**Negative:**
- **No DevTools**: Unlike Redux/Zustand, no built-in state inspection tools
- **Manual Optimization**: Must manually implement memoization with `useCallback`/`useMemo`
- **Scalability Concerns**: Would need refactoring if state complexity increases significantly
- **No Middleware**: No built-in support for logging, undo/redo, or state persistence plugins

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **Redux Toolkit** | Powerful DevTools, middleware, large ecosystem | Boilerplate, overkill for simple state | Complexity not justified for single-entity CRUD |
| **Zustand** | Simple API, small bundle, DevTools | Additional dependency, slight learning curve | Minimal benefit over custom hooks for this scope |
| **Jotai** | Atomic state, React-first, tiny bundle | Different mental model, less intuitive for CRUD | Bottom-up atom model less natural for entity-based state |
| **React Context** | Built-in, no dependencies | Performance pitfalls, no memoization by default | Custom hooks provide better encapsulation |
| **TanStack Query** | Excellent for server state | Designed for async data, not local-first | No server to query; localStorage is synchronous |

---

## ADR-003: Drag and Drop Library: @dnd-kit

### Status
**Accepted**

### Context
Drag and drop is the core interaction pattern for a Kanban board. Requirements included:
- Drag tasks between columns
- Reorder tasks within columns
- Keyboard accessibility for drag operations
- Touch device support
- Smooth animations during drag
- Accessible to screen readers

### Decision
We chose **@dnd-kit** (version 6.3.1 core, 10.0.0 sortable).

**Implementation:**
```typescript
// src/components/kanban/KanbanBoard.tsx
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

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

### Consequences

**Positive:**
- **Accessibility First**: Built with ARIA compliance and keyboard navigation as core features
- **Modern Architecture**: Hooks-based API, works seamlessly with React 18/19
- **Modular Design**: Only import what you need (@dnd-kit/core, @dnd-kit/sortable)
- **Performance**: Uses CSS transforms, minimal re-renders, no legacy APIs
- **Customizable Sensors**: PointerSensor, KeyboardSensor, TouchSensor with activation constraints
- **DragOverlay**: Smooth portal-based drag preview that avoids layout thrashing
- **TypeScript Native**: Written in TypeScript with excellent type definitions
- **Active Maintenance**: Regular updates, responsive maintainer

**Negative:**
- **Learning Curve**: Sensor/modifier/collision detection concepts require documentation reading
- **Bundle Size**: ~45KB minified (core + sortable + utilities)
- **Less Batteries-Included**: More setup required compared to react-beautiful-dnd

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **react-beautiful-dnd** | Excellent defaults, Atlassian-backed | Deprecated (no React 18+ support), no keyboard drag | No longer maintained; incompatible with React 19 |
| **react-dnd** | Flexible, HTML5 backend | Complex API, poor accessibility, heavy setup | Poor accessibility story; steep learning curve |
| **Native HTML5 Drag** | Zero dependencies | Poor mobile support, limited styling, no keyboard | Insufficient for production Kanban requirements |
| **Framer Motion drag** | Beautiful animations | Not designed for sortable lists | Would require significant custom logic |

---

## ADR-004: Styling Approach: Tailwind CSS v4 with Glassmorphic Design

### Status
**Accepted**

### Context
The application required:
- Consistent, modern visual design
- Responsive layouts (mobile to desktop)
- Maintainable styling as components evolve
- Design system with reusable patterns
- Performance (minimal CSS bundle)

### Decision
We chose **Tailwind CSS v4** with a **custom glassmorphic design system** implemented through CSS custom properties.

**Design System Implementation:**
```css
/* src/app/globals.css */
:root {
  /* Glassmorphic Color Palette */
  --glass-lavender: rgba(200, 180, 220, 0.7);
  --glass-mint: rgba(180, 225, 200, 0.7);
  --glass-sky: rgba(180, 215, 245, 0.7);
  --glass-peach: rgba(255, 220, 195, 0.7);

  /* Glassmorphic Effects */
  --glass-bg: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(255, 255, 255, 0.35);
  --glass-shadow: 0 8px 32px rgba(100, 100, 140, 0.12);
  --glass-blur: blur(16px);
  --glass-radius: 16px;
}

/* Utility Classes */
.glass { /* frosted glass effect */ }
.glass-sm { /* smaller glass cards */ }
.glass-lg { /* larger glass panels */ }
.bento-block { /* modular grid units */ }
```

**Component Usage:**
```typescript
// Combining Tailwind utilities with custom classes
<div className="glass-sm p-4 cursor-grab active:cursor-grabbing">
  <h3 className="font-semibold text-slate-700">{task.title}</h3>
</div>
```

### Consequences

**Positive:**
- **Utility-First**: Rapid prototyping, no context switching to CSS files
- **Design Tokens**: CSS custom properties enable consistent theming and easy updates
- **Glassmorphic Aesthetic**: Modern, visually distinctive UI that stands out
- **Responsive Built-in**: `md:`, `lg:` prefixes for responsive design
- **Tree Shaking**: Tailwind v4 produces minimal CSS, only includes used utilities
- **Component Patterns**: Custom classes (`.glass`, `.bento-block`) encapsulate complex styles
- **Dark Mode Ready**: CSS variables can be easily swapped for dark mode in future

**Negative:**
- **Long Class Strings**: Some elements have verbose class lists
- **Custom CSS Required**: Glassmorphic effects needed raw CSS, not pure Tailwind
- **Browser Support**: `backdrop-filter` has limited support in older browsers
- **Design Rigidity**: Glassmorphic look may not suit all brand requirements

### CSS Custom Properties Strategy

| Property Category | Purpose | Example |
|-------------------|---------|---------|
| `--glass-*` colors | Consistent pastel palette | `--glass-mint: rgba(180, 225, 200, 0.7)` |
| `--glass-bg-*` | Background transparency levels | `--glass-bg: rgba(255, 255, 255, 0.65)` |
| `--glass-shadow-*` | Depth and elevation | `--glass-shadow-lg: 0 16px 48px rgba(...)` |
| `--glass-blur-*` | Backdrop blur intensity | `--glass-blur: blur(16px)` |
| `--glass-radius-*` | Border radius scale | `--glass-radius-lg: 20px` |

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **CSS Modules** | Scoped styles, familiar CSS | More files, no utility classes | Slower development; would need separate design system |
| **styled-components** | Dynamic styling, component co-location | Runtime cost, larger bundle | CSS-in-JS overhead; less performant than Tailwind |
| **Vanilla Extract** | Zero-runtime, type-safe | Complex setup, less ecosystem | Higher barrier for contributors |
| **Plain CSS/SCSS** | Maximum control, no dependencies | Hard to maintain at scale | Inconsistency risk; no design system enforcement |

---

## ADR-005: Persistence Strategy: localStorage with Hydration Protection

### Status
**Accepted**

### Context
The application needed:
- Client-side data persistence (survive page refreshes)
- No backend requirement (static deployment)
- Fast read/write operations
- SSR compatibility (Next.js hydration)

### Decision
We use **localStorage** with an **`isHydrated` flag** to prevent hydration mismatches.

**Implementation:**
```typescript
// src/hooks/useLocalStorage.ts
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

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

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue, isHydrated];
}
```

**Hydration Protection in UI:**
```typescript
// src/components/kanban/KanbanBoard.tsx
if (!isHydrated) {
  return (
    <div role="status" aria-live="polite">
      <p>Loading Board...</p>
    </div>
  );
}
```

### Consequences

**Positive:**
- **Zero Backend**: No server required; works as a static site
- **Instant Persistence**: Synchronous writes, no network latency
- **SSR Safe**: `isHydrated` flag prevents React hydration mismatches
- **Simple API**: Native browser API, no additional dependencies
- **Debugging**: Data visible in browser DevTools > Application > Local Storage

**Negative:**
- **5MB Limit**: localStorage is limited to ~5MB per origin
- **No Cross-Device Sync**: Data stays on the specific browser
- **Synchronous Blocking**: Large data could block the main thread
- **No Encryption**: Data stored in plain text (security concern for sensitive data)
- **No Conflict Resolution**: Multiple tabs could cause race conditions

### JSON Serialization Approach
- **Serialization**: `JSON.stringify()` on write
- **Deserialization**: `JSON.parse()` on read
- **Date Handling**: Dates stored as ISO strings (`createdAt`, `updatedAt`)
- **Error Handling**: Try/catch with console logging, fallback to initial value

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **IndexedDB** | Larger storage, async, structured | Complex API, overkill for small data | Complexity not justified for simple task list |
| **Backend API** | Cross-device sync, larger storage | Requires server, adds latency | Out of scope for client-only requirement |
| **Session Storage** | Same API as localStorage | Data lost on tab close | Persistence across sessions required |
| **Cookies** | Works without JS | 4KB limit, sent with requests | Too small for task data |

---

## ADR-006: Type System: TypeScript with Strict Mode

### Status
**Accepted**

### Context
A Kanban board has well-defined data structures (tasks, columns, priorities) that benefit from static typing. The team wanted to catch errors at compile time rather than runtime.

### Decision
We use **TypeScript 5.x** with **strict mode enabled**.

**Configuration:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx"
  }
}
```

**Type Definitions Strategy:**

1. **Discriminated Unions for Constrained Values:**
```typescript
// src/types/index.ts
export type Priority = 'low' | 'medium' | 'high';
export type ColumnId = 'todo' | 'in-progress' | 'completed';
```

2. **Interface for Entity Shapes:**
```typescript
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
```

3. **Utility Types for Partial Updates:**
```typescript
// In useKanban.ts
updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
```

4. **Generic Hooks:**
```typescript
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean]
```

### Consequences

**Positive:**
- **Compile-Time Safety**: Catches type errors before runtime
- **IDE Support**: Autocomplete, refactoring, go-to-definition
- **Self-Documenting**: Types serve as inline documentation
- **Refactoring Confidence**: Renaming properties updates all usages
- **Discriminated Unions**: `Priority` and `ColumnId` restrict values to valid options

**Negative:**
- **Build Step**: Requires compilation before running
- **Learning Curve**: Developers need TypeScript knowledge
- **Type Complexity**: Some advanced patterns (generics, conditional types) can be confusing
- **Third-Party Types**: Occasional `@types/*` package inconsistencies

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **JavaScript + JSDoc** | No build step, simpler | Less strict, IDE support varies | Strict mode benefits outweigh build cost |
| **Flow** | Facebook-backed, similar to TS | Smaller ecosystem, less adoption | TypeScript has won the industry |
| **PropTypes** | Runtime validation | Runtime-only, verbose | Does not provide compile-time safety |

---

## ADR-007: Component Architecture: Feature-based Organization

### Status
**Accepted**

### Context
The application needed a component organization strategy that:
- Scales as features are added
- Provides clear ownership of components
- Separates reusable UI primitives from feature-specific components
- Is intuitive for new developers

### Decision
We adopted a **feature-based folder structure** with clear separation between `features/` (feature-specific components) and `components/ui/` (reusable primitives).

**Directory Structure:**
```
src/
  components/
    ui/               # Reusable UI primitives only
      Button.tsx        # Button variants
      Badge.tsx         # Tag/priority badges
      Modal.tsx         # Dialog component
  features/
    kanban/           # Kanban feature components
      KanbanBoard.tsx   # Main board container
      KanbanColumn.tsx  # Column component
      TaskCard.tsx      # Task display/interaction
      TaskForm.tsx      # Task creation/editing
  hooks/
    useKanban.ts        # Kanban state management
    useLocalStorage.ts  # Persistence hook
  types/
    index.ts            # Shared TypeScript interfaces
  constants/
    index.ts            # Configuration constants
  lib/
    utils.ts            # Utility functions
```

### Component Composition Patterns

**Props Interface Design:**
```typescript
// Explicit, typed props interfaces
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

// Callback props over render props for simplicity
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
```

**Composition over Inheritance:**
```typescript
// Modal composes children, not extends
<Modal isOpen={isModalOpen} onClose={handleClose} title="New Task">
  <TaskForm onSubmit={handleSubmit} onCancel={handleClose} />
</Modal>
```

### Consequences

**Positive:**
- **Clear Boundaries**: `kanban/` owns Kanban logic; `ui/` is project-agnostic
- **Reusability**: `ui/` components can be extracted to a design system
- **Discoverability**: New developers know where to find/add components
- **Testability**: Feature components can be tested in isolation
- **Scalability**: New features get their own folders (e.g., `calendar/`, `settings/`)

**Negative:**
- **Initial Overhead**: More folders than a flat structure
- **Import Paths**: Deeper nesting requires path aliases (`@/components/...`)
- **Duplication Risk**: Similar components might exist in `kanban/` and `ui/`

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **Flat Structure** | Simple, all components in one folder | Doesn't scale; hard to navigate | Would become unwieldy as app grows |
| **Atomic Design** | Clear component hierarchy | Complex for small projects; learning curve | Overkill for current scope |
| **Colocation** | Components with their styles/tests | Can become messy | Feature-based provides better boundaries |

---

## ADR-008: Security: XSS Prevention via Sanitization

### Status
**Accepted**

### Context
User-generated content (task titles, descriptions, tags) is displayed in the UI. Without sanitization, malicious scripts could be injected and executed (Cross-Site Scripting / XSS).

### Decision
We implement **HTML entity escaping** at the data layer before storage.

**Implementation:**
```typescript
// src/lib/utils.ts

/**
 * Sanitizes a string to prevent XSS attacks by escaping HTML entities
 */
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

/**
 * Sanitizes task data to prevent XSS attacks
 */
export function sanitizeTaskData<T extends {
  title?: string;
  description?: string;
  tags?: string[]
}>(data: T): T {
  return {
    ...data,
    ...(data.title !== undefined && { title: sanitizeString(data.title) }),
    ...(data.description !== undefined && { description: sanitizeString(data.description) }),
    ...(data.tags !== undefined && { tags: data.tags.map(sanitizeString) }),
  };
}
```

**Application Point:**
```typescript
// src/hooks/useKanban.ts
const addTask = useCallback((taskData) => {
  const sanitizedData = sanitizeTaskData(taskData);
  const newTask = { ...sanitizedData, id: generateId(), ... };
  setTasks((prev) => [...prev, newTask]);
}, [setTasks]);
```

### Input Validation Constants
```typescript
// src/lib/utils.ts
export const VALIDATION = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAG_LENGTH: 30,
  MAX_TAGS: 10,
} as const;
```

### Consequences

**Positive:**
- **XSS Prevention**: Malicious `<script>` tags are escaped to `&lt;script&gt;`
- **Defense in Depth**: Sanitization at data layer protects all display points
- **No Dependencies**: Simple regex-based escaping, no external library
- **Consistent**: All user input goes through the same sanitization

**Negative:**
- **Display Artifacts**: Legitimate `<` or `>` in content appear as escaped entities
- **Storage Overhead**: Escaped strings are slightly longer
- **Incomplete Coverage**: Only protects text fields; doesn't handle URLs or other vectors

### Why Sanitize at Data Layer?

| Approach | Pros | Cons |
|----------|------|------|
| **Sanitize on Storage** (chosen) | Single point of defense; data is always safe | Escaped data looks different than input |
| **Sanitize on Display** | Preserves original data | Must remember to sanitize everywhere; easy to miss |
| **React's Built-in Escaping** | Automatic for JSX children | Doesn't help if data is used in `dangerouslySetInnerHTML` |

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **DOMPurify** | Comprehensive, handles edge cases | 15KB dependency; overkill for text-only fields | No HTML content to purify; simple escaping suffices |
| **Rely on React** | Automatic JSX escaping | Doesn't protect non-render uses | Explicit sanitization is more reliable |

---

## ADR-009: Accessibility: WCAG 2.1 AA Compliance

### Status
**Accepted**

### Context
Kanban boards must be usable by people with disabilities, including:
- Screen reader users
- Keyboard-only users
- Users with motor impairments
- Users with visual impairments

WCAG 2.1 AA is the accepted standard for web accessibility.

### Decision
We implement comprehensive accessibility features across all components.

### Focus Trap Implementation (Modal)
```typescript
// src/components/ui/Modal.tsx
const handleTabKey = useCallback((e: KeyboardEvent) => {
  if (e.key !== 'Tab' || !modalRef.current) return;

  const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (e.shiftKey && document.activeElement === firstElement) {
    e.preventDefault();
    lastElement?.focus();
  } else if (!e.shiftKey && document.activeElement === lastElement) {
    e.preventDefault();
    firstElement?.focus();
  }
}, []);

// Restore focus on close
useEffect(() => {
  if (isOpen) {
    previousActiveElement.current = document.activeElement as HTMLElement;
  }
  return () => {
    previousActiveElement.current?.focus();
  };
}, [isOpen]);
```

### ARIA Attributes Strategy

| Component | ARIA Implementation |
|-----------|---------------------|
| **Modal** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby={titleId}` |
| **Column** | `aria-label="To-Do column with 3 tasks"` |
| **Task Actions** | `aria-label="Edit task: {title}"`, `aria-label="Delete task: {title}"` |
| **Priority Buttons** | `aria-pressed={isSelected}`, `aria-label="Set priority to High"` |
| **Form Fields** | `aria-describedby` for hints, `aria-invalid` for errors |
| **Loading State** | `role="status"`, `aria-live="polite"` |
| **Icons** | `aria-hidden="true"` on decorative SVGs |

### Keyboard Navigation Support

| Action | Keys | Component |
|--------|------|-----------|
| Close modal | `Escape` | Modal |
| Navigate focus | `Tab` / `Shift+Tab` | Modal (trapped) |
| Drag task | Arrow keys | TaskCard (via @dnd-kit KeyboardSensor) |
| Submit form | `Enter` | TaskForm |

### Screen Reader Considerations

1. **Dynamic Content**: `aria-live="polite"` on task count, loading states
2. **Descriptive Labels**: Buttons include task title context ("Delete task: Fix bug")
3. **Semantic HTML**: `<section>`, `<header>`, `<main>`, `<button>`, `<form>`
4. **Unique IDs**: `useId()` for label-input associations

### Consequences

**Positive:**
- **Legal Compliance**: Meets accessibility requirements for many jurisdictions
- **Broader Audience**: Usable by people with disabilities
- **Better UX for All**: Keyboard navigation benefits power users
- **SEO Benefits**: Semantic HTML improves searchability

**Negative:**
- **Development Time**: Accessibility adds ~20% to implementation time
- **Testing Overhead**: Requires screen reader testing and keyboard testing
- **Complexity**: Focus management adds code complexity

### Alternatives Considered

| Alternative | Why Not Chosen |
|-------------|----------------|
| **No accessibility focus** | Excludes users with disabilities; potential legal liability |
| **Third-party a11y library** | Native implementation provides better control |

---

## ADR-010: ID Generation: Timestamp + Random String

### Status
**Accepted**

### Context
Tasks need unique identifiers for:
- React list rendering (`key` prop)
- Drag and drop identification
- Update/delete operations
- localStorage references

### Decision
We generate IDs using **timestamp + random string** format.

**Implementation:**
```typescript
// src/lib/utils.ts
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

**Example Output:** `1706285412345-k7f8x9m2a`

### Collision Probability Analysis

| Factor | Value |
|--------|-------|
| Timestamp precision | 1 millisecond |
| Random string length | 9 characters (base-36) |
| Random string entropy | 36^9 = ~101 trillion combinations |
| Combined uniqueness | Effectively unique for client-side use |

**Collision Scenario:**
- Two tasks created in the same millisecond would need identical 9-character random strings
- Probability: 1 / 101,559,956,668,416 = ~0.000000000001%
- For a Kanban board with hundreds of tasks, collision risk is negligible

### Why Not UUID Library?

| Approach | Bundle Size | Collision Risk | Readability |
|----------|-------------|----------------|-------------|
| **Timestamp + Random** (chosen) | 0 KB | Negligible | Good (sortable by creation) |
| **uuid v4** | ~3 KB | Negligible | Poor (fully random) |
| **nanoid** | ~1 KB | Negligible | Moderate |

### Consequences

**Positive:**
- **Zero Dependencies**: No external library required
- **Sortable**: Timestamp prefix allows chronological sorting
- **Readable**: IDs hint at creation time during debugging
- **Fast**: No cryptographic operations

**Negative:**
- **Not Cryptographically Secure**: `Math.random()` is predictable; don't use for security
- **Client Time Dependency**: IDs depend on client clock accuracy
- **No Guarantee of Uniqueness**: Unlike UUIDs, not a standardized format

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **uuid v4** | Industry standard, RFC-compliant | 3KB bundle size; no sorting benefit | Overkill for local-only IDs |
| **nanoid** | Smaller than uuid, URL-safe | Still a dependency | Custom solution is sufficient |
| **Incrementing integers** | Simple, sortable | Requires state; collision on restart | localStorage could restart counters |

---

## ADR-011: Form Handling: Controlled Components

### Status
**Accepted**

### Context
The TaskForm component needs to:
- Collect task title, description, priority, tags, and column
- Validate input before submission
- Provide real-time feedback (character counts)
- Support both create and edit modes

### Decision
We use **controlled components** with React `useState`.

**Implementation:**
```typescript
// src/components/kanban/TaskForm.tsx
export function TaskForm({ initialData, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'medium');
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(', ') || '');
  const [columnId, setColumnId] = useState<ColumnId>(initialData?.columnId || 'todo');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    // ... validation and submission
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={VALIDATION.MAX_TITLE_LENGTH}
      />
      {/* Character count feedback */}
      <p>{title.length}/{VALIDATION.MAX_TITLE_LENGTH} characters</p>
    </form>
  );
}
```

### Validation Timing
- **On Submit**: Core validation (required title) happens at form submission
- **Real-time Feedback**: Character counts update as user types
- **HTML5 Constraints**: `maxLength`, `required` attributes provide browser-level validation

### Character Limits and Feedback
```typescript
// Real-time character count display
<p className="text-xs text-slate-400">
  {title.length}/{VALIDATION.MAX_TITLE_LENGTH} characters
</p>

// Hint text for complex fields
<p className="text-xs text-slate-400">
  Separate tags with commas (max {VALIDATION.MAX_TAGS} tags, {VALIDATION.MAX_TAG_LENGTH} chars each)
</p>
```

### Consequences

**Positive:**
- **Single Source of Truth**: React state reflects input values
- **Real-time Validation**: Can validate/format as user types
- **Consistent State**: Easy to reset form or populate with edit data
- **Testability**: State can be inspected and manipulated in tests

**Negative:**
- **More Boilerplate**: Each field needs `useState` and `onChange`
- **Re-renders**: Each keystroke triggers a re-render (minor perf cost)
- **No Form Library**: Manual validation logic

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **Uncontrolled Components** | Less code, fewer re-renders | Hard to validate, no real-time feedback | Need character counts and dynamic validation |
| **React Hook Form** | Less boilerplate, performance optimized | Additional dependency | Form is simple enough without it |
| **Formik** | Comprehensive validation | Large bundle, learning curve | Overkill for a 5-field form |

---

## ADR-012: Error Handling Strategy

### Status
**Accepted**

### Context
The application needs error handling for:
- localStorage read/write failures
- Invalid form input
- Unexpected runtime errors

### Decision
We implement a **layered error handling strategy** with context-appropriate responses.

### Error Categories and Handling

#### 1. localStorage Errors (Silent with Logging)
```typescript
// src/hooks/useLocalStorage.ts
const setValue = useCallback((value) => {
  try {
    setStoredValue(valueToStore);
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    // State is still updated; only persistence fails
  }
}, [key, storedValue]);
```

**Rationale:** localStorage failures (quota exceeded, private browsing) are rare and non-critical. The app continues working with in-memory state; only persistence is affected.

#### 2. Form Validation Errors (User Feedback)
```typescript
// src/components/kanban/TaskForm.tsx
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return; // Silent rejection, button is disabled

  // Tags validation with feedback
  const tags = tagsInput
    .split(',')
    .filter((tag) => tag.length <= VALIDATION.MAX_TAG_LENGTH)
    .slice(0, VALIDATION.MAX_TAGS);
};
```

**Feedback Mechanisms:**
- Disabled submit button when title is empty
- Character count hints (proactive)
- Input `maxLength` prevents over-typing

#### 3. Runtime Errors (Unhandled)
- Currently, unexpected errors bubble up to browser console
- **Future Enhancement:** Add Error Boundary component for graceful degradation

### Error Handling Decision Matrix

| Error Type | Severity | User Impact | Response |
|------------|----------|-------------|----------|
| localStorage read failure | Low | None if first visit | Log, use initial value |
| localStorage write failure | Medium | Data may not persist | Log, continue with memory state |
| Empty title submission | Low | None (prevented) | Disable button |
| Invalid tag format | Low | Tags silently filtered | Filter invalid, accept valid |
| Drag/drop failure | Medium | Operation fails | @dnd-kit handles gracefully |

### Consequences

**Positive:**
- **Graceful Degradation**: App continues working despite storage failures
- **User-Friendly**: No alarming error messages for non-critical issues
- **Debugging Support**: `console.error` provides developer visibility
- **Progressive Enhancement**: Core functionality works even if extras fail

**Negative:**
- **Silent Failures**: Users may not know their data isn't persisting
- **No Error Boundary**: React render errors crash the whole app
- **Limited Telemetry**: No error reporting to external services

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **Toast Notifications** | User sees all errors | Annoying for non-critical issues | Over-communicates minor issues |
| **Error Boundary + Fallback UI** | Catches render errors | Adds complexity | Should be added as enhancement |
| **Retry with Exponential Backoff** | More resilient | Overkill for localStorage | localStorage is synchronous; no transient failures |

---

## Summary

This document captures the key architectural and implementation decisions for the Kanban board. Each decision was made considering:

1. **Project Scope**: A client-side Kanban board with moderate complexity
2. **Performance**: Optimizing for smooth drag-and-drop and fast persistence
3. **Maintainability**: Code organization and typing for future developers
4. **Accessibility**: WCAG 2.1 AA compliance for inclusive design
5. **Security**: XSS prevention for user-generated content
6. **Developer Experience**: Familiar tools and patterns

Future developers should review this document before making significant changes, and update it when new decisions are made.

---

*Document Version: 1.0*
*Last Updated: 2026-01-26*
