# Test Coverage and Quality Review
## Kanban Board Application

**Review Date:** January 26, 2026
**Test Framework:** Vitest 4.0.18 + React Testing Library
**Test Count:** 492 tests across 12 test files
**Coverage Report:** v8 provider

---

## Executive Summary

The kanban board test suite demonstrates **strong foundational test coverage** with 238+ component tests and 20 integration tests. Overall statement coverage is **58.04%**, with critical application components achieving **80-100% coverage**. The test suite follows React Testing Library best practices with user-centric testing patterns and excellent accessibility-focused assertions.

**Key Strengths:**
- Excellent test quality and readability with comprehensive documentation
- Strong component coverage (UI components 100%, core features 80%+)
- User-centric testing approach using semantic queries
- Well-structured test utilities and mock helpers
- Proper setup and teardown patterns
- Good accessibility testing coverage

**Key Gaps:**
- Server action layer has 0% coverage (critical gap)
- Store/state management has 61% coverage with branch coverage gaps
- Integration tests have `act()` warning issues affecting drag-and-drop tests
- API route handlers not tested
- Missing edge cases in error handling and network resilience

---

## 1. Test Coverage Analysis

### Overall Coverage Metrics

```
Statement Coverage: 58.04%
Branch Coverage:    50.72%
Function Coverage:  69.56%
Line Coverage:      58.45%
```

### Coverage by Module

#### A. Green Zone (80-100% Coverage)

**✓ UI Components: 100% Coverage**
- `components/ui/Badge.tsx` - 100% statements, 100% branches
- `components/ui/Button.tsx` - 100% statements, 100% branches
- `components/ui/Modal.tsx` - 100% statements, 100% branches
- `constants/index.ts` - 100% coverage
- `lib/schemas.ts` - 100% statements, 100% branches
- `lib/utils.ts` - 100% statements, 90% branches
- `hooks/useLocalStorage.ts` - 100% statements, 83% branches

**✓ Feature Components: 80%+ Coverage**
- `features/kanban/components/TaskCard.tsx` - 100%
- `features/kanban/components/TaskForm.tsx` - 96.55% statements, 95.83% branches
- `features/kanban/components/KanbanColumn.tsx` - 100% statements, 90% branches
- `features/kanban/components/KanbanBoard.tsx` - 65.07% statements (gap area)
- `features/kanban/hooks/useKanban.ts` - 92.5% statements, 64.28% branches

#### B. Yellow Zone (50-79% Coverage)

**⚠ Store/State Management: 61.19% Coverage**
- `store/kanban.ts` - 61.19% statements, 48.21% branches, 52.27% functions
  - Missing coverage for error rollback scenarios
  - Branch coverage gaps in optimistic update logic (lines 245, 296-297, 320)

#### C. Red Zone (0% Coverage - Critical Gaps)

**✗ Server Actions: 0% Coverage**
- `app/actions/tasks.ts` - 0% statements (lines 81-461)
  - No unit tests for createTask, updateTask, deleteTask, moveTask
  - No tests for server-side validation
  - No tests for database operations
  - No tests for error handling in async operations

**✗ Database Layer: 0% Coverage**
- `lib/db/prisma.ts` - 0% coverage
- `lib/db/index.ts` - 0% coverage
- Prisma-generated code - minimal coverage (100% branch on enums only)

**✗ API Routes: 0% Coverage**
- `app/api/health/route.ts` - 0% coverage

**✗ Feature Index Exports: 0% Coverage**
- `features/kanban/index.ts` - 0% coverage

---

## 2. Test Quality Assessment

### Strengths

#### 2.1 React Testing Library Best Practices

**✓ User-Centric Testing**
The tests prioritize user interactions over implementation details:

```typescript
// GOOD: Tests behavior users see
it('should call onEdit when edit button is clicked', async () => {
  renderTaskCard(mockTask, mockOnEdit, mockOnDelete);
  const editButton = screen.getByRole('button', { name: /edit task: test task/i });
  await user.click(editButton);
  expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
});

// BAD: Tests internal implementation
// const { container } = render(...);
// expect(container.querySelector('.edit-button')).toBeInTheDocument();
```

