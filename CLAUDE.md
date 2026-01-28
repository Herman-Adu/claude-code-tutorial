# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kanban board application built with Next.js 16, React 19, TypeScript 5, PostgreSQL 16, and Prisma 7.3. Uses Zustand for state management and @dnd-kit for drag-and-drop.

## Commands

### Development
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
```

### Database
```bash
npm run db:migrate       # Create/apply migrations
npm run db:push          # Push schema changes (no migration)
npm run db:seed          # Seed sample data
npm run db:studio        # Prisma Studio GUI (localhost:5555)
npm run db:reset         # Reset database (destroys data)
```

### Docker
```bash
npm run docker:dev       # Full dev stack with hot reload
npm run docker:prod      # Production stack
npm run docker:stop      # Stop all containers
npm run docker:db:migrate # Run migrations in container
```

### Testing
```bash
npm run test             # Vitest watch mode
npm run test:run         # Single run
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright E2E tests
```

## Architecture

### 4-Layer Pattern
```
Presentation (React Components)
    ↓
Business Logic (useKanban hook + Zustand store)
    ↓
Persistence (Server Actions in app/actions/)
    ↓
Database (PostgreSQL via Prisma)
```

### Feature-Based Organization
```
src/
├── app/                    # Next.js App Router, server actions, API routes
├── components/ui/          # Reusable UI primitives (Button, Badge, Modal)
├── features/kanban/        # Kanban feature module
│   ├── components/         # KanbanBoard, KanbanColumn, TaskCard, TaskForm
│   ├── hooks/useKanban.ts  # Task CRUD and state logic
│   └── index.ts            # Barrel exports (public API)
├── store/kanban.ts         # Zustand store with optimistic updates
├── lib/                    # Utilities, auth config, DB setup
└── types/index.ts          # Type definitions with conversion utilities
```

### Import Patterns
```typescript
// Feature imports via barrel exports
import { KanbanBoard, useKanban } from '@/features/kanban'

// UI components directly
import { Button } from '@/components/ui/Button'

// Types
import { Task, Priority } from '@/types'
```

### Type Conventions
- Frontend uses lowercase enums: `priority: 'low' | 'medium' | 'high'`
- Database uses uppercase enums: `Priority.LOW | Priority.MEDIUM | Priority.HIGH`
- Conversion utilities in `src/types/index.ts` handle mapping

### Server Actions
Task CRUD operations are in `src/app/actions/tasks.ts`. All mutations go through server actions with:
- Zod validation
- Input sanitization
- Ownership verification

### State Management
Zustand store (`src/store/kanban.ts`) provides:
- Optimistic updates with auto-rollback on error
- Selector hooks for efficient re-renders

## Database

PostgreSQL with Prisma ORM. Schema in `prisma/schema.prisma`.

**Key models:** User, Account, Session, Task

**Enums:** `Priority` (LOW, MEDIUM, HIGH), `ColumnId` (TODO, IN_PROGRESS, COMPLETED)

Tasks are linked to users via `ownerId` foreign key.

## Environment Variables

Copy `.env.example` to `.env`:
```bash
DATABASE_URL=postgresql://kanban:kanban_secret@localhost:5434/kanban_db?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-min-32-chars>
```

## Testing

- Framework: Vitest with happy-dom
- Test files: `src/__tests__/`
- Setup: `tests/setup.ts` (mocks localStorage, Next.js navigation, server actions)
- Coverage: >80%
