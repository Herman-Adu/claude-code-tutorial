# CRITICAL ISSUES FOUND - Phase 2 Runtime/Test Failures

**Date**: 2026-01-29
**Context**: App fails on startup after Phase 2C/2D implementation
**Status**: ROOT CAUSE IDENTIFIED - READY FOR FIX SPRINT
**Severity**: CRITICAL - App non-functional

---

## ISSUE 1: Zustand Infinite Loop - getServerSnapshot Error

### Error Message
```
The result of getServerSnapshot should be cached to avoid an infinite loop
src/features/kanban/hooks/useLabels.ts (117:32) @ useLabels
```

### Root Cause Analysis

**Primary Cause**: Missing `useShallow()` wrapper in Zustand selector

**Location**: `src/features/kanban/hooks/useLabels.ts` line 117

**Current Problematic Code**:
```typescript
// Line 115-130
export function useLabels(): UseLabelsReturn {
  // Store state and actions
  const labels = useLabelsStore((state) => state.getLabelsArray());  // LINE 117 - PROBLEM
  const isHydrated = useLabelsStore((state) => state.isHydrated);
  const isLoading = useLabelsStore((state) => state.isLoading);
  const error = useLabelsStore((state) => state.error);
  // ...
}
```

**Secondary Root Cause**: Store method creates new array reference each call

**Location**: `src/store/labels.ts` lines 515-517

**Code**:
```typescript
getLabelsArray: () => {
  return Array.from(get().labels.values());  // Creates NEW array instance every time
},
```

### Why This Causes Infinite Loop

1. **Line 117 calls selector without memoization**
   - `useLabelsStore((state) => state.getLabelsArray())`
   - This calls the method which returns a new array instance

2. **Array.from() creates new reference every time**
   - Even if underlying Map data is unchanged
   - `Array.from(map.values())` !== `Array.from(map.values())` (different references)

3. **Zustand cannot detect equality**
   - Without `useShallow()`, Zustand compares array references
   - New reference = state changed (from Zustand perspective)
   - Triggers re-subscription = component re-renders

4. **Re-render calls selector again**
   - New render → selector called → new array → different reference
   - Zustand thinks state changed again → re-subscribe → infinite loop

### Correct Working Pattern Reference

**Location**: `src/store/kanban.ts` lines 757-759 (WORKING PATTERN)
```typescript
export function useTasksByColumn(columnId: ColumnId): StoreTask[] {
  return useKanbanStore(useShallow((state) => state.getTasksByColumn(columnId)));
}
```

Note the `useShallow()` wrapper - this is the missing piece.

### Existing Correct Implementation (But Unused)

**Location**: `src/store/labels.ts` lines 560-562
```typescript
export function useLabels(): StoreLabel[] {
  return useLabelsStore(useShallow((state) => state.getLabelsArray()));
}
```

This selector hook ALREADY EXISTS in the store and implements correctly with `useShallow()`.

### Fix Required

**Option A - Quick Fix** (add useShallow):
```typescript
// In src/features/kanban/hooks/useLabels.ts line 117, change:
const labels = useLabelsStore((state) => state.getLabelsArray());

// TO:
const labels = useLabelsStore(useShallow((state) => state.getLabelsArray()));
```

**Option B - Better Fix** (use existing selector):
```typescript
// Just use the store's pre-built selector that already has useShallow:
import { useLabels as useLabelsFromStore } from '@/store/labels';

export function useLabels(): UseLabelsReturn {
  const labels = useLabelsFromStore();  // Already has useShallow internally
  // ... rest of hook
}
```

### Files to Modify
- `src/features/kanban/hooks/useLabels.ts` - Line 117 (add `useShallow()` wrapper or use store hook)
- May need to add import: `import { useShallow } from 'zustand/react/shallow';` at top

---

## ISSUE 2: Test Import/Configuration Failures

### Error Location
```
C:\Users\herma\source\repository\claude-code-tutorial\src\__tests__\integration\kanban-workflows.test.tsx
(Module resolution failed or insufficient config)
```

### Root Cause Analysis

**Primary Cause 1**: Labels store not exported from barrel exports

**Location**: `src/store/index.ts` (lines 1-24)

**Current Code** (incomplete):
```typescript
export {
  useKanbanStore,
  useTasksByColumn,
  useTaskById,
  useTasksHydrated,
  // ... only kanban exports
} from './kanban';
// MISSING: No exports from labels.ts, comments.ts, activity.ts, notifications.ts
```

**Problem**: When test tries to import `useLabelsStore` or any labels-related export, it fails because they're not in the barrel.

---

**Primary Cause 2**: New server action modules not mocked in test setup

**Location**: `tests/setup.ts` (lines 51-92)

**Current Code** (incomplete):
```typescript
// Only mocks @/app/actions/tasks
vi.mock('@/app/actions/tasks', () => ({
  // ... task action mocks
}));

// MISSING: Mocks for:
// - @/app/actions/labels
// - @/app/actions/comments
// - @/app/actions/activity
// - @/app/actions/notifications
```

**Problem**: Any test that imports or transitively depends on these modules will fail because they're not mocked in the test environment.

---

**Primary Cause 3**: Potential circular dependencies or missing type exports

**Location**: Various store files may not properly export types

**Impact**: TypeScript compilation errors or runtime module resolution failures

### Files with Import Issues

1. **`src/store/index.ts`** - Missing barrel exports
2. **`tests/setup.ts`** - Missing action mocks
3. **`src/features/kanban/hooks/useLabels.ts`** - Imports unexported store
4. **`vitest.config.ts`** - May need adjustment (though appears correct)