**✓ Semantic Queries**
Tests use proper semantic queries (byRole, byLabelText, byText) before data-testid:
- `screen.getByRole('button', { name: /edit/i })`
- `screen.getByLabelText(/title/i)`
- `screen.getByText(/test task/i)`

Only 4 instances of `data-testid` in all tests, appropriately used for custom components.

#### 2.2 Accessibility Testing

Strong accessibility coverage with:
- Role-based queries (button, dialog, alert, group, status)
- aria-label and aria-describedby testing
- aria-live region testing for dynamic content
- Focus management testing
- Keyboard navigation testing

Example from Button.test.tsx (lines 243-265):
```typescript
it('should be keyboard navigable', async () => {
  render(
    <>
      <Button>First</Button>
      <Button>Second</Button>
    </>
  );

  const firstButton = screen.getByRole('button', { name: /first/i });
  const secondButton = screen.getByRole('button', { name: /second/i });

  firstButton.focus();
  expect(firstButton).toHaveFocus();

  await user.keyboard('{Tab}');
  expect(secondButton).toHaveFocus();
});
```

#### 2.3 Documentation and Organization

**Excellent test documentation:**
- Every test file has JSDoc headers explaining purpose
- Test suites organized with clear section comments
- Helper functions documented with purpose and parameters
- Test names are descriptive and follow "should..." convention

Example from KanbanBoard.test.tsx:
```typescript
/**
 * KanbanBoard Component Tests
 *
 * Tests the main KanbanBoard component including state management,
 * drag-and-drop functionality, modal interactions, and error handling.
 */
```

#### 2.4 Setup and Teardown

**Proper test isolation:**
- beforeEach cleanup with `vi.clearAllMocks()`
- localStorage cleared between tests
- Store state reset between test cases
- User event setup properly initialized

#### 2.5 Test Utilities and Factories

**Excellent test helper organization:**
- `tests/utils/testHelpers.ts` provides task factories
- Mock response helpers (mockSuccessResponse, mockErrorResponse)
- Reusable mock localStorage
- Inline rendering helpers for complex scenarios

---

### Areas for Improvement

#### 2.6 Integration Test `act()` Warnings

**Critical Issue Found:** Integration tests generate multiple `act()` warnings in stderr

```
stderr | An update to KanbanBoard inside a test was not wrapped in act(...).
stderr | An update to DndContext inside a test was not wrapped in act(...).
```

**Affected Tests:**
- `Move Task Workflow > should move a task between columns`
- `Move Task Workflow > should rollback move on server error`

**Root Cause:** Drag-and-drop operations trigger state updates that aren't properly wrapped in `act()`.

**Impact:** While tests pass, React's strict mode warnings indicate potential issues with asynchronous state updates in drag-and-drop scenarios.

**Example Location:** `src/__tests__/integration/kanban-workflows.test.tsx` (lines in test execution)

#### 2.7 Mock Component Coverage

Some unit tests heavily mock child components, reducing integration coverage:

**KanbanBoard.test.tsx (line 64):**
```typescript
vi.mock('@/features/kanban/components/KanbanColumn', () => ({
  KanbanColumn: ({ column, tasks, onAddTask, ... }: any) => (
    <div data-testid={`column-${column.id}`}>
      {/* Simplified mock */}
    </div>
  ),
}));
```

**Issue:** This trades unit test simplicity for reduced integration coverage. While valid for unit tests, it means actual component composition isn't tested in isolation.

---

## 3. Test Patterns and Consistency

### Pattern Analysis

#### 3.1 Consistent Test Structure

All component tests follow AAA pattern (Arrange, Act, Assert):

```typescript
describe('Button', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // Organized by concern
  describe('Rendering', () => { /* tests */ });
  describe('User Interactions', () => { /* tests */ });
  describe('State Management', () => { /* tests */ });
});
```

**Consistency Score:** 9/10
- All files follow similar structure
- Section organization is consistent
- Naming conventions are uniform
- Only minor variations in helper function placement

#### 3.2 Mock Usage

