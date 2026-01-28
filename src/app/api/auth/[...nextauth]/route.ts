/**
 * NextAuth.js API Route Handler
 *
 * This file exports the HTTP handlers for the authentication API routes.
 * NextAuth.js handles all authentication endpoints under /api/auth/*:
 *
 * - GET /api/auth/signin - Sign-in page
 * - POST /api/auth/signin/:provider - Start OAuth flow or credentials sign-in
 * - GET /api/auth/callback/:provider - OAuth callback
 * - GET /api/auth/signout - Sign-out page
 * - POST /api/auth/signout - Sign-out action
 * - GET /api/auth/session - Get current session
 * - GET /api/auth/csrf - Get CSRF token
 * - GET /api/auth/providers - List available providers
 */

export { GET, POST } from '@/lib/auth/auth';
