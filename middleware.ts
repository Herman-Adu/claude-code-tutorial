/**
 * Next.js Middleware for Route Protection and Security Headers
 *
 * This middleware integrates with NextAuth.js to protect routes,
 * handle authentication-related redirects, and add security headers.
 *
 * The middleware runs on the Edge runtime for optimal performance
 * and executes before every matched request.
 */

import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authConfig } from '@/lib/auth/auth.config';

/**
 * Initialize NextAuth middleware handler
 *
 * Uses the auth config (without providers that require Node.js runtime)
 * to enable the authorized callback for route protection.
 */
const { auth } = NextAuth(authConfig);

/**
 * Content Security Policy directive.
 *
 * This CSP configuration:
 * - default-src 'self': Only allow resources from the same origin by default
 * - script-src: Allow scripts from same origin, inline scripts (required for Next.js),
 *   and eval (required for some React development features)
 * - style-src: Allow styles from same origin and inline styles (required for CSS-in-JS)
 * - img-src: Allow images from same origin, data URIs, and HTTPS sources
 * - font-src: Allow fonts from same origin and data URIs
 * - connect-src: Allow connections to same origin
 * - frame-ancestors 'none': Prevent clickjacking by disallowing framing
 * - base-uri 'self': Restrict base URL to same origin
 * - form-action 'self': Restrict form submissions to same origin
 *
 * Note: 'unsafe-inline' and 'unsafe-eval' are needed for Next.js/React
 * but should be removed if using nonce-based CSP in production.
 */
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/**
 * Security headers to add to all responses.
 *
 * These headers provide defense-in-depth against common web vulnerabilities:
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking (backup for CSP frame-ancestors)
 * - X-XSS-Protection: Legacy XSS protection for older browsers
 * - Referrer-Policy: Controls referrer information leakage
 * - Permissions-Policy: Restricts access to browser features
 */
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP_HEADER,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Adds security headers to the response.
 *
 * @param response - The NextResponse object to add headers to
 * @returns The response with security headers added
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Combined middleware handler that:
 * 1. Runs NextAuth authentication checks
 * 2. Adds security headers to all responses
 *
 * The auth() function from NextAuth acts as middleware when called
 * without arguments. It uses the authorized callback defined in
 * auth.config.ts to determine if a request should be allowed.
 */
export default auth(function middleware(_request: NextRequest) {
  // _request is available for future use (e.g., logging, path-specific headers)
  // Currently we apply the same security headers to all requests

  // Create response (or get from auth if it returned one)
  const response = NextResponse.next();

  // Add security headers to all responses
  return addSecurityHeaders(response);
});

/**
 * Matcher configuration
 *
 * Specifies which routes the middleware should run on.
 * This configuration excludes static files, images, and API routes
 * that don't need authentication checks.
 *
 * Protected routes:
 * - /dashboard/* - User dashboard and related pages
 *
 * Auth routes (redirect if already logged in):
 * - /auth/* - Sign in, sign out, and other auth pages
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * - API routes that handle their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
