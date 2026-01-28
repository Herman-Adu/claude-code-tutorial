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

// Label Components
export { LabelManager } from './components/LabelManager';
export { LabelSelector } from './components/LabelSelector';
export { LabelFilter, filterTasksByLabels } from './components/LabelFilter';

// Search and Filter Components
export { SearchFilterBar } from './components/SearchFilterBar';
export { FilterPanel } from './components/FilterPanel';
export { FilterChips } from './components/FilterChips';
export { SavedFiltersDropdown } from './components/SavedFiltersDropdown';
export { SaveFilterModal } from './components/SaveFilterModal';

// Hooks
export { useKanban } from './hooks/useKanban';
export { useLabels, type Label } from './hooks/useLabels';
