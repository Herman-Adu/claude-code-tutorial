/**
 * End-to-End Test Template (Playwright)
 *
 * Use this template for testing complete user workflows in a real browser.
 * E2E tests verify that the entire application works together correctly.
 *
 * Guidelines:
 * - Test critical user journeys
 * - Use real database and services (or test doubles)
 * - Test across different browsers
 * - Verify visual appearance with screenshots
 * - Keep tests maintainable and readable
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

// Configure test behavior
test.describe.configure({ mode: 'parallel' });

// Set timeout for all tests in this file
test.setTimeout(60000); // 60 seconds

// =============================================================================
// CONSTANTS
// =============================================================================

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!@#',
};

const TEST_TASK = {
  title: 'E2E Test Task',
  description: 'This task was created by an E2E test',
  priority: 'HIGH',
  tags: ['e2e', 'test'],
  categories: ['Testing'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Navigate to the application home page
 */
async function navigateToHome(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
}

/**
 * Create a new task via UI
 */
async function createTask(
  page: Page,
  task: typeof TEST_TASK
) {
  // Click "Add Task" button
  await page.getByRole('button', { name: /add task/i }).click();

  // Fill in the form
  await page.getByLabel(/title/i).fill(task.title);
  await page.getByLabel(/description/i).fill(task.description);

  // Select priority
  await page.getByLabel(/priority/i).selectOption(task.priority);

  // Add tags
  for (const tag of task.tags) {
    await page.getByPlaceholder(/add tag/i).fill(tag);
    await page.keyboard.press('Enter');
  }

  // Submit form
  await page.getByRole('button', { name: /create/i }).click();
}

/**
 * Wait for task to appear in column
 */
async function waitForTaskInColumn(
  page: Page,
  taskTitle: string,
  columnName: string
) {
  const column = page.getByRole('region', { name: new RegExp(columnName, 'i') });
  await expect(column.getByText(taskTitle)).toBeVisible();
}

/**
 * Clean up test data
 */
async function cleanupTestData(page: Page) {
  // Delete all tasks with "E2E Test" in title
  const tasks = page.getByText(/E2E Test/);
  const count = await tasks.count();

  for (let i = 0; i < count; i++) {
    await tasks.first().hover();
    await page.getByRole('button', { name: /delete/i }).first().click();
    await page.getByRole('button', { name: /confirm/i }).click();
  }
}

// =============================================================================
// TEST HOOKS
// =============================================================================

test.beforeEach(async ({ page }) => {
  // Navigate to the application before each test
  await navigateToHome(page);
});

test.afterEach(async ({ page }) => {
  // Clean up test data after each test
  await cleanupTestData(page);
});

// =============================================================================
// TEST SUITE
// =============================================================================

