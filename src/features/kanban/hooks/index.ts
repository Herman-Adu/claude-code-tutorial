/**
 * Kanban Hooks Module
 *
 * Exports all hooks related to the Kanban board feature.
 */

// Core hooks
export { useKanban } from './useKanban';
export { useLabels } from './useLabels';

// Board management hooks (extracted from KanbanBoard)
export { useFilterUrlSync } from './useFilterUrlSync';
export { useTaskFiltering, type TaskFilteringResult } from './useTaskFiltering';
export { useDragAndDrop, type DragAndDropResult } from './useDragAndDrop';
export { useModalState, type ModalStateResult } from './useModalState';
export { useTaskHandlers, type TaskHandlersResult, type TaskFormData } from './useTaskHandlers';
