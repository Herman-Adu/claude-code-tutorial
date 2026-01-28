# Filtering System

> **PLANNED FEATURE - Not Yet Implemented**
>
> This document describes a proposed filtering system for the Kanban board application.
> The feature is currently in the design phase and has not been implemented.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Filter Capabilities](#2-filter-capabilities)
3. [Proposed Filter UI Design](#3-proposed-filter-ui-design)
4. [Filter State Management](#4-filter-state-management)
5. [useFilter Hook Proposal](#5-usefilter-hook-proposal)
6. [URL-Based Filter Persistence](#6-url-based-filter-persistence)
7. [Performance Considerations](#7-performance-considerations)
8. [Implementation Phases](#8-implementation-phases)

---

## 1. Overview

### Current State

The Kanban board displays all tasks without any filtering capability. Users must visually scan through all tasks to find specific items.

### Proposed State

Implement a comprehensive filtering system that enables users to:

- Filter tasks by priority (low, medium, high)
- Filter tasks by tags
- Filter tasks by date range (if due dates are implemented)
- Search tasks by title and description text
- Combine multiple filters with AND/OR logic
- Persist filter state in URL for sharing and bookmarking
- Clear all filters with one click

---

## 2. Filter Capabilities

### 2.1 Filter Types

| Filter Type | Description | Values | Logic |
|-------------|-------------|--------|-------|
| **Priority** | Filter by task priority level | `low`, `medium`, `high` | OR (any selected) |
| **Tags** | Filter by assigned tags | Any existing tag | OR (any selected) |
| **Date Range** | Filter by due date | Start date, end date | AND (within range) |
| **Search Text** | Full-text search | Any string | Contains match |
| **Status** | Filter by column | `todo`, `in-progress`, `completed` | OR (any selected) |

### 2.2 Filter Combinations

Filters combine with AND logic between types and OR logic within types:

```
Final Result = (Priority Filter) AND (Tag Filter) AND (Date Filter) AND (Search Filter)

Where:
  Priority Filter = task.priority IN [selected priorities]
  Tag Filter = task.tags INTERSECTS [selected tags]
  Date Filter = task.dueDate BETWEEN [start, end]
  Search Filter = task.title CONTAINS search OR task.description CONTAINS search
```

### 2.3 Example Filter Scenarios

**Scenario 1: High priority bugs**
```
Priority: [high]
Tags: [bug]
Result: All high-priority tasks tagged with "bug"
```

**Scenario 2: This week's tasks**
```
Date Range: [2026-01-20, 2026-01-26]
Result: All tasks due this week
```

**Scenario 3: Search for "API"**
```
Search: "API"
Result: All tasks with "API" in title or description
```

**Scenario 4: Combined filters**
```
Priority: [medium, high]
Tags: [frontend]
Search: "button"
Result: Medium or high priority frontend tasks mentioning "button"
```

---

## 3. Proposed Filter UI Design

### 3.1 Filter Bar Layout

The filter bar will be positioned between the header and the Kanban columns:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Task Flow                                                               │
│  Organize your tasks with ease                    [Kanban] [Calendar]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  FILTER BAR                                                         │ │
│  │                                                                     │ │
│  │  ┌─────────────────────────────┐  ┌──────────┐  ┌──────────┐       │ │
│  │  │ Search tasks...         [x] │  │ Priority │  │ Tags     │       │ │
│  │  └─────────────────────────────┘  │    v     │  │    v     │       │ │
│  │                                   └──────────┘  └──────────┘       │ │
│  │                                                                     │ │
│  │  Active Filters: [High x] [Bug x] [Frontend x]     [Clear All]     │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │    To-Do     │  │  In Progress │  │  Completed   │                   │
│  │              │  │              │  │              │                   │
│  │   [Tasks]    │  │   [Tasks]    │  │   [Tasks]    │                   │
│  │              │  │              │  │              │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Filter Components

#### Search Input

```
┌─────────────────────────────────────────┐
│  [Search Icon]  Search tasks...     [x] │
└─────────────────────────────────────────┘

- Glassmorphic input styling
- Debounced search (300ms delay)
- Clear button appears when text entered
- Placeholder text: "Search tasks..."
```

#### Priority Filter Dropdown

```
┌──────────────────┐
│  Priority    [v] │
├──────────────────┤
│  [ ] All         │
│  [x] High        │
│  [x] Medium      │
│  [ ] Low         │
└──────────────────┘

- Multi-select checkboxes
- Visual indicators (colored dots) for each priority
- "All" option to quickly select/deselect all
```

#### Tags Filter Dropdown

```
┌──────────────────────┐
│  Tags            [v] │
├──────────────────────┤
│  [Search tags...]    │
│  ──────────────────  │
│  [x] bug        (5)  │
│  [x] frontend   (3)  │
│  [ ] backend    (2)  │
│  [ ] design     (1)  │
└──────────────────────┘

- Multi-select with search
- Shows task count per tag
- Tags sorted by frequency
- Filtered as user types in search
```

#### Date Range Filter (if due dates implemented)

```
┌────────────────────────────────────┐
│  Due Date                      [v] │
├────────────────────────────────────┤
│  Quick Select:                     │
│  [Today] [This Week] [This Month]  │
│  ──────────────────────────────    │
│  From: [01/20/2026]                │
│  To:   [01/26/2026]                │
│  ──────────────────────────────    │
│  [ ] Include tasks without dates   │
└────────────────────────────────────┘

- Quick select buttons for common ranges
- Date pickers for custom range
- Option to include/exclude undated tasks
```

#### Active Filters Display

```
Active Filters: ┌──────┐ ┌─────┐ ┌──────────┐         ┌───────────┐
                │High x│ │Bug x│ │Frontend x│         │ Clear All │
                └──────┘ └─────┘ └──────────┘         └───────────┘

- Chips showing all active filters
- Click 'x' to remove individual filter
- "Clear All" button to reset all filters
- Chips color-coded by filter type
```

### 3.3 Glassmorphic Filter Styling

```css
/* Filter bar container */
.filter-bar {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--glass-radius);
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

/* Search input */
.filter-search {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  width: 280px;
  transition: all 0.2s ease;
}

.filter-search:focus {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(56, 189, 248, 0.5);
  outline: none;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
}

/* Filter dropdown trigger */
.filter-dropdown-trigger {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-dropdown-trigger:hover {
  background: rgba(255, 255, 255, 0.7);
}

/* Active filter chip */
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.filter-chip.priority-high {
  background: rgba(244, 63, 94, 0.15);
  color: rgb(159, 18, 57);
}

.filter-chip.priority-medium {
  background: rgba(245, 158, 11, 0.15);
  color: rgb(146, 64, 14);
}

.filter-chip.priority-low {
  background: rgba(16, 185, 129, 0.15);
  color: rgb(6, 95, 70);
}

.filter-chip.tag {
  background: rgba(139, 92, 246, 0.15);
  color: rgb(91, 33, 182);
}

.filter-chip .remove-btn {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.filter-chip .remove-btn:hover {
  opacity: 1;
}
```

### 3.4 Responsive Design

**Desktop (md and above):**
- Full filter bar with all controls visible
- Dropdowns open below triggers

**Mobile (below md):**
- Filter bar collapses to icon button
- Opens full-screen filter modal
- Touch-friendly controls

```
Mobile Filter Modal:
┌─────────────────────────────────────┐
│  Filters                        [x] │
├─────────────────────────────────────┤
│                                     │
│  Search                             │
│  ┌─────────────────────────────┐    │
│  │ Search tasks...             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Priority                           │
│  ┌─────┐ ┌────────┐ ┌─────┐        │
│  │ Low │ │ Medium │ │ High│        │
│  └─────┘ └────────┘ └─────┘        │
│                                     │
│  Tags                               │
│  ┌─────┐ ┌──────┐ ┌─────────┐      │
│  │ Bug │ │ UI   │ │ Backend │      │
│  └─────┘ └──────┘ └─────────┘      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │       Apply Filters         │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │       Clear All             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Filter State Management

### 4.1 Filter State Interface

```typescript
// types/filter.ts (proposed)

import { Priority, ColumnId } from './index';

/**
 * Date range for filtering
 */
export interface DateRange {
  start: string | null;  // ISO date string
  end: string | null;    // ISO date string
}

/**
 * Complete filter state
 */
export interface FilterState {
  /** Text search query */
  search: string;

  /** Selected priority levels (empty = all) */
  priorities: Priority[];

  /** Selected tags (empty = all) */
  tags: string[];

  /** Selected columns/statuses (empty = all) */
  statuses: ColumnId[];

  /** Due date range (null = no filter) */
  dateRange: DateRange | null;

  /** Include tasks without due dates when date filter active */
  includeUndated: boolean;
}

/**
 * Default/empty filter state
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  search: '',
  priorities: [],
  tags: [],
  statuses: [],
  dateRange: null,
  includeUndated: true,
};

/**
 * Filter action types for reducer
 */
export type FilterAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'TOGGLE_PRIORITY'; payload: Priority }
  | { type: 'SET_PRIORITIES'; payload: Priority[] }
  | { type: 'TOGGLE_TAG'; payload: string }
  | { type: 'SET_TAGS'; payload: string[] }
  | { type: 'TOGGLE_STATUS'; payload: ColumnId }
  | { type: 'SET_DATE_RANGE'; payload: DateRange | null }
  | { type: 'SET_INCLUDE_UNDATED'; payload: boolean }
  | { type: 'CLEAR_ALL' }
  | { type: 'RESTORE'; payload: FilterState };
```

### 4.2 Filter Reducer

```typescript
// hooks/filterReducer.ts (proposed)

export function filterReducer(
  state: FilterState,
  action: FilterAction
): FilterState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };

    case 'TOGGLE_PRIORITY': {
      const priorities = state.priorities.includes(action.payload)
        ? state.priorities.filter((p) => p !== action.payload)
        : [...state.priorities, action.payload];
      return { ...state, priorities };
    }

    case 'SET_PRIORITIES':
      return { ...state, priorities: action.payload };

    case 'TOGGLE_TAG': {
      const tags = state.tags.includes(action.payload)
        ? state.tags.filter((t) => t !== action.payload)
        : [...state.tags, action.payload];
      return { ...state, tags };
    }

    case 'SET_TAGS':
      return { ...state, tags: action.payload };

    case 'TOGGLE_STATUS': {
      const statuses = state.statuses.includes(action.payload)
        ? state.statuses.filter((s) => s !== action.payload)
        : [...state.statuses, action.payload];
      return { ...state, statuses };
    }

    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload };

    case 'SET_INCLUDE_UNDATED':
      return { ...state, includeUndated: action.payload };

    case 'CLEAR_ALL':
      return DEFAULT_FILTER_STATE;

    case 'RESTORE':
      return action.payload;

    default:
      return state;
  }
}
```

---

## 5. useFilter Hook Proposal

### 5.1 Hook Interface

```typescript
// hooks/useFilter.ts (proposed)

import { Task, Priority, ColumnId } from '@/types';
import { FilterState, DateRange, DEFAULT_FILTER_STATE } from '@/types/filter';

interface UseFilterReturn {
  /** Current filter state */
  filters: FilterState;

  /** Filtered tasks based on current filters */
  filteredTasks: Task[];

  /** Whether any filters are active */
  hasActiveFilters: boolean;

  /** Count of active filters */
  activeFilterCount: number;

  /** All unique tags from tasks (for dropdown) */
  availableTags: string[];

  // Filter actions
  setSearch: (query: string) => void;
  togglePriority: (priority: Priority) => void;
  setPriorities: (priorities: Priority[]) => void;
  toggleTag: (tag: string) => void;
  setTags: (tags: string[]) => void;
  toggleStatus: (status: ColumnId) => void;
  setDateRange: (range: DateRange | null) => void;
  setIncludeUndated: (include: boolean) => void;
  clearAll: () => void;

  // URL sync
  getFilterUrl: () => string;
  restoreFromUrl: (searchParams: URLSearchParams) => void;
}
```

### 5.2 Hook Implementation

```typescript
// hooks/useFilter.ts (proposed implementation)
'use client';

import { useReducer, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Task, Priority, ColumnId } from '@/types';
import {
  FilterState,
  FilterAction,
  DateRange,
  DEFAULT_FILTER_STATE,
} from '@/types/filter';
import { filterReducer } from './filterReducer';

export function useFilter(tasks: Task[]): UseFilterReturn {
  const [filters, dispatch] = useReducer(filterReducer, DEFAULT_FILTER_STATE);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Restore filters from URL on mount
  useEffect(() => {
    const restored = parseFiltersFromUrl(searchParams);
    if (restored) {
      dispatch({ type: 'RESTORE', payload: restored });
    }
  }, []);

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description
          .toLowerCase()
          .includes(searchLower);
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      // Priority filter
      if (filters.priorities.length > 0) {
        if (!filters.priorities.includes(task.priority)) {
          return false;
        }
      }

      // Tag filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = task.tags.some((tag) =>
          filters.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Status filter
      if (filters.statuses.length > 0) {
        if (!filters.statuses.includes(task.columnId)) {
          return false;
        }
      }

      // Date range filter (if dueDate exists on task)
      if (filters.dateRange && 'dueDate' in task) {
        const taskDate = (task as Task & { dueDate?: string }).dueDate;
        if (!taskDate) {
          return filters.includeUndated;
        }
        const taskDateObj = new Date(taskDate);
        if (filters.dateRange.start) {
          if (taskDateObj < new Date(filters.dateRange.start)) {
            return false;
          }
        }
        if (filters.dateRange.end) {
          if (taskDateObj > new Date(filters.dateRange.end)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [tasks, filters]);

  // Calculate available tags from all tasks
  const availableTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    tasks.forEach((task) => {
      task.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([tag]) => tag);
  }, [tasks]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.priorities.length > 0 ||
      filters.tags.length > 0 ||
      filters.statuses.length > 0 ||
      filters.dateRange !== null
    );
  }, [filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    count += filters.priorities.length;
    count += filters.tags.length;
    count += filters.statuses.length;
    if (filters.dateRange) count++;
    return count;
  }, [filters]);

  // Action handlers
  const setSearch = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH', payload: query });
  }, []);

  const togglePriority = useCallback((priority: Priority) => {
    dispatch({ type: 'TOGGLE_PRIORITY', payload: priority });
  }, []);

  const setPriorities = useCallback((priorities: Priority[]) => {
    dispatch({ type: 'SET_PRIORITIES', payload: priorities });
  }, []);

  const toggleTag = useCallback((tag: string) => {
    dispatch({ type: 'TOGGLE_TAG', payload: tag });
  }, []);

  const setTags = useCallback((tags: string[]) => {
    dispatch({ type: 'SET_TAGS', payload: tags });
  }, []);

  const toggleStatus = useCallback((status: ColumnId) => {
    dispatch({ type: 'TOGGLE_STATUS', payload: status });
  }, []);

  const setDateRange = useCallback((range: DateRange | null) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: range });
  }, []);

  const setIncludeUndated = useCallback((include: boolean) => {
    dispatch({ type: 'SET_INCLUDE_UNDATED', payload: include });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  // URL sync functions
  const getFilterUrl = useCallback(() => {
    return serializeFiltersToUrl(filters);
  }, [filters]);

  const restoreFromUrl = useCallback((params: URLSearchParams) => {
    const restored = parseFiltersFromUrl(params);
    if (restored) {
      dispatch({ type: 'RESTORE', payload: restored });
    }
  }, []);

  // Sync filters to URL when they change
  useEffect(() => {
    if (hasActiveFilters) {
      const params = new URLSearchParams();
      if (filters.search) params.set('q', filters.search);
      if (filters.priorities.length) params.set('p', filters.priorities.join(','));
      if (filters.tags.length) params.set('t', filters.tags.join(','));
      if (filters.statuses.length) params.set('s', filters.statuses.join(','));
      if (filters.dateRange) {
        if (filters.dateRange.start) params.set('from', filters.dateRange.start);
        if (filters.dateRange.end) params.set('to', filters.dateRange.end);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } else {
      router.replace(pathname, { scroll: false });
    }
  }, [filters, hasActiveFilters, pathname, router]);

  return {
    filters,
    filteredTasks,
    hasActiveFilters,
    activeFilterCount,
    availableTags,
    setSearch,
    togglePriority,
    setPriorities,
    toggleTag,
    setTags,
    toggleStatus,
    setDateRange,
    setIncludeUndated,
    clearAll,
    getFilterUrl,
    restoreFromUrl,
  };
}

// Helper functions for URL serialization
function serializeFiltersToUrl(filters: FilterState): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.priorities.length) params.set('p', filters.priorities.join(','));
  if (filters.tags.length) params.set('t', filters.tags.join(','));
  if (filters.statuses.length) params.set('s', filters.statuses.join(','));
  if (filters.dateRange?.start) params.set('from', filters.dateRange.start);
  if (filters.dateRange?.end) params.set('to', filters.dateRange.end);
  return params.toString();
}

