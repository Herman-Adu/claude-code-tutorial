# UI Components Library

This document provides comprehensive documentation for the reusable UI components in the Kanban board application. All components are built with React, TypeScript, and follow a glassmorphic design system.

---

## Table of Contents

- [Overview](#overview)
- [Button Component](#button-component)
- [Badge Component](#badge-component)
- [Modal Component](#modal-component)
- [Glassmorphic Design System](#glassmorphic-design-system)
- [Accessibility Considerations](#accessibility-considerations)

---

## Overview

The UI component library provides a set of reusable, accessible primitives that implement a consistent glassmorphic design language. These components are located in `src/components/ui/` and serve as the foundation for building feature-specific components.

### Design Principles

1. **Glassmorphic Aesthetic**: All components use frosted glass effects with semi-transparent backgrounds and blur filters
2. **Accessibility First**: ARIA attributes, keyboard navigation, and focus management are built-in
3. **Composition**: Components are designed to be composed together for complex interfaces
4. **Type Safety**: Full TypeScript support with well-defined prop interfaces

### Utility Function: `cn()`

All components use the `cn()` utility function for conditional class name composition:

```typescript
import { cn } from '@/lib/utils';

// Usage
cn('base-class', condition && 'conditional-class', className)
```

---

## Button Component

**File:** `src/components/ui/Button.tsx`

A versatile button component with multiple variants and sizes, featuring glassmorphic styling with gradient backgrounds and interactive hover states.

### Props Interface

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
```

### Props Table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `className` | `string` | - | Additional CSS classes |
| `children` | `ReactNode` | - | Button content |
| `...props` | `ButtonHTMLAttributes` | - | All native button attributes |

### Variants

| Variant | Use Case | Visual Style |
|---------|----------|--------------|
| `primary` | Main actions (Create, Save) | Sky-to-indigo gradient, white text |
| `secondary` | Alternative actions | Violet-to-pink gradient, slate text |
| `danger` | Destructive actions (Delete) | Rose-to-pink gradient, white text |
| `ghost` | Subtle actions (Cancel) | White/transparent background, slate text |

### Sizes

| Size | Padding | Font Size |
|------|---------|-----------|
| `sm` | `px-3.5 py-1.5` | `text-sm` |
| `md` | `px-5 py-2.5` | `text-sm` |
| `lg` | `px-7 py-3.5` | `text-base` |

### Usage Examples

```tsx
import { Button } from '@/components/ui/Button';

// Primary action
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>

// Danger action with size
<Button variant="danger" size="sm" onClick={handleDelete}>
  Delete
</Button>

// Ghost button (cancel action)
<Button variant="ghost" onClick={handleCancel}>
  Cancel
</Button>

// Disabled state
<Button variant="primary" disabled>
  Processing...
</Button>

// With custom className
<Button variant="secondary" className="w-full">
  Full Width Button
</Button>
```

### Styling Details

The Button component includes:

- **Base Styles**: Rounded corners (`rounded-xl`), backdrop blur, border with white transparency
- **Interactive States**: Hover lift (`-translate-y-0.5`), active press, focus ring
- **Disabled State**: Reduced opacity (`opacity-50`), no pointer events
- **Transitions**: Smooth 250ms transitions for all state changes
- **Shadows**: Layered box shadows for depth effect

### Ref Forwarding

The Button component uses `forwardRef` for ref forwarding, making it compatible with form libraries and focus management:

```tsx
const buttonRef = useRef<HTMLButtonElement>(null);
<Button ref={buttonRef}>Click Me</Button>
```

---

## Badge Component

**File:** `src/components/ui/Badge.tsx`

A lightweight badge component for displaying labels, tags, and status indicators with glassmorphic styling.

### Props Interface

```typescript
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'priority' | 'tag';
}
```

### Props Table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Badge content |
| `className` | `string` | - | Additional CSS classes (required for `priority` variant) |
| `variant` | `'default' \| 'priority' \| 'tag'` | `'default'` | Visual style variant |

### Variants

| Variant | Use Case | Style |
|---------|----------|-------|
| `default` | General purpose | White background, slate text, subtle border |
| `priority` | Priority indicators | Styles passed via `className` prop |
| `tag` | Tags/labels | Violet background, violet text |

### Usage Examples

```tsx
import { Badge } from '@/components/ui/Badge';

// Default badge
<Badge>Default</Badge>

// Tag variant
<Badge variant="tag">Frontend</Badge>

// Priority variant with custom colors
<Badge
  variant="priority"
  className="bg-emerald-100/80 text-emerald-700"
>
  Low
</Badge>

<Badge
  variant="priority"
  className="bg-amber-100/80 text-amber-700"
>
  Medium
</Badge>

<Badge
  variant="priority"
  className="bg-rose-100/80 text-rose-700"
>
  High
</Badge>
```

### Priority Color Reference

| Priority | Background | Text Color |
|----------|------------|------------|
| Low | `bg-emerald-100/80` | `text-emerald-700` |
| Medium | `bg-amber-100/80` | `text-amber-700` |
| High | `bg-rose-100/80` | `text-rose-700` |

### Styling Details

- **Base Styles**: Inline-flex, small padding (`px-2.5 py-1`), extra-small font, rounded (`rounded-lg`)
- **Glass Effect**: `backdrop-blur-sm` for subtle frosted effect
- **Typography**: Medium font weight, wide letter spacing

---

## Modal Component

**File:** `src/components/ui/Modal.tsx`

A fully accessible modal dialog component with focus trapping, keyboard navigation, and glassmorphic styling.

### Props Interface

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
```

### Props Table

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Callback when modal should close |
| `title` | `string` | Yes | Modal header title |
| `children` | `ReactNode` | Yes | Modal body content |

### Usage Examples

```tsx
import { Modal } from '@/components/ui/Modal';

function TaskManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Open Modal
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Task"
      >
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}
```

### Focus Management

The Modal implements comprehensive focus management:

1. **Initial Focus**: First focusable element receives focus when modal opens
2. **Focus Trap**: Tab key cycles through focusable elements within the modal
3. **Focus Restoration**: Focus returns to the triggering element when modal closes

```typescript
// Focusable elements selector
'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Escape` | Close modal |
| `Tab` | Move focus to next focusable element |
| `Shift + Tab` | Move focus to previous focusable element |

### Body Scroll Lock

When the modal opens, `document.body.style.overflow` is set to `'hidden'` to prevent background scrolling. This is restored to `'unset'` when the modal closes.

### Accessibility Features

```tsx
// Modal container
<div
  ref={modalRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby={titleId}
>
  // Title with unique ID
  <h2 id={titleId}>{title}</h2>

  // Close button with label
  <button aria-label="Close modal">
    // SVG with aria-hidden="true"
  </button>
</div>

// Backdrop
<div aria-hidden="true" onClick={onClose} />
```

### Styling Details

- **Backdrop**: Semi-transparent slate overlay (`bg-slate-900/30`) with backdrop blur
- **Dialog**: Glass effect (`glass-lg`), max-width of `md` (28rem), padding, rounded corners
- **Header**: Bottom border, title with slate color, close button with hover states
- **Z-Index**: Modal uses `z-50` for proper stacking

---

## Glassmorphic Design System

The application uses a comprehensive glassmorphic design system defined in `src/app/globals.css`.

### CSS Custom Properties

```css
:root {
  /* Glassmorphic Pastel Color Palette */
  --glass-lavender: rgba(200, 180, 220, 0.7);
  --glass-pink: rgba(250, 210, 220, 0.7);
  --glass-mint: rgba(180, 225, 200, 0.7);
  --glass-sky: rgba(180, 215, 245, 0.7);
  --glass-peach: rgba(255, 220, 195, 0.7);
  --glass-lilac: rgba(220, 195, 235, 0.7);
  --glass-cream: rgba(255, 252, 245, 0.7);

  /* Glassmorphic Effects */
  --glass-bg: rgba(255, 255, 255, 0.65);
  --glass-bg-light: rgba(255, 255, 255, 0.75);
  --glass-bg-dark: rgba(255, 255, 255, 0.45);
  --glass-border: rgba(255, 255, 255, 0.35);
  --glass-border-light: rgba(255, 255, 255, 0.5);
  --glass-blur: blur(16px);
  --glass-blur-sm: blur(12px);
  --glass-blur-lg: blur(20px);
  --glass-radius: 16px;
  --glass-radius-sm: 12px;
  --glass-radius-lg: 20px;
  --glass-radius-xl: 24px;

  /* Shadow System */
  --glass-shadow: 0 8px 32px rgba(100, 100, 140, 0.12);
  --glass-shadow-sm: 0 4px 16px rgba(100, 100, 140, 0.08);
  --glass-shadow-lg: 0 16px 48px rgba(100, 100, 140, 0.15);
  --glass-shadow-inset: inset 0 1px 1px rgba(255, 255, 255, 0.6);
}
```

### Utility Classes

| Class | Description | Use Case |
|-------|-------------|----------|
| `.glass` | Standard glass effect | General containers |
| `.glass-sm` | Smaller blur and radius | Cards, small elements |
| `.glass-lg` | Larger blur and radius | Modals, prominent sections |
| `.glass-btn` | Button-specific glass | Interactive buttons |
| `.glass-input` | Input-specific glass | Form inputs, textareas |
| `.bento-block` | Bento grid block | Column containers |

### Pastel Accent Classes

| Class | Color | Use Case |
|-------|-------|----------|
| `.glass-lavender` | Purple tint | Decorative |
| `.glass-pink` | Pink tint | Decorative |
| `.glass-mint` | Green tint | Completed column |
| `.glass-sky` | Blue tint | To-Do column |
| `.glass-peach` | Orange tint | In Progress column |
| `.glass-lilac` | Light purple | Decorative |
| `.glass-cream` | Warm white | Decorative |

### Background Gradient

The application uses a multi-stop gradient background:

```css
background: linear-gradient(
  135deg,
  #e8e4f0 0%,    /* Lavender */
  #f5e6d3 25%,   /* Peach */
  #f0e0e8 50%,   /* Pink */
  #dceef5 75%,   /* Sky */
  #e8e4f0 100%   /* Lavender */
);
background-attachment: fixed;
```

---

## Accessibility Considerations

### Button Component

- Uses native `<button>` element for built-in keyboard support
- Includes visible focus ring (`focus:ring-2`)
- Disabled state prevents interaction and provides visual feedback
- Supports all native button attributes including `aria-*` props

### Badge Component

- Uses semantic `<span>` element
- Color contrast meets WCAG guidelines
- Can accept additional ARIA attributes via spread props

### Modal Component

| Feature | Implementation |
|---------|----------------|
| Role | `role="dialog"` |
| Modal indicator | `aria-modal="true"` |
| Label | `aria-labelledby` pointing to title |
| Close button | `aria-label="Close modal"` |
| Backdrop | `aria-hidden="true"` |
| Decorative icons | `aria-hidden="true"` |
| Focus trap | Tab cycles within modal |
| Focus restoration | Returns focus on close |
| Keyboard | Escape closes modal |
| Scroll lock | Prevents background scroll |

### Color Contrast

The design system ensures adequate color contrast:

- Text colors use slate-600/700 on light backgrounds
- White text on gradient buttons meets WCAG AA standards
- Focus rings use semi-transparent colors with sufficient contrast

### Keyboard Navigation

All interactive components support:

- **Tab**: Navigate between focusable elements
- **Enter/Space**: Activate buttons
- **Escape**: Close modals

---

## Best Practices

### When to Use Each Component

| Component | Use When |
|-----------|----------|
| Button (primary) | Main call-to-action, form submission |
| Button (secondary) | Alternative actions |
| Button (danger) | Destructive operations requiring attention |
| Button (ghost) | Cancel actions, subtle controls |
| Badge (default) | Neutral labels |
| Badge (priority) | Status indicators with semantic color |
| Badge (tag) | Categorical labels, tags |
| Modal | Forms, confirmations, focused content |

### Composition Patterns

```tsx
// Form in Modal
<Modal isOpen={isOpen} onClose={onClose} title="Edit Task">
  <form>
    {/* Form fields */}
    <div className="flex gap-3">
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" type="submit">Save</Button>
    </div>
  </form>
</Modal>

// Badges in Cards
<div className="flex gap-2">
  <Badge variant="priority" className="bg-amber-100/80 text-amber-700">
    Medium
  </Badge>
  <Badge variant="tag">Frontend</Badge>
  <Badge variant="tag">Design</Badge>
</div>
```

---

*Last Updated: January 2026*
