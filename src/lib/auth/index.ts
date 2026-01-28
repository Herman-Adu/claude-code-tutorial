/**
 * Authentication Module Barrel Export
 *
 * Re-exports all authentication-related functions and configurations
 * for convenient importing throughout the application.
 */

export { auth, signIn, signOut, GET, POST, getServerSession } from './auth';
export { authConfig } from './auth.config';
export { providers, providerMetadata } from './providers';
