/**
 * Prisma Client Singleton
 *
 * This module provides a singleton instance of the Prisma Client to prevent
 * multiple instances from being created during hot reloading in development.
 *
 * Prisma 7.x requires a driver adapter for database connections.
 *
 * Usage:
 *   import { prisma } from '@/lib/db/prisma';
 *   const tasks = await prisma.task.findMany();
 */

import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Extend the global type to include the Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

/**
 * Creates a connection pool for PostgreSQL.
 * The pool is reused across requests for efficiency.
 */
function getPool(): pg.Pool {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return globalForPrisma.pool;
}

/**
 * Creates a new PrismaClient instance with the PostgreSQL adapter.
 * Prisma 7.x requires an adapter for database connections.
 */
function createPrismaClient(): PrismaClient {
  const pool = getPool();
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

/**
 * Singleton Prisma Client instance
 *
 * In development, we attach the client to the global object to prevent
 * creating new instances on every hot reload. In production, we create
 * a fresh instance.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
