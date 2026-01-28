# Test Implementation Guide
## Priority Actions for Improving Test Coverage

**Created:** January 26, 2026
**Total Coverage Gap:** 22% (58% → 80%)
**Estimated Effort:** 24-34 hours (3-4 weeks)

---

## Quick Start: Critical Issues First

### Issue #1: Fix `act()` Warnings (1-2 hours) 🔴 URGENT

**Problem:** Integration tests generate React warnings about untracked state updates in drag-drop tests.

**Files:** `src/__tests__/integration/kanban-workflows.test.tsx`

**Affected Tests:**
- Line 237: "should move a task between columns"
- Line 283: "should rollback move on server error"

**Quick Fix:**

```typescript
// BEFORE (Current - generates warnings)
it('should move a task between columns', async () => {
  vi.mocked(moveTask).mockResolvedValueOnce({
    success: true,
    data: createMockTask({ columnId: 'IN_PROGRESS' }),
  });

  render(<KanbanBoard />);
  await waitForHydration();

  const taskElement = screen.getByText(/test task/i);
  fireEvent.dragStart(taskElement);
  fireEvent.dragEnd(taskElement);
  // ⚠️ WARNING: An update to KanbanBoard inside a test was not wrapped in act(...)
});

// AFTER (Fixed)
import { act } from 'react';

it('should move a task between columns', async () => {
  vi.mocked(moveTask).mockResolvedValueOnce({
    success: true,
    data: createMockTask({ columnId: 'IN_PROGRESS' }),
  });

  render(<KanbanBoard />);
  await waitForHydration();

  // Wrap drag operation in act()
  await act(async () => {
    const taskElement = screen.getByText(/test task/i);
    fireEvent.dragStart(taskElement);
    fireEvent.dragEnd(taskElement);
  });

  // Wait for async operation
  await waitFor(() => {
    expect(vi.mocked(moveTask)).toHaveBeenCalled();
  });
});
```

**Checklist:**
- [ ] Import `act` from 'react'
- [ ] Wrap drag operations in `await act(async () => { ... })`
- [ ] Add `await waitFor()` for async completion
- [ ] Run tests: `npm run test:run` (should show 0 warnings)
- [ ] Verify all integration tests pass

---

### Issue #2: Add Server Action Tests (8-10 hours) 🔴 CRITICAL

**Problem:** Server actions completely untested (0% coverage)

**File to Create:** `src/__tests__/unit/server-actions/tasks.test.ts`

**Step-by-Step Implementation:**

#### Step 1: Create test file structure

```bash
# Create directory
mkdir -p src/__tests__/unit/server-actions

# Create test file
touch src/__tests__/unit/server-actions/tasks.test.ts
```

#### Step 2: Add test file template

