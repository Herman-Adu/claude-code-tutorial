import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// ============================================================================
// Rate Limiting for Registration
// ============================================================================

/**
 * In-memory store for registration attempt tracking.
 * Tracks attempts per IP address to prevent registration abuse.
 *
 * Note: This is a simple in-memory implementation suitable for single-instance
 * deployments. For multi-instance/clustered deployments, use Redis or similar.
 */
const registrationAttempts = new Map<string, { count: number; resetTime: number }>();

/**
 * Maximum allowed registrations per IP within the rate limit window.
 */
const MAX_REGISTRATIONS_PER_IP = 5;

/**
 * Duration in milliseconds before the rate limit resets (1 hour).
 */
const REGISTRATION_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/**
 * Extracts the client IP address from request headers.
 * Checks common proxy headers in order of priority.
 *
 * @param request - The incoming Next.js request
 * @returns The client IP address or 'unknown' if not determinable
 */
function getClientIP(request: NextRequest): string {
  // Check common proxy headers (in order of priority)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs; take the first (original client)
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const clientIP = request.headers.get('x-client-ip');
  if (clientIP) {
    return clientIP.trim();
  }

  // Fallback - this should rarely happen behind a reverse proxy
  return 'unknown';
}

/**
 * Checks if a registration attempt should be allowed based on rate limiting.
 *
 * @param ip - The client IP address
 * @returns true if the registration is allowed, false if rate limited
 */
function checkRegistrationRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = registrationAttempts.get(ip);

  // No previous attempts or window has expired
  if (!attempts || now > attempts.resetTime) {
    registrationAttempts.set(ip, {
      count: 1,
      resetTime: now + REGISTRATION_RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  // Check if rate limit exceeded
  if (attempts.count >= MAX_REGISTRATIONS_PER_IP) {
    return false;
  }

  // Increment attempt counter
  attempts.count++;
  return true;
}

/**
 * Periodically cleans up expired rate limit entries to prevent memory leaks.
 * Runs every 10 minutes.
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of registrationAttempts.entries()) {
    if (now > attempts.resetTime) {
      registrationAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

/**
 * Validation schema for user registration.
 * Enforces email format, name length, and strong password requirements.
 */
const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must be less than 255 characters'),
});

/**
 * POST /api/auth/register
 * Registers a new user with email, name, and password.
 *
 * Request body:
 *   - email: string (valid email format)
 *   - name: string (1-100 characters)
 *   - password: string (8-255 characters)
 *
 * Returns:
 *   - 201: User created successfully
 *   - 400: Invalid input, email already registered, or database error
 *   - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit based on client IP
    const clientIP = getClientIP(request);
    if (!checkRegistrationRateLimit(clientIP)) {
      console.warn(`Registration rate limit exceeded for IP: ${clientIP.substring(0, 8)}***`);
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { email, name, password } = registerSchema.parse(body);

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }, // Only select id for efficiency
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered' },
        { status: 400 }
      );
    }

    // Hash password with bcryptjs (cost factor 12 provides good security/speed balance)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Return success response with user data (status 201 indicates resource created)
    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Log unexpected errors for debugging
    console.error('[register] Unexpected error:', error);

    // Return generic error response for unexpected errors
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET request handler that returns a method not allowed error.
 * Registration is only available via POST.
 */
export function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to register.' },
    { status: 405 }
  );
}