**Appropriately Used:**
- Server actions mocked at integration test level
- Child components mocked in unit tests for isolation
- localStorage mocked globally in setup
- useRouter and usePathname properly mocked for Next.js

**Potential Over-Mocking:**
- `KanbanBoard.test.tsx` mocks too much (KanbanColumn, TaskForm)
  - Suggests the unit test should have broader scope
  - Consider moving some to integration tests instead

---

## 4. Edge Cases and Error Scenarios

### Covered Edge Cases

#### 4.1 Input Validation (Excellent)

**schemas.test.ts** provides comprehensive validation testing (131 tests):
- Max length boundaries: title (100), description (500), tags (30)
- Empty values and whitespace
- Transformation handling (trim, filter duplicates)
- Type mismatches
- Special characters in strings

Example (line 39-44):
```typescript
it('should accept LOW priority', () => {
  const result = PrioritySchema.safeParse('LOW');
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toBe('LOW');
  }
});
```

#### 4.2 Empty States (Good)

Empty state handling tested in KanbanColumn tests:
```typescript
it('should not render tags if tags array is empty', () => {
  const taskWithoutTags = { ...mockTask, tags: [] };
  renderTaskCard(taskWithoutTags);
  expect(screen.queryByText('frontend')).not.toBeInTheDocument();
});
```

#### 4.3 Loading States (Good)

Loading indicator testing in integration tests:
```typescript
it('should display loading indicator during operations', async () => {
  // Assertion: expect(screen.getByRole('status')).toBeInTheDocument();
});
```

### Missing Edge Cases

#### 4.4 Error Scenarios - Gaps

**Missing Tests:**
- Network timeout handling in server actions
- Partial failure scenarios (e.g., some tasks fail to load)
- Duplicate task creation detection
- Concurrent operation handling (two edits simultaneously)
- Out-of-order updates (newer update arrives before older one)
- Task move to same column (idempotency)

**TaskForm Error Handling Gap:**
```typescript
// Currently missing test for:
// - Form submission during network failure
// - Server validation errors (title already exists)
// - Character encoding edge cases in tags/categories
```

#### 4.5 Boundary Conditions

**useLocalStorage Hook (Good Coverage):**
- Tests JSON.parse('null') correctly returns null
- Tests undefined vs missing value distinction
- Tests hydration timing

**Missing Boundary Tests:**
- localStorage quota exceeded (quota exceeded error)
- corrupted localStorage data recovery
- Very large object serialization (>5MB)
- Rapid simultaneous updates to same key

---

## 5. Test Maintainability Assessment

### Readability - 9/10

**Strengths:**
- Clear test names describe exactly what's tested
- Good use of fixtures and mock data
- Comments explain complex test setup
- No deeply nested conditions in tests

**Minor Issues:**
- Some helper functions could be extracted (fillTaskForm is 30+ lines)
- Constants for magic strings (e.g., "Edit task: Test Task") defined locally

### Will Tests Break Easily? - 7/10

**Fragile Areas:**
1. **String-Based Selectors** (Moderate Risk)
   - Tests depend on exact button text: "Edit task: Test Task"
   - Minor UI text changes break tests
   - Recommended: Use aria-labels for critical actions

2. **CSS Class Selectors** (Moderate Risk)
   ```typescript
   const button = container.firstChild as HTMLElement;
   expect(button).toHaveClass('from-sky-400');
   ```
   - Tailwind class names changes break tests
   - Recommend: Use role-based queries instead

3. **Element Ordering Assumptions** (Low Risk)
   - Some tests assume `container.firstChild` is the button
   - Fragile if DOM structure changes
   - Better: Use semantic selectors

### Data-testid Usage - 8/10

**Good Pattern:**
- Only 4 instances in entire test suite
- Used only for custom components without semantic roles
- Alternative semantic selectors preferred

**Locations:**
- `KanbanBoard.test.tsx`: `data-testid="column-${column.id}"`
- `TaskCard.test.tsx`: Test for task actions grouping

---

## 6. Coverage by Component

### UI Components