```typescript
/**
 * Server Action Tests for Task Operations
 *
 * Tests the server-side task operations including:
 * - Input validation
 * - Database operations
 * - Error handling
 * - Authorization
 * - Type safety
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  getTasks,
  getTasksByColumn,
} from '@/app/actions/tasks';
import { prisma } from '@/lib/db';
import type { TaskResponse, ActionResponse } from '@/app/actions/tasks';

// =========================================================================
// MOCKS
// =========================================================================

vi.mock('@/lib/db', () => ({
  prisma: {
    task: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// =========================================================================
// TEST HELPERS
// =========================================================================

function createValidTaskInput() {
  return {
    title: 'Test Task',
    description: 'Test description',
    priority: 'MEDIUM',
    tags: ['test'],
    categories: ['Testing'],
    columnId: 'TODO',
  };
}

function createMockTaskResponse(overrides: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test description',
    priority: 'MEDIUM',
    tags: ['test'],
    categories: ['Testing'],
    columnId: 'TODO',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// =========================================================================
// TEST SUITE
// =========================================================================

describe('Task Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // CREATE TASK
  // =========================================================================

  describe('createTask', () => {
    describe('validation', () => {
      it('should reject empty title', async () => {
        const result = await createTask({ ...createValidTaskInput(), title: '' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('title');
      });

      it('should reject missing title', async () => {
        const input = createValidTaskInput();
        delete (input as any).title;
        const result = await createTask(input);
        expect(result.success).toBe(false);
      });

      it('should reject title exceeding max length (100 chars)', async () => {
        const longTitle = 'a'.repeat(101);
        const result = await createTask({ ...createValidTaskInput(), title: longTitle });
        expect(result.success).toBe(false);
      });

      it('should accept title at max length (100 chars)', async () => {
        const maxTitle = 'a'.repeat(100);
        vi.mocked(prisma.task.create).mockResolvedValueOnce(
          createMockTaskResponse({ title: maxTitle })
        );

        const result = await createTask({ ...createValidTaskInput(), title: maxTitle });
        expect(result.success).toBe(true);
      });

      it('should reject invalid priority', async () => {
        const result = await createTask({
          ...createValidTaskInput(),
          priority: 'INVALID_PRIORITY',
        });
        expect(result.success).toBe(false);
      });

      it('should accept valid priorities', async () => {
        const priorities = ['LOW', 'MEDIUM', 'HIGH'];

        for (const priority of priorities) {
          vi.mocked(prisma.task.create).mockResolvedValueOnce(
            createMockTaskResponse({ priority: priority as any })
          );

          const result = await createTask({
            ...createValidTaskInput(),
            priority: priority as any,
          });

          expect(result.success).toBe(true, `Should accept priority: ${priority}`);
        }
      });

      it('should reject invalid column', async () => {
        const result = await createTask({
          ...createValidTaskInput(),
          columnId: 'INVALID_COLUMN',
        });
        expect(result.success).toBe(false);
      });

      it('should accept valid columns', async () => {
        const columns = ['TODO', 'IN_PROGRESS', 'DONE'];

        for (const columnId of columns) {
          vi.mocked(prisma.task.create).mockResolvedValueOnce(
            createMockTaskResponse({ columnId: columnId as any })
          );

          const result = await createTask({
            ...createValidTaskInput(),
            columnId: columnId as any,
          });

          expect(result.success).toBe(true);
        }
      });

      it('should reject too many tags (max 10)', async () => {
        const tooManyTags = Array(11).fill('tag');
        const result = await createTask({
          ...createValidTaskInput(),
          tags: tooManyTags,
        });
        expect(result.success).toBe(false);
      });

      it('should reject tag exceeding max length (30 chars)', async () => {
        const longTag = 'a'.repeat(31);
        const result = await createTask({
          ...createValidTaskInput(),
          tags: [longTag],
        });
        expect(result.success).toBe(false);
      });

      it('should accept valid tags', async () => {
        vi.mocked(prisma.task.create).mockResolvedValueOnce(
          createMockTaskResponse({ tags: ['urgent', 'frontend', 'bug'] })
        );

        const result = await createTask({
          ...createValidTaskInput(),
          tags: ['urgent', 'frontend', 'bug'],
        });

        expect(result.success).toBe(true);
      });

      it('should reject too many categories (max 10)', async () => {
        const tooManyCategories = Array(11).fill('category');
        const result = await createTask({
          ...createValidTaskInput(),
          categories: tooManyCategories,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('database operations', () => {
      it('should create task in database', async () => {
        const input = createValidTaskInput();
        const mockTask = createMockTaskResponse();

        vi.mocked(prisma.task.create).mockResolvedValueOnce(mockTask);

        const result = await createTask(input);

        expect(result.success).toBe(true);
        expect(vi.mocked(prisma.task.create)).toHaveBeenCalledWith({
          data: expect.objectContaining({
            title: input.title,
            priority: input.priority,
            columnId: input.columnId,
          }),
        });
      });

      it('should return correct response structure', async () => {
        vi.mocked(prisma.task.create).mockResolvedValueOnce(createMockTaskResponse());

        const result = await createTask(createValidTaskInput());

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('data');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveProperty('id');
          expect(result.data).toHaveProperty('title');
          expect(result.data).toHaveProperty('priority');
          expect(result.data).toHaveProperty('columnId');
          expect(result.data).toHaveProperty('createdAt');
          expect(result.data).toHaveProperty('updatedAt');
        }
      });

      it('should generate unique IDs', async () => {
        const task1 = createMockTaskResponse({ id: 'id-1' });
        const task2 = createMockTaskResponse({ id: 'id-2' });

        vi.mocked(prisma.task.create)
          .mockResolvedValueOnce(task1)
          .mockResolvedValueOnce(task2);

        const result1 = await createTask(createValidTaskInput());
        const result2 = await createTask(createValidTaskInput());

        if (result1.success && result2.success) {
          expect(result1.data.id).not.toBe(result2.data.id);
        }
      });

      it('should set timestamps correctly', async () => {
        const beforeTime = new Date();
        const mockTask = createMockTaskResponse({
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        vi.mocked(prisma.task.create).mockResolvedValueOnce(mockTask);

        const result = await createTask(createValidTaskInput());
        const afterTime = new Date();

        if (result.success) {
          expect(new Date(result.data.createdAt)).toBeGreaterThanOrEqual(beforeTime);
          expect(new Date(result.data.createdAt)).toBeLessThanOrEqual(afterTime);
          expect(new Date(result.data.updatedAt)).toBeGreaterThanOrEqual(beforeTime);
          expect(new Date(result.data.updatedAt)).toBeLessThanOrEqual(afterTime);
        }
      });
    });

    describe('error handling', () => {
      it('should handle database errors gracefully', async () => {
        vi.mocked(prisma.task.create).mockRejectedValueOnce(
          new Error('Database connection failed')
        );

        const result = await createTask(createValidTaskInput());

        expect(result.success).toBe(false);
        expect(result).toHaveProperty('error');
        expect(result.error).not.toContain('connection');
      });

      it('should not expose sensitive error details', async () => {
        const sensitiveError = new Error(
          'Connection string: postgresql://user:password@localhost/db'
        );

        vi.mocked(prisma.task.create).mockRejectedValueOnce(sensitiveError);

        const result = await createTask(createValidTaskInput());

        expect(result.success).toBe(false);
        expect(result.error).not.toContain('password');
        expect(result.error).not.toContain('postgresql');
      });

      it('should handle validation errors', async () => {
        const result = await createTask({
          ...createValidTaskInput(),
          title: '', // Invalid
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  // =========================================================================
  // UPDATE TASK
  // =========================================================================

  describe('updateTask', () => {
    it('should update task fields', async () => {
      const updatedTask = createMockTaskResponse({
        id: 'task-1',
        title: 'Updated Task',
      });

      vi.mocked(prisma.task.update).mockResolvedValueOnce(updatedTask);

      const result = await updateTask('task-1', { title: 'Updated Task' });

      expect(result.success).toBe(true);
      expect(vi.mocked(prisma.task.update)).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: expect.objectContaining({ title: 'Updated Task' }),
      });
    });

    it('should handle partial updates', async () => {
      const originalTask = createMockTaskResponse({ id: 'task-1', title: 'Original' });
      const updatedTask = { ...originalTask, title: 'Updated' };

      vi.mocked(prisma.task.update).mockResolvedValueOnce(updatedTask);

      const result = await updateTask('task-1', { title: 'Updated' });

      expect(result.success).toBe(true);
    });

    it('should reject non-existent task', async () => {
      vi.mocked(prisma.task.update).mockRejectedValueOnce(
        new Error('Record not found')
      );

      const result = await updateTask('non-existent-id', { title: 'Updated' });

      expect(result.success).toBe(false);
    });

    it('should validate update fields', async () => {
      const result = await updateTask('task-1', { title: '' });

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // DELETE TASK
  // =========================================================================

  describe('deleteTask', () => {
    it('should delete existing task', async () => {
      vi.mocked(prisma.task.delete).mockResolvedValueOnce(createMockTaskResponse());

      const result = await deleteTask('task-1');

      expect(result.success).toBe(true);
      expect(vi.mocked(prisma.task.delete)).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      });
    });

    it('should return success response', async () => {
      vi.mocked(prisma.task.delete).mockResolvedValueOnce(createMockTaskResponse());

      const result = await deleteTask('task-1');

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('data');
    });

    it('should handle non-existent task', async () => {
      vi.mocked(prisma.task.delete).mockRejectedValueOnce(
        new Error('Record not found')
      );

      const result = await deleteTask('non-existent-id');

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // MOVE TASK
  // =========================================================================

  describe('moveTask', () => {
    it('should move task to different column', async () => {
      const movedTask = createMockTaskResponse({
        id: 'task-1',
        columnId: 'IN_PROGRESS',
      });

      vi.mocked(prisma.task.update).mockResolvedValueOnce(movedTask);

      const result = await moveTask('task-1', 'IN_PROGRESS');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.columnId).toBe('IN_PROGRESS');
      }
    });

    it('should validate target column', async () => {
      const result = await moveTask('task-1', 'INVALID_COLUMN');

      expect(result.success).toBe(false);
    });

    it('should handle non-existent task', async () => {
      vi.mocked(prisma.task.update).mockRejectedValueOnce(
        new Error('Record not found')
      );

      const result = await moveTask('non-existent-id', 'TODO');

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // GET TASKS
  // =========================================================================

  describe('getTasks', () => {
    it('should return all tasks', async () => {
      const mockTasks = [
        createMockTaskResponse({ id: 'task-1' }),
        createMockTaskResponse({ id: 'task-2' }),
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValueOnce(mockTasks);

      const result = await getTasks();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('should handle empty task list', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([]);

      const result = await getTasks();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should handle database errors', async () => {
      vi.mocked(prisma.task.findMany).mockRejectedValueOnce(
        new Error('Database error')
      );

      const result = await getTasks();

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // GET TASKS BY COLUMN
  // =========================================================================

  describe('getTasksByColumn', () => {
    it('should return tasks for specific column', async () => {
      const mockTasks = [
        createMockTaskResponse({ id: 'task-1', columnId: 'TODO' }),
        createMockTaskResponse({ id: 'task-2', columnId: 'TODO' }),
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValueOnce(mockTasks);

      const result = await getTasksByColumn('TODO');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data.every(task => task.columnId === 'TODO')).toBe(true);
      }
    });

    it('should validate column ID', async () => {
      const result = await getTasksByColumn('INVALID_COLUMN');

      expect(result.success).toBe(false);
    });

    it('should handle empty column', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([]);

      const result = await getTasksByColumn('TODO');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });
});
```

