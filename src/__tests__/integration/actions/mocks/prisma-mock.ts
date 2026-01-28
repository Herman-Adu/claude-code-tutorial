/**
 * Prisma Mock Setup
 *
 * Provides mock Prisma client for testing server actions in isolation.
 * Uses vitest-mock-extended for deep mocking of Prisma client methods.
 */

import { PrismaClient } from '@/generated/prisma/client';
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended';
import { vi } from 'vitest';

// Create deep mock of Prisma client
export type MockPrismaClient = DeepMockProxy<PrismaClient>;
export const prismaMock = mockDeep<PrismaClient>();

// Mock the prisma module to use our mock client
vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}));

// Mock next/cache revalidatePath to prevent errors in tests
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

/**
 * Resets all mock call history and implementations.
 * Call this in beforeEach to ensure clean test state.
 */
export const resetPrismaMock = () => {
  mockReset(prismaMock);
};