| Component | Statements | Branches | Functions | Status |
|-----------|-----------|----------|-----------|--------|
| Badge.tsx | 100% | 100% | 100% | ✓ Complete |
| Button.tsx | 100% | 100% | 100% | ✓ Complete |
| Modal.tsx | 100% | 100% | 100% | ✓ Complete |

**Test Files:**
- `Button.test.tsx` - 34 tests covering variants, sizes, interactions, accessibility
- `Badge.test.tsx` - 23 tests covering all badge variants and states
- `Modal.test.tsx` - 28 tests covering dialog behavior and accessibility

### Feature Components

| Component | Statements | Branches | Functions | Tests |
|-----------|-----------|----------|-----------|-------|
| TaskCard.tsx | 100% | 100% | 100% | 36 |
| TaskForm.tsx | 96.55% | 95.83% | 100% | 44 |
| KanbanColumn.tsx | 100% | 90% | 100% | 39 |
| KanbanBoard.tsx | 65.07% | 53.84% | 70% | 34 |

**Analysis:**
- **TaskCard** - Complete, all user interactions tested
- **TaskForm** - Missing 1 statement on line 32 (edge case handling)
- **KanbanColumn** - Missing 1 branch on line 69 (conditional rendering)
- **KanbanBoard** - **COVERAGE GAP**: Missing tests for:
  - Drag-and-drop error handling (lines 145, 153-173)
  - Delete confirmation modal flow (lines 291-310)
  - Error toast auto-dismiss timing (line 40)

### State Management

| Module | Statements | Branches | Functions | Status |
|--------|-----------|----------|-----------|--------|
| store/kanban.ts | 61.19% | 48.21% | 52.27% | ⚠ Gap |
| useKanban.ts | 92.5% | 64.28% | 92.59% | ⚠ Gap |

**Issues:**
- Store has low branch coverage (48%) - rollback logic not fully tested
- useKanban hook missing tests for error scenarios
- Optimistic update failures not tested
- Type conversion edge cases not covered

### Utilities and Libraries

| Module | Statements | Branches | Functions | Tests |
|--------|-----------|----------|-----------|-------|
| lib/utils.ts | 100% | 90% | 100% | 60 |
| lib/schemas.ts | 100% | 100% | 100% | 131 |
| hooks/useLocalStorage.ts | 100% | 83.33% | 100% | 40 |

**Analysis:**
- **schemas.ts** - Excellent coverage with 131 tests for Zod validation
- **utils.ts** - Missing 1 branch on line 25 (character encoding path)
- **useLocalStorage** - Missing branch on line 35 (hydration race condition)

---

## 7. Server-Side Testing - Critical Gap

### Missing Test Coverage (0%)

The server action layer represents a critical gap in test coverage:

```
app/actions/tasks.ts (0% coverage, lines 81-461)
├── createTask() - not tested
├── updateTask() - not tested
├── deleteTask() - not tested
├── moveTask() - not tested
├── getTasks() - not tested
└── getTasksByColumn() - not tested
```

### Why This Matters

1. **Business Logic Validation** - Server actions contain:
   - Request validation (schemas.parse)
   - Authorization checks
   - Database operations
   - Error handling

2. **Database Integrity** - No tests verify:
   - Data persistence
   - Constraint violations
   - Transaction rollback on errors
   - Concurrent operation handling

3. **Security** - No tests verify:
   - Input sanitization
   - SQL injection prevention
   - Authorization enforcement

### Recommended Testing Strategy

```typescript
// Missing: tests/unit/server-actions/tasks.test.ts

describe('createTask server action', () => {
  it('should validate input against schema', async () => {
    const result = await createTask({
      title: 'x'.repeat(101), // exceeds max length
      description: '',
      priority: 'INVALID',
      columnId: 'TODO',
      tags: [],
      categories: [],
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Title too long');
  });

  it('should persist task to database', async () => {
    const result = await createTask({
      title: 'New Task',
      description: 'Test',
      priority: 'MEDIUM',
      columnId: 'TODO',
      tags: ['test'],
      categories: [],
    });
    expect(result.success).toBe(true);
    expect(result.data.id).toBeDefined();

    // Verify in database
    const dbTask = await db.task.findUnique({ where: { id: result.data.id } });
    expect(dbTask).toBeDefined();
  });

  it('should rollback on validation failure', async () => {
    const result = await createTask(invalidData);
    expect(result.success).toBe(false);
    // Verify no orphaned records created
  });
});
```