function parseFiltersFromUrl(params: URLSearchParams): FilterState | null {
  const hasFilters =
    params.has('q') ||
    params.has('p') ||
    params.has('t') ||
    params.has('s') ||
    params.has('from') ||
    params.has('to');

  if (!hasFilters) return null;

  return {
    search: params.get('q') || '',
    priorities: (params.get('p')?.split(',') || []) as Priority[],
    tags: params.get('t')?.split(',') || [],
    statuses: (params.get('s')?.split(',') || []) as ColumnId[],
    dateRange:
      params.has('from') || params.has('to')
        ? {
            start: params.get('from'),
            end: params.get('to'),
          }
        : null,
    includeUndated: true,
  };
}
```

---

## 6. URL-Based Filter Persistence

### 6.1 URL Parameter Schema

| Parameter | Description | Example |
|-----------|-------------|---------|
| `q` | Search query | `?q=api%20design` |
| `p` | Priority filter (comma-separated) | `?p=high,medium` |
| `t` | Tag filter (comma-separated) | `?t=bug,frontend` |
| `s` | Status filter (comma-separated) | `?s=todo,in-progress` |
| `from` | Date range start (ISO date) | `?from=2026-01-20` |
| `to` | Date range end (ISO date) | `?to=2026-01-26` |

### 6.2 Example URLs

```
# High priority tasks
/board?p=high

