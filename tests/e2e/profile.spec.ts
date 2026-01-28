import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page, context }) => {
    // This would need a test user to be created in the test database
    // For now, we're documenting the test structure
    // In a real scenario, you'd need to:
    // 1. Create a test user in the database
    // 2. Set up a test session/auth cookie
    // 3. Then navigate to the profile page
  });

  test('should display user profile information', async ({ page }) => {
    // Skip for now - requires authenticated session
    // TODO: Set up test database and auth flow
    test.skip();

    await page.goto(`${BASE_URL}/profile`);

    // Should show user name
    await expect(page.locator('text=John Doe')).toBeVisible();

    // Should show email
    await expect(page.locator('text=john@example.com')).toBeVisible();

    // Should show account creation date
    await expect(page.locator('text=Member Since')).toBeVisible();
  });

  test('should update profile name successfully', async ({ page }) => {
    test.skip();

    await page.goto(`${BASE_URL}/profile`);

    // Find the name input field
    const nameInput = page.locator('input[placeholder="John Doe"]').first();

    // Clear and enter new name
    await nameInput.clear();
    await nameInput.fill('Jane Smith');

    // Click save button
    await page.locator('button:has-text("Save Changes")').click();

    // Should show success message
    await expect(
      page.locator('text=Profile updated successfully')
    ).toBeVisible();

    // Name should be updated
    await expect(nameInput).toHaveValue('Jane Smith');
  });

  test('should show validation error for empty name', async ({ page }) => {
    test.skip();

    await page.goto(`${BASE_URL}/profile`);

    // Clear the name field
    const nameInput = page.locator('input').first();
    await nameInput.clear();

    // Try to save
    await page.locator('button:has-text("Save Changes")').click();

    // Should show error message
    await expect(
      page.locator('text=Name is required')
    ).toBeVisible();
  });

  test('should show validation error for name too long', async ({ page }) => {
    test.skip();

    await page.goto(`${BASE_URL}/profile`);

    const nameInput = page.locator('input').first();

    // Enter name exceeding 100 characters
    const longName = 'a'.repeat(101);
    await nameInput.fill(longName);

    // Try to save
    await page.locator('button:has-text("Save Changes")').click();

    // Should show error message
    await expect(
      page.locator('text=/characters or less/')
    ).toBeVisible();
  });

  test('should display character count', async ({ page }) => {
    test.skip();

    await page.goto(`${BASE_URL}/profile`);

    // Should show character count
    await expect(page.locator('text=/\\d+ \\/ 100 characters/')).toBeVisible();
  });

  test('should link to settings for password change', async ({ page }) => {
    test.skip();

    await page.goto(`${BASE_URL}/profile`);

    // Should have link to settings
    const settingsLink = page.locator('a:has-text("Go to Settings")');
    await expect(settingsLink).toBeVisible();
    await expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  test('should display OAuth connections', async ({ page }) => {
    test.skip();

    await page.goto(`${BASE_URL}/profile`);

    // Should display connected accounts section
    await expect(
      page.locator('text=Connected Accounts')
    ).toBeVisible();
  });

  test('should show Gravatar tip', async ({ page }) => {
    test.skip();

    await page.goto(`${BASE_URL}/profile`);

    // Should show Gravatar tip
    await expect(
      page.locator('text=/managed by Gravatar/')
    ).toBeVisible();

    // Should have link to Gravatar
    const gravatarLink = page.locator('a[href="https://gravatar.com"]');
    await expect(gravatarLink).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    test.skip();

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/profile`);

    // Profile should be visible and scrollable
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible();

    // Form should be visible
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('should maintain responsive layout on desktop', async ({ page }) => {
    test.skip();

    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto(`${BASE_URL}/profile`);

    // All sections should be visible
    await expect(page.locator('text=Edit Profile')).toBeVisible();
    await expect(page.locator('text=Account Information')).toBeVisible();
    await expect(page.locator('text=Connected Accounts')).toBeVisible();
  });
});