---

## 8. Integration Test Analysis

### Coverage

- **20 integration tests** in `kanban-workflows.test.tsx`
- Tests real component interactions with mocked server
- Good workflow coverage: create, edit, move, delete

### Strengths

1. **Workflow Testing**
   - End-to-end task creation flow
   - Multi-step operations (create → edit → delete)
   - Sequential operation handling

2. **State Persistence**
   - Tests optimistic updates
   - Tests rollback on error
   - Tests error message display

3. **User Interactions**
   - Modal open/close workflows
   - Form submission handling
   - Error clearing on new operations

### Issues Found

#### Issue #1: `act()` Warnings (Critical)

**Symptom:** Console warnings during drag-and-drop tests

```
stderr | An update to KanbanBoard inside a test was not wrapped in act(...).
stderr | An update to DndContext inside a test was not wrapped in act(...).
```

**Affected Tests:**
- "should move a task between columns"
- "should rollback move on server error"

**Root Cause:** DnD Kit library updates state asynchronously in ways not captured by waitFor

**Solution:**
```typescript
it('should move a task between columns', async () => {
  const user = userEvent.setup();

  // Need to wrap drag operation
  await act(async () => {
    await simulateDragAndDrop(user, sourceId, targetId);
  });

  await waitFor(() => {
    expect(taskInNewColumn).toBeInTheDocument();
  });
});
```

#### Issue #2: Mock Server Actions

Tests mock all server actions, which means:
- Real server action implementation never tested
- Client-server contract not validated
- Database integration not tested

**Better Approach:**
- Keep integration tests with mocks (current approach is good)
- Add separate server action unit tests
- Add E2E tests with real backend (Playwright)

---

## 9. Testing Best Practices Compliance

### ✓ Adhered To

1. **Isolation** - Tests don't depend on each other
2. **Clarity** - Test names explain what's being tested
3. **Specificity** - Each test verifies one behavior
4. **Cleanup** - Proper setup/teardown
5. **Accessibility** - Strong a11y test coverage
6. **User-Centric** - Tests user workflows, not implementation

### ⚠ Partially Adhered To