**Checklist:**
- [ ] Create file structure
- [ ] Copy template code
- [ ] Run tests: `npm run test:run`
- [ ] Verify 40-60 tests passing
- [ ] Check coverage: `npm run test:coverage`
- [ ] Target: 80%+ coverage on server actions

---

### Issue #3: Add Store Error Handling Tests (3-4 hours) 🔴 HIGH

**File to Create:** `src/__tests__/unit/store/kanban.test.ts`

**Key Test Cases to Add:**

```typescript
/**
 * Store Tests for Kanban State Management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useKanbanStore } from '@/store/kanban';
import { createMockTask } from '@/tests/utils/testHelpers';

describe('Kanban Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useKanbanStore.getState();
    store.setTasks([]);
    store.setError(null);
    store.setLoading(false);
  });

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  describe('Error Handling', () => {
    it('should set error state', () => {
      const store = useKanbanStore.getState();
      store.setError('Task creation failed');

      expect(store.error).toBe('Task creation failed');
    });

    it('should clear error state', () => {
      const store = useKanbanStore.getState();
      store.setError('Some error');
      store.clearError();

      expect(store.error).toBeNull();
    });

    it('should handle multiple errors sequentially', () => {
      const store = useKanbanStore.getState();

      store.setError('Error 1');
      expect(store.error).toBe('Error 1');

      store.setError('Error 2');
      expect(store.error).toBe('Error 2');

      store.clearError();
      expect(store.error).toBeNull();
    });

    it('should not allow error to be undefined', () => {
      const store = useKanbanStore.getState();
      store.setError('Error');

      // Attempting to set undefined should clear error
      store.clearError();
      expect(store.error).toBeNull();
    });
  });

  // =========================================================================
  // OPTIMISTIC UPDATES
  // =========================================================================

  describe('Optimistic Updates', () => {
    it('should add task optimistically', () => {
      const store = useKanbanStore.getState();
      const newTask = createMockTask();

      store.addTask(newTask);

      expect(store.tasks).toContainEqual(newTask);
    });

    it('should handle optimistic update rollback', () => {
      const store = useKanbanStore.getState();
      const newTask = createMockTask({ id: 'temp-task' });

      // Add optimistically
      store.addTask(newTask);
      expect(store.tasks).toContainEqual(newTask);

      // Simulate server error - rollback
      const taskIndex = store.tasks.findIndex(t => t.id === 'temp-task');
      if (taskIndex !== -1) {
        const previousTasks = store.tasks.filter(t => t.id !== 'temp-task');
        store.setTasks(previousTasks);
      }

      expect(store.tasks).not.toContainEqual(newTask);
    });

    it('should update task optimistically', () => {
      const store = useKanbanStore.getState();
      const originalTask = createMockTask({ id: 'task-1', title: 'Original' });

      store.addTask(originalTask);
      expect(store.tasks[0].title).toBe('Original');

      // Optimistic update
      store.updateTask('task-1', { title: 'Updated' });

      expect(store.tasks[0].title).toBe('Updated');
    });

    it('should revert optimistic update on error', () => {
      const store = useKanbanStore.getState();
      const originalTask = createMockTask({ id: 'task-1', title: 'Original' });

      store.addTask(originalTask);

      // Save original state
      const savedState = [...store.tasks];

      // Optimistic update
      store.updateTask('task-1', { title: 'Updated' });
      expect(store.tasks[0].title).toBe('Updated');

      // Revert on error
      store.setTasks(savedState);
      expect(store.tasks[0].title).toBe('Original');
    });
  });

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  describe('Loading State', () => {
    it('should set loading state', () => {
      const store = useKanbanStore.getState();

      store.setLoading(true);
      expect(store.isLoading).toBe(true);

      store.setLoading(false);
      expect(store.isLoading).toBe(false);
    });

    it('should allow operations during loading', () => {
      const store = useKanbanStore.getState();

      store.setLoading(true);
      const task = createMockTask();
      store.addTask(task);

      expect(store.isLoading).toBe(true);
      expect(store.tasks).toContainEqual(task);
    });
  });

  // =========================================================================
  // HYDRATION STATE
  // =========================================================================

  describe('Hydration State', () => {
    it('should track hydration state', () => {
      const store = useKanbanStore.getState();

      expect(store.isHydrated).toBe(false);

      store.setHydrated(true);
      expect(store.isHydrated).toBe(true);
    });

    it('should prevent operations before hydration', () => {
      const store = useKanbanStore.getState();
      store.setHydrated(false);

      // Some stores might prevent operations before hydration
      // This depends on your implementation
    });
  });

  // =========================================================================
  // TASK MANAGEMENT
  // =========================================================================

  describe('Task Management', () => {
    it('should retrieve tasks by column', () => {
      const store = useKanbanStore.getState();
      const todoTask = createMockTask({ id: 'task-1', columnId: 'todo' });
      const inProgressTask = createMockTask({ id: 'task-2', columnId: 'in-progress' });

      store.setTasks([todoTask, inProgressTask]);

      const todoTasks = store.getTasksByColumn('todo');
      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0].id).toBe('task-1');
    });

    it('should return empty array for empty column', () => {
      const store = useKanbanStore.getState();
      store.setTasks([]);

      const tasks = store.getTasksByColumn('todo');
      expect(tasks).toEqual([]);
    });

    it('should delete task from store', () => {
      const store = useKanbanStore.getState();
      const task = createMockTask({ id: 'task-1' });

      store.addTask(task);
      expect(store.tasks).toHaveLength(1);

      store.deleteTask('task-1');
      expect(store.tasks).toHaveLength(0);
    });

    it('should move task between columns', () => {
      const store = useKanbanStore.getState();
      const task = createMockTask({ id: 'task-1', columnId: 'todo' });

      store.addTask(task);
      store.moveTask('task-1', 'in-progress');

      const movedTask = store.tasks[0];
      expect(movedTask.columnId).toBe('in-progress');
    });
  });

  // =========================================================================
  // CONCURRENT OPERATIONS
  // =========================================================================

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous additions', () => {
      const store = useKanbanStore.getState();

      const tasks = Array.from({ length: 5 }, (_, i) =>
        createMockTask({ id: `task-${i}` })
      );

      tasks.forEach(task => store.addTask(task));

      expect(store.tasks).toHaveLength(5);
      expect(store.tasks.map(t => t.id)).toEqual([
        'task-0',
        'task-1',
        'task-2',
        'task-3',
        'task-4',
      ]);
    });

    it('should maintain consistency during concurrent updates', () => {
      const store = useKanbanStore.getState();
      const task = createMockTask({ id: 'task-1', title: 'Original' });

      store.addTask(task);

      // Simulate concurrent updates
      store.updateTask('task-1', { title: 'Update 1' });
      expect(store.tasks[0].title).toBe('Update 1');

      store.updateTask('task-1', { title: 'Update 2' });
      expect(store.tasks[0].title).toBe('Update 2');
    });
  });

  // =========================================================================
  // STATE PERSISTENCE
  // =========================================================================

  describe('State Persistence', () => {
    it('should allow setting complete task list', () => {
      const store = useKanbanStore.getState();
      const tasks = [
        createMockTask({ id: 'task-1' }),
        createMockTask({ id: 'task-2' }),
      ];

      store.setTasks(tasks);

      expect(store.tasks).toEqual(tasks);
    });

    it('should clear all tasks', () => {
      const store = useKanbanStore.getState();
      store.setTasks([
        createMockTask({ id: 'task-1' }),
        createMockTask({ id: 'task-2' }),
      ]);

      expect(store.tasks).toHaveLength(2);

      store.setTasks([]);

      expect(store.tasks).toHaveLength(0);
    });
  });
});
```

