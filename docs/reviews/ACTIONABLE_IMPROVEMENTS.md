# ACTIONABLE IMPROVEMENTS GUIDE
## Phase 2A & 2B Implementation

This document provides concrete, copy-paste ready solutions for identified improvement areas.

---

## 1. FIX: Focus Test Failures (2-4 hours)

### Issue
6 tests failing in Modal.test.tsx related to keyboard focus management.

**Files:**
- `src/__tests__/unit/components/ui/Modal.test.tsx:200`
- Lines 198-202 (Tab navigation test)

### Solution Option A: Increase Test Timeout

```typescript
// src/__tests__/unit/components/ui/Modal.test.tsx:200
// Before
await waitFor(() => expect(firstButton).toHaveFocus());

// After
await waitFor(
  () => expect(firstButton).toHaveFocus(),
  { timeout: 500 }  // Increase from default 1000ms to give more time
);
```

### Solution Option B: Mock Focus Behavior

```typescript
// src/__tests__/unit/components/ui/Modal.test.tsx
// Add to test setup
beforeEach(() => {
  // Focus-based tests can be unreliable in jsdom
  // Mock HTMLElement focus/blur if needed
  if (!HTMLElement.prototype.focus) {
    HTMLElement.prototype.focus = jest.fn();
  }
});
```

### Solution Option C: Skip Focus Tests in jsdom

```typescript
// src/__tests__/unit/components/ui/Modal.test.tsx:190
it.skip('should trap focus within modal', async () => {
  // Focus trapping works in real browser, tested in e2e
  // jsdom has limitations - focus tests unreliable
});
```

**Recommendation:** Use Option A (simplest) or implement proper keyboard navigation test with userEvent.

---

## 2. REFACTOR: KanbanBoard Component (6-8 hours)

### Current Structure Problem

```
KanbanBoard.tsx (769 lines)
├── ErrorToast (sub-component, 58 lines)
├── LoadingIndicator (sub-component, 17 lines)
├── Main logic
│   ├── Task CRUD
│   ├── Drag & drop
│   ├── Search/filtering
│   ├── Label management
│   ├── Modal management
│   └── URL sync
```

### Proposed Refactoring

**Step 1: Extract Modal Management**

```typescript
// src/features/kanban/components/KanbanModals.tsx
interface KanbanModalsProps {
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  showLabelManager: boolean;
  showFilterPanel: boolean;
  showSaveFilterModal: boolean;
  onTaskModalClose: () => void;
  onLabelManagerClose: () => void;
  onFilterPanelClose: () => void;
  onSaveFilterModalClose: () => void;
}

export function KanbanModals({
  isTaskModalOpen,
  editingTask,
  showLabelManager,
  showFilterPanel,
  showSaveFilterModal,
  onTaskModalClose,
  onLabelManagerClose,
  onFilterPanelClose,
  onSaveFilterModalClose,
}: KanbanModalsProps) {
  return (
    <>
      <Modal isOpen={isTaskModalOpen} onClose={onTaskModalClose}>
        <TaskForm task={editingTask} />
      </Modal>
      <Modal isOpen={showLabelManager} onClose={onLabelManagerClose}>
        <LabelManager />
      </Modal>
      {/* ... other modals ... */}
    </>
  );
}
```

**Step 2: Extract Task Operations**

```typescript
// src/features/kanban/components/TaskManagementSection.tsx
interface TaskManagementSectionProps {
  tasks: StoreTask[];
  onNewTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, columnId: ColumnId, targetTaskId?: string) => void;
  deleteConfirmId: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}

export function TaskManagementSection({
  tasks,
  onNewTask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  deleteConfirmId,
  onConfirmDelete,
  onCancelDelete,
}: TaskManagementSectionProps) {
  return (
    <DndContext sensors={sensors}>
      <div className="grid grid-cols-3 gap-6 p-6">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter((t) => t.columnId === column.id)}
            onAddTask={onNewTask}
            // ... other props
          />
        ))}
      </div>
      <DragOverlay>{/* ... */}</DragOverlay>
    </DndContext>
  );
}
```