1. **DRY (Don't Repeat Yourself)**
   - Mock task creation repeated in multiple files
   - Should use testHelpers instead
   - Test utilities well-structured but not always used

2. **Coverage Goals**
   - Component coverage excellent (80%+)
   - Logic coverage weak (server actions 0%)
   - No clear coverage targets per file

3. **Async Testing**
   - Mostly uses `waitFor()` correctly
   - Some tests have missing `act()` wrappers
   - Race conditions possible in timing-dependent tests

### ✗ Not Followed

1. **Database Testing** - No tests use actual database
2. **Performance Testing** - No performance assertions
3. **Visual Regression** - No snapshot tests (reasonable decision)

---

## 10. Strengths of the Test Suite

### 1. Comprehensive Component Coverage
- **7 components fully tested** with 80%+ coverage
- 238+ component tests provide strong regression detection
- All UI variants tested

### 2. Excellent Documentation
- JSDoc headers for every test file
- Test organization with clear sections
- Helper functions well-commented
- Test names follow "should..." convention

### 3. Strong Accessibility Focus
- Tests for keyboard navigation
- Tests for screen reader compatibility
- Tests for focus management
- Role-based queries prioritized

### 4. Good Test Utilities
- Reusable mock task factories
- Response helper functions
- Shared localStorage mock
- Test helper functions documented

### 5. User-Centric Testing
- Semantic queries (byRole, byLabelText)
- Real user interactions via user-event
- Avoids implementation details
- Tests behavior, not DOM structure

### 6. Proper Test Isolation
- Mocks cleared between tests
- State reset between tests
- localStorage cleared
- No shared state leaks

### 7. Integration Test Coverage
- 20 integration tests covering workflows
- Creates > edits > deletes tested
- Error scenarios included
- Optimistic updates tested

---

## 11. Areas for Improvement

### Priority 1: Critical Gaps

#### 1. Add Server Action Tests (0% → 80%+)
- Create unit tests for `app/actions/tasks.ts`
- Test validation, authorization, database operations
- Test error handling and rollback scenarios
- Estimated: 40-60 additional tests

#### 2. Fix `act()` Warnings
- Wrap drag-and-drop operations in `act()`
- Consider using `userEvent` drag simulation
- Add `waitFor()` with condition for DnD completion
- Estimated effort: 2-3 hours

#### 3. Add Store Coverage (61% → 90%+)
- Test optimistic update rollback
- Test error handling in store actions
- Test concurrent operation handling
- Add 15-20 store-specific tests

### Priority 2: Important Improvements

#### 4. Improve KanbanBoard Coverage (65% → 85%+)
- Test error toast auto-dismiss
- Test delete confirmation modal
- Test delete confirmation cancel
- Test drag-drop error scenarios
- Add 8-10 additional tests

#### 5. Add useKanban Hook Tests (92% → 100%)
- Test error state transitions
- Test type conversion edge cases
- Test server action failure handling
- Add 5-7 tests

#### 6. Replace CSS Class Tests with Role-Based Tests
- Replace `container.firstChild` selectors
- Remove dependency on Tailwind class names
- Use `toHaveClass()` only for accessibility classes
- Refactor ~15 test assertions

#### 7. Extract More Test Utilities
- Move `fillTaskForm()` helper to testHelpers.ts
- Create `openTaskModal()` shared helper
- Add `submitForm()` generic helper
- Reduces duplication across test files

### Priority 3: Nice to Have

#### 8. Add Snapshot Tests (Controversial)
- Could add for complex components (TaskCard, TaskForm)
- Risk: Snapshots often become maintenance burden
- Better: Keep focus on functional tests

#### 9. Add E2E Tests with Playwright
- Current setup has `playwright` in devDependencies
- Could add real backend E2E tests
- Tests server actions with real database
- Good for regression prevention

#### 10. Add Performance Tests
- Test form validation doesn't block UI
- Test large task lists (1000+ tasks) render efficiently
- Could use `performance.measure()`

---

## 12. Recommendations and Next Steps

### Immediate Actions (This Sprint)

#### 1. Fix `act()` Warnings [1-2 hours]
```typescript
// File: src/__tests__/integration/kanban-workflows.test.tsx
// Apply act() wrapper to drag-drop operations
// Add test for move to same column (no-op)
```

#### 2. Add Basic Server Action Tests [2-3 hours]
```typescript
// File: src/__tests__/unit/server-actions/tasks.test.ts
// Test: createTask validation
// Test: getTasks success and failure
// Test: basic error handling
// 10-15 tests total
```

#### 3. Add Store Error Handling Tests [1-2 hours]
```typescript
// File: src/__tests__/unit/store/kanban.test.ts
// Test: optimistic update rollback
// Test: error state management
// 10-15 tests total
```

### Short-Term (1-2 Weeks)

#### 4. Improve KanbanBoard Coverage [2-3 hours]
- Add missing modal and error handling tests
- Refactor mocks to use less mocking
- Add 8-10 tests to reach 85% coverage

#### 5. Replace CSS Class Tests [1-2 hours]
- Convert `toHaveClass('from-sky-400')` to semantic assertions
- Use role-based queries instead of `container.firstChild`
- Reduce CSS dependency

#### 6. Extract Shared Test Utilities [1 hour]
- Move integration test helpers to testHelpers.ts
- Create generic form filling helper
- Create generic modal opening helper

### Medium-Term (1-2 Months)

#### 7. Complete Server Layer Testing [4-6 hours]
- Test all server actions thoroughly
- Add error scenarios (network, database)
- Test authorization if implemented
- Aim for 80%+ coverage

#### 8. Add E2E Tests [Ongoing]
- Set up Playwright tests
- Test real workflows with backend
- Run against staging environment
- 5-10 critical workflows

#### 9. Coverage Goals [Target]
```
Target Coverage Metrics:
- Statements: 80%+ (currently 58%)
- Branches: 75%+ (currently 50%)
- Functions: 85%+ (currently 69%)
- Lines: 80%+ (currently 58%)

Per-File Goals:
- Components: 90%+ (currently 80%+) ✓
- Store/Hooks: 85%+ (currently 61-92%)
- Utils/Lib: 95%+ (currently 100%) ✓
- Server Actions: 80%+ (currently 0%)
- API Routes: 80%+ (currently 0%)
```

---

## 13. Specific Code Examples

### Example 1: Fix act() Warning

**Current:**
```typescript
it('should move a task between columns', async () => {
  // ... setup

  // This triggers state updates not wrapped in act()
  await user.pointer({ keys: '[MouseLeft>]', target: taskElement });
  await user.pointer({ coord: { x: 100, y: 300 } });
  await user.pointer({ keys: '[/MouseLeft]' });

  await waitFor(() => {
    expect(screen.getByText('New Feature')).toBeInTheDocument();
  });
});
```

**Fixed:**
```typescript
it('should move a task between columns', async () => {
  // ... setup

  // Wrap state updates in act()
  await act(async () => {
    await user.pointer({ keys: '[MouseLeft>]', target: taskElement });
    await user.pointer({ coord: { x: 100, y: 300 } });
    await user.pointer({ keys: '[/MouseLeft]' });
  });

  // Wait for store updates
  await waitFor(() => {
    expect(screen.getByText('New Feature')).toBeInTheDocument();
  });
});
```

### Example 2: Add Server Action Test

**New File: `src/__tests__/unit/server-actions/tasks.test.ts`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTask, updateTask } from '@/app/actions/tasks';

