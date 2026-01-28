# Testing and Verification Guide

This document provides comprehensive testing procedures for the Kanban Board application. Use these checklists to verify all functionality works correctly before deployment.

---

## Table of Contents

1. [Manual Testing Checklist](#manual-testing-checklist)
2. [CRUD Operations Testing](#crud-operations-testing)
3. [Drag and Drop Testing](#drag-and-drop-testing)
4. [Responsive Design Testing](#responsive-design-testing)
5. [Accessibility Testing](#accessibility-testing)
6. [Browser Compatibility Testing](#browser-compatibility-testing)
7. [localStorage Persistence Testing](#localstorage-persistence-testing)
8. [Edge Cases](#edge-cases)
9. [Success Criteria](#success-criteria)

---

## Manual Testing Checklist

### Quick Smoke Test (5 minutes)

| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| App loads | Navigate to the app URL | Board displays with 3 columns | |
| Create task | Click + button, fill form, submit | Task appears in To-Do column | |
| Edit task | Click edit icon on task, modify, save | Changes are reflected | |
| Delete task | Click delete icon, confirm | Task is removed | |
| Drag task | Drag task to another column | Task moves to new column | |
| Refresh persistence | Refresh page | All tasks remain | |

---

## CRUD Operations Testing

### Create Task

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Create with title only | 1. Click + button<br>2. Enter title "Test Task"<br>3. Click "Create Task" | Task appears in To-Do with medium priority |
| Create with all fields | 1. Click + button<br>2. Enter title, description, select High priority<br>3. Add tags "design, urgent"<br>4. Submit | Task shows all entered data correctly |
| Title validation | 1. Open create modal<br>2. Leave title empty<br>3. Click submit | Submit button is disabled |
| Title max length | 1. Enter 100+ characters in title | Input stops at 100 characters |
| Description max length | 1. Enter 500+ characters in description | Input stops at 500 characters |
| Tag limits | 1. Enter more than 10 comma-separated tags | Only first 10 tags are saved |
| Tag character limit | 1. Enter a tag with 30+ characters | Tag is truncated or rejected |
| Duplicate tags | 1. Enter "design, design, frontend" | Only "design" and "frontend" appear |
| Cancel create | 1. Open modal, enter data<br>2. Click Cancel | Modal closes, no task created |

### Read/Display Tasks

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Empty state | Delete all tasks | "No tasks yet" message in each column |
| Task count display | Add 3 tasks to To-Do | Column header shows "3 tasks" |
| Single task display | Add 1 task to column | Column header shows "1 task" |
| Priority badge colors | Create tasks with each priority | Low=green, Medium=amber, High=rose |
| Description truncation | Create task with long description | Description shows with "..." if too long |
| Tags display | Create task with multiple tags | All tags shown as badges |

### Update Task

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Edit title | 1. Click edit on task<br>2. Change title<br>3. Save | Title updates immediately |
| Edit description | 1. Click edit<br>2. Modify description<br>3. Save | Description updates |
| Change priority | 1. Click edit<br>2. Select different priority<br>3. Save | Priority badge changes |
| Add tags | 1. Click edit<br>2. Add new tags<br>3. Save | New tags appear on card |
| Remove tags | 1. Click edit<br>2. Remove tags from input<br>3. Save | Tags removed from card |
| Change status | 1. Click edit<br>2. Change status dropdown<br>3. Save | Task moves to new column |
| Cancel edit | 1. Click edit<br>2. Make changes<br>3. Click Cancel | Original data preserved |
| Form pre-population | 1. Click edit on task | Form shows current task data |

### Delete Task

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Delete with confirmation | 1. Click delete icon<br>2. Click "Delete" in modal | Task removed from board |
| Cancel delete | 1. Click delete icon<br>2. Click "Cancel" | Task remains, modal closes |
| Delete updates count | 1. Note task count<br>2. Delete a task | Count decreases by 1 |
| Delete from any column | Test delete in To-Do, In Progress, Completed | Works in all columns |

---

## Drag and Drop Testing

### Basic Drag Operations

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Drag within column | Drag task up/down in same column | Task reorders within column |
| Drag to empty column | Drag task to column with no tasks | Task appears in target column |
| Drag to populated column | Drag task to column with existing tasks | Task inserts at drop position |
| Visual feedback on drag | Start dragging a task | Original position shows placeholder, dragged card follows cursor |
| Column highlight | Drag over a column | Column scales up slightly, shadow increases |

### Cross-Column Movement

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| To-Do to In Progress | Drag task from To-Do to In Progress | Task columnId changes, appears in In Progress |
| In Progress to Completed | Drag task from In Progress to Completed | Task moves to Completed |
| Completed to To-Do | Drag task from Completed to To-Do | Task returns to To-Do |
| Verify persistence | Move task, refresh page | Task remains in new column |

### Reordering

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Reorder first to last | Drag first task below last task | Order updates correctly |
| Reorder last to first | Drag last task above first task | Order updates correctly |
| Drop on specific task | Drag and drop directly on another task | Dropped task inserts before target |

### Edge Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Cancel drag (drop outside) | Start drag, drop outside columns | Task returns to original position |
| Drag on self | Drag task and drop on itself | Nothing changes |
| Rapid dragging | Quickly drag multiple tasks | All operations complete correctly |
| Activation constraint | Click without dragging 8px | No drag initiated |

### Keyboard Drag and Drop

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Focus task card | Tab to task card | Card receives focus outline |
| Initiate drag | Press Space/Enter on focused card | Drag mode activates |
| Move with arrows | Use arrow keys while dragging | Task moves between positions |
| Confirm drop | Press Space/Enter | Task drops at current position |
| Cancel with Escape | Press Escape while dragging | Drag cancelled, task returns |

---

## Responsive Design Testing

### Viewport Breakpoints

| Viewport | Width | Expected Layout |
|----------|-------|-----------------|
| Mobile | < 768px | Columns stack vertically |
| Tablet | >= 768px | 3 columns side by side |
| Desktop | >= 1024px | Full width with margins |

### Mobile-Specific Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Column stacking | View on mobile width | Columns appear vertically stacked |
| Touch drag | Touch and drag task on mobile | Drag works with touch events |
| Modal sizing | Open modal on mobile | Modal fits screen, scrollable if needed |
| Header sizing | View header on mobile | Title is 3xl size (smaller than desktop) |
| Container padding | View on mobile | 4px horizontal padding |

### Tablet/Desktop Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| 3-column layout | View at >= 768px width | All 3 columns side by side |
| Column min-height | View columns | 520px minimum height on desktop |
| Header sizing | View header | Title is 5xl size |
| Container padding | View on desktop | 8px horizontal padding |

### Resize Behavior

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Resize mobile to desktop | Start mobile, resize to desktop | Layout smoothly transitions |
| Resize desktop to mobile | Start desktop, resize to mobile | Columns stack without issues |

---

## Accessibility Testing

### Keyboard Navigation

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Tab through page | Press Tab repeatedly | Focus moves logically through interactive elements |
| Add button focus | Tab to + button | Button has visible focus indicator |
| Task card focus | Tab to task card | Card is focusable |
| Edit button focus | Tab to edit button | Clear focus ring visible |
| Delete button focus | Tab to delete button | Clear focus ring visible |
| Modal focus trap | Open modal, Tab | Focus cycles within modal only |
| Escape closes modal | Press Escape in modal | Modal closes |
| Focus restoration | Close modal | Focus returns to trigger element |

### Screen Reader Testing

| Test Case | Tool | Expected Result |
|-----------|------|-----------------|
| Page structure | Screen reader | Announces header, main landmark |
| Column announcement | Screen reader | "To-Do column with X tasks" |
| Task card info | Screen reader | Reads title, description, priority, tags |
| Add button label | Screen reader | Announces "Add new task" |
| Edit button label | Screen reader | Announces "Edit task: [task title]" |
| Delete button label | Screen reader | Announces "Delete task: [task title]" |
| Modal role | Screen reader | Announces as dialog |
| Loading state | Screen reader | Announces "Loading Board..." |
| Empty column state | Screen reader | Announces "No tasks yet" |

### ARIA Attributes Verification

| Element | Expected ARIA | Location |
|---------|---------------|----------|
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | Modal.tsx |
| Column | `aria-label="[column name] column with X tasks"` | KanbanColumn.tsx |
| Empty state | `role="status"` | KanbanColumn.tsx |
| Action buttons | `role="group"`, `aria-label="Task actions"` | TaskCard.tsx |
| Edit button | `aria-label="Edit task: [title]"` | TaskCard.tsx |
| Delete button | `aria-label="Delete task: [title]"` | TaskCard.tsx |
| Priority buttons | `aria-pressed` | TaskForm.tsx |
| Form inputs | `aria-describedby` linking to hints | TaskForm.tsx |
| Loading state | `role="status"`, `aria-live="polite"` | KanbanBoard.tsx |
| Decorative icons | `aria-hidden="true"` | All icon SVGs |

### Color Contrast

| Element | Foreground | Background | Ratio Required |
|---------|------------|------------|----------------|
| Title text | slate-700 | white glass | >= 4.5:1 |
| Description text | slate-500 | white glass | >= 4.5:1 |
| Priority badges | Colored text | Light colored bg | >= 4.5:1 |
| Button text | White or slate | Gradient bg | >= 4.5:1 |

---

## Browser Compatibility Testing

### Supported Browsers

| Browser | Version | Tests |
|---------|---------|-------|
| Chrome | Latest | All functionality |
| Firefox | Latest | All functionality |
| Safari | Latest | All functionality |
| Edge | Latest | All functionality |

### Browser-Specific Tests

| Test Case | Browsers | Expected Result |
|-----------|----------|-----------------|
| Glassmorphic blur | All | Backdrop blur renders correctly |
| CSS Grid | All | 3-column layout works |
| localStorage | All | Data persists |
| Drag and drop | All | Smooth drag operations |
| Touch events | Safari iOS, Chrome Android | Touch drag works |

### Feature Detection

| Feature | Fallback |
|---------|----------|
| localStorage | Graceful error logging |
| CSS backdrop-filter | Background color fallback |
| CSS Grid | Block fallback |

---

## localStorage Persistence Testing

### Basic Persistence

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| New task persists | 1. Create task<br>2. Refresh page | Task still exists |
| Edit persists | 1. Edit task<br>2. Refresh page | Changes retained |
| Delete persists | 1. Delete task<br>2. Refresh page | Task stays deleted |
| Move persists | 1. Move task to new column<br>2. Refresh | Task in correct column |
| Order persists | 1. Reorder tasks<br>2. Refresh | Order preserved |

### Storage Limits

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Multiple tasks | Create 50+ tasks | All tasks persist |
| Large descriptions | Create tasks with max descriptions | No truncation |
| Storage key | Check DevTools > Application > localStorage | Key: "kanban-tasks" |

### Error Handling

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Corrupted data | Manually corrupt localStorage JSON | App handles gracefully |
| Cleared storage | Clear localStorage | App shows empty board |
| Private/Incognito | Use private browsing | App works (data clears on close) |

### Hydration

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Initial load | Watch page load | "Loading Board..." appears briefly |
| SSR mismatch | Check console | No hydration errors |
| Fast refresh | Hot reload during development | State preserved |

---

## Edge Cases

### Input Validation

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Empty title | "" | Form doesn't submit |
| Whitespace title | "   " | Trimmed to empty, doesn't submit |
| XSS in title | `<script>alert('xss')</script>` | Escaped, displays as text |
| XSS in description | `<img onerror="alert('xss')">` | Escaped, displays as text |
| XSS in tags | `<b onclick="evil()">tag</b>` | Escaped, displays as text |
| HTML entities | `&nbsp; &lt;` | Properly escaped |
| Unicode characters | Emojis, Chinese, Arabic | Displays correctly |
| Very long title | 100 characters | Accepted, displayed correctly |
| 101 character title | 101 characters | Truncated at 100 |

### Task Limits

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Many tasks in column | Add 20 tasks to one column | Scrollable, performance OK |
| Empty tags array | Create task without tags | Empty array saved, no tags displayed |
| Single character tag | Tag: "a" | Accepted and displayed |

### State Edge Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Double-click create | Rapidly click + twice | Only one modal opens |
| Edit while modal open | Try to edit another task | Current modal handles it |
| Delete while dragging | Try to delete during drag | Operation blocked or queued |
| Concurrent operations | Rapidly create/delete | All operations complete |

---

## Success Criteria

Based on the project specification, verify all criteria are met:

### Functional Requirements

| Criteria | Verification Method | Status |
|----------|---------------------|--------|
| All CRUD operations functional | Complete CRUD testing section | |
| Drag and drop works within columns | Drag and drop testing | |
| Drag and drop works between columns | Drag and drop testing | |
| Data persists across browser sessions | localStorage testing | |

### Non-Functional Requirements

| Criteria | Verification Method | Status |
|----------|---------------------|--------|
| Responsive on mobile | Test at < 768px width | |
| Responsive on tablet | Test at 768px-1024px | |
| Responsive on desktop | Test at > 1024px | |
| Passes accessibility audit (axe-core) | Run axe DevTools extension | |
| No XSS vulnerabilities | Input validation testing | |
| TypeScript strict mode passes | `npm run build` succeeds | |
| Production build succeeds | `npm run build` completes | |

### Performance Criteria

| Criteria | Target | Verification |
|----------|--------|--------------|
| Initial load | < 3 seconds | Chrome DevTools Network |
| Drag responsiveness | < 100ms | Visual inspection |
| Modal open/close | < 200ms | Visual inspection |

---

## Testing Tools

### Recommended Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| Chrome DevTools | Network, Performance, Storage | F12 |
| axe DevTools Extension | Accessibility audit | Browser extension |
| React Developer Tools | Component inspection | Browser extension |
| NVDA/VoiceOver | Screen reader testing | System accessibility |
| Responsive Design Mode | Viewport testing | F12 > Toggle device |

### Automated Testing Commands

```bash
# Type checking
npm run type-check

# Build verification
npm run build

# Linting
npm run lint

# Development server
npm run dev
```

---

## Bug Reporting Template

When reporting bugs, include:

```markdown
## Bug Report

**Component**: [e.g., KanbanBoard, TaskCard]
**Browser**: [e.g., Chrome 120]
**Viewport**: [e.g., 375x667 mobile]

### Steps to Reproduce
1.
2.
3.

### Expected Result
[What should happen]

### Actual Result
[What actually happens]

### Screenshots/Console Errors
[If applicable]

### localStorage State
[Copy from DevTools > Application > localStorage]
```

---

## Sign-Off Checklist

Before deployment, ensure:

- [ ] All smoke tests pass
- [ ] CRUD operations verified
- [ ] Drag and drop works on all browsers
- [ ] Responsive design tested at all breakpoints
- [ ] Accessibility audit shows no critical issues
- [ ] localStorage persistence verified
- [ ] No console errors in production build
- [ ] TypeScript build passes
- [ ] All edge cases handled gracefully

**Tested By**: _______________
**Date**: _______________
**Version**: _______________