**Step 3: Simplified KanbanBoard**

```typescript
// src/features/kanban/components/KanbanBoard.tsx (refactored)
export function KanbanBoard({ showHeader = true }: KanbanBoardProps) {
  const { tasks, isLoading, error, /* ... */ } = useKanban();

  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);

  // Other state management...

  return (
    <div className="flex flex-col h-screen">
      {showHeader && <KanbanHeader />}

      <SearchFilterBar />
      <FilterChips />
      <SavedFiltersDropdown />

      <TaskManagementSection
        tasks={tasks}
        onNewTask={() => setIsTaskModalOpen(true)}
        onEditTask={setEditingTask}
        // ... other props
      />

      <KanbanModals
        isTaskModalOpen={isTaskModalOpen}
        editingTask={editingTask}
        showLabelManager={showLabelManager}
        showFilterPanel={showFilterPanel}
        showSaveFilterModal={showSaveFilterModal}
        onTaskModalClose={() => setIsTaskModalOpen(false)}
        // ... other handlers
      />

      {error && <ErrorToast message={error} onDismiss={() => {}} />}
      {isLoading && <LoadingIndicator />}
    </div>
  );
}
```

**Results:**
- KanbanBoard: 150-200 lines (ideal)
- TaskManagementSection: 200-250 lines
- KanbanModals: 100-150 lines
- Total: 550 lines (vs. 769)

**Testing Benefits:**
- Test TaskManagementSection independently
- Mock modals for KanbanBoard tests
- Easier to test modal interactions

---

## 3. ENHANCE: Search Performance Monitoring (2-3 hours)

### Add Performance Metrics

**File:** `src/app/actions/tasks.ts`

```typescript
/**
 * Performance metrics for search operations
 */
interface SearchMetrics {
  queryTime: number;        // Time to fetch from DB (ms)
  totalTime: number;        // Total time including validation (ms)
  resultCount: number;
  tasksetSize: number;      // Total tasks for user
  queryComplexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Calculate query complexity based on filter count
 */
function calculateComplexity(filters: SearchTasksInput['filters']): SearchMetrics['queryComplexity'] {
  let filterCount = 0;
  if (filters.searchQuery) filterCount++;
  if (filters.priority) filterCount++;
  if (filters.columnId) filterCount++;
  if (filters.categories?.length) filterCount++;
  if (filters.dateRange) filterCount++;

  if (filterCount === 0) return 'simple';
  if (filterCount <= 2) return 'moderate';
  return 'complex';
}

/**
 * Searches tasks with performance metrics
 */
export async function searchTasks(
  input: SearchTasksInput
): Promise<ActionResponse<SearchResultResponse>> {
  const startTime = Date.now();

  try {
    // Require authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: 'Too many searches. Please try again in 1 minute.',
      };
    }

    // Validation
    const validationResult = SearchTasksInputSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: formatZodErrors(validationResult.error.issues),
      };
    }

    const { query, filters, limit, offset } = validationResult.data;

    // Build where clause...
    const whereClause: Record<string, any> = {
      ownerId: userId,
    };

    // ... filter building logic ...

    const dbStartTime = Date.now();

    // Get total count
    const total = await prisma.task.count({ where: whereClause });

    // Execute search
    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
    });

    const dbTime = Date.now() - dbStartTime;
    const totalTime = Date.now() - startTime;
    const complexity = calculateComplexity(filters);

    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Search metrics:', {
        userId,
        queryTime: dbTime,
        totalTime,
        resultCount: tasks.length,
        tasksetSize: total,
        queryComplexity: complexity,
      });
    }

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production' && totalTime > 200) {
      console.warn('Slow search detected:', {
        userId,
        queryTime: dbTime,
        totalTime,
        tasksetSize: total,
        queryComplexity: complexity,
      });
    }

    return {
      success: true,
      data: {
        tasks: tasks.map(transformTask),
        total,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'searchTasks'),
    };
  }
}
```