describe('Server Actions: Tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTask', () => {
    it('should validate input before creating', async () => {
      const result = await createTask({
        title: 'x'.repeat(101), // exceeds limit
        description: '',
        priority: 'MEDIUM',
        columnId: 'TODO',
        tags: [],
        categories: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Title');
    });

    it('should create task with valid input', async () => {
      const result = await createTask({
        title: 'New Task',
        description: 'Description',
        priority: 'HIGH',
        columnId: 'TODO',
        tags: ['test'],
        categories: ['Dev'],
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('New Task');
      expect(result.data?.id).toBeDefined();
    });

    it('should sanitize input to prevent XSS', async () => {
      const result = await createTask({
        title: '<script>alert("xss")</script>',
        description: '<img src=x onerror="alert(\'xss\')">',
        priority: 'MEDIUM',
        columnId: 'TODO',
        tags: ['<script>'],
        categories: [],
      });

      if (result.success) {
        expect(result.data?.title).not.toContain('<script>');
        expect(result.data?.description).not.toContain('onerror');
        expect(result.data?.tags[0]).not.toContain('<script>');
      }
    });
  });

  describe('updateTask', () => {
    it('should update task with partial data', async () => {
      // Arrange: Create a task first
      const createResult = await createTask({
        title: 'Original',
        description: 'Original desc',
        priority: 'LOW',
        columnId: 'TODO',
        tags: [],
        categories: [],
      });

      if (!createResult.success) throw new Error('Setup failed');
      const taskId = createResult.data!.id;

      // Act: Update only title
      const updateResult = await updateTask(taskId, {
        title: 'Updated Title',
      });

      // Assert
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.title).toBe('Updated Title');
      expect(updateResult.data?.description).toBe('Original desc'); // unchanged
    });
  });
});
```

### Example 3: Extract Shared Test Helper

**Current (Duplicated in kanban-workflows.test.tsx):**
```typescript
async function fillTaskForm(
  user: ReturnType<typeof userEvent.setup>,
  data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string;
  }
) {
  const dialog = screen.getByRole('dialog');
  const titleInput = within(dialog).getByLabelText(/title/i);
  await user.clear(titleInput);
  await user.type(titleInput, data.title);
  // ... 20+ more lines
}
```

**Refactored (Move to testHelpers.ts):**
```typescript
// tests/utils/testHelpers.ts
export async function fillTaskForm(
  user: ReturnType<typeof userEvent.setup>,
  data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string;
  }
) {
  const dialog = screen.getByRole('dialog');
  // ... implementation
}