test.describe('Kanban Board E2E Tests', () => {

  // ---------------------------------------------------------------------------
  // Happy Path Tests
  // ---------------------------------------------------------------------------

  test.describe('Task Creation', () => {
    test('should create a new task successfully', async ({ page }) => {
      // Act
      await createTask(page, TEST_TASK);

      // Assert - task should appear in To-Do column
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');

      // Verify task content
      const taskCard = page.getByText(TEST_TASK.title).locator('..');
      await expect(taskCard.getByText(TEST_TASK.description)).toBeVisible();

      // Verify priority badge
      await expect(taskCard.getByText(/high/i)).toBeVisible();

      // Verify tags
      for (const tag of TEST_TASK.tags) {
        await expect(taskCard.getByText(tag)).toBeVisible();
      }
    });

    test('should validate required fields', async ({ page }) => {
      // Act
      await page.getByRole('button', { name: /add task/i }).click();
      await page.getByRole('button', { name: /create/i }).click();

      // Assert - error messages should appear
      await expect(page.getByText(/title is required/i)).toBeVisible();
    });

    test('should close form on cancel', async ({ page }) => {
      // Act
      await page.getByRole('button', { name: /add task/i }).click();
      await page.getByLabel(/title/i).fill('Test');
      await page.getByRole('button', { name: /cancel/i }).click();

      // Assert - form should be closed
      await expect(page.getByLabel(/title/i)).not.toBeVisible();
    });
  });

  test.describe('Task Updates', () => {
    test('should update task details', async ({ page }) => {
      // Arrange - create a task first
      await createTask(page, TEST_TASK);
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');

      // Act - open edit form
      const taskCard = page.getByText(TEST_TASK.title).locator('..');
      await taskCard.hover();
      await taskCard.getByRole('button', { name: /edit/i }).click();

      // Update title
      const newTitle = 'Updated E2E Test Task';
      await page.getByLabel(/title/i).fill(newTitle);
      await page.getByRole('button', { name: /save/i }).click();

      // Assert - updated task should be visible
      await expect(page.getByText(newTitle)).toBeVisible();
      await expect(page.getByText(TEST_TASK.title)).not.toBeVisible();
    });

    test('should update task priority', async ({ page }) => {
      // Arrange
      await createTask(page, TEST_TASK);
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');

      // Act
      const taskCard = page.getByText(TEST_TASK.title).locator('..');
      await taskCard.hover();
      await taskCard.getByRole('button', { name: /edit/i }).click();
      await page.getByLabel(/priority/i).selectOption('LOW');
      await page.getByRole('button', { name: /save/i }).click();

      // Assert
      await expect(taskCard.getByText(/low/i)).toBeVisible();
      await expect(taskCard.getByText(/high/i)).not.toBeVisible();
    });
  });

  test.describe('Task Deletion', () => {
    test('should delete task with confirmation', async ({ page }) => {
      // Arrange
      await createTask(page, TEST_TASK);
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');

      // Act
      const taskCard = page.getByText(TEST_TASK.title).locator('..');
      await taskCard.hover();
      await taskCard.getByRole('button', { name: /delete/i }).click();

      // Confirm deletion
      await page.getByRole('button', { name: /confirm/i }).click();

      // Assert
      await expect(page.getByText(TEST_TASK.title)).not.toBeVisible();
    });

    test('should cancel deletion', async ({ page }) => {
      // Arrange
      await createTask(page, TEST_TASK);
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');

      // Act
      const taskCard = page.getByText(TEST_TASK.title).locator('..');
      await taskCard.hover();
      await taskCard.getByRole('button', { name: /delete/i }).click();

      // Cancel deletion
      await page.getByRole('button', { name: /cancel/i }).click();

      // Assert - task should still be visible
      await expect(page.getByText(TEST_TASK.title)).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Drag and Drop Tests
  // ---------------------------------------------------------------------------

  test.describe('Drag and Drop', () => {
    test('should move task to In Progress', async ({ page }) => {
      // Arrange
      await createTask(page, TEST_TASK);
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');

      // Act - drag task to In Progress column
      const taskCard = page.getByText(TEST_TASK.title).locator('..');
      const inProgressColumn = page.getByRole('region', { name: /in progress/i });

      await taskCard.dragTo(inProgressColumn);

      // Assert
      await waitForTaskInColumn(page, TEST_TASK.title, 'In Progress');
    });

    test('should move task through all columns', async ({ page }) => {
      // Arrange
      await createTask(page, TEST_TASK);
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');

      const taskCard = page.getByText(TEST_TASK.title).locator('..');

      // Act & Assert - To-Do → In Progress
      const inProgressColumn = page.getByRole('region', { name: /in progress/i });
      await taskCard.dragTo(inProgressColumn);
      await waitForTaskInColumn(page, TEST_TASK.title, 'In Progress');

      // Act & Assert - In Progress → Completed
      const completedColumn = page.getByRole('region', { name: /completed/i });
      await taskCard.dragTo(completedColumn);
      await waitForTaskInColumn(page, TEST_TASK.title, 'Completed');
    });

    test('should maintain task order after drag', async ({ page }) => {
      // Arrange - create multiple tasks
      const tasks = [
        { ...TEST_TASK, title: 'E2E Task 1' },
        { ...TEST_TASK, title: 'E2E Task 2' },
        { ...TEST_TASK, title: 'E2E Task 3' },
      ];

      for (const task of tasks) {
        await createTask(page, task);
        await waitForTaskInColumn(page, task.title, 'To-Do');
      }

      // Act - drag second task to top
      const task2 = page.getByText('E2E Task 2').locator('..');
      const task1 = page.getByText('E2E Task 1').locator('..');
      await task2.dragTo(task1, { targetPosition: { x: 0, y: 0 } });

      // Assert - verify new order
      const todoColumn = page.getByRole('region', { name: /to-do/i });
      const taskCards = todoColumn.getByRole('article');

      await expect(taskCards.nth(0)).toContainText('E2E Task 2');
      await expect(taskCards.nth(1)).toContainText('E2E Task 1');
    });
  });

  // ---------------------------------------------------------------------------
  // Persistence Tests
  // ---------------------------------------------------------------------------

  test.describe('Data Persistence', () => {
    test('should persist tasks after page reload', async ({ page }) => {
      // Arrange
      await createTask(page, TEST_TASK);
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');

      // Act - reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Assert - task should still be visible
      await expect(page.getByText(TEST_TASK.title)).toBeVisible();
    });

    test('should persist task position after reload', async ({ page }) => {
      // Arrange - create and move task
      await createTask(page, TEST_TASK);
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');

      const taskCard = page.getByText(TEST_TASK.title).locator('..');
      const inProgressColumn = page.getByRole('region', { name: /in progress/i });
      await taskCard.dragTo(inProgressColumn);
      await waitForTaskInColumn(page, TEST_TASK.title, 'In Progress');

      // Act - reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Assert - task should still be in In Progress
      await waitForTaskInColumn(page, TEST_TASK.title, 'In Progress');
    });
  });

  // ---------------------------------------------------------------------------
  // Error Handling Tests
  // ---------------------------------------------------------------------------

  test.describe('Error Handling', () => {
    test('should show error message on failed creation', async ({ page }) => {
      // Arrange - simulate network error
      await page.route('**/api/tasks', route => route.abort());

      // Act
      await createTask(page, TEST_TASK);

      // Assert - error message should appear
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(/error/i)).toBeVisible();
    });

    test('should recover from temporary network error', async ({ page }) => {
      // Arrange - fail first request, succeed second
      let requestCount = 0;
      await page.route('**/api/tasks', route => {
        requestCount++;
        if (requestCount === 1) {
          route.abort();
        } else {
          route.continue();
        }
      });

      // Act - try to create task
      await createTask(page, TEST_TASK);

      // Error should appear
      await expect(page.getByRole('alert')).toBeVisible();

      // Retry
      await page.getByRole('button', { name: /retry/i }).click();

      // Assert - task should be created on retry
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Act - navigate using keyboard
      await page.keyboard.press('Tab'); // Focus first interactive element
      await page.keyboard.press('Enter'); // Activate element

      // Assert - verify keyboard interaction works
      // This depends on your specific implementation
    });

    test('should have proper focus management in modal', async ({ page }) => {
      // Act - open modal
      await page.getByRole('button', { name: /add task/i }).click();

      // Assert - focus should be in modal
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeFocused();
    });

    test('should trap focus within modal', async ({ page }) => {
      // Act
      await page.getByRole('button', { name: /add task/i }).click();

      // Tab through all focusable elements
      const dialog = page.getByRole('dialog');
      const focusableElements = await dialog.locator('button, input, textarea').all();

      for (let i = 0; i < focusableElements.length; i++) {
        await page.keyboard.press('Tab');
      }

      // One more tab should cycle back to first element
      await page.keyboard.press('Tab');

      // Assert - focus should be back at first element
      await expect(focusableElements[0]).toBeFocused();
    });
  });

  // ---------------------------------------------------------------------------
  // Visual Regression Tests
  // ---------------------------------------------------------------------------

  test.describe('Visual Regression', () => {
    test('should match empty board screenshot', async ({ page }) => {
      // Assert
      await expect(page).toHaveScreenshot('empty-board.png');
    });

    test('should match board with tasks screenshot', async ({ page }) => {
      // Arrange
      await createTask(page, TEST_TASK);
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');

      // Assert
      await expect(page).toHaveScreenshot('board-with-tasks.png');
    });

    test('should match modal screenshot', async ({ page }) => {
      // Act
      await page.getByRole('button', { name: /add task/i }).click();

      // Assert
      const dialog = page.getByRole('dialog');
      await expect(dialog).toHaveScreenshot('task-form-modal.png');
    });
  });

  // ---------------------------------------------------------------------------
  // Responsive Design Tests
  // ---------------------------------------------------------------------------

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      // Act
      await createTask(page, TEST_TASK);

      // Assert
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad

      // Act
      await createTask(page, TEST_TASK);

      // Assert
      await waitForTaskInColumn(page, TEST_TASK.title, 'To-Do');
    });
  });

  // ---------------------------------------------------------------------------
  // Performance Tests
  // ---------------------------------------------------------------------------

  test.describe('Performance', () => {
    test('should load within performance budget', async ({ page }) => {
      // Act
      const startTime = Date.now();
      await navigateToHome(page);
      const loadTime = Date.now() - startTime;

      // Assert
      expect(loadTime).toBeLessThan(3000); // 3 second budget
    });

    test('should handle many tasks efficiently', async ({ page }) => {
      // Arrange - create 50 tasks
      for (let i = 0; i < 50; i++) {
        await createTask(page, {
          ...TEST_TASK,
          title: `E2E Task ${i}`,
        });
      }

      // Act - measure drag performance
      const startTime = Date.now();
      const firstTask = page.getByText('E2E Task 0').locator('..');
      const inProgressColumn = page.getByRole('region', { name: /in progress/i });
      await firstTask.dragTo(inProgressColumn);
      const dragTime = Date.now() - startTime;

      // Assert
      expect(dragTime).toBeLessThan(1000); // 1 second budget
    });
  });
});

