/**
 * Kanban Feature Module
 *
 * This module exports all components and hooks related to the Kanban board feature.
 * Using a barrel export pattern for cleaner imports.
 */

// Components
export { KanbanBoard } from './components/KanbanBoard';
export { KanbanColumn } from './components/KanbanColumn';
export { TaskCard, TaskCardOverlay } from './components/TaskCard';
export { TaskForm } from './components/TaskForm';

// Hooks
export { useKanban } from './hooks/useKanban';
