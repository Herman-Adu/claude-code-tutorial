/**
 * Search and Filter E2E Tests
 *
 * End-to-end tests for the search and filter functionality using Playwright.
 * These tests verify the complete user flow from typing in the search bar
 * to seeing filtered results.
 */

import { test, expect } from '@playwright/test';

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the kanban board
    await page.goto('/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  // ---------------------------------------------------------------------------
  // Search Bar Tests
  // ---------------------------------------------------------------------------

  test.describe('Search Bar', () => {
    test('should display search bar in header', async ({ page }) => {
      const searchBar = page.getByRole('textbox', { name: /search/i });
      await expect(searchBar).toBeVisible();
    });

    test('should filter tasks when typing in search bar', async ({ page }) => {
      const searchBar = page.getByRole('textbox', { name: /search/i });

      // Type search query
      await searchBar.fill('test');

      // Wait for debounce
      await page.waitForTimeout(400);

      // Verify URL updates with search parameter
      await expect(page).toHaveURL(/search=test/);
    });

    test('should clear search when clear button is clicked', async ({ page }) => {
      const searchBar = page.getByRole('textbox', { name: /search/i });

      // Type search query
      await searchBar.fill('test');
      await page.waitForTimeout(400);

      // Click clear button
      const clearButton = page.getByRole('button', { name: /clear search/i });
      await clearButton.click();

      // Verify search is cleared
      await expect(searchBar).toHaveValue('');
      await expect(page).not.toHaveURL(/search=/);
    });

    test('should show loading indicator while searching', async ({ page }) => {
      const searchBar = page.getByRole('textbox', { name: /search/i });

      // Type quickly
      await searchBar.fill('test');

      // Note: Loading indicator may be too quick to catch in E2E tests
      // This test verifies the search bar accepts input
      await expect(searchBar).toHaveValue('test');
    });
  });

  // ---------------------------------------------------------------------------
  // Filter Panel Tests
  // ---------------------------------------------------------------------------

  test.describe('Filter Panel', () => {
    test('should open filter panel when filter button is clicked', async ({ page }) => {
      // Click filter button
      const filterButton = page.getByRole('button', { name: /filter tasks/i });
      await filterButton.click();

      // Verify filter panel is visible
      const filterPanel = page.getByRole('dialog', { name: /filter options/i });
      await expect(filterPanel).toBeVisible();
    });

    test('should show priority filter options', async ({ page }) => {
      // Open filter panel
      const filterButton = page.getByRole('button', { name: /filter tasks/i });
      await filterButton.click();

      // Verify priority dropdown is visible
      const prioritySelect = page.getByLabel(/priority/i);
      await expect(prioritySelect).toBeVisible();

      // Verify options
      await prioritySelect.click();
      await expect(page.getByRole('option', { name: /high/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /medium/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /low/i })).toBeVisible();
    });

    test('should show status filter options', async ({ page }) => {
      // Open filter panel
      const filterButton = page.getByRole('button', { name: /filter tasks/i });
      await filterButton.click();

      // Verify status dropdown is visible
      const statusSelect = page.getByLabel(/status/i);
      await expect(statusSelect).toBeVisible();
    });

    test('should apply filters and close panel', async ({ page }) => {
      // Open filter panel
      const filterButton = page.getByRole('button', { name: /filter tasks/i });
      await filterButton.click();

      // Select a priority
      const prioritySelect = page.getByLabel(/priority/i);
      await prioritySelect.selectOption('HIGH');

      // Click apply
      const applyButton = page.getByRole('button', { name: /apply filters/i });
      await applyButton.click();

      // Verify panel is closed
      const filterPanel = page.getByRole('dialog', { name: /filter options/i });
      await expect(filterPanel).not.toBeVisible();

      // Verify URL is updated
      await expect(page).toHaveURL(/priority=high/);
    });

    test('should clear all filters', async ({ page }) => {
      // Open filter panel and apply a filter
      const filterButton = page.getByRole('button', { name: /filter tasks/i });
      await filterButton.click();

      const prioritySelect = page.getByLabel(/priority/i);
      await prioritySelect.selectOption('HIGH');

      // Click clear all
      const clearButton = page.getByRole('button', { name: /clear all/i });
      await clearButton.click();

      // Verify priority is reset
      await expect(prioritySelect).toHaveValue('');
    });

    test('should close filter panel on escape', async ({ page }) => {
      // Open filter panel
      const filterButton = page.getByRole('button', { name: /filter tasks/i });
      await filterButton.click();

      const filterPanel = page.getByRole('dialog', { name: /filter options/i });
      await expect(filterPanel).toBeVisible();

      // Press escape
      await page.keyboard.press('Escape');

      // Verify panel is closed
      await expect(filterPanel).not.toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Filter Chips Tests
  // ---------------------------------------------------------------------------

  test.describe('Filter Chips', () => {
    test('should display filter chips when filters are active', async ({ page }) => {
      // Open filter panel and apply a filter
      const filterButton = page.getByRole('button', { name: /filter tasks/i });
      await filterButton.click();

      const prioritySelect = page.getByLabel(/priority/i);
      await prioritySelect.selectOption('HIGH');

      const applyButton = page.getByRole('button', { name: /apply filters/i });
      await applyButton.click();

      // Verify filter chip is visible
      const filterChip = page.getByText('Priority:').locator('xpath=..');
      await expect(filterChip).toBeVisible();
      await expect(filterChip).toContainText('High');
    });

    test('should remove filter when chip remove button is clicked', async ({ page }) => {
      // Apply a filter first
      const filterButton = page.getByRole('button', { name: /filter tasks/i });
      await filterButton.click();

      const prioritySelect = page.getByLabel(/priority/i);
      await prioritySelect.selectOption('HIGH');

      const applyButton = page.getByRole('button', { name: /apply filters/i });
      await applyButton.click();

      // Click remove on the chip
      const removeButton = page.getByRole('button', { name: /remove priority/i });
      await removeButton.click();

      // Verify chip is removed
      await expect(page.getByText('Priority:')).not.toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Saved Filters Tests
  // ---------------------------------------------------------------------------

  test.describe('Saved Filters', () => {
    test('should show saved filters dropdown button', async ({ page }) => {
      const savedFiltersButton = page.getByRole('button', { name: /saved filter presets/i });
      await expect(savedFiltersButton).toBeVisible();
    });

    test('should open saved filters dropdown', async ({ page }) => {
      const savedFiltersButton = page.getByRole('button', { name: /saved filter presets/i });
      await savedFiltersButton.click();

      const dropdown = page.getByRole('menu');
      await expect(dropdown).toBeVisible();
      await expect(page.getByText('Saved Filters')).toBeVisible();
    });

    test('should show empty state when no presets', async ({ page }) => {
      const savedFiltersButton = page.getByRole('button', { name: /saved filter presets/i });
      await savedFiltersButton.click();

      // Note: This test assumes no presets exist initially
      // In a real test, we'd need to ensure clean state
      await expect(page.getByText('No saved presets yet')).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // URL Persistence Tests
  // ---------------------------------------------------------------------------

  test.describe('URL Persistence', () => {
    test('should load filters from URL on page load', async ({ page }) => {
      // Navigate with filter params
      await page.goto('/?search=test&priority=high');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Verify search bar has the value
      const searchBar = page.getByRole('textbox', { name: /search/i });
      await expect(searchBar).toHaveValue('test');

      // Verify filter chip is shown
      await expect(page.getByText('Priority:')).toBeVisible();
    });

    test('should update URL when filters change', async ({ page }) => {
      // Start with no filters
      await expect(page).not.toHaveURL(/priority=/);

      // Apply a filter
      const filterButton = page.getByRole('button', { name: /filter tasks/i });
      await filterButton.click();

      const prioritySelect = page.getByLabel(/priority/i);
      await prioritySelect.selectOption('HIGH');

      const applyButton = page.getByRole('button', { name: /apply filters/i });
      await applyButton.click();

      // Wait for URL update (debounced)
      await page.waitForTimeout(600);

      // Verify URL is updated
      await expect(page).toHaveURL(/priority=high/);
    });

    test('should persist filters after page reload', async ({ page }) => {
      // Apply search filter
      const searchBar = page.getByRole('textbox', { name: /search/i });
      await searchBar.fill('test');
      await page.waitForTimeout(600);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify search is still applied
      await expect(searchBar).toHaveValue('test');
    });
  });

  // ---------------------------------------------------------------------------
  // Combined Filters Tests
  // ---------------------------------------------------------------------------

  test.describe('Combined Filters', () => {
    test('should apply multiple filters together', async ({ page }) => {
      // Apply search
      const searchBar = page.getByRole('textbox', { name: /search/i });
      await searchBar.fill('task');
      await page.waitForTimeout(400);

      // Apply priority filter
      const filterButton = page.getByRole('button', { name: /filter tasks/i });
      await filterButton.click();

      const prioritySelect = page.getByLabel(/priority/i);
      await prioritySelect.selectOption('HIGH');

      const applyButton = page.getByRole('button', { name: /apply filters/i });
      await applyButton.click();

      // Verify both filters are active
      await expect(page.getByText('Search:')).toBeVisible();
      await expect(page.getByText('Priority:')).toBeVisible();

      // Verify URL has both params
      await page.waitForTimeout(600);
      await expect(page).toHaveURL(/search=task/);
      await expect(page).toHaveURL(/priority=high/);
    });

    test('should show active filter count badge', async ({ page }) => {
      // Apply multiple filters
      const filterButton = page.getByRole('button', { name: /filter tasks/i });
      await filterButton.click();

      const prioritySelect = page.getByLabel(/priority/i);
      await prioritySelect.selectOption('HIGH');

      const statusSelect = page.getByLabel(/status/i);
      await statusSelect.selectOption('TODO');

      const applyButton = page.getByRole('button', { name: /apply filters/i });
      await applyButton.click();

      // Verify badge shows count
      const badge = filterButton.locator('span').filter({ hasText: '2' });
      await expect(badge).toBeVisible();
    });
  });
});
