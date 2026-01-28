# Calendar View

> **PLANNED FEATURE - Not Yet Implemented**
>
> This document describes a proposed calendar view feature for the Kanban board application.
> The feature is currently in the design phase and has not been implemented.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Calendar View Concept](#2-calendar-view-concept)
3. [Proposed UI Design](#3-proposed-ui-design)
4. [Required Type Extensions](#4-required-type-extensions)
5. [Component Structure Proposal](#5-component-structure-proposal)
6. [Integration with Existing Kanban](#6-integration-with-existing-kanban)
7. [Library Recommendations](#7-library-recommendations)
8. [Implementation Phases](#8-implementation-phases)

---

## 1. Overview

### Current State

The Kanban board displays tasks organized by status columns (To-Do, In Progress, Completed). Tasks have creation and update timestamps but no due date functionality.

### Proposed State

Add a calendar view that allows users to:

- View tasks by due date on a calendar
- Switch between monthly and weekly views
- Drag tasks to reschedule them
- See task priority and status on the calendar
- Create tasks directly from calendar date cells

---

## 2. Calendar View Concept

### 2.1 View Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Monthly** | Traditional calendar grid showing full month | Overview planning, deadline visibility |
| **Weekly** | 7-day horizontal view with time slots | Detailed scheduling, daily planning |
| **Agenda** | List view of upcoming tasks by date | Quick review of deadlines |

### 2.2 Task Display on Calendar

Tasks will appear as colored event blocks on their due dates:

```
┌─────────────────────────────────────────────────────────────────────┐
│  January 2026                                          < Today >    │
├───────┬───────┬───────┬───────┬───────┬───────┬───────────────────┤
│  Sun  │  Mon  │  Tue  │  Wed  │  Thu  │  Fri  │  Sat              │
├───────┼───────┼───────┼───────┼───────┼───────┼───────────────────┤
│       │       │       │   1   │   2   │   3   │   4               │
│       │       │       │       │ ┌───┐ │       │                   │
│       │       │       │       │ │Hi │ │       │                   │
│       │       │       │       │ └───┘ │       │                   │
├───────┼───────┼───────┼───────┼───────┼───────┼───────────────────┤
│   5   │   6   │   7   │   8   │   9   │  10   │  11               │
│       │ ┌───┐ │       │ ┌───┐ │       │       │                   │
│       │ │Med│ │       │ │Lo │ │       │       │                   │
│       │ └───┘ │       │ └───┘ │       │       │                   │
│       │ ┌───┐ │       │       │       │       │                   │
│       │ │Hi │ │       │       │       │       │                   │
│       │ └───┘ │       │       │       │       │                   │
└───────┴───────┴───────┴───────┴───────┴───────┴───────────────────┘

Legend: Hi = High Priority (rose), Med = Medium Priority (amber), Lo = Low Priority (emerald)
```

### 2.3 Interaction Patterns

| Interaction | Behavior |
|-------------|----------|
| Click on task | Open task detail modal |
| Drag task to date | Update task due date |
| Click empty date cell | Open create task modal with date pre-filled |
| Double-click task | Open task edit modal |
| Hover on task | Show tooltip with full title and status |

---

## 3. Proposed UI Design

### 3.1 View Toggle

A view toggle component in the header allows switching between Kanban and Calendar views:

```typescript
// Proposed view toggle types
type ViewMode = 'kanban' | 'calendar';
type CalendarMode = 'month' | 'week' | 'agenda';
```

**Visual Design:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Task Flow                                                       │
│  Organize your tasks with ease                                   │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │ [Kanban] [Calendar] │  │ [Month] [Week] [Agenda]         │   │
│  └─────────────────────┘  └─────────────────────────────────┘   │
│   View Toggle               Calendar Mode (when calendar view)   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Monthly View Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ┌──────┐                  January 2026                   ┌──────┐   │
│  │  <   │                                                 │  >   │   │
│  └──────┘                                                 └──────┘   │
│                                                                       │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐   │
│  │  Sun   │  Mon   │  Tue   │  Wed   │  Thu   │  Fri   │  Sat   │   │
│  ├────────┼────────┼────────┼────────┼────────┼────────┼────────┤   │
│  │   28   │   29   │   30   │   31   │    1   │    2   │    3   │   │
│  │        │        │        │        │        │ ┌────┐ │        │   │
│  │        │        │        │        │        │ │Task│ │        │   │
│  │        │        │        │        │        │ └────┘ │        │   │
│  ├────────┼────────┼────────┼────────┼────────┼────────┼────────┤   │
│  │    4   │    5   │    6   │    7   │    8   │    9   │   10   │   │
│  │        │ ┌────┐ │        │        │ ┌────┐ │        │        │   │
│  │        │ │API │ │        │        │ │Fix │ │        │        │   │
│  │        │ └────┘ │        │        │ └────┘ │        │        │   │
│  │        │ ┌────┐ │        │        │        │        │        │   │
│  │        │ │UI  │ │        │        │        │        │        │   │
│  │        │ └────┘ │        │        │        │        │        │   │
│  │        │ +2more │        │        │        │        │        │   │
│  └────────┴────────┴────────┴────────┴────────┴────────┴────────┘   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 Weekly View Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ┌──────┐            Week of January 5, 2026              ┌──────┐   │
│  │  <   │                                                 │  >   │   │
│  └──────┘                                                 └──────┘   │
│                                                                       │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐   │
│  │Sun 5   │Mon 6   │Tue 7   │Wed 8   │Thu 9   │Fri 10  │Sat 11  │   │
│  ├────────┼────────┼────────┼────────┼────────┼────────┼────────┤   │
│  │        │┌──────┐│        │        │┌──────┐│        │        │   │
│  │        ││ API  ││        │        ││ Fix  ││        │        │   │
│  │        ││Design││        │        ││ Bug  ││        │        │   │
│  │        │├──────┤│        │        │└──────┘│        │        │   │
│  │        ││ UI   ││        │        │        │        │        │   │
│  │        ││Update││        │        │        │        │        │   │
│  │        │├──────┤│        │        │        │        │        │   │
│  │        ││Tests ││        │        │        │        │        │   │
│  │        │└──────┘│        │        │        │        │        │   │
│  │        │        │        │        │        │        │        │   │
│  └────────┴────────┴────────┴────────┴────────┴────────┴────────┘   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.4 Glassmorphic Calendar Styling

The calendar will use the existing glassmorphic design system:

```css
/* Calendar container */
.calendar-container {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
}

/* Calendar date cell */
.calendar-cell {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: background 0.2s ease;
}

.calendar-cell:hover {
  background: rgba(255, 255, 255, 0.5);
}

.calendar-cell.today {
  background: var(--glass-sky);
  border-color: rgba(56, 189, 248, 0.4);
}

/* Task event on calendar */
.calendar-event {
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.calendar-event:hover {
  transform: scale(1.02);
}

/* Priority-based colors */
.calendar-event.priority-high {
  background: rgba(244, 63, 94, 0.2);
  border-left: 3px solid rgb(244, 63, 94);
  color: rgb(159, 18, 57);
}

.calendar-event.priority-medium {
  background: rgba(245, 158, 11, 0.2);
  border-left: 3px solid rgb(245, 158, 11);
  color: rgb(146, 64, 14);
}

.calendar-event.priority-low {
  background: rgba(16, 185, 129, 0.2);
  border-left: 3px solid rgb(16, 185, 129);
  color: rgb(6, 95, 70);
}

/* Status indicators */
.calendar-event.status-completed {
  opacity: 0.6;
  text-decoration: line-through;
}
```

---

## 4. Required Type Extensions

### 4.1 Task Type Extension

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

  // New fields for calendar view
  dueDate?: string;        // ISO 8601 date string (e.g., "2026-01-15")
  dueTime?: string;        // Optional time (e.g., "14:30")
  reminderAt?: string;     // Optional reminder timestamp
  isAllDay?: boolean;      // True if no specific time
}
```

### 4.2 Calendar-Specific Types

```typescript
// types/calendar.ts (proposed)

/**
 * Calendar view mode
 */
export type CalendarMode = 'month' | 'week' | 'agenda';

/**
 * Calendar event representation of a task
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Task;  // Original task data
}

/**
 * Date range for calendar queries
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Calendar navigation state
 */
export interface CalendarState {
  currentDate: Date;
  mode: CalendarMode;
  selectedDate: Date | null;
}

/**
 * Calendar event slot info (for click handling)
 */
export interface SlotInfo {
  start: Date;
  end: Date;
  slots: Date[];
  action: 'select' | 'click' | 'doubleClick';
}
```

### 4.3 View State Types

```typescript
// types/view.ts (proposed)

/**
 * Application view mode
 */
export type ViewMode = 'kanban' | 'calendar';

/**
 * Combined view state
 */
export interface ViewState {
  mode: ViewMode;
  calendarMode: CalendarMode;
}
```

---

## 5. Component Structure Proposal

### 5.1 File Structure

```
src/
├── features/
│   ├── kanban/                    # Existing Kanban components
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── TaskCard.tsx
│   │   └── TaskForm.tsx
│   │
│   └── calendar/                  # New calendar components
│       ├── CalendarView.tsx       # Main calendar container
│       ├── CalendarHeader.tsx     # Navigation and mode toggle
│       ├── CalendarGrid.tsx       # Month/week grid
│       ├── CalendarEvent.tsx      # Task event component
│       ├── CalendarCell.tsx       # Individual date cell
│       ├── AgendaView.tsx         # Agenda list view
│       └── DatePicker.tsx         # Due date picker for forms
│
├── components/
│   └── ui/
│       └── ViewToggle.tsx         # Kanban/Calendar toggle
│
└── hooks/
    ├── useCalendar.ts             # Calendar state management
    └── useTasksByDate.ts          # Tasks filtered by date range
```

### 5.2 Component Hierarchy

```
App
└── BoardPage
    ├── ViewToggle                    # Switch between views
    │
    ├── [ViewMode === 'kanban']
    │   └── KanbanBoard               # Existing component
    │
    └── [ViewMode === 'calendar']
        └── CalendarView              # New calendar root
            ├── CalendarHeader
            │   ├── NavigationButtons
            │   ├── CurrentDateDisplay
            │   └── ModeToggle (month/week/agenda)
            │
            ├── [CalendarMode === 'month']
            │   └── CalendarGrid (month)
            │       └── CalendarCell (×35-42)
            │           └── CalendarEvent (×n)
            │
            ├── [CalendarMode === 'week']
            │   └── CalendarGrid (week)
            │       └── CalendarCell (×7)
            │           └── CalendarEvent (×n)
            │
            └── [CalendarMode === 'agenda']
                └── AgendaView
                    └── AgendaItem (×n)
```

### 5.3 Component Specifications

#### CalendarView.tsx

```typescript
// features/calendar/CalendarView.tsx (proposed)

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, newDate: Date) => void;
  onDateClick: (date: Date) => void;
}

/**
 * Main calendar view container.
 * Manages calendar state and renders appropriate view mode.
 */
export function CalendarView({
  tasks,
  onTaskClick,
  onTaskDrop,
  onDateClick,
}: CalendarViewProps): JSX.Element;
```

#### CalendarHeader.tsx

```typescript
// features/calendar/CalendarHeader.tsx (proposed)

interface CalendarHeaderProps {
  currentDate: Date;
  mode: CalendarMode;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onModeChange: (mode: CalendarMode) => void;
}

/**
 * Calendar navigation header with date display and mode toggle.
 */
export function CalendarHeader({
  currentDate,
  mode,
  onNavigate,
  onModeChange,
}: CalendarHeaderProps): JSX.Element;
```

#### CalendarEvent.tsx

```typescript
// features/calendar/CalendarEvent.tsx (proposed)

interface CalendarEventProps {
  task: Task;
  onClick: () => void;
  compact?: boolean;  // For overflow display
}

/**
 * Task displayed as calendar event.
 * Shows title, priority color, and status indicator.
 */
export function CalendarEvent({
  task,
  onClick,
  compact = false,
}: CalendarEventProps): JSX.Element;
```

---

## 6. Integration with Existing Kanban

### 6.1 Shared State Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BoardPage                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    useKanban()                            │   │
│  │  - tasks: Task[]                                          │   │
│  │  - addTask, updateTask, deleteTask, moveTask              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ tasks                             │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ViewToggle                             │   │
│  │  viewMode: 'kanban' | 'calendar'                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│              ┌───────────────┴───────────────┐                  │
│              │                               │                   │
│              ▼                               ▼                   │
│  ┌──────────────────────┐     ┌──────────────────────────┐      │
│  │    KanbanBoard       │     │    CalendarView          │      │
│  │  (existing)          │     │  (new)                   │      │
│  │                      │     │                          │      │
│  │  - Drag between      │     │  - View tasks by date    │      │
│  │    columns           │     │  - Drag to reschedule    │      │
│  │  - Edit/delete       │     │  - Edit/delete           │      │
│  └──────────────────────┘     └──────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Updated useKanban Hook

```typescript
// hooks/useKanban.ts (proposed additions)

interface UseKanbanReturn {
  // Existing methods
  tasks: Task[];
  isHydrated: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newColumnId: ColumnId, targetTaskId?: string) => void;
  getTasksByColumn: (columnId: ColumnId) => Task[];

  // New calendar-related methods
  updateTaskDueDate: (taskId: string, dueDate: string | null) => void;
  getTasksByDateRange: (start: Date, end: Date) => Task[];
  getTasksWithDueDate: () => Task[];
  getOverdueTasks: () => Task[];
}
```

### 6.3 TaskForm Enhancement

The existing TaskForm component will be extended with due date selection:

```typescript
// features/kanban/TaskForm.tsx (proposed additions)

interface TaskFormProps {
  initialData?: Task;
  defaultDueDate?: Date;  // Pre-fill when creating from calendar
  onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

// Form will include new fields:
// - Due date picker (optional)
// - Due time picker (optional, only if date selected)
// - All day toggle
```

### 6.4 Bidirectional Updates

Changes in either view are immediately reflected in the other:

| Action in Calendar | Effect in Kanban |
|-------------------|------------------|
| Drag task to new date | Task due date updated |
| Click and edit task | Task edited, Kanban reflects changes |
| Create task on date | New task appears in To-Do column |
| Mark complete | Task moves to Completed column |

| Action in Kanban | Effect in Calendar |
|-----------------|-------------------|
| Edit task, change due date | Task moves to new date |
| Delete task | Task removed from calendar |
| Move to Completed | Task shows completed styling |
| Add new task with due date | Task appears on calendar |

---

## 7. Library Recommendations

### 7.1 Primary Recommendation: react-big-calendar

**Version:** ^1.8.0

**Why react-big-calendar:**

| Feature | Benefit |
|---------|---------|
| Month, week, day, agenda views | All required views supported |
| Drag and drop | Built-in, configurable |
| Customizable styling | Works with our glassmorphic design |
| TypeScript support | Type definitions available |
| Active maintenance | Regular updates |
| Accessibility | ARIA attributes built-in |

**Installation:**

```bash
npm install react-big-calendar date-fns
# or
npm install react-big-calendar moment
```

**Basic Integration:**

```typescript
// features/calendar/CalendarView.tsx (proposed)
'use client';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, newDate: Date) => void;
  onDateClick: (date: Date) => void;
}

export function CalendarView({
  tasks,
  onTaskClick,
  onTaskDrop,
  onDateClick,
}: CalendarViewProps) {
  const events = tasks
    .filter((task) => task.dueDate)
    .map((task) => ({
      id: task.id,
      title: task.title,
      start: new Date(task.dueDate!),
      end: new Date(task.dueDate!),
      allDay: task.isAllDay ?? true,
      resource: task,
    }));

  return (
    <div className="glass-lg p-6 min-h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={(event) => onTaskClick(event.resource)}
        onSelectSlot={(slotInfo) => onDateClick(slotInfo.start)}
        selectable
        // Custom styling would be applied via CSS
      />
    </div>
  );
}
```

### 7.2 Alternative: FullCalendar

**Version:** ^6.1.0

**When to consider FullCalendar:**

- Need more advanced features (timeline view, resource scheduling)
- Willing to pay for premium plugins
- Need built-in printing support

**Comparison:**

| Feature | react-big-calendar | FullCalendar |
|---------|-------------------|--------------|
| Bundle size | ~50KB | ~100KB |
| Free features | All core features | Basic views only |
| Premium plugins | N/A | Available (paid) |
| React integration | Native | Via adapter |
| Learning curve | Moderate | Moderate |

### 7.3 Date Picker Recommendation: react-day-picker

**Version:** ^8.10.0

For the due date input in TaskForm:

```typescript
// components/ui/DatePicker.tsx (proposed)
'use client';

import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DatePicker({
  selected,
  onSelect,
  placeholder = 'Select due date',
}: DatePickerProps) {
  return (
    <div className="relative">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        className="glass-sm p-3"
        classNames={{
          day_selected: 'bg-sky-400 text-white',
          day_today: 'font-bold text-sky-600',
        }}
      />
    </div>
  );
}
```

---

## 8. Implementation Phases

### Phase 1: Type Extensions and Due Date Field (Week 1)

**Goals:**
- Extend Task type with due date fields
- Update TaskForm with date picker
- Add date display to TaskCard
- Implement useTasksByDate hook

**Deliverables:**
- [ ] Updated Task type definition
- [ ] DatePicker component
- [ ] TaskForm with due date input
- [ ] TaskCard due date display
- [ ] localStorage schema migration (if needed)

### Phase 2: Basic Calendar View (Week 2)

**Goals:**
- Install and configure react-big-calendar
- Create CalendarView component
- Implement view toggle (Kanban/Calendar)
- Basic monthly view with task events

**Deliverables:**
- [ ] react-big-calendar integration
- [ ] CalendarView component
- [ ] ViewToggle component
- [ ] Monthly view rendering tasks
- [ ] Glassmorphic calendar styling

### Phase 3: Calendar Interactions (Week 3)

**Goals:**
- Click on task to edit
- Click on date to create task
- Drag and drop to reschedule
- Implement weekly view

**Deliverables:**
- [ ] Task click handling
- [ ] Date click with pre-filled form
- [ ] Drag-to-reschedule functionality
- [ ] Weekly view implementation
- [ ] Event styling by priority/status

### Phase 4: Polish and Agenda View (Week 4)

**Goals:**
- Implement agenda view
- Add overdue task indicators
- Keyboard navigation
- Mobile responsiveness
- Performance optimization

**Deliverables:**
- [ ] AgendaView component
- [ ] Overdue styling and notifications
- [ ] Keyboard accessibility
- [ ] Responsive design for mobile
- [ ] Memoization and performance tuning

### Phase 5: Advanced Features (Future)

**Potential enhancements for later phases:**

- Recurring tasks
- Task reminders/notifications
- Calendar export (iCal format)
- Multi-day tasks
- Time blocking
- Integration with external calendars

---

## Performance Considerations

### Rendering Optimization

```typescript
// Memoize calendar events conversion
const events = useMemo(() => {
  return tasks
    .filter((task) => task.dueDate)
    .map((task) => ({
      id: task.id,
      title: task.title,
      start: new Date(task.dueDate!),
      end: new Date(task.dueDate!),
      allDay: task.isAllDay ?? true,
      resource: task,
    }));
}, [tasks]);

// Memoize event component
const EventComponent = memo(({ event }: { event: CalendarEvent }) => (
  <CalendarEvent task={event.resource} />
));
```

### Lazy Loading

```typescript
// Load calendar view only when needed
const CalendarView = lazy(() => import('@/features/calendar/CalendarView'));

// In BoardPage
{viewMode === 'calendar' && (
  <Suspense fallback={<CalendarSkeleton />}>
    <CalendarView tasks={tasks} />
  </Suspense>
)}
```

---

## Accessibility Considerations

- Calendar navigation via keyboard (arrow keys, Tab)
- Screen reader announcements for date changes
- ARIA labels for calendar cells and events
- Focus management when modal opens
- High contrast mode support
- Respect reduced motion preferences

---

**Document Status:** Proposed Design
**Last Updated:** January 2026
**Author:** Development Team
