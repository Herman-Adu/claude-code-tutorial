# Claude Code Recovery Document - Sprint C Implementation

**Date**: 2026-01-26
**Status**: Ready to implement from correct directory
**Current Issue**: Connected from wrong directory (C:\users\herma instead of kanban project directory)

---

## WHAT WE'RE DOING

Implementing **Sprint C: Store Coverage Enhancement** to increase test coverage of `src/store/kanban.ts` from 61% to 85%+.

This is a comprehensive testing implementation that will create ~47 tests across 3 new files.

---

## PROJECT REQUIREMENTS

**Target Directory**: Your kanban board project (wherever src/store/kanban.ts exists)

**Required Files to Read First**:
1. `src/store/kanban.ts` - The Zustand store we're testing (576 lines)
2. `src/app/actions/tasks.ts` - Server actions that the store calls
3. `package.json` - To verify dependencies
4. `vitest.config.ts` - Current test configuration

**Expected Project Structure**:
```
project-root/
├── src/
│   ├── store/
│   │   └── kanban.ts (TARGET FILE TO TEST)
│   ├── app/
│   │   └── actions/
│   │       └── tasks.ts
│   └── __tests__/
│       ├── integration/
│       │   └── kanban-workflows.test.tsx (existing)
│       └── unit/
│           └── store/ (NEW - we'll create this)
├── package.json
└── vitest.config.ts
```

---

## FILES TO CREATE

### 1. Test Utilities
**Path**: `src/__tests__/unit/store/mocks/store-test-utils.ts` (~150 lines)

**Purpose**: Helper functions for testing the store

**Key Functions**:
- `resetStore()` - Reset to clean state
- `createStoreTask(overrides)` - Task factory
- `mockServerSuccess(data)` - Mock successful server response
- `mockServerError(error)` - Mock server error response
- `waitForStoreCondition(predicate, timeout)` - Async state waiting

### 2. Test Fixtures
**Path**: `src/__tests__/unit/store/fixtures/test-scenarios.ts` (~100 lines)

**Purpose**: Pre-built test data scenarios

**Key Functions**:
- `createMultiColumnScenario()` - Tasks across TODO/IN_PROGRESS/COMPLETED
- `createSameColumnScenario()` - Multiple tasks in same column for reordering tests

### 3. Main Test File
**Path**: `src/__tests__/unit/store/kanban.test.ts` (~600-800 lines)

**Purpose**: Comprehensive store tests

**Test Groups** (47 total tests):
- Error Handling & Rollback (15 tests)
- Positioning Logic (12 tests)
- Selector Hooks (12 tests)
- Edge Cases & Concurrent Operations (8 tests)

---

## IMPLEMENTATION PHASES

### Phase 1: Setup Test Infrastructure (2-3 hours)
**Steps**:
1. Create directory structure: `src/__tests__/unit/store/mocks/` and `src/__tests__/unit/store/fixtures/`
2. Implement `store-test-utils.ts` with helper functions
3. Implement `test-scenarios.ts` with fixture data
4. Create initial `kanban.test.ts` with imports and structure

### Phase 2: Error Handling & Rollback Tests (4-5 hours)
**Target Coverage**: Lines 227-243, 291-308, 343-359, 460-476

**Tests to Write**:
- addTask errors: server failure rollback, exception handling, non-Error exceptions
- updateTask errors: same pattern (3 tests)
- deleteTask errors: same pattern (3 tests)
- moveTask errors: same pattern (3 tests)
- Verify state restoration after each error (3 tests)

### Phase 3: Positioning Logic Tests (5-6 hours)
**Target Coverage**: Lines 385-430 (moveTask positioning)

**Tests to Write**:
- With targetTaskId: insert before target, handle target not found
- Without targetTaskId (cross-column): move to empty column, insert based on column order
- Same column without target: maintain position
- Edge cases: moving first item, last item, single item columns

### Phase 4: Selector Hooks Tests (3-4 hours)
**Target Coverage**: Lines 521-572 (all selector hooks)

**Hooks to Test**:
- `getTasksByColumn(columnId)` - filter tasks, empty columns
- `getTaskById(id)` - find task, non-existent ID
- `getTotalTasks()` - count verification
- `getIsHydrated()` - hydration state
- `getIsLoading()` - loading state
- `getError()` - error state
- `getKanbanStatus()` - combined status object

### Phase 5: Edge Cases & Concurrent Operations (3-4 hours)
**Tests to Write**:
- Rapid successive creates (race condition testing)
- Task not found scenarios
- Empty store operations
- Large dataset operations
- Concurrent updates to same task
- Invalid data handling

