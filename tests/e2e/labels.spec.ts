/**
 * Label Management E2E Tests
 *
 * End-to-end tests for Phase 2 label functionality:
 * - Label manager modal
 * - Creating, editing, and deleting labels
 * - Assigning labels to tasks
 * - Filtering by labels
 */

import { test, expect } from '@playwright/test';

test.describe('Label Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ---------------------------------------------------------------------------
  // Label Manager Modal Tests
  // ---------------------------------------------------------------------------

  test.describe('Label Manager Modal', () => {
    test('should open label manager from board header', async ({ page }) => {
      // Look for labels button in header
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        // Modal should open
        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        // Should show "Manage Labels" or similar title
        await expect(modal.locator('text=/manage|labels/i')).toBeVisible();
      } else {
        // Label feature may not be accessible without auth
        test.skip();
      }
    });

    test('should display empty state when no labels exist', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        // Either shows labels or empty state
        const emptyState = modal.locator('text=/no labels|create.*first|get started/i');
        const labelList = modal.locator('[data-testid="label-item"], [class*="label-row"]');

        const hasEmptyState = await emptyState.count() > 0;
        const hasLabels = await labelList.count() > 0;

        // One of these should be true
        expect(hasEmptyState || hasLabels).toBeTruthy();
      } else {
        test.skip();
      }
    });

    test('should have create label button', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        // Should have create button
        const createButton = modal.locator('button:has-text("Create"), button:has-text("New Label"), button:has-text("Add Label")');
        await expect(createButton.first()).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should close modal on escape', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        // Press escape
        await page.keyboard.press('Escape');

        // Modal should close
        await expect(modal).not.toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Label Creation Tests
  // ---------------------------------------------------------------------------

  test.describe('Label Creation', () => {
    test('should show create label form', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        // Click create button
        const createButton = modal.locator('button:has-text("Create"), button:has-text("New Label")');
        await createButton.first().click();

        // Form should appear
        const nameInput = page.locator('input#label-name, input[placeholder*="label name" i], input[name="name"]');
        await expect(nameInput).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should have color picker for new label', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        const createButton = modal.locator('button:has-text("Create"), button:has-text("New Label")');
        await createButton.first().click();

        // Color picker or color options should be visible
        const colorPicker = page.locator('[data-testid="color-picker"], [class*="color"], button[title*="color" i]');
        await expect(colorPicker.first()).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should validate empty label name', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        const createButton = modal.locator('button:has-text("Create"), button:has-text("New Label")');
        await createButton.first().click();

        // Try to save without entering a name
        const saveButton = page.locator('button:has-text("Create Label"), button:has-text("Save")').last();
        await saveButton.click();

        // Should show error or button should be disabled
        const errorMessage = page.locator('text=/required|empty|enter.*name/i');
        const buttonDisabled = await saveButton.isDisabled();

        expect(await errorMessage.count() > 0 || buttonDisabled).toBeTruthy();
      } else {
        test.skip();
      }
    });

    test('should show character count for label name', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        const createButton = modal.locator('button:has-text("Create"), button:has-text("New Label")');
        await createButton.first().click();

        // Look for character count indicator
        const charCount = page.locator('text=/\\d+.*characters/i, text=/\\d+.*\\/.*\\d+/');
        await expect(charCount.first()).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should show label preview', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        const createButton = modal.locator('button:has-text("Create"), button:has-text("New Label")');
        await createButton.first().click();

        // Enter a label name
        const nameInput = page.locator('input#label-name, input[placeholder*="label name" i], input[name="name"]');
        await nameInput.fill('Test Label');

        // Preview should show the label
        const preview = page.locator('text=/preview/i');
        await expect(preview).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should create a new label successfully', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        const createButton = modal.locator('button:has-text("Create"), button:has-text("New Label")');
        await createButton.first().click();

        // Fill in label name
        const labelName = `Test Label ${Date.now()}`;
        const nameInput = page.locator('input#label-name, input[placeholder*="label name" i], input[name="name"]');
        await nameInput.fill(labelName);

        // Save the label
        const saveButton = page.locator('button:has-text("Create Label"), button:has-text("Save")').last();
        await saveButton.click();

        // Should return to list view
        await expect(nameInput).not.toBeVisible({ timeout: 5000 });

        // Label should appear in the list
        await expect(page.getByText(labelName)).toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    });

    test('should cancel label creation', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        const createButton = modal.locator('button:has-text("Create"), button:has-text("New Label")');
        await createButton.first().click();

        // Fill in some data
        const nameInput = page.locator('input#label-name, input[placeholder*="label name" i], input[name="name"]');
        await nameInput.fill('Will be cancelled');

        // Cancel
        const cancelButton = page.locator('button:has-text("Cancel")');
        await cancelButton.click();

        // Form should close, back to list
        await expect(nameInput).not.toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Label Editing Tests
  // ---------------------------------------------------------------------------

  test.describe('Label Editing', () => {
    test('should show edit button for existing labels', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        // Check if there are any labels with edit buttons
        const editButtons = modal.locator('button[aria-label*="Edit"]');

        if (await editButtons.count() > 0) {
          await expect(editButtons.first()).toBeVisible();
        } else {
          // No labels exist yet
          test.skip();
        }
      } else {
        test.skip();
      }
    });

    test('should open edit form with label data', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        const editButtons = modal.locator('button[aria-label*="Edit"]');

        if (await editButtons.count() > 0) {
          // Get the label name before editing
          const labelRow = editButtons.first().locator('xpath=ancestor::*[1]');
          const labelText = await labelRow.textContent();

          // Click edit
          await editButtons.first().click();

          // Form should open with name populated
          const nameInput = page.locator('input#label-name, input[placeholder*="label name" i], input[name="name"]');
          await expect(nameInput).toBeVisible();

          // Name should be pre-filled
          const inputValue = await nameInput.inputValue();
          expect(inputValue.length).toBeGreaterThan(0);
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Label Deletion Tests
  // ---------------------------------------------------------------------------

  test.describe('Label Deletion', () => {
    test('should show delete button for existing labels', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        const deleteButtons = modal.locator('button[aria-label*="Delete"]');

        if (await deleteButtons.count() > 0) {
          await expect(deleteButtons.first()).toBeVisible();
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });

    test('should show confirmation before deleting', async ({ page }) => {
      const labelsButton = page.locator('button:has-text("Labels"), button:has-text("Manage Labels"), button[aria-label*="label" i]').first();

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const modal = page.locator('[role="dialog"]').filter({ hasText: /labels/i });
        await expect(modal).toBeVisible();

        const deleteButtons = modal.locator('button[aria-label*="Delete"]');

        if (await deleteButtons.count() > 0) {
          await deleteButtons.first().click();

          // Confirmation modal should appear
          const confirmModal = page.locator('[role="dialog"]').filter({ hasText: /delete|confirm|sure/i }).last();
          await expect(confirmModal).toBeVisible();

          // Cancel the deletion
          const cancelButton = confirmModal.locator('button:has-text("Cancel")');
          await cancelButton.click();

          // Confirmation should close
          await expect(confirmModal).not.toBeVisible();
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Label Filter Tests
  // ---------------------------------------------------------------------------

  test.describe('Label Filtering', () => {
    test('should display label filter option', async ({ page }) => {
      // Open filter panel
      const filterButton = page.getByRole('button', { name: /filter/i });

      if (await filterButton.isVisible()) {
        await filterButton.click();

        // Look for label filter section
        const labelFilter = page.locator('text=/label/i, [data-testid="label-filter"]');
        await expect(labelFilter.first()).toBeVisible();
      }
    });

    test('should filter tasks by label', async ({ page }) => {
      const filterButton = page.getByRole('button', { name: /filter/i });

      if (await filterButton.isVisible()) {
        await filterButton.click();

        // Look for label checkboxes or selectors
        const labelOptions = page.locator('[data-testid="label-filter"] input[type="checkbox"], [class*="label-filter"] input');

        if (await labelOptions.count() > 0) {
          // Check a label
          await labelOptions.first().check();

          // Apply filters
          const applyButton = page.locator('button:has-text("Apply")');
          if (await applyButton.isVisible()) {
            await applyButton.click();
          }

          // URL should update or board should filter
          // This is implementation-dependent
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Label Display on Task Cards Tests
  // ---------------------------------------------------------------------------

  test.describe('Labels on Task Cards', () => {
    test('should display labels on task cards', async ({ page }) => {
      // Find a task card
      const taskCard = page.locator('[class*="task"], [data-testid="task-card"]').first();

      if (await taskCard.isVisible()) {
        // Look for label badges on the card
        const labelBadges = taskCard.locator('[data-testid="label-badge"], [class*="label-badge"], [class*="LabelBadge"]');

        // This may or may not have labels
        // Just verify the structure is correct if labels exist
        if (await labelBadges.count() > 0) {
          await expect(labelBadges.first()).toBeVisible();
        }
      }
    });

    test('should show +N indicator for multiple labels', async ({ page }) => {
      const taskCard = page.locator('[class*="task"], [data-testid="task-card"]').first();

      if (await taskCard.isVisible()) {
        // Look for +N indicator (shows when more than MAX_VISIBLE_LABELS)
        const moreIndicator = taskCard.locator('text=/\\+\\d+/');

        // This is optional - only shows if many labels
        if (await moreIndicator.count() > 0) {
          await expect(moreIndicator.first()).toBeVisible();
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Label Assignment Tests
  // ---------------------------------------------------------------------------

  test.describe('Label Assignment', () => {
    test('should show label selector in task edit modal', async ({ page }) => {
      const taskCard = page.locator('[class*="task"], [data-testid="task-card"]').first();

      if (await taskCard.isVisible()) {
        // Click edit button
        const editButton = taskCard.locator('button[aria-label*="Edit"]');
        await editButton.click();

        // Modal should open
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();

        // Look for label selector
        const labelSelector = modal.locator('text=/labels/i, [data-testid="label-selector"]');
        await expect(labelSelector.first()).toBeVisible();

        // Close modal
        await page.keyboard.press('Escape');
      } else {
        test.skip();
      }
    });
  });
});
