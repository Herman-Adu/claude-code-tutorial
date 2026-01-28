# Kanban Board - Project Setup Guide

This guide covers everything you need to get the Kanban Board application up and running on your local development machine.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Development Commands](#development-commands)
- [Build and Deployment](#build-and-deployment)
- [Environment Setup](#environment-setup)
- [Dependencies](#dependencies)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

| Requirement | Minimum Version | Recommended Version | Check Command    |
| ----------- | --------------- | ------------------- | ---------------- |
| Node.js     | 18.17.0         | 20.x or later       | `node --version` |
| npm         | 9.x             | 10.x or later       | `npm --version`  |

### Why These Versions?

- **Node.js 18.17+**: Required by Next.js 16 for its native fetch API and modern JavaScript features.
- **npm 10+**: Recommended for improved performance and better dependency resolution with the new lockfile format.

### Optional Tools

- **Git**: For version control (`git --version`)
- **VS Code**: Recommended IDE with excellent TypeScript support
- **React Developer Tools**: Browser extension for debugging React applications

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd kanban-board
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies listed in `package.json`.

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
kanban-board/
├── docs/                    # Documentation files
├── plans/                   # Implementation plans and specs
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css      # Global styles & CSS variables
│   │   ├── layout.tsx       # Root layout with fonts
│   │   └── page.tsx         # Main page component
│   ├── components/
│   │   └── ui/              # Reusable UI primitives
│   │       ├── Badge.tsx    # Badge component
│   │       ├── Button.tsx   # Button component
│   │       └── Modal.tsx    # Modal dialog component
│   ├── constants/
│   │   └── index.ts         # App constants (columns, colors, keys)
│   ├── features/
│   │   └── kanban/          # Kanban feature components
│   │       ├── KanbanBoard.tsx   # Main board orchestrator
│   │       ├── KanbanColumn.tsx  # Column container
│   │       ├── TaskCard.tsx      # Draggable task card
│   │       └── TaskForm.tsx      # Task create/edit form
│   ├── hooks/
│   │   ├── useKanban.ts     # Task CRUD operations
│   │   └── useLocalStorage.ts  # LocalStorage persistence
│   ├── lib/
│   │   └── utils.ts         # Utility functions
│   └── types/
│       └── index.ts         # TypeScript type definitions
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

### Directory Purposes

| Directory            | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `src/app/`           | Next.js App Router pages and layouts              |
| `src/components/ui/` | Generic, reusable UI components                   |
| `src/features/`      | Feature-specific components (organized by domain) |
| `src/hooks/`         | Custom React hooks for state and logic            |
| `src/lib/`           | Utility functions and helpers                     |
| `src/types/`         | TypeScript type definitions                       |
| `src/constants/`     | Application constants and configuration           |

---

## Development Commands

### Available Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Create production build                  |
| `npm run start` | Start production server                  |
| `npm run lint`  | Run ESLint for code quality              |

### Development Server

```bash
npm run dev
```

- Starts the Next.js development server on port 3000
- Enables Fast Refresh for instant feedback on code changes
- Shows detailed error overlays in the browser
- TypeScript errors are displayed in the terminal

### Linting

```bash
npm run lint
```

- Uses ESLint with Next.js recommended configuration
- Runs TypeScript type checking
- Catches common React and accessibility issues

---

## Build and Deployment

### Creating a Production Build

```bash
npm run build
```

This command:

1. Compiles TypeScript to JavaScript
2. Optimizes and bundles the application
3. Generates static pages where possible
4. Creates the `.next/` build output directory

### Running Production Build Locally

```bash
npm run build
npm run start
```

This simulates the production environment locally for testing.

### Deployment Options

#### Vercel (Recommended)

The easiest way to deploy a Next.js application:

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the repository in [Vercel](https://vercel.com)
3. Vercel automatically detects Next.js and configures the build

#### Self-Hosted

For self-hosted deployments:

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

Configure your reverse proxy (nginx, Apache) to proxy requests to port 3000.

#### Static Export

If you need a fully static site (no server required), you can configure Next.js for static export in `next.config.ts`:

```typescript
const nextConfig = {
  output: "export",
};
```

Then run `npm run build` to generate static files in the `out/` directory.

---

## Environment Setup

### TypeScript Configuration

The project uses TypeScript with strict mode enabled. Key settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Path Aliases

The `@/` alias is configured for clean imports:

```typescript
// Instead of:
import { Task } from "../../../types";

// Use:
import { Task } from "@/types";
```

### CSS Configuration

The project uses Tailwind CSS v4 with PostCSS. The configuration is in `postcss.config.mjs`:

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Global styles and CSS variables are defined in `src/app/globals.css`.

---

## Dependencies

### Core Dependencies

| Package     | Version | Purpose                         |
| ----------- | ------- | ------------------------------- |
| `next`      | 16.1.2  | React framework with App Router |
| `react`     | 19.2.3  | UI library                      |
| `react-dom` | 19.2.3  | React DOM renderer              |

### Drag and Drop

| Package              | Version | Purpose                          |
| -------------------- | ------- | -------------------------------- |
| `@dnd-kit/core`      | ^6.3.1  | Core drag and drop functionality |
| `@dnd-kit/sortable`  | ^10.0.0 | Sortable lists and grids         |
| `@dnd-kit/utilities` | ^3.2.2  | Utility functions for dnd-kit    |

**Why @dnd-kit?**

- Modern, accessible drag and drop library
- Built for React with hooks-based API
- Excellent TypeScript support
- Supports keyboard navigation and screen readers
- Lightweight and performant

**Example Usage:**

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function Board() {
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {/* Draggable items */}
      </SortableContext>
    </DndContext>
  );
}
```

### Styling

| Package                | Version | Purpose                     |
| ---------------------- | ------- | --------------------------- |
| `tailwindcss`          | ^4      | Utility-first CSS framework |
| `@tailwindcss/postcss` | ^4      | PostCSS plugin for Tailwind |

**Why Tailwind CSS v4?**

- Zero-config setup with CSS-first approach
- Automatic content detection (no `content` configuration needed)
- Native CSS cascade layers for better style organization
- Improved performance with Lightning CSS

**Glassmorphic Design System:**

The project implements a custom glassmorphic design using CSS variables:

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(255, 255, 255, 0.35);
  --glass-blur: blur(16px);
  --glass-shadow: 0 8px 32px rgba(100, 100, 140, 0.12);
}
```

### Development Dependencies

| Package              | Version | Purpose                      |
| -------------------- | ------- | ---------------------------- |
| `typescript`         | ^5      | Static type checking         |
| `@types/node`        | ^20     | Node.js type definitions     |
| `@types/react`       | ^19     | React type definitions       |
| `@types/react-dom`   | ^19     | React DOM type definitions   |
| `eslint`             | ^9      | Code linting                 |
| `eslint-config-next` | 16.1.2  | Next.js ESLint configuration |

### Fonts

The application uses the Geist font family (loaded via `next/font/google`):

- **Geist Sans**: Primary font for UI text
- **Geist Mono**: Monospace font for code elements

```typescript
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

---

## Troubleshooting

### Common Issues

#### Port 3000 Already in Use

```bash
# Find the process using port 3000
lsof -i :3000

# Or use a different port
npm run dev -- -p 3001
```

#### Node Version Mismatch

If you see errors about Node.js version:

```bash
# Check your version
node --version

# Use nvm to switch versions
nvm use 20
```

#### TypeScript Errors After Package Update

```bash
# Clear the TypeScript cache
rm -rf .next
npm run dev
```

#### Hydration Mismatch Errors

This project handles SSR hydration carefully. If you see hydration errors:

1. Ensure you are not accessing `window` or `localStorage` during server rendering
2. Use the `isHydrated` flag from `useLocalStorage` to conditionally render client-only content

---

## Next Steps

- Read the [Storage Layer Documentation](./storage-layer) to understand data persistence
- Review the implementation plan in `plans/KANBAN_IMPLEMENTATION_PLAN.md`
- Explore the codebase starting from `src/app/page.tsx`