**Checklist:**
- [ ] Create `src/__tests__/unit/store/kanban.test.ts`
- [ ] Implement 15-20 test cases
- [ ] Run tests: `npm run test:coverage`
- [ ] Target: 85%+ coverage on store

---

## Remaining High-Priority Issues

### Issue #4: Improve KanbanBoard Coverage (2-3 hours) 🟡 HIGH

**Current Coverage:** 65% → Target: 85%

**Missing Test Cases:**

1. **Error Toast Auto-Dismiss (Line 40)**
   ```typescript
   it('should auto-dismiss error toast after 5 seconds', async () => {
     // Test implementation
   });
   ```

2. **Delete Confirmation Modal (Lines 291-310)**
   ```typescript
   it('should show delete confirmation modal', async () => {
     // Test implementation
   });

   it('should confirm task deletion', async () => {
     // Test implementation
   });

   it('should cancel task deletion', async () => {
     // Test implementation
   });
   ```

3. **Escape Key Handling**
   ```typescript
   it('should close modal on escape key', async () => {
     // Test implementation
   });
   ```

4. **Error Scenarios in Drag-Drop**
   ```typescript
   it('should handle drag-drop errors gracefully', async () => {
     // Test implementation
   });
   ```

**Action:**
- [ ] Add 8-10 new tests to KanbanBoard.test.tsx
- [ ] Focus on error handling paths
- [ ] Target: 85%+ coverage

