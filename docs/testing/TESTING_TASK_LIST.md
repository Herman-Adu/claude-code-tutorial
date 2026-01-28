# KANBAN BOARD - TESTING SESSION

## PROJECT CONTEXT

**Previous Session:** Implementation Complete (5 tracks + 3 code reviews)
**Current Gap:** Testing Score 2/10 (CRITICAL)
**Goal:** Achieve 70%+ code coverage with comprehensive test suite
**Location:** C:\Users\herma\source\repository\claude-code-tutorial

## YOUR ROLE: TEST ORCHESTRATION COORDINATOR

You will coordinate coder agents (to write tests) and code-reviewer agents (to review test quality).
DO NOT write tests yourself - use the coder agent for implementation.

---

## PHASE 1: TESTING INFRASTRUCTURE SETUP

### Task 1.1: Install Testing Dependencies

**Assign to:** Coder Agent

**Requirements:**
```bash
# Install core testing libraries
npm install -D vitest @vitest/ui
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @testing-library/react-hooks
npm install -D happy-dom  # For DOM simulation
npm install -D msw  # Mock Service Worker for API mocking

# TypeScript types
npm install -D @types/testing-library__jest-dom
```

**Deliverables:**
- Updated package.json with dev dependencies
- No errors during installation

---

### Task 1.2: Create Vitest Configuration

**Assign to:** Coder Agent

**File to create:** `vitest.config.ts`