---

## CRITICAL IMPLEMENTATION DETAILS

### Mock Setup Pattern
```typescript
vi.mock('@/app/actions/tasks');

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
});
```

### Error Rollback Test Pattern
```typescript
it('should rollback on server failure', async () => {
  const store = useKanbanStore.getState();
  const initialTasks = [...store.tasks];

  vi.mocked(taskActions.createTask).mockResolvedValue({
    success: false,
    error: 'Database error',
  });

  const result = await store.addTask(
    { title: 'New Task', columnId: 'TODO', /* ... */ },
    taskActions.createTask
  );

  expect(result).toBeNull();
  expect(store.error).toBe('Database error');
  expect(store.tasks).toEqual(initialTasks); // Rollback verified
});
```

### Positioning Test Pattern
```typescript
it('should insert before target task', async () => {
  const store = useKanbanStore.getState();

  await store.moveTask('1', 'TODO', '3', taskActions.moveTask);

  const todoTasks = store.tasks.filter((t) => t.columnId === 'TODO');
  expect(todoTasks.map((t) => t.id)).toEqual(['2', '1', '3']);
});
```

### Selector Hook Test Pattern
```typescript
import { renderHook } from '@testing-library/react';

it('should return tasks filtered by column', () => {
  const { result } = renderHook(() =>
    useKanbanStore((state) => state.getTasksByColumn('TODO'))
  );

  expect(result.current).toHaveLength(1);
  expect(result.current[0].columnId).toBe('TODO');
});
```

---

## SUCCESS CRITERIA

After implementation, verify:

- [ ] Coverage: 61% → 85%+ statements
- [ ] Branch coverage: 48% → 75%+
- [ ] Function coverage: 52% → 80%+
- [ ] All 47 tests passing
- [ ] Test execution time < 10 seconds
- [ ] No flaky tests (run 5 times to verify)

**Verification Commands**:
```bash
# Run store tests only
npm test -- store/kanban.test.ts

# Check coverage
npm test -- --coverage src/store/kanban.ts

# Run 5 times to check for flakiness
for i in {1..5}; do npm test -- store/kanban.test.ts; done
```

---

## DEPENDENCIES REQUIRED

Should already be installed (verify in package.json):
- `vitest` - Test runner
- `@testing-library/react` - For renderHook in selector tests
- `@testing-library/jest-dom` - Assertions
- `zustand` - Store library being tested

If missing, install:
```bash
npm install -D @testing-library/react @testing-library/jest-dom
```

---

## CONTEXT FROM PLAN

**Sprint B**: ✅ COMPLETE - Integration test act() warnings fixed
**Sprint A**: ⚠️ BLOCKED - Server actions testing has technical issues, existing 70% coverage sufficient
**Sprint C**: 🔄 THIS SPRINT - High ROI, no blockers, ready to implement

**Why Sprint C**:
- Achievable goal (no technical blockers)
- High ROI (24% coverage increase)
- Tests business-critical store logic
- Improves reliability of state management

---

## NEXT STEPS WHEN YOU RECONNECT

1. **Navigate to your kanban project directory**
2. **Run**: `claude` from the correct directory
3. **Tell Claude**: "Continue with Sprint C implementation from the recovery document at C:\users\herma\Desktop\CLAUDE_RECOVERY_SPRINT_C.md"
4. **Claude will**:
   - Read this document
   - Read the kanban store file
   - Create the test infrastructure
   - Implement all 47 tests in phases
   - Verify coverage targets are met

---

## ESTIMATED TIME

**Total**: 15-20 hours
- Phase 1 (Setup): 2-3 hours
- Phase 2 (Error Handling): 4-5 hours
- Phase 3 (Positioning): 5-6 hours
- Phase 4 (Selectors): 3-4 hours
- Phase 5 (Edge Cases): 3-4 hours

---

## NOTES

- This is a FRESH implementation (no existing store tests)
- Focus on coverage of untested lines (error paths, positioning logic, selectors)
- All tests should be deterministic (no flakiness)
- Use fixture data for consistency
- Mock all server actions
- Verify rollback behavior for all mutations

---

## FULL PLAN REFERENCE

Full plan details are in your conversation history at:
`C:\Users\herma\.claude\projects\C--users-herma\59955115-233d-4ad9-b4be-f4d675476be4.jsonl`

---

**READY TO CONTINUE**: When you reconnect from the correct directory, I'll start with Phase 1 immediately.
