/**
 * User and Session Factory Utilities
 *
 * Provides factory functions for creating test users and session objects.
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Mock user ID for testing.
 */
export const MOCK_USER_ID = 'user-123-456-789';

/**
 * Alternative user ID for testing multi-user scenarios.
 */
export const OTHER_USER_ID = 'other-user-999';

// ============================================================================
// Types
// ============================================================================

/**
 * User object as returned from auth.
 */
export interface MockUser {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
}

/**
 * Session object as returned from NextAuth.
 */
export interface MockSession {
  user: MockUser;
  expires: string;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a mock user object.
 */
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: MOCK_USER_ID,
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}

/**
 * Creates a mock session object.
 */
export function createMockSession(overrides?: Partial<MockSession>): MockSession {
  return {
    user: createMockUser(overrides?.user as Partial<MockUser>),
    expires: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
    ...overrides,
  };
}

/**
 * Creates an expired session for testing auth failures.
 */
export function createExpiredSession(): MockSession {
  return {
    user: createMockUser(),
    expires: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
  };
}

/**
 * Creates a session with a null user for testing auth edge cases.
 */
export function createNullUserSession(): { user: null; expires: string } {
  return {
    user: null,
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

/**
 * Default mock session for use in tests.
 */
export const mockSession: MockSession = createMockSession();

/**
 * Default mock user for use in tests.
 */
export const mockUser: MockUser = createMockUser();
