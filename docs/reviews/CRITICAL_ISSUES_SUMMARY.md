# CRITICAL ISSUES - Phase 2A Labels System Review

## Overview
The Phase 2A labels implementation has **3 critical issues** that prevent the feature from working correctly for newly created tasks. All critical issues affect the core workflow of creating a task with labels and expecting those labels to be saved.

---

## 🚨 ISSUE #1: Labels Not Persisted on New Task Creation

**Status:** BLOCKER - Feature unusable
**Priority:** P0 - Must fix before production

### The Problem
When users create a new task with labels selected in TaskForm, the selected labels are silently lost and never saved to the database.

### How to Reproduce
1. Open Kanban board
2. Create new task
3. Select 2-3 labels in the LabelSelector
4. Submit form
5. Labels are NOT displayed on the card
6. No error message to user

### Root Cause
The label IDs are collected by TaskForm and passed in the onSubmit callback:
```typescript
// TaskForm.tsx line 116
labelIds: selectedLabelIds,
```

But the `handleCreateTask` function in KanbanBoard.tsx never actually saves these labels:
```typescript
// KanbanBoard.tsx - commented TODO at line ~200
// This requires passing labelIds through to the addTask flow
```

The createTask server action doesn't accept labelIds, and setLabelsForTask is never called for new tasks.

### Impact
- Users create tasks with labels expecting them to save
- Labels silently disappear without error message
- Labels only work for editing existing tasks, not creating new ones
- Feature appears broken to end users

### Files to Check
- `src/features/kanban/components/KanbanBoard.tsx` - handleCreateTask function
- `src/features/kanban/components/TaskForm.tsx` - passes labelIds in submit
- `src/features/kanban/hooks/useKanban.ts` - createTask action
- `src/app/actions/tasks.ts` - createTask server action (missing label handling)

### Solution Required
1. Modify createTask server action to return the created task ID
2. After task creation, call setLabelsForTask with the new task ID and selected label IDs
3. Handle errors gracefully with user feedback
4. Add test: "Creating task with labels should persist labels"

---

## 🚨 ISSUE #2: Task Creation Breaks When Label Persistence Fails

**Status:** BLOCKER - Data consistency risk
**Priority:** P0 - Must fix before production

### The Problem
Even if we fix Issue #1 and add label persistence, the current pattern in KanbanBoard has no error handling. If label saving fails after task creation succeeds, the user gets a success message but labels aren't actually saved.

### Current Pattern (Bad)
```typescript
// KanbanBoard.tsx - fire and forget pattern
if (labelIds) {
  await setTaskLabels(editingTask.id, labelIds);  // ← No error checking!
}
```

### Consequences
1. Task is created successfully → user sees success message
2. Label persistence fails silently → no error feedback
3. User refreshes page → task exists but has no labels
4. User is confused: "I created the task with labels, where did they go?"
5. Support confusion: Is it a bug or user error?

