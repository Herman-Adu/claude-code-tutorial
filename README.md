# Kanban Board

A modern, responsive Kanban board application for task management built with Next.js, React, and TypeScript. Features a beautiful glassmorphic UI design, drag-and-drop functionality, and local storage persistence.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.x-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED)

---

## Screenshots

<!-- Add screenshots of your application here -->

| Desktop View | Mobile View |
|:------------:|:-----------:|
| ![Desktop Screenshot](docs/images/desktop-placeholder.png) | ![Mobile Screenshot](docs/images/mobile-placeholder.png) |

> **Note**: Replace placeholder images with actual screenshots of the application.

---

## Features

### Implemented

| Feature | Description |
|---------|-------------|
| **Task Management** | Create, read, update, and delete tasks with full CRUD operations |
| **Drag and Drop** | Intuitive task reordering within and between columns using @dnd-kit |
| **Three-Column Board** | Organize tasks into To-Do, In Progress, and Completed columns |
| **Priority Levels** | Assign Low, Medium, or High priority with visual color coding |
| **Tag Support** | Categorize tasks with multiple tags |
| **Data Persistence** | Automatic saving to browser localStorage |
| **Glassmorphic UI** | Beautiful frosted glass design with pastel color palette |
| **Responsive Design** | Optimized for desktop, tablet, and mobile devices |
| **Accessibility** | WCAG 2.1 AA compliant with ARIA labels, focus trapping, and keyboard navigation |
| **XSS Protection** | Input sanitization to prevent cross-site scripting attacks |

### Planned

