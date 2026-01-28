# Testing Strategy

## Table of Contents

1. [Overview](#overview)
2. [Testing Philosophy](#testing-philosophy)
3. [Testing Layers](#testing-layers)
4. [Coverage Targets](#coverage-targets)
5. [Testing Tools](#testing-tools)
6. [Best Practices](#best-practices)
7. [Test Organization](#test-organization)
8. [Continuous Integration](#continuous-integration)
9. [Performance Testing](#performance-testing)
10. [Accessibility Testing](#accessibility-testing)

---

## Overview

This document outlines the comprehensive testing strategy for the Kanban Board application. Our approach emphasizes quality, maintainability, and confidence in deployments while balancing test coverage with development velocity.

### Goals

- **Confidence**: Catch bugs before they reach production
- **Speed**: Fast feedback loops for developers
- **Maintainability**: Tests that are easy to understand and update
- **Coverage**: Comprehensive coverage of critical paths
- **Documentation**: Tests as living documentation

### Principles

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **User-Centric**: Test from the user's perspective
3. **Fast Feedback**: Unit tests run in milliseconds, integration tests in seconds
4. **Pyramid Structure**: Many unit tests, fewer integration tests, minimal E2E tests
5. **Continuous Integration**: All tests run on every commit

---

## Testing Philosophy

### The Testing Pyramid

```
         /\
        /  \  E2E Tests (5%)
       /____\  - Critical user flows
      /      \  - Cross-browser testing
     /        \ Integration Tests (25%)
    /__________\ - Server actions
   /            \ - State management
  /              \ - API integration
 /________________\ Unit Tests (70%)
                   - Utilities
                   - Schemas
                   - Pure functions
```

### Why This Distribution?

**Unit Tests (70%)**
- Fast execution (milliseconds)
- Easy to debug
- Test edge cases thoroughly
- High maintainability
- Excellent for utilities and business logic

**Integration Tests (25%)**
- Test component interactions
- Verify data flow
- Moderate execution time (seconds)
- Test realistic scenarios
- Cover server actions and state management

**E2E Tests (5%)**
- Test complete user journeys
- Cross-browser compatibility
- Slow execution (minutes)
- High confidence in production readiness
- Focus on critical paths only

---

## Testing Layers

### Layer 1: Unit Tests

**Purpose**: Test individual functions and modules in isolation

**Targets**:
- `src/lib/utils.ts` - Utility functions (100% coverage)
- `src/lib/schemas.ts` - Zod validation schemas (100% coverage)
- `src/hooks/useLocalStorage.ts` - Storage hook logic
- Pure functions and helpers

**Characteristics**:
- No external dependencies
- Mock all I/O operations
- Fast execution (&lt;100ms per test)
- High code coverage

**Example**:
```typescript
describe('sanitizeInput', () => {
  it('should escape HTML entities', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeInput(input);
    expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
});
```

### Layer 2: Integration Tests

**Purpose**: Test interactions between modules

**Targets**:
- `src/app/actions/tasks.ts` - Server Actions (80% coverage)
- `src/store/kanban.ts` - Zustand store (70% coverage)
- Database operations with Prisma
- Type transformations

**Characteristics**:
- Mock external services (database)
- Test real module interactions
- Moderate execution time (1-5s per test)
- Focus on data flow

**Example**:
```typescript
describe('createTask', () => {
  it('should create task and return success', async () => {
    mockPrisma.task.create.mockResolvedValue(mockTask);

    const result = await createTask(validTaskData);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject(validTaskData);
  });
});
```

### Layer 3: Component Tests

**Purpose**: Test UI components with React Testing Library

**Targets**:
- `src/components/ui/*` - UI primitives (60% coverage)
- `src/features/kanban/*` - Feature components (60% coverage)
- User interactions
- Accessibility

**Characteristics**:
- Test from user perspective
- Use accessible queries
- Test interactions
- Verify accessibility with jest-axe

**Example**:
```typescript
describe('TaskCard', () => {
  it('should render task details', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
    expect(screen.getByText(mockTask.description)).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<TaskCard task={mockTask} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Layer 4: End-to-End Tests

**Purpose**: Test complete user workflows in real browser

**Targets**:
- Critical user journeys (task creation, editing, deletion)
- Drag-and-drop functionality
- Data persistence
- Cross-browser compatibility

**Characteristics**:
- Real browser environment (Playwright)
- Real or test database
- Slow execution (30s-2m per test)
- High confidence

**Example**:
```typescript
test('should create task and move to In Progress', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Create task
  await page.getByRole('button', { name: /add task/i }).click();
  await page.getByLabel(/title/i).fill('New Task');
  await page.getByRole('button', { name: /create/i }).click();

  // Move task
  const taskCard = page.getByText('New Task').locator('..');
  const inProgressColumn = page.getByRole('region', { name: /in progress/i });
  await taskCard.dragTo(inProgressColumn);

  // Verify
  await expect(inProgressColumn.getByText('New Task')).toBeVisible();
});
```

---

## Coverage Targets

### Overall Coverage Goal: 70%

| Layer | Target | Priority | Rationale |
|-------|--------|----------|-----------|
| **Utilities** | 100% | Critical | Pure functions, no excuses for gaps |
| **Schemas** | 100% | Critical | Validation is security-critical |
| **Server Actions** | 80% | High | Business logic and data operations |
| **Zustand Store** | 70% | High | State management is core functionality |
| **Components** | 60% | Medium | Focus on user interactions |
| **E2E** | Key Paths | Medium | Critical workflows only |

### What to Test

**Always Test**:
- ✅ Security-critical code (sanitization, validation)
- ✅ Business logic and calculations
- ✅ Error handling
- ✅ Edge cases and boundary conditions
- ✅ User interactions
- ✅ Accessibility

**Consider Testing**:
- ⚠️ Complex UI interactions
- ⚠️ Performance-critical code
- ⚠️ Integration points
- ⚠️ Data transformations

**Don't Test**:
- ❌ Third-party library internals
- ❌ Framework code
- ❌ Simple getters/setters
- ❌ Obvious code with no logic

---

## Testing Tools

### Test Runners

**Jest (v29.x)**
- Test runner for unit and integration tests
- Built-in mocking, assertions, and coverage
- Fast parallel execution
- Snapshot testing

**Playwright (v1.40.x)**
- E2E testing framework
- Cross-browser support (Chromium, Firefox, WebKit)
- Visual regression testing
- Network interception

### Testing Libraries

**React Testing Library (v14.x)**
- Component testing
- User-centric queries
- Encourages accessibility
- Minimal implementation details

**jest-axe (v8.x)**
- Automated accessibility testing
- Integrates with RTL
- WCAG compliance checks

**MSW (Mock Service Worker v2.x)**
- API mocking for tests
- Service worker-based
- Works in both tests and browser

**ts-jest (v29.x)**
- TypeScript support for Jest
- Type checking in tests
- Source maps for debugging

### Mocking Tools

**jest-mock-extended**
- Type-safe mocks for TypeScript
- Deep mocking support
- Better IntelliSense

**@faker-js/faker**
- Generate realistic test data
- Consistent across tests
- Supports localization

---

## Best Practices

### Writing Good Tests

#### 1. Use Descriptive Test Names

**Good**:
```typescript
it('should return sanitized string when input contains HTML entities', () => {
  // ...
});
```

**Bad**:
```typescript
it('test1', () => {
  // ...
});
```

#### 2. Follow AAA Pattern

```typescript
it('should create task successfully', async () => {
  // Arrange
  const taskData = { title: 'Test', description: 'Test Description' };
  mockPrisma.task.create.mockResolvedValue(mockTask);

  // Act
  const result = await createTask(taskData);

  // Assert
  expect(result.success).toBe(true);
  expect(result.data).toMatchObject(taskData);
});
```

#### 3. Test One Thing Per Test

**Good**:
```typescript
it('should escape HTML entities', () => {
  expect(sanitizeInput('<script>')).toBe('&lt;script&gt;');
});

it('should handle empty strings', () => {
  expect(sanitizeInput('')).toBe('');
});
```

**Bad**:
```typescript
it('should sanitize input', () => {
  expect(sanitizeInput('<script>')).toBe('&lt;script&gt;');
  expect(sanitizeInput('')).toBe('');
  expect(sanitizeInput('normal')).toBe('normal');
  // Too many assertions in one test
});
```

#### 4. Mock External Dependencies

```typescript
// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

// Mock server actions
jest.mock('@/app/actions/tasks', () => ({
  createTask: jest.fn(),
  updateTask: jest.fn(),
}));
```

#### 5. Clean Up After Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

#### 6. Use Accessible Queries

**Preferred**:
```typescript
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/title/i);
```

**Avoid**:
```typescript
screen.getByTestId('submit-button');
container.querySelector('.submit-btn');
```

#### 7. Test Accessibility

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Code Coverage Guidelines

#### Interpreting Coverage Metrics

- **Line Coverage**: Percentage of lines executed
- **Branch Coverage**: Percentage of code branches taken
- **Function Coverage**: Percentage of functions called
- **Statement Coverage**: Percentage of statements executed

#### Coverage is Not Everything

✅ **Good**: 80% coverage with meaningful tests
❌ **Bad**: 100% coverage with shallow tests

Focus on:
- Testing business logic thoroughly
- Covering edge cases
- Testing error paths
- Verifying user workflows

---

## Test Organization

### File Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── utils.test.ts
│   │   │   └── schemas.test.ts
│   │   └── hooks/
│   │       └── useLocalStorage.test.ts
│   ├── integration/
│   │   ├── actions/
│   │   │   └── tasks.test.ts
│   │   └── store/
│   │       └── kanban.test.ts
│   └── components/
│       ├── ui/
│       │   ├── Badge.test.tsx
│       │   ├── Button.test.tsx
│       │   └── Modal.test.tsx
│       └── features/
│           └── kanban/
│               ├── KanbanBoard.test.tsx
│               ├── KanbanColumn.test.tsx
│               ├── TaskCard.test.tsx
│               └── TaskForm.test.tsx
├── e2e/
│   ├── kanban-board.spec.ts
│   ├── task-lifecycle.spec.ts
│   └── drag-and-drop.spec.ts
└── test-utils/
    ├── setup.ts
    ├── test-helpers.ts
    └── mocks/
        ├── prisma.ts
        └── server-actions.ts
```

### Naming Conventions

- Test files: `*.test.ts`, `*.test.tsx`
- E2E tests: `*.spec.ts`
- Test suites: Use `describe()` blocks
- Test cases: Use `it()` or `test()`
- Mock files: Place in `__mocks__/` or `test-utils/mocks/`

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run component tests
        run: npm run test:components

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

### Test Execution Strategy

**On Commit**:
- Run unit tests (fast, ~10s)
- Run linting and type checking

**On PR**:
- Run all tests (unit + integration + component)
- Generate coverage report
- Run E2E tests on critical paths

**On Main Branch**:
- Run full test suite
- Run E2E tests across all browsers
- Deploy if all tests pass

---

## Performance Testing

### Performance Budgets

| Metric | Budget | Measurement |
|--------|--------|-------------|
| Component Render | &lt;100ms | `performance.now()` |
| Page Load | &lt;3s | Lighthouse |
| API Response | &lt;500ms | Server Actions |
| Bundle Size | &lt;200KB | Next.js build output |

### Measuring Performance

```typescript
it('should render within performance budget', () => {
  const startTime = performance.now();
  render(<KanbanBoard />);
  const endTime = performance.now();

  expect(endTime - startTime).toBeLessThan(100);
});
```

### Performance Monitoring

- Use Lighthouse CI for page metrics
- Monitor bundle size with size-limit
- Track API response times in tests
- Set up performance alerts

---

## Accessibility Testing

### Automated Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no violations', async () => {
    const { container } = render(<Component />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Focus visible and logical
- [ ] Color contrast meets WCAG AA
- [ ] Forms have proper labels
- [ ] Error messages are descriptive
- [ ] ARIA attributes used correctly

### Keyboard Testing

```typescript
it('should be keyboard navigable', async () => {
  const user = userEvent.setup();
  render(<Component />);

  await user.keyboard('{Tab}');
  expect(screen.getByRole('button')).toHaveFocus();

  await user.keyboard('{Enter}');
  expect(onAction).toHaveBeenCalled();
});
```

---

## Summary

This testing strategy provides a comprehensive approach to ensuring the quality and reliability of the Kanban Board application. By following these guidelines:

1. **Maintain high coverage** of critical code paths
2. **Write maintainable tests** that serve as documentation
3. **Test from the user's perspective** with accessible queries
4. **Balance speed and confidence** with the testing pyramid
5. **Automate everything** with CI/CD integration
6. **Monitor performance** and accessibility continuously
7. **Iterate and improve** based on feedback and metrics

### Next Steps

1. Review [TESTING_TASK_LIST.md](TESTING_TASK_LIST) for implementation roadmap
2. Set up CI/CD pipeline using [CI_CD_PIPELINE.md](CI_CD_PIPELINE)
3. Use test templates from [templates/](templates/) directory
4. Start with Phase 1: Infrastructure Setup

---

*This is a living document. Update as testing practices evolve.*
