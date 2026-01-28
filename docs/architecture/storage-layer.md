# Storage Layer Documentation

This document describes the localStorage-based persistence layer used in the Kanban Board application, including the `useLocalStorage` hook, SSR hydration handling, and best practices.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [useLocalStorage Hook](#uselocalstorage-hook)
- [SSR Hydration Handling](#ssr-hydration-handling)
- [Data Serialization](#data-serialization)
- [Error Handling](#error-handling)
- [Browser Compatibility](#browser-compatibility)
- [Limitations and Considerations](#limitations-and-considerations)

---

## Overview

The Kanban Board uses browser localStorage for data persistence. This approach provides:

- **Zero Server Requirements**: No backend database or API needed
- **Instant Persistence**: Changes are saved immediately to localStorage
- **Offline Support**: Data is available without an internet connection
- **Privacy**: User data stays on their device

### Storage Key

All task data is stored under a single key:

```typescript
export const LOCAL_STORAGE_KEY = 'kanban-tasks';
```

This key is defined in `src/constants/index.ts` and used consistently throughout the application.

---

## Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
│  (KanbanBoard, TaskCard, TaskForm)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ User interactions
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    useKanban Hook                            │
│  - addTask()      - updateTask()    - deleteTask()          │
│  - moveTask()     - getTasksByColumn()                      │
│  - Input sanitization (XSS prevention)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ Task[] state changes
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 useLocalStorage Hook                         │
│  - Manages state synchronization with localStorage          │
│  - Handles SSR hydration                                    │
│  - Provides isHydrated flag                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ JSON serialization
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Browser localStorage                       │
│  Key: 'kanban-tasks'                                        │
│  Value: JSON string of Task[]                               │
└─────────────────────────────────────────────────────────────┘
```

### Hook Dependency Chain

```typescript
// useKanban depends on useLocalStorage
function useKanban() {
  const [tasks, setTasks, isHydrated] = useLocalStorage<Task[]>(LOCAL_STORAGE_KEY, []);
  // ... CRUD operations
}

// Components use useKanban
function KanbanBoard() {
  const { tasks, isHydrated, addTask, updateTask, deleteTask, moveTask } = useKanban();
  // ... UI rendering
}
```

---

## useLocalStorage Hook

The `useLocalStorage` hook is a generic, reusable hook for persisting state to localStorage while handling SSR compatibility.

### Location

`src/hooks/useLocalStorage.ts`

### Signature

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean]
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | The localStorage key to store data under |
| `initialValue` | `T` | Default value used during SSR and when no stored value exists |

### Return Value

Returns a tuple of three elements:

| Index | Type | Description |
|-------|------|-------------|
| 0 | `T` | The current stored value |
| 1 | `(value: T \| ((prev: T) => T)) => void` | Setter function (supports functional updates) |
| 2 | `boolean` | Hydration status flag (`true` when client data is loaded) |

### Implementation

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  // Start with initial value (safe for SSR)
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after mount (client-side only)
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

  // Memoized setter that updates both state and localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue, isHydrated];
}
```

### Usage Examples

#### Basic Usage

```typescript
const [name, setName, isHydrated] = useLocalStorage('user-name', '');

// Set a value
setName('John Doe');

// Functional update
setName(prev => prev.toUpperCase());

// Check hydration before rendering
if (!isHydrated) {
  return <LoadingSkeleton />;
}
```

#### With Complex Types

```typescript
interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

const [preferences, setPreferences, isHydrated] = useLocalStorage<UserPreferences>(
  'user-preferences',
  { theme: 'light', language: 'en', notifications: true }
);

// Update a single property
setPreferences(prev => ({ ...prev, theme: 'dark' }));
```

---

## SSR Hydration Handling

### The Hydration Problem

Next.js renders components on the server first, then "hydrates" them on the client. localStorage is only available in the browser, creating a mismatch:

1. **Server**: Renders with `initialValue` (localStorage unavailable)
2. **Client**: Hydrates with `initialValue`, then loads from localStorage
3. **Mismatch**: If content differs, React throws a hydration error

### The Solution

The `useLocalStorage` hook solves this with a two-phase approach:

```
Phase 1: Server Render + Initial Client Render
├── storedValue = initialValue
├── isHydrated = false
└── Components render with initial/loading state

Phase 2: After useEffect (Client Only)
├── Load data from localStorage
├── storedValue = loaded data (or initialValue if empty)
├── isHydrated = true
└── Components re-render with actual data
```

### Using the isHydrated Flag

Components should use `isHydrated` to handle the loading state:

```typescript
function KanbanBoard() {
  const { tasks, isHydrated } = useKanban();

  // Show loading state until hydrated
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">Loading your tasks...</div>
      </div>
    );
  }

  // Safe to render actual content
  return (
    <div>
      {tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}
```

### Why Not Use useSyncExternalStore?

While React 18+ provides `useSyncExternalStore` for external data sources, the current approach was chosen for:

- **Simplicity**: Easier to understand and maintain
- **Compatibility**: Works with all React versions
- **Sufficient for Use Case**: localStorage data is not expected to change from other tabs

---

## Data Serialization

### Serialization Process

Data is serialized to JSON when storing:

```typescript
// Writing to localStorage
window.localStorage.setItem(key, JSON.stringify(valueToStore));

// Reading from localStorage
const item = window.localStorage.getItem(key);
const parsed = JSON.parse(item);
```

### Task Data Structure

```typescript
interface Task {
  id: string;           // Unique identifier (timestamp + random)
  title: string;        // Task title (max 100 chars, sanitized)
  description: string;  // Task description (max 500 chars, sanitized)
  priority: Priority;   // 'low' | 'medium' | 'high'
  tags: string[];       // Array of tag strings (max 10, each max 30 chars)
  columnId: ColumnId;   // 'todo' | 'in-progress' | 'completed'
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
}
```

### Example Stored Data

```json
[
  {
    "id": "1706284800000-abc123xyz",
    "title": "Implement drag and drop",
    "description": "Add @dnd-kit library for task reordering",
    "priority": "high",
    "tags": ["feature", "ui"],
    "columnId": "in-progress",
    "createdAt": "2024-01-26T12:00:00.000Z",
    "updatedAt": "2024-01-26T14:30:00.000Z"
  },
  {
    "id": "1706284900000-def456uvw",
    "title": "Write documentation",
    "description": "Create setup and storage layer docs",
    "priority": "medium",
    "tags": ["docs"],
    "columnId": "todo",
    "createdAt": "2024-01-26T12:01:40.000Z",
    "updatedAt": "2024-01-26T12:01:40.000Z"
  }
]
```

### Serialization Considerations

| Type | Serializes Correctly | Notes |
|------|---------------------|-------|
| Strings | Yes | Standard JSON |
| Numbers | Yes | Standard JSON |
| Booleans | Yes | Standard JSON |
| Arrays | Yes | Standard JSON |
| Objects | Yes | Standard JSON |
| Dates | Partial | Stored as ISO strings, must be parsed manually |
| Functions | No | Not serializable |
| undefined | No | Converted to null or omitted |
| Symbols | No | Not serializable |

---

## Error Handling

### Read Errors

Errors during localStorage reads are caught and logged:

```typescript
useEffect(() => {
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      setStoredValue(JSON.parse(item));
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    // Falls back to initialValue
  }
  setIsHydrated(true);
}, []);
```

**Common Read Errors:**
- Corrupted JSON data
- localStorage access denied (private browsing)
- Storage quota exceeded

### Write Errors

Errors during localStorage writes are caught and logged:

```typescript
const setValue = useCallback(
  (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      // State is still updated even if localStorage fails
    }
  },
  [key, storedValue]
);
```

**Common Write Errors:**
- QuotaExceededError (storage full)
- SecurityError (third-party context)
- Private browsing restrictions

### Graceful Degradation

The application continues to function even if localStorage fails:
- In-memory state is always updated
- User can still use the app during the session
- Data will not persist between sessions if storage fails

---

## Browser Compatibility

### localStorage Support

| Browser | Supported | Notes |
|---------|-----------|-------|
| Chrome | Yes | Full support |
| Firefox | Yes | Full support |
| Safari | Yes | 5MB limit |
| Edge | Yes | Full support |
| IE 11 | Yes | 5MB limit (legacy) |
| Mobile Safari | Yes | May clear in low storage |
| Chrome Android | Yes | Full support |

### Storage Limits

| Browser | Typical Limit |
|---------|---------------|
| Chrome | 5MB per origin |
| Firefox | 5MB per origin |
| Safari | 5MB per origin |
| Mobile | 2.5-5MB per origin |

### Private Browsing Considerations

| Browser | Private Mode Behavior |
|---------|----------------------|
| Safari | localStorage throws error |
| Chrome | localStorage works but clears on close |
| Firefox | localStorage works but clears on close |

### Checking Availability

```typescript
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}
```

---

## Limitations and Considerations

### Storage Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| 5MB limit | Cannot store large amounts of data | Keep task data minimal |
| Single origin | Data not shared across domains | Expected behavior |
| Synchronous API | Can block main thread | Keep data size small |
| No encryption | Data visible in DevTools | Don't store sensitive data |
| No expiration | Data persists indefinitely | Implement manual cleanup if needed |

### Data Integrity

**No Transaction Support**: Unlike databases, localStorage has no transaction support. If the browser crashes mid-write, data could be corrupted.

**Recommendation**: Consider implementing periodic exports for critical data:

```typescript
function exportTasks(tasks: Task[]): void {
  const dataStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  // Trigger download...
}
```

### Multi-Tab Behavior

The current implementation does not sync between tabs. If the same user has the app open in multiple tabs:

- Changes in Tab A will not appear in Tab B until refresh
- Both tabs could overwrite each other's changes

**Potential Enhancement** (not implemented):

```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === key && e.newValue) {
      setStoredValue(JSON.parse(e.newValue));
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, [key]);
```

### Performance Considerations

| Operation | Performance Impact |
|-----------|-------------------|
| Read (on mount) | Single synchronous read, typically < 1ms |
| Write (on change) | Synchronous write, blocks UI briefly |
| Large data sets | JSON serialization can be slow for > 1MB |

**Best Practices:**
- Keep total data under 100KB for optimal performance
- Batch updates when possible (e.g., reordering multiple tasks)
- Consider debouncing rapid updates

### Security Considerations

1. **XSS Vulnerability**: localStorage is accessible via JavaScript. The application mitigates this by:
   - Sanitizing all user input before storage
   - Using React's built-in XSS protection for rendering

2. **No Authentication**: Any JavaScript on the page can read localStorage. Don't store:
   - Authentication tokens (use httpOnly cookies instead)
   - Personal identifiable information
   - Financial data

3. **Input Sanitization**: All task data is sanitized before storage:

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

### When to Consider Alternatives

Consider migrating to a backend solution if you need:

| Requirement | Why localStorage Falls Short |
|-------------|------------------------------|
| Multi-device sync | localStorage is device-specific |
| Collaboration | No real-time sync between users |
| Large data sets | 5MB limit per origin |
| Data analytics | No server-side access to data |
| Backup/recovery | User could clear browser data |
| Offline-first with sync | Need IndexedDB + sync strategy |

### Migration Path

If you outgrow localStorage, consider:

1. **IndexedDB**: For larger client-side storage with async API
2. **SQLite (via WASM)**: For complex queries on client
3. **Backend API**: For multi-device, collaboration, and analytics
4. **Supabase/Firebase**: For quick backend with real-time sync

---

## Testing the Storage Layer

### Manual Testing

1. **Create tasks** and verify they appear after page refresh
2. **Open DevTools** > Application > Local Storage to inspect raw data
3. **Clear localStorage** and verify the app handles empty state
4. **Test private browsing** to ensure graceful degradation

### Unit Test Example

```typescript
describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );
    expect(result.current[0]).toBe('initial');
  });

  it('should persist values to localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(localStorage.getItem('test-key')).toBe('"updated"');
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 0)
    );

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });
});
```

---

## Related Documentation

- [Project Setup Guide](../getting-started/project-setup)
- [Implementation Plan](../plans/KANBAN_IMPLEMENTATION_PLAN)