// =============================================================================
// TIPS FOR WRITING GOOD E2E TESTS
// =============================================================================

/*
1. Test User Journeys
   - Focus on complete workflows
   - Test critical paths first
   - Cover happy path and error cases

2. Use Stable Selectors
   - Prefer getByRole (most robust)
   - Use getByLabel for forms
   - Avoid CSS selectors when possible

3. Wait Appropriately
   - Use built-in waiting (expect, waitFor)
   - Don't use arbitrary timeouts
   - Wait for network idle when needed

4. Keep Tests Independent
   - Each test should work in isolation
   - Clean up test data
   - Don't rely on test order

5. Make Tests Maintainable
   - Use helper functions
   - Extract common workflows
   - Keep tests readable

6. Test Across Browsers
   - Use Playwright's browser matrix
   - Test Chrome, Firefox, Safari
   - Check mobile browsers

7. Handle Flakiness
   - Use auto-retrying assertions
   - Wait for animations to complete
   - Handle race conditions

8. Visual Testing
   - Use screenshots for visual regressions
   - Update snapshots carefully
   - Test responsive layouts

9. Performance Testing
   - Set performance budgets
   - Monitor load times
   - Check for performance regressions

10. Accessibility
    - Test keyboard navigation
    - Verify focus management
    - Check screen reader support
*/
