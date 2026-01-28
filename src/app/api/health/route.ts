import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Health Check API Endpoint
 *
 * Used by Docker health checks and load balancers to verify application status.
 * Performs database connectivity validation to ensure the full stack is operational.
 *
 * @returns {NextResponse} JSON response with health status and database connectivity
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Validate database connectivity with a simple query
    await prisma.$queryRaw`SELECT 1`;

    const healthCheck = {
      status: 'healthy',
      db: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    // Log detailed error server-side only
    console.error('Health check database error:', error);

    // Return generic error message to prevent XSS and information disclosure
    const healthCheck = {
      status: 'unhealthy',
      db: 'disconnected',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(healthCheck, { status: 503 });
  }
}

/**
 * HEAD request support for lightweight health checks
 * Some load balancers prefer HEAD requests to minimize bandwidth
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}
