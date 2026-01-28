# Documentation Index

This directory contains all documentation for the Kanban Board application.

---

## Getting Started

| Document | Description |
|----------|-------------|
| [Project Setup](getting-started/project-setup) | Prerequisites, installation, and development setup |

---

## Architecture

| Document | Description |
|----------|-------------|
| [Overview](architecture/overview) | System architecture, tech stack, file structure |
| [Database Schema](architecture/database-schema) | Data models, JSON storage format, limitations |
| [Storage Layer](architecture/storage-layer) | localStorage persistence, SSR hydration handling |
| [Technical Decisions](architecture/technical-decisions) | Architectural Decision Records (ADRs) |

---

## Components

| Document | Description |
|----------|-------------|
| [UI Components](components/ui-components) | Button, Badge, Modal - reusable primitives |
| [Feature Components](components/feature-components) | KanbanColumn, TaskCard, TaskForm |
| [Kanban Board](components/kanban-board) | Main orchestrator component documentation |

---

## API Reference

| Document | Description |
|----------|-------------|
| [API and Actions](api/api-and-actions) | useKanban hook, CRUD operations, data flow |
| [Types and Constants](api/types-and-constants) | TypeScript definitions, constants, validation |

---

## Guides

| Document | Description |
|----------|-------------|
| [Testing & Verification](guides/testing-verification) | Manual testing checklist, edge cases, success criteria |

---

## Planned Features

> These features are not yet implemented. Documents contain proposed designs and implementation plans.

| Document | Description |
|----------|-------------|
| [Authentication](planned-features/authentication) | User auth, session management, multi-user support |
| [Calendar View](planned-features/calendar-view) | Task calendar, due dates, scheduling |
| [Filtering System](planned-features/filtering-system) | Search, filters, sorting capabilities |

---

## Other Resources

| Document | Location | Description |
|----------|----------|-------------|
| [Implementation Plan](../plans/KANBAN_IMPLEMENTATION_PLAN) | `plans/` | Comprehensive implementation roadmap |
| [Original Specifications](../spec/kanban-implementation) | `spec/` | Original technical specifications (archived) |