**Configuration:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/generated/**',
        'src/app/layout.tsx',
        'src/app/page.tsx',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Deliverables:**
- vitest.config.ts created
- Configuration uses happy-dom environment
- Coverage thresholds set to 70%
- Path aliases configured (@/ resolves to ./src)

---

### Task 1.3: Create Test Setup File

**Assign to:** Coder Agent

**File to create:** `tests/setup.ts`

**Content:**
```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5434/test_db';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock server actions (will be overridden in specific tests)
vi.mock('@/app/actions/tasks', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  moveTask: vi.fn(),
  getTasks: vi.fn(),
  getTasksByColumn: vi.fn(),
}));
```

**Deliverables:**
- tests/setup.ts created
- Cleanup configured
- Next.js mocks in place
- Server actions mocked

---

### Task 1.4: Create Test Utilities

**Assign to:** Coder Agent

**File to create:** `tests/utils/testHelpers.ts`

**Content:**
```typescript
import { type Task, type Priority, type ColumnId } from '@/types';

// Factory function for creating test tasks
export function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: `test-${Date.now()}-${Math.random()}`,
    title: 'Test Task',
    description: 'Test description',
    priority: 'medium' as Priority,
    tags: ['test'],
    categories: ['Testing'],
    columnId: 'todo' as ColumnId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Factory for creating multiple tasks
export function createMockTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTask({
      id: `test-${i}`,
      title: `Task ${i}`,
    })
  );
}

// Mock API responses
export const mockSuccessResponse = <T>(data: T) => ({
  success: true,
  data,
});

export const mockErrorResponse = (error: string) => ({
  success: false,
  error,
});
```

**Deliverables:**
- Test helper utilities created
- Mock factory functions working
- Type-safe mock generators

---

### Task 1.5: Update package.json Scripts

**Assign to:** Coder Agent

**Add these scripts to package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

**Deliverables:**
- Scripts added to package.json
- Can run `npm test` successfully

---

### ✅ CHECKPOINT 1: Infrastructure Review

**Assign to:** Code-Reviewer Agent

**Review criteria:**
- All dependencies installed correctly
- Vitest config properly set up
- Test setup file includes necessary mocks
- Test helpers are type-safe
- Scripts run without errors

**Expected outcome:** `npm test` runs (even with 0 tests)

---

## PHASE 2: UNIT TESTS - UTILITIES (Priority: CRITICAL)

### Task 2.1: Test sanitizeString Function

**Assign to:** Coder Agent

**File to create:** `tests/unit/lib/utils/sanitizeString.test.ts`

**Test cases:**
```typescript
import { describe, it, expect } from 'vitest';
import { sanitizeString } from '@/lib/utils';

describe('sanitizeString', () => {
  it('should escape HTML entities', () => {
    const input = '<script>alert("XSS")</script>';
    const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
    expect(sanitizeString(input)).toBe(expected);
  });

  it('should escape ampersands', () => {
    expect(sanitizeString('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape single quotes', () => {
    expect(sanitizeString("It's a test")).toBe("It&#x27;s a test");
  });

  it('should escape double quotes', () => {
    expect(sanitizeString('Say "hello"')).toBe('Say &quot;hello&quot;');
  });

  it('should escape forward slashes', () => {
    expect(sanitizeString('path/to/file')).toBe('path&#x2F;to&#x2F;file');
  });

  it('should handle multiple special characters', () => {
    const input = '<div class="test">A & B</div>';
    const expected = '&lt;div class=&quot;test&quot;&gt;A &amp; B&lt;&#x2F;div&gt;';
    expect(sanitizeString(input)).toBe(expected);
  });

  it('should return empty string for empty input', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('should handle normal text without changes', () => {
    const input = 'Normal text without special characters';
    expect(sanitizeString(input)).toBe(input);
  });
});
```

**Coverage target:** 100% (simple pure function)

---

### Task 2.2: Test sanitizeTaskData Function

**Assign to:** Coder Agent

**File to create:** `tests/unit/lib/utils/sanitizeTaskData.test.ts`

**Test cases:**
```typescript
import { describe, it, expect } from 'vitest';
import { sanitizeTaskData } from '@/lib/utils';

describe('sanitizeTaskData', () => {
  it('should sanitize title', () => {
    const input = { title: '<script>alert("XSS")</script>' };
    const result = sanitizeTaskData(input);
    expect(result.title).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('should sanitize description', () => {
    const input = { description: '<b>Bold</b>' };
    const result = sanitizeTaskData(input);
    expect(result.description).toBe('&lt;b&gt;Bold&lt;&#x2F;b&gt;');
  });

  it('should sanitize all tags in array', () => {
    const input = { tags: ['<script>', 'normal', '<div>'] };
    const result = sanitizeTaskData(input);
    expect(result.tags).toEqual([
      '&lt;script&gt;',
      'normal',
      '&lt;div&gt;',
    ]);
  });

  it('should sanitize all categories', () => {
    const input = { categories: ['<test>', 'safe'] };
    const result = sanitizeTaskData(input);
    expect(result.categories).toEqual(['&lt;test&gt;', 'safe']);
  });

  it('should handle missing optional fields', () => {
    const input = { title: 'Test' };
    const result = sanitizeTaskData(input);
    expect(result).toEqual({ title: 'Test' });
  });

  it('should sanitize all fields when all present', () => {
    const input = {
      title: '<title>',
      description: '<desc>',
      tags: ['<tag>'],
      categories: ['<cat>'],
    };
    const result = sanitizeTaskData(input);
    expect(result.title).toBe('&lt;title&gt;');
    expect(result.description).toBe('&lt;desc&gt;');
    expect(result.tags).toEqual(['&lt;tag&gt;']);
    expect(result.categories).toEqual(['&lt;cat&gt;']);
  });
});
```

**Coverage target:** 100%

---

### Task 2.3: Test generateId Function

**Assign to:** Coder Agent

**File to create:** `tests/unit/lib/utils/generateId.test.ts`

**Test cases:**
```typescript
import { describe, it, expect } from 'vitest';
import { generateId } from '@/lib/utils';

describe('generateId', () => {
  it('should generate a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('should contain a hyphen separator', () => {
    const id = generateId();
    expect(id).toContain('-');
  });

  it('should start with timestamp', () => {
    const id = generateId();
    const [timestamp] = id.split('-');
    expect(parseInt(timestamp)).toBeGreaterThan(0);
  });

  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000); // All unique
  });

  it('should have random suffix after timestamp', () => {
    const id = generateId();
    const parts = id.split('-');
    expect(parts.length).toBe(2);
    expect(parts[1].length).toBeGreaterThan(0);
  });
});
```

**Coverage target:** 100%

---

### Task 2.4: Test cn (className utility) Function

**Assign to:** Coder Agent

**File to create:** `tests/unit/lib/utils/cn.test.ts`

**Test cases:**
```typescript
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('should combine multiple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should filter out falsy values', () => {
    expect(cn('class1', false, 'class2', undefined, 'class3')).toBe('class1 class2 class3');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('should return empty string for no classes', () => {
    expect(cn()).toBe('');
  });

  it('should handle all falsy values', () => {
    expect(cn(false, undefined, null, '')).toBe('');
  });
});
```

**Coverage target:** 100%

---

### Task 2.5: Test VALIDATION Constants

**Assign to:** Coder Agent

**File to create:** `tests/unit/lib/utils/validation.test.ts`

**Test cases:**
```typescript
import { describe, it, expect } from 'vitest';
import { VALIDATION } from '@/lib/utils';

describe('VALIDATION constants', () => {
  it('should have correct max title length', () => {
    expect(VALIDATION.MAX_TITLE_LENGTH).toBe(100);
  });

  it('should have correct max description length', () => {
    expect(VALIDATION.MAX_DESCRIPTION_LENGTH).toBe(500);
  });

  it('should have correct max tag length', () => {
    expect(VALIDATION.MAX_TAG_LENGTH).toBe(30);
  });

  it('should have correct max tags count', () => {
    expect(VALIDATION.MAX_TAGS).toBe(10);
  });

  it('should have correct max category length', () => {
    expect(VALIDATION.MAX_CATEGORY_LENGTH).toBe(50);
  });

  it('should have correct max categories count', () => {
    expect(VALIDATION.MAX_CATEGORIES).toBe(10);
  });

  it('should be immutable (as const)', () => {
    // TypeScript will catch this at compile time, but we can verify
    expect(Object.isFrozen(VALIDATION)).toBe(false); // Not frozen, but 'as const'
  });
});
```

**Coverage target:** 100%

---

### ✅ CHECKPOINT 2: Unit Tests - Utilities Review

**Assign to:** Code-Reviewer Agent

**Review criteria:**
- All edge cases covered
- Test descriptions are clear
- Assertions are meaningful
- 100% coverage on utilities achieved
- Tests pass successfully

**Run:** `npm run test:coverage -- tests/unit/lib/utils`

**Expected:** All tests pass, 100% coverage on src/lib/utils.ts

---

## PHASE 3: UNIT TESTS - ZOD SCHEMAS (Priority: CRITICAL)

### Task 3.1: Test TaskSchema Validation

**Assign to:** Coder Agent

**File to create:** `tests/unit/lib/schemas/TaskSchema.test.ts`

**Test cases:**
```typescript
import { describe, it, expect } from 'vitest';
import { TaskSchema, CreateTaskSchema, UpdateTaskSchema } from '@/lib/schemas';

describe('TaskSchema', () => {
  const validTask = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Task',
    description: 'Test description',
    priority: 'MEDIUM',
    tags: ['tag1', 'tag2'],
    categories: ['Category1'],
    columnId: 'TODO',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should validate a correct task', () => {
    const result = TaskSchema.safeParse(validTask);
    expect(result.success).toBe(true);
  });

  it('should reject invalid priority', () => {
    const invalid = { ...validTask, priority: 'INVALID' };
    const result = TaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid columnId', () => {
    const invalid = { ...validTask, columnId: 'INVALID' };
    const result = TaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should require title', () => {
    const invalid = { ...validTask, title: undefined };
    const result = TaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject title longer than 100 chars', () => {
    const invalid = { ...validTask, title: 'a'.repeat(101) };
    const result = TaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject description longer than 500 chars', () => {
    const invalid = { ...validTask, description: 'a'.repeat(501) };
    const result = TaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject more than 10 tags', () => {
    const invalid = {
      ...validTask,
      tags: Array.from({ length: 11 }, (_, i) => `tag${i}`)
    };
    const result = TaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject tag longer than 30 chars', () => {
    const invalid = { ...validTask, tags: ['a'.repeat(31)] };
    const result = TaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject more than 10 categories', () => {
    const invalid = {
      ...validTask,
      categories: Array.from({ length: 11 }, (_, i) => `cat${i}`)
    };
    const result = TaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject category longer than 50 chars', () => {
    const invalid = { ...validTask, categories: ['a'.repeat(51)] };
    const result = TaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('CreateTaskSchema', () => {
  const validCreate = {
    title: 'New Task',
    description: 'Description',
    priority: 'HIGH',
    tags: ['tag1'],
    categories: ['cat1'],
    columnId: 'TODO',
  };

  it('should validate correct creation data', () => {
    const result = CreateTaskSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it('should not require id, createdAt, updatedAt', () => {
    const result = CreateTaskSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it('should reject if id is present', () => {
    const invalid = { ...validCreate, id: '123' };
    const result = CreateTaskSchema.safeParse(invalid);
    // Depends on schema definition - check if id is explicitly omitted
  });
});

describe('UpdateTaskSchema', () => {
  it('should allow partial updates', () => {
    const update = { title: 'Updated Title' };
    const result = UpdateTaskSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it('should allow updating priority only', () => {
    const update = { priority: 'LOW' };
    const result = UpdateTaskSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it('should allow empty update object', () => {
    const result = UpdateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should still validate fields that are present', () => {
    const invalid = { title: 'a'.repeat(101) };
    const result = UpdateTaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

**Coverage target:** 100%

---

### Task 3.2: Test MoveTaskSchema

**Assign to:** Coder Agent

**File to create:** `tests/unit/lib/schemas/MoveTaskSchema.test.ts`

**Test cases:**
```typescript
import { describe, it, expect } from 'vitest';
import { MoveTaskSchema } from '@/lib/schemas';

describe('MoveTaskSchema', () => {
  it('should validate task move with columnId only', () => {
    const data = {
      taskId: '123e4567-e89b-12d3-a456-426614174000',
      newColumnId: 'IN_PROGRESS',
    };
    const result = MoveTaskSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should validate with targetTaskId', () => {
    const data = {
      taskId: '123e4567-e89b-12d3-a456-426614174000',
      newColumnId: 'COMPLETED',
      targetTaskId: '456e4567-e89b-12d3-a456-426614174000',
    };
    const result = MoveTaskSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should require taskId', () => {
    const invalid = { newColumnId: 'TODO' };
    const result = MoveTaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should require newColumnId', () => {
    const invalid = { taskId: '123e4567-e89b-12d3-a456-426614174000' };
    const result = MoveTaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID format', () => {
    const invalid = {
      taskId: 'not-a-uuid',
      newColumnId: 'TODO',
    };
    const result = MoveTaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

**Coverage target:** 100%

---

### ✅ CHECKPOINT 3: Unit Tests - Schemas Review

**Assign to:** Code-Reviewer Agent

**Review criteria:**
- All validation rules tested
- Edge cases covered
- Error messages checked
- 100% schema coverage

**Run:** `npm run test:coverage -- tests/unit/lib/schemas`

**Expected:** All tests pass, 100% coverage on schemas

---

## PHASE 4: INTEGRATION TESTS - SERVER ACTIONS (Priority: HIGH)

### Task 4.1: Setup Prisma Test Database

**Assign to:** Coder Agent

**File to create:** `tests/integration/setup/testDb.ts`

**Content:**
```typescript
import { PrismaClient } from '@/generated/prisma';

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Clean database before tests
export async function cleanDatabase() {
  await testPrisma.task.deleteMany();
}

// Seed test data
export async function seedTestData() {
  await testPrisma.task.createMany({
    data: [
      {
        title: 'Test Task 1',
        description: 'Description 1',
        priority: 'HIGH',
        columnId: 'TODO',
        tags: ['tag1'],
        categories: ['cat1'],
      },
      {
        title: 'Test Task 2',
        description: 'Description 2',
        priority: 'MEDIUM',
        columnId: 'IN_PROGRESS',
        tags: ['tag2'],
        categories: ['cat2'],
      },
    ],
  });
}

// Close connection after tests
export async function closeDatabaseConnection() {
  await testPrisma.$disconnect();
}
```

**Deliverables:**
- Test database utilities
- Clean/seed functions
- Connection management

---

### Task 4.2: Test createTask Server Action

**Assign to:** Coder Agent

**File to create:** `tests/integration/actions/createTask.test.ts`

**Test cases:**
```typescript
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTask } from '@/app/actions/tasks';
import { cleanDatabase, closeDatabaseConnection } from '../setup/testDb';

describe('createTask Server Action', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it('should create a task successfully', async () => {
    const taskData = {
      title: 'New Task',
      description: 'Task description',
      priority: 'HIGH' as const,
      tags: ['tag1', 'tag2'],
      categories: ['Category1'],
      columnId: 'TODO' as const,
    };

    const result = await createTask(taskData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.title).toBe('New Task');
    expect(result.data?.id).toBeDefined();
  });

  it('should sanitize input', async () => {
    const taskData = {
      title: '<script>alert("XSS")</script>',
      description: '<b>Bold</b>',
      priority: 'MEDIUM' as const,
      tags: ['<tag>'],
      categories: ['<cat>'],
      columnId: 'TODO' as const,
    };

    const result = await createTask(taskData);

    expect(result.success).toBe(true);
    expect(result.data?.title).toContain('&lt;script&gt;');
    expect(result.data?.description).toContain('&lt;b&gt;');
  });

  it('should reject invalid data', async () => {
    const invalidData = {
      title: '', // Empty title
      description: 'Description',
      priority: 'HIGH' as const,
      tags: [],
      categories: [],
      columnId: 'TODO' as const,
    };

    const result = await createTask(invalidData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should enforce max title length', async () => {
    const taskData = {
      title: 'a'.repeat(101),
      description: 'Description',
      priority: 'LOW' as const,
      tags: [],
      categories: [],
      columnId: 'TODO' as const,
    };

    const result = await createTask(taskData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('title');
  });

  it('should enforce max tags', async () => {
    const taskData = {
      title: 'Task',
      description: 'Description',
      priority: 'MEDIUM' as const,
      tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
      categories: [],
      columnId: 'TODO' as const,
    };

    const result = await createTask(taskData);

    expect(result.success).toBe(false);
  });
});
```

**Coverage target:** 80%+

---

### Task 4.3: Test updateTask Server Action

**Assign to:** Coder Agent

**File to create:** `tests/integration/actions/updateTask.test.ts`

**Test cases:**
```typescript
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTask, updateTask } from '@/app/actions/tasks';
import { cleanDatabase, closeDatabaseConnection } from '../setup/testDb';

describe('updateTask Server Action', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it('should update task successfully', async () => {
    // Create task first
    const created = await createTask({
      title: 'Original Title',
      description: 'Original description',
      priority: 'LOW',
      tags: [],
      categories: [],
      columnId: 'TODO',
    });

    expect(created.success).toBe(true);
    const taskId = created.data!.id;

    // Update task
    const result = await updateTask(taskId, {
      title: 'Updated Title',
      priority: 'HIGH',
    });

    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Updated Title');
    expect(result.data?.priority).toBe('HIGH');
  });

  it('should return error for non-existent task', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const result = await updateTask(fakeId, { title: 'Updated' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should allow partial updates', async () => {
    const created = await createTask({
      title: 'Task',
      description: 'Description',
      priority: 'MEDIUM',
      tags: ['tag1'],
      categories: ['cat1'],
      columnId: 'TODO',
    });

    const taskId = created.data!.id;

    const result = await updateTask(taskId, { priority: 'HIGH' });

    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Task'); // Unchanged
    expect(result.data?.priority).toBe('HIGH'); // Changed
  });

  it('should sanitize updated fields', async () => {
    const created = await createTask({
      title: 'Task',
      description: 'Desc',
      priority: 'LOW',
      tags: [],
      categories: [],
      columnId: 'TODO',
    });

    const taskId = created.data!.id;

    const result = await updateTask(taskId, {
      title: '<script>XSS</script>',
    });

    expect(result.success).toBe(true);
    expect(result.data?.title).toContain('&lt;script&gt;');
  });
});
```

**Coverage target:** 80%+

---

### Task 4.4: Test deleteTask Server Action

**Assign to:** Coder Agent

**File to create:** `tests/integration/actions/deleteTask.test.ts`

**Test cases:**
```typescript
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTask, deleteTask, getTasks } from '@/app/actions/tasks';
import { cleanDatabase, closeDatabaseConnection } from '../setup/testDb';

describe('deleteTask Server Action', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it('should delete task successfully', async () => {
    const created = await createTask({
      title: 'Task to Delete',
      description: 'Will be deleted',
      priority: 'LOW',
      tags: [],
      categories: [],
      columnId: 'TODO',
    });

    const taskId = created.data!.id;

    const result = await deleteTask(taskId);
    expect(result.success).toBe(true);

    // Verify deletion
    const allTasks = await getTasks();
    expect(allTasks.data?.find(t => t.id === taskId)).toBeUndefined();
  });

  it('should return error for non-existent task', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const result = await deleteTask(fakeId);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error for invalid UUID', async () => {
    const result = await deleteTask('not-a-uuid');

    expect(result.success).toBe(false);
  });
});
```

**Coverage target:** 80%+

---

### Task 4.5: Test getTasks Server Action

**Assign to:** Coder Agent

**File to create:** `tests/integration/actions/getTasks.test.ts`

**Test cases:**
```typescript
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTask, getTasks } from '@/app/actions/tasks';
import { cleanDatabase, closeDatabaseConnection } from '../setup/testDb';

describe('getTasks Server Action', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it('should return empty array when no tasks', async () => {
    const result = await getTasks();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should return all tasks', async () => {
    await createTask({
      title: 'Task 1',
      description: 'Desc 1',
      priority: 'HIGH',
      tags: [],
      categories: [],
      columnId: 'TODO',
    });

    await createTask({
      title: 'Task 2',
      description: 'Desc 2',
      priority: 'MEDIUM',
      tags: [],
      categories: [],
      columnId: 'IN_PROGRESS',
    });

    const result = await getTasks();

    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('should order tasks by createdAt desc', async () => {
    const first = await createTask({
      title: 'First',
      description: 'Desc',
      priority: 'LOW',
      tags: [],
      categories: [],
      columnId: 'TODO',
    });

    // Wait to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const second = await createTask({
      title: 'Second',
      description: 'Desc',
      priority: 'LOW',
      tags: [],
      categories: [],
      columnId: 'TODO',
    });

    const result = await getTasks();

    expect(result.success).toBe(true);
    expect(result.data?.[0].id).toBe(second.data!.id); // Most recent first
    expect(result.data?.[1].id).toBe(first.data!.id);
  });
});
```

**Coverage target:** 80%+

---

### ✅ CHECKPOINT 4: Integration Tests - Server Actions Review

**Assign to:** Code-Reviewer Agent

**Review criteria:**
- Database properly cleaned between tests
- Edge cases tested
- Error handling verified
- Tests are reliable (not flaky)
- Coverage meets 80%+ target

**Run:** `npm run test:coverage -- tests/integration/actions`

**Expected:** All integration tests pass, database operations work correctly

---

## PHASE 5: INTEGRATION TESTS - ZUSTAND STORE (Priority: HIGH)

### Task 5.1: Test Zustand Store State Updates

**Assign to:** Coder Agent

**File to create:** `tests/integration/store/kanbanStore.test.ts`

**Test cases:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useKanbanStore } from '@/store/kanban';
import { mockSuccessResponse, mockErrorResponse } from '../../utils/testHelpers';

describe('Kanban Store', () => {
  beforeEach(() => {
    // Reset store state
    useKanbanStore.setState({
      tasks: [],
      isHydrated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should initialize with empty state', () => {
    const state = useKanbanStore.getState();
    expect(state.tasks).toEqual([]);
    expect(state.isHydrated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should set tasks', () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', /* ... */ },
    ];

    useKanbanStore.getState().setTasks(mockTasks);

    expect(useKanbanStore.getState().tasks).toEqual(mockTasks);
  });

  it('should set hydrated flag', () => {
    useKanbanStore.getState().setHydrated(true);
    expect(useKanbanStore.getState().isHydrated).toBe(true);
  });

  it('should set loading state', () => {
    useKanbanStore.getState().setLoading(true);
    expect(useKanbanStore.getState().isLoading).toBe(true);
  });

  it('should set error', () => {
    useKanbanStore.getState().setError('Test error');
    expect(useKanbanStore.getState().error).toBe('Test error');
  });
});
```

**Coverage target:** 70%+

---

### Task 5.2: Test Optimistic Updates in Store

**Assign to:** Coder Agent

**File to create:** `tests/integration/store/optimisticUpdates.test.ts`

**Test cases:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useKanbanStore } from '@/store/kanban';
import { mockSuccessResponse, mockErrorResponse } from '../../utils/testHelpers';

describe('Optimistic Updates', () => {
  beforeEach(() => {
    useKanbanStore.setState({
      tasks: [],
      isHydrated: true,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('addTask', () => {
    it('should add task optimistically', async () => {
      const mockServerAction = vi.fn().mockResolvedValue(
        mockSuccessResponse({
          id: 'server-id',
          title: 'New Task',
          /* ... other fields */
        })
      );

      const taskData = {
        title: 'New Task',
        description: 'Description',
        priority: 'MEDIUM',
        tags: [],
        categories: [],
        columnId: 'TODO',
      };

      const addPromise = useKanbanStore.getState().addTask(taskData, mockServerAction);

      // Check optimistic state immediately
      const tasksAfterOptimistic = useKanbanStore.getState().tasks;
      expect(tasksAfterOptimistic.length).toBe(1);
      expect(tasksAfterOptimistic[0].title).toBe('New Task');
      expect(tasksAfterOptimistic[0].id).toContain('temp-');

      // Wait for server confirmation
      await addPromise;

      // Check final state
      const finalTasks = useKanbanStore.getState().tasks;
      expect(finalTasks.length).toBe(1);
      expect(finalTasks[0].id).toBe('server-id');
      expect(mockServerAction).toHaveBeenCalledOnce();
    });

    it('should rollback on server error', async () => {
      const mockServerAction = vi.fn().mockResolvedValue(
        mockErrorResponse('Server error')
      );

      const taskData = { /* ... */ };

      await useKanbanStore.getState().addTask(taskData, mockServerAction);

      // Should rollback to empty state
      expect(useKanbanStore.getState().tasks).toEqual([]);
      expect(useKanbanStore.getState().error).toBe('Server error');
    });
  });

  describe('updateTask', () => {
    it('should update task optimistically', async () => {
      // Setup initial task
      useKanbanStore.setState({
        tasks: [{
          id: 'task-1',
          title: 'Original',
          priority: 'LOW',
          /* ... */
        }],
      });

      const mockServerAction = vi.fn().mockResolvedValue(
        mockSuccessResponse({
          id: 'task-1',
          title: 'Updated',
          priority: 'HIGH',
          /* ... */
        })
      );

      const updatePromise = useKanbanStore.getState().updateTask(
        'task-1',
        { title: 'Updated', priority: 'HIGH' },
        mockServerAction
      );

      // Check optimistic state
      const tasksAfterOptimistic = useKanbanStore.getState().tasks;
      expect(tasksAfterOptimistic[0].title).toBe('Updated');

      await updatePromise;

      expect(mockServerAction).toHaveBeenCalledOnce();
    });

    it('should rollback update on error', async () => {
      useKanbanStore.setState({
        tasks: [{
          id: 'task-1',
          title: 'Original',
          /* ... */
        }],
      });

      const mockServerAction = vi.fn().mockResolvedValue(
        mockErrorResponse('Update failed')
      );

      await useKanbanStore.getState().updateTask(
        'task-1',
        { title: 'Updated' },
        mockServerAction
      );

      // Should rollback
      expect(useKanbanStore.getState().tasks[0].title).toBe('Original');
      expect(useKanbanStore.getState().error).toBe('Update failed');
    });
  });

  describe('deleteTask', () => {
    it('should delete task optimistically', async () => {
      useKanbanStore.setState({
        tasks: [
          { id: 'task-1', title: 'Task 1', /* ... */ },
          { id: 'task-2', title: 'Task 2', /* ... */ },
        ],
      });

      const mockServerAction = vi.fn().mockResolvedValue(
        mockSuccessResponse(undefined)
      );

      const deletePromise = useKanbanStore.getState().deleteTask('task-1', mockServerAction);

      // Check optimistic state
      expect(useKanbanStore.getState().tasks.length).toBe(1);
      expect(useKanbanStore.getState().tasks[0].id).toBe('task-2');

      await deletePromise;
    });

    it('should rollback delete on error', async () => {
      const originalTasks = [
        { id: 'task-1', title: 'Task 1', /* ... */ },
      ];

      useKanbanStore.setState({ tasks: originalTasks });

      const mockServerAction = vi.fn().mockResolvedValue(
        mockErrorResponse('Delete failed')
      );

      await useKanbanStore.getState().deleteTask('task-1', mockServerAction);

      // Should restore task
      expect(useKanbanStore.getState().tasks).toEqual(originalTasks);
    });
  });
});
```