### Impact
- Partial success scenarios are indistinguishable from complete success
- Inconsistent data state (task exists, labels don't)
- Poor user experience and user confusion
- Hidden data loss

### Files to Check
- `src/features/kanban/components/KanbanBoard.tsx` - handleEditTask function
- `src/features/kanban/hooks/useLabels.ts` - setTaskLabels function

### Solution Required
1. Wrap label operations in try-catch
2. Check the return value of setTaskLabels
3. If labels fail to persist, show error message to user
4. Consider transaction semantics: should task creation be rolled back if labels fail?
5. Add test: "Should show error if label persistence fails"

---

## 🚨 ISSUE #3: useTaskLabels Returns Empty Array for New Tasks

**Status:** BLOCKER - Visibility issue
**Priority:** P0 - Must fix before production

### The Problem
TaskCard uses `useTaskLabels(task.id)` to display labels, but for newly created tasks, the Zustand store never has the task-label relationship, so it returns an empty array.

### How It Breaks
1. User creates task with 3 labels selected
2. TaskForm calls setLabelsForTask (once Issue #1 is fixed)
3. Server persists task-label relationships to database
4. But Zustand store's `taskLabels` map is never updated!
5. TaskCard.tsx calls: `const labelObjects = useTaskLabels(task.id)`
6. Hook returns empty array because store has no entry for this taskId
7. User sees task with NO LABELS despite just selecting them

### How useTaskLabels Works
```typescript
// store/labels.ts line 581-582
export function useTaskLabels(taskId: string): StoreLabel[] {
  return useLabelsStore(useShallow((state) => state.getLabelsForTask(taskId)));
}

// Which does this:
getLabelsForTask: (taskId) => {
  const labelIds = get().taskLabels.get(taskId) || [];  // ← Empty for new tasks!
  const labels = get().labels;
  return labelIds
    .map((id) => labels.get(id))
    .filter((label): label is StoreLabel => label !== undefined);
}
```

### Store Hydration Gap
- Store hydration at app startup loads existing task-label relationships from database
- But it doesn't know about newly created tasks
- setLabelsForTask server action updates database but doesn't update the store
- Mismatch between database and Zustand cache

### Impact
- Users see labels disappear after task creation
- Even if Issue #1 and #2 are fixed, labels still won't show immediately
- Page refresh reveals labels were saved (confusing!)
- Feature appears broken: "I set labels but they're not showing"

### Files to Check
- `src/features/kanban/components/TaskCard.tsx` - line 109: useTaskLabels call
- `src/store/labels.ts` - taskLabels map and hydration logic
- `src/features/kanban/hooks/useLabels.ts` - setTaskLabels function

### Solution Required
1. After setLabelsForTask succeeds, update store: `storeSetTaskLabels(taskId, labelIds)`
2. Also update in handleCreateTask: `storeSetTaskLabels(newTaskId, labelIds)` immediately
3. Ensure store is synchronized with database after every label operation
4. Add test: "Newly created task should show labels immediately without refresh"

---

## Quick Checklist to Fix Critical Issues

```
ISSUE #1: Labels Lost on Task Creation
[ ] Modify createTask server action to return task ID
[ ] Add labelIds parameter to createTask (optional)
[ ] Call setLabelsForTask after successful task creation
[ ] Test: "create task with labels should persist"

ISSUE #2: Error Handling Missing
[ ] Wrap label persistence in try-catch in handleCreateTask
[ ] Wrap label persistence in try-catch in handleEditTask
[ ] Check return value of setTaskLabels
[ ] Show error toast if labels fail to persist
[ ] Test: "label persistence failure shows error"

ISSUE #3: Store Not Updated for New Tasks
[ ] Call storeSetTaskLabels(taskId, labelIds) after task creation
[ ] Ensure store is always synchronized with database
[ ] Test: "newly created task shows labels immediately"
```

---

## Testing Validation

Before considering critical issues fixed:

1. Create task with 2 labels → labels shown on card ✓
2. Edit task, change labels → changes persisted and displayed ✓
3. Server returns error on label save → user sees error message ✓
4. Refresh page → labels still there (database persisted) ✓
5. Delete label → removed from all tasks (including newly created) ✓

---

## Documentation for Developer Implementing Fixes

### Key Files to Modify
1. **src/app/actions/tasks.ts** - createTask server action
   - Add optional `labelIds?: string[]` parameter
   - Call setLabelsForTask after task creation
   - Return created task

2. **src/features/kanban/components/KanbanBoard.tsx** - handleCreateTask
   - Extract labelIds from task data
   - Check for errors from both task and label operations
   - Update store: storeSetTaskLabels(newTaskId, labelIds)
   - Show error toast if either operation fails

3. **src/features/kanban/hooks/useLabels.ts** - setTaskLabels
   - Already mostly correct, just needs error handling

4. **src/features/kanban/components/TaskForm.tsx** - No changes needed
   - Already collecting labelIds correctly

---

## Reference: How It Works (After Fixes)

```
USER CREATES TASK WITH LABELS
  ↓
TaskForm.handleSubmit
  → Collect title, description, labelIds
  → Call onSubmit with all data
  ↓
KanbanBoard.handleCreateTask
  → Extract labelIds
  → Call createTask server action with label IDs
  → createTask returns new task ID
  ↓
Server: src/app/actions/tasks.ts
  → Create task in database
  → Return task ID
  ↓
Client: handleCreateTask continues
  → If labelIds provided, call setLabelsForTask(taskId, labelIds)
  → Wait for result
  ↓
Server: src/app/actions/labels.ts
  → setLabelsForTask verifies ownership
  → Creates TaskLabel relationships
  → Returns success/error
  ↓
Client: handleCreateTask checks result
  → If success:
    - Update Zustand: storeSetTaskLabels(taskId, labelIds)
    - Task card immediately shows labels
  → If error:
    - Show error toast to user
    - Offer to retry or remove labels
```

---

## Severity Summary

| Issue | Severity | Impact | User Sees | Status |
|-------|----------|--------|-----------|--------|
| #1 | Critical | Silent data loss | Labels disappear after creation | Blocker |
| #2 | Critical | Inconsistent state | No error feedback | Blocker |
| #3 | Critical | Visibility bug | Empty labels until refresh | Blocker |

All three issues must be fixed together to have a working feature.

---

*Review Date: 2026-01-28*
*Target Fix: Before Phase 2A acceptance*