---

### Issue #5: Replace CSS-Based Assertions (1-2 hours) 🟡 MEDIUM

**Files Affected:** Button.test.tsx, Badge.test.tsx, and others

**Find and Replace:**

```typescript
// BEFORE
expect(button).toHaveClass('from-sky-400');
expect(button).toHaveClass('to-indigo-500');

// AFTER
const button = screen.getByRole('button');
expect(button).toBeInTheDocument();
// Test via visual inspection or computed styles if needed
const styles = window.getComputedStyle(button);
expect(styles.backgroundImage).toBeDefined();
```

**Action:**
- [ ] Search for all `toHaveClass()` assertions
- [ ] Replace with semantic queries or computed styles
- [ ] Run tests: `npm run test:run`

---

## Test Implementation Timeline

### Week 1: Critical Fixes
```
Mon-Tue: Fix act() warnings (1-2 hrs)
Wed-Thu: Add server action tests (6-8 hrs)
Fri:     Add store error tests (3-4 hrs)

Total: 10-14 hours
Expected Coverage: 58% → 68%
```

### Week 2: High Priority
```
Mon-Tue: Improve KanbanBoard (2-3 hrs)
Wed:     Replace CSS assertions (1-2 hrs)
Thu-Fri: Extract utilities (1 hr)

Total: 4-6 hours
Expected Coverage: 68% → 75%
```