**Coverage target:** 70%+

---

### ✅ CHECKPOINT 5: Integration Tests - Store Review

**Assign to:** Code-Reviewer Agent

**Review criteria:**
- Optimistic updates work correctly
- Rollback mechanism tested
- Edge cases covered
- Store state properly managed

**Run:** `npm run test:coverage -- tests/integration/store`

**Expected:** All store tests pass, optimistic updates verified

---

## PHASE 6: COMPONENT TESTS (Priority: MEDIUM)

### Task 6.1: Test TaskCard Component

**Assign to:** Coder Agent

**File to create:** `tests/unit/components/TaskCard.test.tsx`

**Test cases:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCard } from '@/features/kanban/TaskCard';
import { createMockTask } from '../../utils/testHelpers';

describe('TaskCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  it('should render task title', () => {
    const task = createMockTask({ title: 'Test Task Title' });
    render(<TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Test Task Title')).toBeInTheDocument();
  });

  it('should render task description', () => {
    const task = createMockTask({ description: 'Task description' });
    render(<TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Task description')).toBeInTheDocument();
  });

  it('should render priority badge', () => {
    const task = createMockTask({ priority: 'high' });
    render(<TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should render tags', () => {
    const task = createMockTask({ tags: ['tag1', 'tag2'] });
    render(<TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  it('should render categories', () => {
    const task = createMockTask({ categories: ['Frontend', 'Backend'] });
    render(<TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
  });

  it('should have edit button', () => {
    const task = createMockTask();
    render(<TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButton = screen.getByLabelText(/edit task/i);
    expect(editButton).toBeInTheDocument();
  });

  it('should have delete button', () => {
    const task = createMockTask();
    render(<TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByLabelText(/delete task/i);
    expect(deleteButton).toBeInTheDocument();
  });
});
```

**Coverage target:** 60%+

---

### Task 6.2: Test Modal Component

**Assign to:** Coder Agent

**File to create:** `tests/unit/components/Modal.test.tsx`

**Test cases:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/ui/Modal';

describe('Modal', () => {
  it('should not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should render title', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Title">
        <div>Content</div>
      </Modal>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <div>Content</div>
      </Modal>
    );

    const closeButton = screen.getByLabelText(/close/i);
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
```

**Coverage target:** 60%+

---

### ✅ CHECKPOINT 6: Component Tests Review

**Assign to:** Code-Reviewer Agent

**Review criteria:**
- Components render correctly
- User interactions tested
- Accessibility verified
- Coverage meets 60%+ target

**Run:** `npm run test:coverage -- tests/unit/components`

**Expected:** Component tests pass

---

## FINAL PHASE: COVERAGE REPORT & SUMMARY

### Task 7.1: Generate Full Coverage Report

**Assign to:** Coder Agent

**Commands:**
```bash
npm run test:coverage
```

**Review coverage report:**
- Open `coverage/index.html` in browser
- Check which files need more coverage
- Prioritize critical files

**Acceptance Criteria:**
- Overall coverage ≥ 70%
- Utilities coverage = 100%
- Schemas coverage = 100%
- Server Actions coverage ≥ 80%
- Store coverage ≥ 70%
- Components coverage ≥ 60%

---

### Task 7.2: Create Coverage Badge

**Assign to:** Coder Agent

**Update README.md:**
Add coverage badge at top of README

```markdown
# Kanban Board

![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-70%25-green)
```

---

### ✅ FINAL CHECKPOINT: Complete Testing Review

**Assign to:** Code-Reviewer Agent (Final Review)

**Review ALL test files:**
1. Test organization and structure
2. Coverage percentages by file
3. Test quality and maintainability
4. Missing test cases
5. Overall testing strategy

**Provide summary report:**
- Total tests written: X
- Total coverage achieved: X%
- Areas exceeding expectations
- Areas needing improvement
- Recommendations for future tests

---

## SUCCESS CRITERIA

**Phase 1: Infrastructure** ✅
- [ ] Vitest configured
- [ ] Test setup complete
- [ ] Test helpers created
- [ ] `npm test` runs successfully

**Phase 2: Unit Tests - Utilities** ✅
- [ ] 100% coverage on src/lib/utils.ts
- [ ] All edge cases tested
- [ ] XSS prevention verified

**Phase 3: Unit Tests - Schemas** ✅
- [ ] 100% coverage on src/lib/schemas.ts
- [ ] All validation rules tested
- [ ] Error messages verified

**Phase 4: Integration Tests - Server Actions** ✅
- [ ] ≥80% coverage on src/app/actions/tasks.ts
- [ ] Database operations tested
- [ ] Error handling verified
- [ ] Input sanitization confirmed

**Phase 5: Integration Tests - Store** ✅
- [ ] ≥70% coverage on src/store/kanban.ts
- [ ] Optimistic updates tested
- [ ] Rollback mechanism verified
- [ ] State management working

**Phase 6: Component Tests** ✅
- [ ] ≥60% coverage on components
- [ ] Rendering tested
- [ ] User interactions verified
- [ ] Accessibility confirmed

**Final Deliverables:**
- [ ] **Overall coverage ≥70%**
- [ ] Coverage report generated
- [ ] All critical paths tested
- [ ] CI/CD ready (optional)

---

## ESTIMATED EFFORT

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Infrastructure | 5 | 2-3 hours |
| Utilities | 5 | 2-3 hours |
| Schemas | 2 | 1-2 hours |
| Server Actions | 5 | 4-5 hours |
| Store | 2 | 2-3 hours |
| Components | 2 | 2-3 hours |
| Coverage & Review | 2 | 1-2 hours |
| **TOTAL** | **23** | **14-21 hours** |

---

## AGENT COORDINATION NOTES

**For each task:**
1. Assign to coder agent with clear requirements
2. Wait for completion
3. Assign to code-reviewer agent
4. Address any feedback
5. Move to next checkpoint

**At each checkpoint:**
- Run coverage report
- Verify passing tests
- Document any blockers
- Get approval before proceeding

**If tests fail:**
- Identify root cause
- Fix code or tests
- Re-run until passing
- Document what was fixed

---

## COPY THIS PROMPT TO START

When ready to start testing session, copy this entire document and begin with:

"Start with Phase 1, Task 1.1: Install Testing Dependencies.
Use the coder agent to install all dependencies listed."

Good luck!
