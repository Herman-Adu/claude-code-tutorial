/**
 * Auth Mock Utilities
 *
 * Provides mock authentication functions for testing server actions.
 */

import { vi } from 'vitest';
import { createMockSession, createExpiredSession, createNullUserSession, MOCK_USER_ID } from '../factories/user';
import type { MockSession } from '../factories/user';

// ============================================================================
// Types
// ============================================================================

export type MockAuthFn = ReturnType<typeof vi.fn>;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a mock auth function that returns the specified session.
 */
export function createMockAuth(session: MockSession | null = createMockSession()): MockAuthFn {
  return vi.fn().mockResolvedValue(session);
}

/**
 * Creates a mock auth function that always returns an authenticated session.
 */
export function createAuthenticatedAuth(): MockAuthFn {
  return createMockAuth(createMockSession());
}

/**
 * Creates a mock auth function that always returns null (unauthenticated).
 */
export function createUnauthenticatedAuth(): MockAuthFn {
  return createMockAuth(null);
}

/**
 * Creates a mock auth function that returns an expired session.
 */
export function createExpiredAuth(): MockAuthFn {
  return createMockAuth(createExpiredSession() as MockSession);
}

/**
 * Creates a mock auth function that returns a session with null user.
 */
export function createNullUserAuth(): MockAuthFn {
  return vi.fn().mockResolvedValue(createNullUserSession());
}

// ============================================================================
// Auth Mock Setup Helpers
// ============================================================================

/**
 * Sets up the auth mock to return an authenticated session.
 * Use with vi.mock in test files.
 */
export function setupAuthenticatedMock(mockAuth: MockAuthFn): void {
  mockAuth.mockResolvedValue(createMockSession());
}

/**
 * Sets up the auth mock to return null (unauthenticated).
 */
export function setupUnauthenticatedMock(mockAuth: MockAuthFn): void {
  mockAuth.mockResolvedValue(null);
}

/**
 * Sets up the auth mock to return an expired session.
 */
export function setupExpiredSessionMock(mockAuth: MockAuthFn): void {
  mockAuth.mockResolvedValue(createExpiredSession());
}

/**
 * Sets up the auth mock to return a custom session.
 */
export function setupCustomSessionMock(mockAuth: MockAuthFn, session: MockSession | null): void {
  mockAuth.mockResolvedValue(session);
}

// ============================================================================
// Re-exports
// ============================================================================

export { MOCK_USER_ID, createMockSession, createExpiredSession };