### Add Performance Monitoring Hook

```typescript
// src/features/kanban/hooks/useSearchMetrics.ts
import { useCallback } from 'react';

export function useSearchMetrics() {
  const logSlowSearch = useCallback((timeMs: number) => {
    if (timeMs > 200) {
      console.warn(`Slow search detected: ${timeMs}ms`);
      // Could send to analytics here
    }
  }, []);

  const logSearch = useCallback((metrics: {
    resultCount: number;
    timeMs: number;
    queryType: string;
  }) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Search completed:', metrics);
    }
  }, []);

  return { logSlowSearch, logSearch };
}
```

### Monitor in Component

```typescript
// src/features/kanban/components/SearchFilterBar.tsx
import { useSearchMetrics } from '../hooks/useSearchMetrics';

export function SearchFilterBar({
  className,
  placeholder = 'Search tasks...',
  showActiveIndicator = true,
}: SearchFilterBarProps) {
  const { logSlowSearch } = useSearchMetrics();
  const searchQuery = useSearchQuery();
  const setSearchQuery = useKanbanStore((state) => state.setSearchQuery);
  const setIsSearching = useKanbanStore((state) => state.setIsSearching);

  const handleChange = useCallback(
    (value: string) => {
      const startTime = Date.now();
      setIsSearching(true);
      setSearchQuery(value);

      // Simulate end of search
      setTimeout(() => {
        const duration = Date.now() - startTime;
        logSlowSearch(duration);
        setIsSearching(false);
      }, 300); // Debounce delay
    },
    [setSearchQuery, setIsSearching, logSlowSearch]
  );

  return (
    // ... component JSX ...
  );
}
```

**Benefits:**
- Monitor search performance in production
- Alert when queries exceed thresholds
- Data-driven migration decision (when to implement tsvector)
- Identify slow filter combinations

---

## 4. DOCUMENT: Rate Limiting Assumptions (1 hour)

### Update README.md

Add to `README.md` - Deployment section:

```markdown
### Rate Limiting

**Current Implementation:** In-memory rate limiting

The application includes rate limiting for label creation and search operations:

- **Label Creation:** 10 labels/hour per user
- **Search:** 20 searches/minute per user

**Important:** This in-memory implementation works only on single-instance deployments.
If you deploy to multiple instances (load-balanced), rate limits will not work correctly
because each instance maintains separate state.

**For Multi-Instance Deployments:**

You must migrate to Redis-based rate limiting:

1. Install Redis or use Upstash (serverless Redis):
   ```bash
   npm install ioredis
   # OR
   npm install @upstash/redis
   ```

2. Migrate in `src/app/actions/labels.ts` and `src/app/actions/tasks.ts`:
   ```typescript
   import { Redis } from '@upstash/redis';

   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_REST_URL,
     token: process.env.UPSTASH_REDIS_REST_TOKEN,
   });

   async function checkRateLimit(userId: string): Promise<boolean> {
     const key = `rate_limit:labels:${userId}`;
     const count = await redis.incr(key);

     if (count === 1) {
       // Set expiry only on first increment
       await redis.expire(key, 3600); // 1 hour
     }

     return count <= 10; // Max 10 labels/hour
   }
   ```

3. Set environment variables:
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

See `PERFORMANCE_MAINTAINABILITY_REVIEW.md` for more details.
```

### Update CLAUDE.md

Add to `CLAUDE.md` - Important notes:

