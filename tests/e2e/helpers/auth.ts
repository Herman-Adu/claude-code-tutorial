import { Page, BrowserContext } from '@playwright/test';

/**
 * Authentication helpers for E2E tests
 *
 * These utilities help with:
 * - Setting up authenticated sessions
 * - Mocking authentication for faster tests
 * - Cleaning up test data
 */

/**
 * Test user credentials for E2E testing.
 * These should match users seeded in the test database.
 */
export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

/**
 * Admin user credentials for testing admin features.
 */
export const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'AdminPassword123!',
  name: 'Admin User',
};

/**
 * Perform login via the UI login form.
 * Use this when testing the actual login flow.
 */
export async function loginViaUI(
  page: Page,
  email: string = TEST_USER.email,
  password: string = TEST_USER.password
): Promise<void> {
  await page.goto('/auth/login');

  // Wait for the login form to be visible
  await page.waitForSelector('form');

  // Fill in credentials
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete (redirect to home/dashboard)
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), {
    timeout: 10000,
  });
}

/**
 * Check if the user is currently logged in by looking for auth indicators.
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Look for common authenticated UI elements
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")');
    const profileLink = page.locator('a[href="/profile"]');
    const userMenu = page.locator('[data-testid="user-menu"]');

    // Check if any of these elements are visible
    const isVisible =
      (await logoutButton.count()) > 0 ||
      (await profileLink.count()) > 0 ||
      (await userMenu.count()) > 0;

    return isVisible;
  } catch {
    return false;
  }
}

/**
 * Logout the current user via UI.
 */
export async function logoutViaUI(page: Page): Promise<void> {
  // Try to find and click logout button
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    // Wait for redirect to login page
    await page.waitForURL(/\/auth\/login/);
  }
}

/**
 * Setup authentication state for faster tests.
 * This stores the auth state to a file that can be reused.
 */
export async function setupAuthState(
  page: Page,
  context: BrowserContext,
  storageStatePath: string = 'playwright/.auth/user.json'
): Promise<void> {
  await loginViaUI(page);

  // Save storage state (cookies, localStorage) for reuse
  await context.storageState({ path: storageStatePath });
}

/**
 * Create a new user registration via UI (if registration is available).
 */
export async function registerViaUI(
  page: Page,
  email: string,
  password: string,
  name: string
): Promise<void> {
  await page.goto('/auth/register');

  await page.waitForSelector('form');

  // Fill in registration form
  const nameInput = page.locator('input[name="name"]');
  if (await nameInput.isVisible()) {
    await nameInput.fill(name);
  }

  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);

  // Look for confirm password field
  const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[placeholder*="Confirm"]');
  if (await confirmPasswordInput.count() > 0) {
    await confirmPasswordInput.fill(password);
  }

  // Submit registration
  await page.click('button[type="submit"]');

  // Wait for redirect after successful registration
  await page.waitForURL((url) => !url.pathname.includes('/auth/register'), {
    timeout: 10000,
  });
}

/**
 * Clear authentication state (cookies, localStorage).
 */
export async function clearAuthState(context: BrowserContext): Promise<void> {
  await context.clearCookies();
}
