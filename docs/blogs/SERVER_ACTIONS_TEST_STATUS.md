# Server Actions Testing Status

## Current Issue

Testing Next.js server actions (`'use server'`) with Vitest presents technical challenges:

1. **Prisma Mock Complexity**: The project uses a custom Prisma client path (`@/generated/prisma/client`) with PostgreSQL adapter
2. **Server Directive**: The `'use server'` directive requires special handling in Vitest
3. **Environment Mismatch**: Server actions need Node environment, tests run in happy-dom

## Test Files Created

✓ `src/__tests__/integration/actions/mocks/prisma-mock.ts` - Prisma mock setup
✓ `src/__tests__/integration/actions/mocks/test-data.ts` - Test fixtures
✓ `src/__tests__/integration/actions/tasks.test.ts` - 38 comprehensive tests

## Tests Written (38 total)

- **createTask**: 11 tests (success cases, validation, errors, XSS sanitization)
- **updateTask**: 7 tests (partial/full updates, validation, errors)
- **deleteTask**: 4 tests (success, validation, errors)
- **moveTask**: 7 tests (column moves, target positioning, errors)
- **getTasks**: 4 tests (fetching, ordering, empty state)
- **getTasksByColumn**: 5 tests (filtering, validation, errors)

## Current Test Result

All 38 tests fail with: `Cannot read properties of undefined (reading 'success')`

This indicates the server actions aren't being imported/executed correctly in the Vitest environment.

## Potential Solutions

### Option 1: E2E Testing
Use Playwright or Cypress for server action testing instead of Vitest unit tests.

### Option 2: Vitest Server Environment
Configure a separate Vitest config with Node environment for server tests:

```typescript
// vitest.config.server.ts
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/integration/actions/**/*.test.ts'],
  },
});
```

### Option 3: API Route Testing
Convert server actions to API routes and test those instead.

### Option 4: Extract Business Logic
Extract validation/sanitization logic into testable pure functions:

```typescript
// Testable without server action complexcompl
export function validateTaskInput(data: CreateTaskInput) { ... }
export function sanitizeTaskData(data: any) { ... }
```

## Recommendation

Given the project's current integration test coverage through `kanban-workflows.test.tsx` (which tests server actions indirectly), prioritize:

1. **Sprint C**: Store coverage enhancement (straightforward unit tests)
2. **Later**: Revisit server actions with E2E tests or extracted business logic

## Coverage Impact

- Server actions currently: **0% unit test coverage**
- Server actions integration coverage: **~70% through kanban-workflows tests**
- Store current: **61%** → Target: **85%+**

**Priority**: Complete Sprint C first for maximum coverage impact with minimal friction.