| Feature | Priority |
|---------|----------|
| Due Dates | High |
| Search and Filter | High |
| Task Sorting | Medium |
| Undo/Redo | Medium |
| Bulk Operations | Medium |
| Export/Import | Low |
| Keyboard Shortcuts | Low |
| Statistics Dashboard | Low |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Drag and Drop** | [@dnd-kit](https://dndkit.com/) (core, sortable, utilities) |
| **Fonts** | [Geist](https://vercel.com/font) (Sans & Mono) |
| **Database** | [PostgreSQL 16](https://www.postgresql.org/) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Containerization** | [Docker](https://www.docker.com/) |

---

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun
- Docker and Docker Compose (for PostgreSQL)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/kanban-board.git
   cd kanban-board
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env if you need to customize database credentials
   ```

4. **Start PostgreSQL with Docker**

   ```bash
   npm run docker:up
   ```

5. **Run database migrations**

   ```bash
   npm run db:migrate
   ```

6. **Seed the database (optional)**

   ```bash
   npm run db:seed
   ```

7. **Start the development server**

   ```bash
   npm run dev
   ```

8. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Docker Deployment

The application is fully containerized and can be run entirely in Docker for both development and production environments.

### Architecture Overview

```
                    +-------------------+
                    |   Docker Host     |
                    +-------------------+
                            |
            +---------------+---------------+
            |                               |
    +-------v-------+               +-------v-------+
    |   Next.js     |               |  PostgreSQL   |
    |   Container   |<------------->|   Container   |
    |   (Port 3000) |   Internal    |  (Port 5432)  |
    +---------------+   Network     +---------------+
            |                               |
            v                               v
    +---------------+               +---------------+
    |  Host Port    |               |  Host Port    |
    |    3000       |               |    5434       |
    +---------------+               +---------------+
```

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (2.0+)

### Quick Start with Docker

**Option 1: Full Stack Development (Recommended)**

```bash
# Copy environment file
cp .env.docker.example .env

# Start both database and application in development mode
npm run docker:dev
```

**Option 2: Production Deployment**

```bash
# Copy and configure environment file
cp .env.docker.example .env
# Edit .env to set secure passwords

# Build and start production stack
npm run docker:prod:build
```

### Docker Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run docker:dev` | Start development environment with hot reload |
| `npm run docker:dev:build` | Rebuild and start development environment |
| `npm run docker:dev:detach` | Start development environment in background |
| `npm run docker:prod` | Start production environment (detached) |
| `npm run docker:prod:build` | Rebuild and start production environment |
| `npm run docker:build` | Build production Docker image |
| `npm run docker:stop` | Stop all containers |
| `npm run docker:clean` | Stop containers, remove volumes and images |
| `npm run docker:logs:app` | View Next.js application logs |
| `npm run docker:logs:all` | View all container logs |
| `npm run docker:shell` | Open shell in Next.js container |
| `npm run docker:db:migrate` | Run database migrations in container |
| `npm run docker:db:seed` | Seed database in container |

### Development with Docker

Development mode provides:
- Hot reload for source code changes
- Source code mounted as volumes
- Debugging port exposed (9229)
- Development environment variables

```bash
# Start development stack
npm run docker:dev

# In another terminal, watch logs
npm run docker:logs:all

# Run database migrations
npm run docker:db:migrate

# Seed database with sample data
npm run docker:db:seed
```

Access the application at [http://localhost:3000](http://localhost:3000)

### Production with Docker

Production mode provides:
- Optimized multi-stage build
- Minimal image size
- Non-root user for security
- Health checks for both services
- Resource limits
- Automatic restart policies
- JSON file logging with rotation

```bash
# Build and start production stack
npm run docker:prod:build

# Check container health
docker compose ps

# View logs
npm run docker:logs:all
```

### Environment Variables for Docker

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `kanban` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `kanban_secret` |
| `POSTGRES_DB` | Database name | `kanban_db` |
| `POSTGRES_PORT` | Host port for PostgreSQL | `5434` |
| `APP_PORT` | Host port for application | `3000` |
| `NODE_ENV` | Node environment | `production` |

> **Security Note**: In production, always change `POSTGRES_PASSWORD` to a secure value.

### Docker File Structure

```
.
├── Dockerfile              # Multi-stage production build
├── Dockerfile.dev          # Development build with hot reload
├── docker-compose.yml      # Base configuration
├── docker-compose.dev.yml  # Development overrides
├── docker-compose.prod.yml # Production overrides
├── .dockerignore           # Files excluded from build context
└── .env.docker.example     # Example environment variables
```

### Troubleshooting Docker

**Container won't start**
```bash
# Check container logs
docker compose logs nextjs
docker compose logs postgres

# Check container status
docker compose ps
```

**Database connection issues**
```bash
# Verify PostgreSQL is healthy
docker compose exec postgres pg_isready -U kanban

# Check network connectivity
docker compose exec nextjs ping postgres
```

**Permission issues**
```bash
# Reset volumes
npm run docker:clean
npm run docker:dev:build
```

**Build cache issues**
```bash
# Rebuild without cache
docker compose build --no-cache
```

**Hot reload not working (development)**
```bash
# Ensure WATCHPACK_POLLING is set
# Check docker-compose.dev.yml for proper volume mounts
# Restart containers
npm run docker:stop && npm run docker:dev
```

### Rate Limiting

**Current Implementation:** In-memory rate limiting

The application includes rate limiting for:
- **Label Creation:** 10 labels/hour per user
- **Search Operations:** 20 searches/minute per user

**Important:** This in-memory implementation works only on single-instance deployments.

For multi-instance (load-balanced) deployments, you must migrate to Redis-based rate limiting.

**Migration Steps:**
1. Install Redis client: `npm install @upstash/redis` or `npm install ioredis`
2. Set environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Update rate limiting in:
   - `src/app/actions/labels.ts`
   - `src/app/actions/tasks.ts`

See [Performance and Maintainability Review](docs/reviews/PERFORMANCE_MAINTAINABILITY_REVIEW.md) for technical details.

---

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/
│   │   └── health/           # Health check endpoint for Docker
│   ├── globals.css           # Global styles, CSS variables, glassmorphic utilities
│   ├── layout.tsx            # Root layout with Geist fonts
│   └── page.tsx              # Main page rendering KanbanBoard
│
├── components/
│   └── ui/                   # Reusable UI primitives
│       ├── Badge.tsx         # Priority and tag badges
│       ├── Button.tsx        # Button component with variants
│       └── Modal.tsx         # Accessible modal with focus trap
│
├── features/
│   └── kanban/               # Kanban feature components
│       ├── KanbanBoard.tsx   # Main board orchestrator
│       ├── KanbanColumn.tsx  # Column container with drop zone
│       ├── TaskCard.tsx      # Draggable task card
│       └── TaskForm.tsx      # Create/edit task form
│
├── constants/
│   └── index.ts              # Column definitions, priority colors, storage keys
│
├── hooks/
│   ├── useKanban.ts          # Task CRUD operations and state management
│   └── useLocalStorage.ts    # localStorage persistence with SSR handling
│
├── lib/
│   └── utils.ts              # Utilities (ID generation, sanitization, validation)
│
└── types/
    └── index.ts              # TypeScript type definitions
```

---

## Available Scripts

### Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality checks |

### Database Scripts

| Script | Description |
|--------|-------------|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Create and apply database migrations |
| `npm run db:migrate:deploy` | Apply migrations in production |
| `npm run db:push` | Push schema changes without migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database and reapply migrations |

### Docker Scripts

| Script | Description |
|--------|-------------|
| `npm run docker:up` | Start PostgreSQL container only |
| `npm run docker:down` | Stop PostgreSQL container |
| `npm run docker:logs` | View PostgreSQL container logs |
| `npm run docker:dev` | Start full development stack |
| `npm run docker:dev:build` | Rebuild and start development stack |
| `npm run docker:prod` | Start full production stack |
| `npm run docker:prod:build` | Rebuild and start production stack |
| `npm run docker:build` | Build production Docker image |
| `npm run docker:stop` | Stop all Docker containers |
| `npm run docker:clean` | Remove containers, volumes, and images |

---

## Database Setup

### PostgreSQL with Docker

The application uses PostgreSQL 16 for data persistence, managed via Docker Compose.

#### Starting the Database

```bash
# Start PostgreSQL container in background
npm run docker:up

# View container logs
npm run docker:logs

# Stop the container
npm run docker:down
```

#### Environment Variables

Configure the database connection in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma connection string | `postgresql://kanban:kanban_secret@localhost:5434/kanban_db?schema=public` |
| `POSTGRES_USER` | PostgreSQL username | `kanban` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `kanban_secret` |
| `POSTGRES_DB` | Database name | `kanban_db` |
| `POSTGRES_PORT` | Port to expose | `5434` |

#### Database Migrations

```bash
# Create a new migration after schema changes
npm run db:migrate

# Apply pending migrations (production)
npm run db:migrate:deploy

# Reset database (WARNING: destroys all data)
npm run db:reset
```

#### Seeding Data

The seed script populates the database with sample tasks:

```bash
npm run db:seed
```

#### Prisma Studio

Explore and edit data with the Prisma Studio GUI:

```bash
npm run db:studio
```

This opens a browser interface at http://localhost:5555

### Database Schema

The application uses a single `tasks` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `title` | VARCHAR(100) | Task title |
| `description` | VARCHAR(500) | Task description |
| `priority` | ENUM | LOW, MEDIUM, HIGH |
| `tags` | JSONB | Array of tag strings |
| `columnId` | ENUM | TODO, IN_PROGRESS, COMPLETED |
| `categories` | JSONB | Array of category strings |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

Indexes are created on `columnId`, `priority`, and `created_at` for query performance.

---

## Documentation

All documentation is organized in the [`docs/`](docs/README.md) directory:

| Category | Documents |
|----------|-----------|
| **Getting Started** | [Project Setup](docs/getting-started/project-setup.md) |
| **Architecture** | [Overview](docs/architecture/overview.md) &#124; [Database Schema](docs/architecture/database-schema.md) &#124; [Storage Layer](docs/architecture/storage-layer.md) &#124; [Technical Decisions](docs/architecture/technical-decisions.md) |
| **Components** | [UI Components](docs/components/ui-components.md) &#124; [Feature Components](docs/components/feature-components.md) &#124; [Kanban Board](docs/components/kanban-board.md) |
| **API Reference** | [API & Actions](docs/api/api-and-actions.md) &#124; [Types & Constants](docs/api/types-and-constants.md) |
| **Guides** | [Testing & Verification](docs/guides/testing-verification.md) |
| **Planned Features** | [Authentication](docs/planned-features/authentication.md) &#124; [Calendar View](docs/planned-features/calendar-view.md) &#124; [Filtering](docs/planned-features/filtering-system.md) |

### Implementation Plan

See [plans/KANBAN_IMPLEMENTATION_PLAN.md](plans/KANBAN_IMPLEMENTATION_PLAN.md) for the comprehensive implementation roadmap

---

## Architecture

### Component Hierarchy

```
KanbanBoard (Root)
├── Modal (Create/Edit Task Form)
├── Modal (Delete Confirmation)
├── DndContext (Drag & Drop Provider)
│   ├── KanbanColumn (To-Do)
│   │   └── TaskCard (×N)
│   ├── KanbanColumn (In Progress)
│   │   └── TaskCard (×N)
│   └── KanbanColumn (Completed)
│       └── TaskCard (×N)
└── DragOverlay (Visual feedback during drag)
```

### Data Flow

```
User Interaction
        ↓
KanbanBoard (Event Handlers)
        ↓
useKanban Hook (Business Logic + Sanitization)
        ↓
useLocalStorage Hook (Persistence)
        ↓
localStorage (JSON Storage)
        ↓
React Re-render (UI Update)
```

---

## Design System

### Color Palette

The application uses a glassmorphic design with pastel colors:

| Element | Color |
|---------|-------|
| To-Do Column | Sky Blue |
| In Progress Column | Peach/Amber |
| Completed Column | Mint Green |
| Low Priority | Emerald |
| Medium Priority | Amber |
| High Priority | Rose |

### Glassmorphic Effects

- Frosted glass backgrounds with blur effects
- Semi-transparent overlays
- Subtle shadows and borders
- Smooth transitions and animations

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**

2. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**

   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

4. **Commit your changes**

   ```bash
   git commit -m "Add: description of your changes"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**

### Code Style Guidelines

- Use TypeScript strict mode
- Follow the existing component patterns
- Write self-documenting code with meaningful names
- Add comments for complex logic
- Ensure accessibility compliance

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [@dnd-kit](https://dndkit.com/) - Modern drag and drop toolkit
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js and TypeScript
- [PostgreSQL](https://www.postgresql.org/) - Advanced open source relational database
- [Docker](https://www.docker.com/) - Containerization platform
- [Vercel](https://vercel.com/) - Platform for frontend frameworks

---

*Built with care and attention to detail.*