export async function submitTaskForm(
  user: ReturnType<typeof userEvent.setup>,
  buttonText = /save|create/i
) {
  const dialog = screen.getByRole('dialog');
  const button = within(dialog).getByRole('button', { name: buttonText });
  await user.click(button);
}

export async function openTaskModal(
  user: ReturnType<typeof userEvent.setup>
) {
  const addButton = screen.getByRole('button', { name: /add new task/i });
  await user.click(addButton);
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
}
```

**Usage:**
```typescript
// In test files - much cleaner
await openTaskModal(user);
await fillTaskForm(user, { title: 'New Task' });
await submitTaskForm(user);
```

---

## 14. Test Metrics Summary

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Statement Coverage | 58.04% | 80% | ❌ Below target |
| Branch Coverage | 50.72% | 75% | ❌ Below target |
| Function Coverage | 69.56% | 85% | ❌ Below target |
| Line Coverage | 58.45% | 80% | ❌ Below target |
| Component Coverage | 80-100% | 90%+ | ✓ Good |
| Server Action Coverage | 0% | 80% | ❌ Critical gap |
| Integration Tests | 20 | 25+ | ⚠ Adequate |
| Total Tests | 492 | 550+ | ⚠ Adequate |

---

## 15. Conclusion

The kanban board test suite demonstrates **strong foundational quality** with excellent coverage of UI components and user interactions. The tests are well-written, properly isolated, and follow React Testing Library best practices.

### Key Achievements:
1. ✓ 100% coverage on all UI components (Badge, Button, Modal)
2. ✓ 80%+ coverage on core features (TaskCard, TaskForm, KanbanColumn)
3. ✓ Strong accessibility testing
4. ✓ Good integration test coverage
5. ✓ Well-documented and maintainable tests
6. ✓ Excellent test utilities and helpers

### Critical Gaps Requiring Attention:
1. ❌ Server action layer has 0% coverage (critical)
2. ❌ Store/state management at 61% (needs 30%+ more)
3. ❌ `act()` warnings in drag-and-drop tests (critical)
4. ❌ API routes not tested
5. ⚠ Missing error handling edge cases

### Recommended Next Steps:
1. **This week:** Fix `act()` warnings and add basic server action tests
2. **Next 2 weeks:** Improve store coverage and KanbanBoard component coverage
3. **Next month:** Complete server layer testing, add E2E tests
4. **Ongoing:** Refactor brittle CSS-dependent assertions

The test suite is in **good shape** but requires focused effort on server-side testing to achieve comprehensive coverage. With the recommended improvements, the application will have enterprise-grade test coverage and confidence in both client and server-side functionality.

---

## Appendix: Test File Inventory

### Test Files (12 total, 492 tests)

```
src/__tests__/
├── setup.test.ts                              (3 tests)
├── unit/
│   ├── components/
│   │   ├── kanban/
│   │   │   ├── KanbanBoard.test.tsx           (34 tests)
│   │   │   ├── KanbanColumn.test.tsx          (39 tests)
│   │   │   ├── TaskCard.test.tsx              (36 tests)
│   │   │   └── TaskForm.test.tsx              (44 tests)
│   │   └── ui/
│   │       ├── Badge.test.tsx                 (23 tests)
│   │       ├── Button.test.tsx                (34 tests)
│   │       └── Modal.test.tsx                 (28 tests)
│   ├── hooks/
│   │   └── useLocalStorage.test.ts            (40 tests)
│   └── lib/
│       ├── schemas.test.ts                    (131 tests)
│       └── utils.test.ts                      (60 tests)
└── integration/
    └── kanban-workflows.test.tsx              (20 tests)
```

### Configuration Files

- `vitest.config.ts` - Properly configured with happy-dom environment
- `tests/setup.ts` - Global setup with localStorage mock
- `tests/utils/testHelpers.ts` - Shared test utilities

---

**Document Version:** 1.0
**Last Updated:** January 26, 2026
**Reviewed By:** Code Review System
**Next Review:** After implementing recommended improvements