### Fix Required

**Fix 1: Export all stores from barrel** (`src/store/index.ts`)

After line 24, add:
```typescript
// Labels store exports
export {
  useLabelsStore,
  useLabels,
  useLabelById,
  useTaskLabels,
  useTaskLabelIds,
  useTasksWithLabel,
  useLabelsHydrated,
  useLabelsLoading,
  useLabelsError,
  type StoreLabel,
  type CreateLabelData,
  type UpdateLabelData,
} from './labels';

// Activity store exports
export {
  useActivityStore,
  useActivity,
  useActivityLoading,
  useActivityError,
  type StoreActivity,
} from './activity';

// Comments store exports
export {
  useCommentsStore,
  useComments,
  useCommentsLoading,
  useCommentLoading,
  useCommentsError,
  type StoreComment,
} from './comments';

// Notifications store exports
export {
  useNotificationsStore,
  useNotifications,
  useUnreadNotificationCount,
  useNotificationsLoading,
  useNotificationsError,
  type StoreNotification,
} from './notifications';
```

**Fix 2: Add all action mocks** (`tests/setup.ts`)

After line 64 (after task mocks), add:
```typescript
// Mock label server actions
vi.mock('@/app/actions/labels', () => ({
  createLabel: vi.fn(() => Promise.resolve({ success: true, data: { id: 'test-label' } })),
  updateLabel: vi.fn(() => Promise.resolve({ success: true })),
  deleteLabel: vi.fn(() => Promise.resolve({ success: true })),
  getLabels: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  getLabelById: vi.fn(() => Promise.resolve({ success: true, data: null })),
  addLabelToTask: vi.fn(() => Promise.resolve({ success: true })),
  removeLabelFromTask: vi.fn(() => Promise.resolve({ success: true })),
  getLabelsForTask: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  setLabelsForTask: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mock comment server actions
vi.mock('@/app/actions/comments', () => ({
  createComment: vi.fn(() => Promise.resolve({ success: true, data: { id: 'test-comment' } })),
  updateComment: vi.fn(() => Promise.resolve({ success: true })),
  deleteComment: vi.fn(() => Promise.resolve({ success: true })),
  getCommentsByTask: vi.fn(() => Promise.resolve({ success: true, data: { comments: [], total: 0 } })),
}));

// Mock activity server actions
vi.mock('@/app/actions/activity', () => ({
  getTaskActivity: vi.fn(() => Promise.resolve({ success: true, data: { activities: [], total: 0 } })),
  logTaskActivity: vi.fn(() => Promise.resolve()),
}));

// Mock notification server actions
vi.mock('@/app/actions/notifications', () => ({
  getNotifications: vi.fn(() => Promise.resolve({ success: true, data: { notifications: [], total: 0 } })),
  getUnreadNotificationCount: vi.fn(() => Promise.resolve({ success: true, data: 0 })),
  markNotificationAsRead: vi.fn(() => Promise.resolve({ success: true })),
  markAllNotificationsAsRead: vi.fn(() => Promise.resolve({ success: true })),
  deleteNotification: vi.fn(() => Promise.resolve({ success: true })),
  createNotification: vi.fn(() => Promise.resolve()),
}));
```

---

## ADDITIONAL ISSUES FOUND

### Issue 3: Naming Collision Risk

**Location**: `src/features/kanban/hooks/useLabels.ts` (line 115)

**Problem**: Hook named `useLabels()` but `src/store/labels.ts` also exports `useLabels()` selector

**Impact**: Confusing imports, potential collision if both imported in same file

**Recommendation**: Add clarifying comment (or optionally rename to `useLabelsHook()`)

---

## SUMMARY TABLE

| Issue | File | Line | Root Cause | Severity | Status |
|-------|------|------|-----------|----------|--------|
| Zustand Infinite Loop | `src/features/kanban/hooks/useLabels.ts` | 117 | Missing `useShallow()` | CRITICAL | ROOT CAUSE IDENTIFIED |
| Store Export Missing | `src/store/index.ts` | 1-24 | Incomplete barrel exports | HIGH | ROOT CAUSE IDENTIFIED |
| Test Mock Missing | `tests/setup.ts` | 51-92 | Incomplete action mocks | HIGH | ROOT CAUSE IDENTIFIED |
| Array Reference Issue | `src/store/labels.ts` | 515-517 | `Array.from()` creates new ref | CRITICAL | UNDERLYING CAUSE |
| Naming Confusion | `src/features/kanban/hooks/useLabels.ts` | 115 | Duplicate hook name | MEDIUM | ENHANCEMENT |

---

## NEXT STEPS - FIX SPRINT

When resuming context, run this fix sprint:

1. **Fix Issue 1**: Add `useShallow()` to line 117 in `useLabels.ts`
2. **Fix Issue 2**: Add all store exports to `src/store/index.ts`
3. **Fix Issue 3**: Add all action mocks to `tests/setup.ts`
4. **Verify**:
   - `npm run dev` - app starts without errors
   - `npm run test:run` - all tests pass
   - `npm run build` - compiles successfully

---

## CONTEXT WINDOW MANAGEMENT

**Current Context**: 70% full
**Action**: Reset context window (no compaction)
**Preserved**: All critical findings in this document
**Recovery**: Read this file to resume fix sprint

---

**Analysis Completed By**: Explore Agent (a168420)
**Ready for**: Coder Agent (fix sprint)