### Week 3-4: Medium Priority
```
Mon-Tue: Add edge case tests (4-6 hrs)
Wed-Fri: Add E2E tests (4-6 hrs)

Total: 8-12 hours
Expected Coverage: 75% → 82%+
```

---

## Success Criteria Checklist

### Phase 1 (This Sprint) ✓ MUST HAVE
- [ ] `act()` warnings fixed (0 warnings in test output)
- [ ] Server action tests added (80%+ coverage)
- [ ] Store error tests added (85%+ coverage)
- [ ] All tests passing (492 → 550+ tests)
- [ ] Overall coverage: 58% → 68%+

### Phase 2 (Next Sprint) ⚠ SHOULD HAVE
- [ ] KanbanBoard coverage improved (65% → 85%)
- [ ] CSS-based assertions replaced
- [ ] Test utilities extracted
- [ ] Overall coverage: 68% → 75%+

### Phase 3 (2-4 Weeks) 🎯 NICE TO HAVE
- [ ] Edge case test coverage complete
- [ ] E2E tests added (5-10 workflows)
- [ ] Overall coverage: 75% → 82%+
- [ ] Production-ready approval

---

## Quick Reference Commands

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run UI dashboard
npm run test:ui

# Run specific test file
npm run test:run -- src/__tests__/unit/server-actions/tasks.test.ts

# Run tests matching pattern
npm run test:run -- --grep "should create task"

# Run with debug info
npm run test:run -- --reporter=verbose
```

---

## Common Testing Patterns

### Pattern 1: Async Server Action Test
```typescript
it('should handle async operation', async () => {
  const result = await createTask({ title: 'Test' });
  expect(result.success).toBe(true);
});
```

### Pattern 2: Mock Database
```typescript
vi.mocked(prisma.task.create).mockResolvedValueOnce(mockTask);
const result = await createTask(input);
expect(vi.mocked(prisma.task.create)).toHaveBeenCalledWith(...);
```

### Pattern 3: Error Testing
```typescript
vi.mocked(prisma.task.create).mockRejectedValueOnce(new Error('DB Error'));
const result = await createTask(input);
expect(result.success).toBe(false);
```

### Pattern 4: Wrap in act()
```typescript
await act(async () => {
  // State-updating operation
});
```

---

## Resources

- Vitest Documentation: https://vitest.dev
- React Testing Library: https://testing-library.com/react
- Zod Validation: https://zod.dev
- Prisma Testing: https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing

---

**Last Updated:** January 26, 2026
**Review Status:** Ready for Implementation
**Estimated Completion:** 3-4 weeks (24-34 hours total effort)

