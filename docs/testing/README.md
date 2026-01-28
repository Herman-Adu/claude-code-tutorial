# Testing Documentation

Welcome to the testing documentation for the Kanban Board application. This section contains comprehensive guides, task lists, strategies, and templates for implementing and maintaining a robust test suite.

## 📋 Quick Links

| Document | Description |
|----------|-------------|
| [**Testing Task List**](TESTING_TASK_LIST) | Complete 23-task implementation roadmap with priorities and dependencies |
| [**Testing Strategy**](TESTING_STRATEGY) | Philosophy, principles, coverage targets, and best practices |
| [**CI/CD Pipeline**](CI_CD_PIPELINE) | GitHub Actions workflow configuration and automation setup |
| [**Test Templates**](templates/) | Ready-to-use templates for unit, integration, component, and E2E tests |

---

## 🎯 Overview

This testing suite provides:

- **70% Overall Coverage Target** across the entire codebase
- **100% Coverage** for critical paths (utilities, schemas, server actions)
- **Automated CI/CD** with GitHub Actions
- **Multiple Test Layers** (unit, integration, component, E2E)
- **Performance Benchmarks** and monitoring
- **Accessibility Testing** with jest-axe

---

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- utilities
npm test -- schemas
npm test -- server-actions
npm test -- store
npm test -- components

# Run in watch mode
npm test -- --watch

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

---

## 📊 Coverage Targets

| Layer | Target | Priority |
|-------|--------|----------|
| **Utilities** | 100% | Critical |
| **Schemas** | 100% | Critical |
| **Server Actions** | 80% | High |
| **Zustand Store** | 70% | High |
| **Components** | 60% | Medium |
| **E2E Flows** | Key paths | Medium |

---

## 🗂️ Test Organization

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

---

## 🛠️ Testing Stack

| Tool | Purpose | Version |
|------|---------|---------|
| **Jest** | Test runner and assertion library | ^29.x |
| **React Testing Library** | Component testing | ^14.x |
| **Playwright** | End-to-end testing | ^1.40.x |
| **MSW** | API mocking | ^2.x |
| **jest-axe** | Accessibility testing | ^8.x |
| **ts-jest** | TypeScript support | ^29.x |

---

## 📈 Test Phases

### Phase 1: Infrastructure Setup
- Install testing dependencies
- Configure Jest and Playwright
- Set up test utilities and mocks

### Phase 2: Unit Tests - Utilities Layer
- Test utils.ts functions (sanitization, validation, ID generation)
- Achieve 100% coverage

### Phase 3: Unit Tests - Schemas Layer
- Test Zod schemas with valid/invalid inputs
- Verify error messages and edge cases
- Achieve 100% coverage

### Phase 4: Integration Tests - Server Actions
- Mock Prisma client
- Test CRUD operations
- Verify error handling
- Target 80% coverage

### Phase 5: Integration Tests - Zustand Store
- Test optimistic updates and rollback
- Verify state persistence
- Test error scenarios
- Target 70% coverage

### Phase 6: Component Tests
- Test UI components with React Testing Library
- Verify accessibility with jest-axe
- Test user interactions
- Target 60% coverage

### Phase 7: E2E Tests
- Test complete user workflows
- Verify drag-and-drop functionality
- Test task lifecycle
- Cover critical paths

---

## 🔍 Best Practices

### Writing Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Test Behavior, Not Implementation**: Focus on what the code does, not how
3. **One Assertion Per Test**: Keep tests focused and specific
4. **Descriptive Test Names**: Use "should do X when Y" format
5. **Mock External Dependencies**: Isolate units under test
6. **Clean Up After Tests**: Prevent test pollution

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Performance Testing

```typescript
it('should render within performance budget', () => {
  const startTime = performance.now();
  render(<KanbanBoard />);
  const endTime = performance.now();

  expect(endTime - startTime).toBeLessThan(100); // 100ms budget
});
```

---

## 🚨 Common Issues

### Issue: Tests failing due to localStorage

**Solution**: Use test-utils/setup.ts to mock localStorage

```typescript
// test-utils/setup.ts
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});
```

### Issue: Prisma client not mocked properly

**Solution**: Use jest-mock-extended for type-safe mocks

```typescript
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));
```

### Issue: Server Actions not working in tests

**Solution**: Mock server actions and use MSW for API requests

```typescript
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';

const server = setupServer(
  http.post('/api/tasks', () => {
    return HttpResponse.json({ id: '1', title: 'Test' });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessibility Testing Guide](https://www.deque.com/axe/devtools/)

---

## 🤝 Contributing

When adding new features:

1. Write tests BEFORE implementation (TDD)
2. Ensure all tests pass: `npm test`
3. Verify coverage meets targets: `npm run test:coverage`
4. Run E2E tests: `npm run test:e2e`
5. Update test documentation as needed

---

## 📊 Current Status

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Overall Coverage | 70% | TBD | 🔴 Not Started |
| Utilities | 100% | TBD | 🔴 Not Started |
| Schemas | 100% | TBD | 🔴 Not Started |
| Server Actions | 80% | TBD | 🔴 Not Started |
| Store | 70% | TBD | 🔴 Not Started |
| Components | 60% | TBD | 🔴 Not Started |
| E2E | Key Paths | TBD | 🔴 Not Started |

---

*Last Updated: 2026-01-26*