# Search for "API"
/board?q=API

# High priority bugs
/board?p=high&t=bug

# This week's tasks
/board?from=2026-01-20&to=2026-01-26

# Complex filter
/board?q=button&p=high,medium&t=frontend,ui&s=todo,in-progress
```

### 6.3 Sharing Filters

Users can share filtered views by copying the URL:

```typescript
// Copy filter URL to clipboard
const handleShareFilters = async () => {
  const url = `${window.location.origin}${pathname}?${getFilterUrl()}`;
  await navigator.clipboard.writeText(url);
  toast.success('Filter URL copied to clipboard');
};
```

### 6.4 Browser Navigation

- Back/forward navigation restores previous filter states
- Bookmarking preserves the current filter configuration
- Direct URL access applies filters immediately

---

## 7. Performance Considerations

### 7.1 Search Debouncing

Prevent excessive filtering during typing:

```typescript
// hooks/useDebouncedValue.ts (proposed)

import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in FilterBar
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebouncedValue(searchInput, 300);

useEffect(() => {
  setSearch(debouncedSearch);
}, [debouncedSearch, setSearch]);
```

### 7.2 Memoized Filtering

All filter computations are memoized with `useMemo`:

```typescript
const filteredTasks = useMemo(() => {
  return tasks.filter((task) => {
    // Filter logic
  });
}, [tasks, filters]); // Only recompute when tasks or filters change
```

### 7.3 Virtual Rendering for Large Lists

For boards with many tasks, consider virtualized rendering:

```typescript
// Using react-window for virtual lists
import { FixedSizeList } from 'react-window';