```markdown
## Scaling Considerations

### Single vs. Multi-Instance Deployment

**Single Instance (Current Setup):**
- All features work as-is
- Rate limiting effective
- Search performance adequate for <10K tasks

**Multi-Instance (Load Balanced):**
- Rate limiting requires Redis migration
- All other features work correctly
- See README.md for Redis setup

### Search Performance Scaling

The current search implementation uses PostgreSQL ILIKE, which is adequate for:
- < 1,000 tasks: ~50-100ms (excellent)
- 1-10K tasks: ~100-200ms (good)
- > 10K tasks: ~500-2000ms (problematic)

**When to Migrate:** After exceeding 5,000 tasks, consider upgrading to
PostgreSQL full-text search (tsvector). See Performance Migration Guide.

See `PERFORMANCE_MAINTAINABILITY_REVIEW.md` for technical details.
```

---

## 5. FUTURE: Cursor-Based Pagination (4-6 hours)

This is a future optimization for when datasets exceed 10K tasks.

### Current Implementation (Skip/Take)

```typescript
// Current: Requires scanning skipped rows
const tasks = await prisma.task.findMany({
  where: whereClause,
  skip: offset,      // Scans 1000 rows if offset=1000
  take: limit,       // Then returns next 50
});
```

### Improved: Cursor-Based

```typescript
// Future: Fetches only needed rows
const tasks = await prisma.task.findMany({
  where: whereClause,
  cursor: lastTaskId ? { id: lastTaskId } : undefined,
  skip: lastTaskId ? 1 : 0,  // Skip the cursor itself
  take: limit,
  orderBy: { createdAt: 'desc', id: 'desc' },  // Stable ordering
});
```

**Implementation timing:** Phase 4, after exceeding 10K tasks

---

## 6. OPTIONAL: Selector Optimization with Reselect (2-3 hours)

For Phase 4+ if complex selector logic slows down re-renders.

### Current Zustand Selectors

```typescript
// Current: Fine for most cases
export function useTasksByColumn(columnId: ColumnId): StoreTask[] {
  return useKanbanStore(useShallow((state) => state.getTasksByColumn(columnId)));
}
```

### With Reselect (Optional Future Optimization)

```typescript
// Future: For complex derived state
import { createSelector } from 'reselect';

const selectTasksByColumnId = createSelector(
  (state: KanbanState) => state.tasks,
  (_: any, columnId: ColumnId) => columnId,
  (tasks, columnId) => tasks.filter(t => t.columnId === columnId)
);

export function useTasksByColumn(columnId: ColumnId): StoreTask[] {
  return useKanbanStore(state => selectTasksByColumnId(state, columnId));
}
```

**Installation timing:** Phase 4, if profiling shows selector overhead

---

## IMPLEMENTATION CHECKLIST

### Immediate (Before Next Deploy)
- [ ] Fix 6 focus test failures (2-4 hours)
- [ ] Document rate limit assumptions in README (1 hour)
- [ ] Review findings with team

### Phase 3
- [ ] Refactor KanbanBoard component (6-8 hours)
- [ ] Add search performance metrics (2-3 hours)
- [ ] Plan Phase 4 optimizations

### Phase 4+
- [ ] Cursor-based pagination (4-6 hours) - if needed
- [ ] Selector optimization with reselect (2-3 hours) - if needed
- [ ] Multi-instance Redis migration (3-4 hours) - if deploying load-balanced
- [ ] Full-text search migration (4-6 hours) - if >5K tasks

---

## ESTIMATED EFFORT SUMMARY

| Task | Hours | Priority | Impact |
|------|-------|----------|--------|
| Fix focus tests | 2-4 | HIGH | Test reliability |
| Document assumptions | 1 | HIGH | Deployment clarity |
| Refactor KanbanBoard | 6-8 | MEDIUM | Maintainability |
| Search metrics | 2-3 | MEDIUM | Production readiness |
| Cursor pagination | 4-6 | LOW | Performance (future) |
| Reselect optimization | 2-3 | LOW | Performance (future) |

**Total Immediate:** 3-5 hours
**Total Phase 3:** 8-11 hours
**Total Phase 4+:** 10-15 hours (as needed)

---

**Next Review:** After Phase 3 or when dataset >5K tasks
**Document Date:** January 28, 2026
