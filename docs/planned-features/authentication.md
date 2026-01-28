# Authentication System

> **PLANNED FEATURE - Not Yet Implemented**
>
> This document describes a proposed authentication system for the Kanban board application.
> The feature is currently in the design phase and has not been implemented.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication Approaches](#2-authentication-approaches)
3. [Recommended Approach](#3-recommended-approach)
4. [Proposed Type Definitions](#4-proposed-type-definitions)
5. [Protected Routes Design](#5-protected-routes-design)
6. [Session Management](#6-session-management)
7. [Multi-User Task Ownership](#7-multi-user-task-ownership)
8. [Implementation Phases](#8-implementation-phases)
9. [Security Considerations](#9-security-considerations)

---

## 1. Overview

### Current State

The Kanban board currently operates as a single-user, client-side application with localStorage persistence. There is no authentication, and all data is stored locally in the browser.

### Proposed State

Implement a robust authentication system that enables:

- User registration and login
- Secure session management
- Multi-user support with task ownership
- Protected routes requiring authentication
- Future collaboration features

---

## 2. Authentication Approaches

### 2.1 Option A: NextAuth.js (Auth.js)

**Description:** NextAuth.js is a complete open-source authentication solution designed for Next.js applications.

| Pros | Cons |
|------|------|
| Native Next.js integration | More configuration required |
| Multiple providers (OAuth, email, credentials) | Self-hosted, requires database setup |
| Open source, no vendor lock-in | Session management complexity |
| Built-in CSRF protection | Learning curve for advanced features |
| App Router support | |

**Estimated Setup Time:** 2-3 days

### 2.2 Option B: Clerk

**Description:** Clerk is a complete user management platform with drop-in authentication components.

| Pros | Cons |
|------|------|
| Pre-built UI components | Vendor lock-in |
| Minimal configuration | Monthly costs at scale |
| Built-in user management dashboard | Less customization flexibility |
| Excellent DX with React hooks | Data stored on Clerk servers |
| Handles edge cases automatically | |

**Estimated Setup Time:** 1 day

### 2.3 Option C: Custom JWT Implementation

**Description:** Build a custom authentication system using JSON Web Tokens.

| Pros | Cons |
|------|------|
| Full control over implementation | Significant development time |
| No external dependencies | Security risks if not done correctly |
| No vendor costs | Must handle all edge cases |
| Maximum flexibility | Ongoing maintenance burden |
| | No pre-built UI components |

**Estimated Setup Time:** 1-2 weeks

---

## 3. Recommended Approach

### Recommendation: NextAuth.js (Auth.js)

**Justification:**

1. **Native Next.js Integration:** NextAuth.js is built specifically for Next.js and supports the App Router architecture used in this project.

2. **Flexibility:** Supports multiple authentication strategies (OAuth providers, credentials, magic links) allowing future expansion.

3. **No Vendor Lock-in:** Open source with self-hosted data, aligning with the project's use of localStorage for user data sovereignty.

4. **Security:** Battle-tested with built-in CSRF protection, secure cookie handling, and JWT/database session options.

5. **Community:** Large community, extensive documentation, and active maintenance.

6. **Cost:** Free and open source with no per-user pricing.

### Proposed Provider Configuration

```typescript
// auth.ts (proposed)
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        // Validate credentials against database
        // Return user object or null
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
});
```

---

## 4. Proposed Type Definitions

### 4.1 User Types

```typescript
// types/auth.ts (proposed)

/**
 * Core user entity stored in database
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Session user with minimal data for client-side use
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

/**
 * Extended session type including user ID
 */
export interface AuthSession {
  user: SessionUser;
  expires: string;
}

/**
 * Authentication state for client components
 */
export interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Credentials for email/password authentication
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data for new users
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
}
```

### 4.2 Extended Task Type

```typescript
// types/index.ts (proposed extension)

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  columnId: ColumnId;
  createdAt: string;
  updatedAt: string;

  // New authentication-related fields
  ownerId: string;           // User who created the task
  assigneeId?: string;       // User assigned to the task (optional)
  collaboratorIds?: string[]; // Users who can view/edit (future)
}
```

---

## 5. Protected Routes Design

### 5.1 Middleware-Based Protection

```typescript
// middleware.ts (proposed)
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isPublicPage = req.nextUrl.pathname === '/';

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/board', req.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 5.2 Route Structure

```
src/app/
├── page.tsx                    # Public landing page
├── auth/
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── register/
│   │   └── page.tsx            # Registration page
│   └── error/
│       └── page.tsx            # Auth error page
├── board/
│   └── page.tsx                # Protected Kanban board
├── settings/
│   └── page.tsx                # Protected user settings
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts        # NextAuth API routes
```

### 5.3 Server Component Protection

```typescript
// app/board/page.tsx (proposed)
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { KanbanBoard } from '@/features/kanban/KanbanBoard';

export default async function BoardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return <KanbanBoard userId={session.user.id} />;
}
```

---

## 6. Session Management

### 6.1 Session Strategy

**Recommended:** JWT-based sessions with secure HTTP-only cookies.

```typescript
// auth.ts session configuration (proposed)
export const { handlers, auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'kanban-session',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
});
```

### 6.2 Client-Side Session Hook

```typescript
// hooks/useAuth.ts (proposed)
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { AuthState, SessionUser } from '@/types/auth';

export function useAuth(): AuthState & {
  signIn: typeof signIn;
  signOut: typeof signOut;
} {
  const { data: session, status } = useSession();

  return {
    user: session?.user as SessionUser | null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    signIn,
    signOut,
  };
}
```

### 6.3 Session Provider Setup

```typescript
// components/providers/AuthProvider.tsx (proposed)
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      {children}
    </SessionProvider>
  );
}
```

---

## 7. Multi-User Task Ownership

### 7.1 Data Model Changes

With authentication, tasks need to be associated with users:

```typescript
// Extended Task interface
interface Task {
  // ... existing fields
  ownerId: string;      // Required: creator of the task
  assigneeId?: string;  // Optional: assigned user
}
```

### 7.2 Database Schema (Proposed)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  password_hash VARCHAR(255), -- For credentials auth
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table with user relationship
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  priority VARCHAR(10) NOT NULL,
  column_id VARCHAR(20) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tags as separate table for normalization
CREATE TABLE task_tags (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  tag VARCHAR(30) NOT NULL,
  PRIMARY KEY (task_id, tag)
);

-- Indexes for common queries
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_column ON tasks(column_id);
```

### 7.3 Updated useKanban Hook

```typescript
// hooks/useKanban.ts (proposed changes)
interface UseKanbanReturn {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;

  // Updated to include ownership
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newColumnId: ColumnId) => Promise<void>;

  // New user-specific queries
  getMyTasks: () => Task[];
  getAssignedTasks: () => Task[];
}

export function useKanban(userId: string): UseKanbanReturn {
  // Implementation would fetch from API instead of localStorage
  // Filter tasks by ownerId or assigneeId
}
```

### 7.4 Authorization Rules

| Action | Owner | Assignee | Other Users |
|--------|-------|----------|-------------|
| View task | Yes | Yes | No (unless shared) |
| Edit task | Yes | Yes | No |
| Delete task | Yes | No | No |
| Change assignee | Yes | No | No |
| Move task | Yes | Yes | No |

---

## 8. Implementation Phases

### Phase 1: Core Authentication (Week 1)

**Goals:**
- Set up NextAuth.js with App Router
- Implement GitHub OAuth provider
- Create login/register pages
- Add session provider to layout
- Implement middleware for route protection

**Deliverables:**
- [ ] NextAuth.js configuration
- [ ] OAuth provider setup (GitHub)
- [ ] Auth pages with glassmorphic styling
- [ ] Protected route middleware
- [ ] Session provider integration

### Phase 2: Database Integration (Week 2)

**Goals:**
- Set up database (PostgreSQL recommended)
- Create user and task schemas
- Migrate from localStorage to database
- Implement API routes for task CRUD

**Deliverables:**
- [ ] Database schema and migrations
- [ ] Prisma ORM setup (or alternative)
- [ ] API routes for tasks
- [ ] Updated useKanban hook with API calls
- [ ] Data migration utility

### Phase 3: User Management (Week 3)

**Goals:**
- Add credentials-based authentication
- Implement user profile page
- Add password reset functionality
- Create account settings page

**Deliverables:**
- [ ] Credentials provider configuration
- [ ] User profile component
- [ ] Password reset flow
- [ ] Account settings page
- [ ] Email verification (optional)

### Phase 4: Multi-User Features (Week 4)

**Goals:**
- Implement task ownership
- Add task assignment feature
- Create user search/selection component
- Add activity logging

**Deliverables:**
- [ ] Task ownership enforcement
- [ ] Assignee selection UI
- [ ] User search component
- [ ] Activity/audit log
- [ ] Permission checks throughout

---

## 9. Security Considerations

### 9.1 Authentication Security

| Concern | Mitigation |
|---------|------------|
| Password storage | Use bcrypt with cost factor 12+ |
| Session hijacking | HTTP-only cookies, secure flag in production |
| CSRF attacks | NextAuth.js built-in CSRF protection |
| Brute force | Rate limiting on login endpoint |
| Token exposure | Short-lived JWTs, secure refresh flow |

### 9.2 Authorization Security

| Concern | Mitigation |
|---------|------------|
| Unauthorized access | Verify ownership on all task operations |
| Privilege escalation | Role-based access control (future) |
| Data leakage | Filter queries by user ID at database level |
| API abuse | Input validation, rate limiting |

### 9.3 Data Protection

| Concern | Mitigation |
|---------|------------|
| Data in transit | HTTPS only, TLS 1.3 |
| Data at rest | Database encryption |
| PII exposure | Minimal session data, no sensitive logging |
| XSS attacks | Existing sanitization + CSP headers |

### 9.4 Security Headers (Proposed)

```typescript
// next.config.js (proposed additions)
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  },
];
```

### 9.5 Environment Variables

```bash
# .env.local (proposed - NEVER commit actual values)

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# OAuth Providers
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kanban
```

---

## References

- [NextAuth.js Documentation](https://authjs.dev/)
- [Next.js Authentication Guide](https://nextjs.org/docs/app/building-your-application/authentication)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Document Status:** Proposed Design
**Last Updated:** January 2026
**Author:** Development Team