function VirtualizedTaskList({ tasks }: { tasks: Task[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={tasks.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <TaskCard task={tasks[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### 7.4 Filter Index Optimization

For very large task sets, consider indexing:

```typescript
// Pre-compute indexes for faster filtering
const taskIndexes = useMemo(() => {
  const priorityIndex = new Map<Priority, Set<string>>();
  const tagIndex = new Map<string, Set<string>>();

  tasks.forEach((task) => {
    // Priority index
    if (!priorityIndex.has(task.priority)) {
      priorityIndex.set(task.priority, new Set());
    }
    priorityIndex.get(task.priority)!.add(task.id);

    // Tag index
    task.tags.forEach((tag) => {
      if (!tagIndex.has(tag)) {
        tagIndex.set(tag, new Set());
      }
      tagIndex.get(tag)!.add(task.id);
    });
  });

  return { priorityIndex, tagIndex };
}, [tasks]);
```

### 7.5 Performance Benchmarks

| Scenario | Task Count | Filter Time (target) |
|----------|------------|---------------------|
| Simple filter | 100 tasks | < 5ms |
| Complex filter | 100 tasks | < 10ms |
| Simple filter | 1000 tasks | < 20ms |
| Complex filter | 1000 tasks | < 50ms |

---

## 8. Implementation Phases

### Phase 1: Core Filter Infrastructure (Week 1)

**Goals:**
- Create FilterState types
- Implement useFilter hook
- Add basic search functionality
- Create filter reducer

**Deliverables:**
- [ ] Filter type definitions
- [ ] Filter reducer implementation
- [ ] useFilter hook (search only)
- [ ] useDebouncedValue hook
- [ ] Unit tests for filter logic

### Phase 2: Filter UI Components (Week 2)

**Goals:**
- Create FilterBar component
- Implement search input
- Create priority filter dropdown
- Add tag filter dropdown

**Deliverables:**
- [ ] FilterBar container component
- [ ] SearchInput component
- [ ] PriorityFilter dropdown
- [ ] TagFilter dropdown with search
- [ ] Active filter chips display

### Phase 3: URL Persistence (Week 3)

**Goals:**
- Implement URL serialization
- Add URL restoration on load
- Handle browser navigation
- Create share filter functionality

**Deliverables:**
- [ ] URL parameter encoding/decoding
- [ ] Filter restoration from URL
- [ ] Browser history integration
- [ ] Share filter button/functionality
- [ ] E2E tests for URL persistence

### Phase 4: Advanced Features and Polish (Week 4)

**Goals:**
- Add date range filter (if due dates exist)
- Mobile responsive filter modal
- Performance optimization
- Accessibility improvements

**Deliverables:**
- [ ] DateRangeFilter component
- [ ] Mobile filter modal
- [ ] Performance profiling and optimization
- [ ] ARIA labels and keyboard navigation
- [ ] Filter statistics display

### Phase 5: Integration and Testing (Week 5)

**Goals:**
- Integrate with Kanban and Calendar views
- Comprehensive testing
- Documentation
- Bug fixes

**Deliverables:**
- [ ] Full integration with KanbanBoard
- [ ] Full integration with CalendarView (if implemented)
- [ ] Unit and integration tests
- [ ] User documentation
- [ ] Performance benchmarks

---

## Component File Structure

```
src/
├── features/
│   └── filter/
│       ├── FilterBar.tsx          # Main filter bar container
│       ├── SearchInput.tsx        # Text search input
│       ├── PriorityFilter.tsx     # Priority dropdown
│       ├── TagFilter.tsx          # Tag multi-select dropdown
│       ├── DateRangeFilter.tsx    # Date range picker
│       ├── StatusFilter.tsx       # Status/column filter
│       ├── ActiveFilters.tsx      # Active filter chips
│       └── MobileFilterModal.tsx  # Mobile filter UI
│
├── hooks/
│   ├── useFilter.ts               # Main filter hook
│   ├── filterReducer.ts           # Filter state reducer
│   └── useDebouncedValue.ts       # Debounce utility hook
│
└── types/
    └── filter.ts                  # Filter type definitions
```

---

## Accessibility Considerations

- All dropdowns keyboard navigable (Arrow keys, Enter, Escape)
- Focus management when opening/closing dropdowns
- Screen reader announcements for filter changes
- Clear visual indicators for active filters
- Color is not the only differentiator (icons + text)
- Mobile filter modal has focus trap

---

**Document Status:** Proposed Design
**Last Updated:** January 2026
**Author:** Development Team
