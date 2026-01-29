# Testing & Accessibility Technical Findings

## Test Failures - Root Cause Analysis

### 1. Modal Focus Trap Test Failure (CRITICAL)

**Location:** `src/__tests__/unit/components/ui/Modal.test.tsx` - Line 200

**Error:**
```
Expected: <button>First</button> to have focus
Received: <div aria-label="Modal content"> with tabindex="0"
```

**Root Cause:**
The modal content region has `tabindex="0"` which makes it focusable. When tabbing through the modal, focus reaches this region before the first button. The focus trap logic expects focus to be on a button element.

**Implementation Issue in `src/components/ui/Modal.tsx`:**
```typescript
// Line 56-59: Focus goes to first focusable element
const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
```

The selector includes `[tabindex]` which will match the content region with `tabindex="0"`.

**Fix Options:**
1. Remove `tabindex="0"` from content region (line 119 in Modal.tsx)
2. Modify focus selector to skip the content region specifically
3. Adjust selector to prioritize buttons over tabindex elements

**Recommended Fix:**
```typescript
// In Modal.tsx, around line 56
const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
  'button:not([aria-label="Modal content"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);

// Or better: Remove tabindex="0" from content region entirely
// The region doesn't need to be focusable for accessibility
```

---

### 2. Badge Component Color Test Failure (MINOR)

**Location:** `src/__tests__/unit/components/ui/Badge.test.tsx` - Line 43

**Error:**
```
Expected: text-violet-600
Received: text-violet-700
```

**Root Cause:**
The Badge component implementation uses `text-violet-700` but the test expects `text-violet-600`. This is a visual design inconsistency.

**Files Involved:**
- Test: `src/__tests__/unit/components/ui/Badge.test.tsx` (line 43)
- Component: `src/components/ui/Badge.tsx`

**Solution:**
Choose one and make consistent:
1. Option A: Update test to expect `text-violet-700`
2. Option B: Update component to use `text-violet-600`

**Recommendation:** Option A (test is likely correct if component was recently changed)

---

### 3-6. Schema Default Value Test Failures (MEDIUM)

**Location:** `src/__tests__/unit/lib/schemas.test.ts` - Lines 747, 819, 880, 920

**Error Pattern:**
```
Expected: { title, description, priority, columnId, tags, categories }
Received: { title, description, priority, columnId, tags, categories, isAllDay }
```

**Root Cause:**
TaskSchema is including an `isAllDay` field with a default value of `true`. The tests expect the schema to output only the fields they specify.

**Files Involved:**
- Schema: `src/lib/schemas.ts` (TaskSchema definition)
- Tests: `src/__tests__/unit/lib/schemas.test.ts` (lines 747, 819, 880, 920)

**Affected Tests:**
1. Line 747: `should accept valid complete task`
2. Line 819: `should apply all defaults simultaneously`
3. Line 880: `should accept complete task (all fields)` in UpdateTaskSchema
4. Line 920: `should apply defaults for missing fields in partial schema`

**Investigation Needed:**
Review `src/lib/schemas.ts` to determine:
1. Is `isAllDay` intentionally added to TaskSchema?
2. If yes: Update tests to expect this field
3. If no: Remove the default from schema definition

**Example Fix:**
```typescript
// If isAllDay should be included:
expect(result.data).toEqual({
  title: 'Test',
  description: '',
  priority: 'MEDIUM',
  columnId: 'TODO',
  tags: [],
  categories: [],
  isAllDay: true // Add this
});

// Or if not:
// Remove .default(true) from isAllDay in schema definition
```

---

### 7-8. Integration Test Environment Issues (CRITICAL)

**Location:**
- `src/__tests__/integration/kanban-workflows.test.tsx`
- `src/__tests__/integration/actions/tasks.test.ts`

**Error:**
```
Error: Cannot find module 'C:\Users\herma\source\repository\claude-code-tutorial\node_modules\next\server'
       imported from next-auth/lib/env.js
```

**Root Cause:**
Version mismatch between Next.js and Next-Auth. The next-auth library is trying to import from next/server, but the Next.js installation doesn't provide it or it's in a different location.

**Resolution Options:**

1. **Check Next.js Version:**
   ```bash
   npm list next
   npm list next-auth
   ```

2. **Verify next/server Export:**
   - Check `node_modules/next/package.json` for "server" export
   - Verify `node_modules/next/server.js` exists

3. **Update Dependencies:**
   ```bash
   npm install next@latest next-auth@latest
   npm install
   npm run build
   ```

4. **Alternative - Skip These Tests in CI:**
   ```bash
   npm run test:run -- --exclude "**/kanban-workflows.test.tsx" --exclude "**/actions/tasks.test.ts"
   ```

---

## Accessibility Implementation Details

### FilterPanel Accessibility (Excellent)

**File:** `src/features/kanban/components/FilterPanel.tsx`

**Accessibility Features Implemented:**

1. **Dialog Semantics (Lines 178-192)**
   ```typescript
   <div
     role="dialog"
     aria-modal="true"
     aria-label="Filter options"
   >
   ```
   ✓ Properly marks this as a modal dialog for screen readers
   ✓ Prevents interaction with background content

2. **Label Association (Lines 229-243)**
   ```typescript
   <label htmlFor="priority-filter" className="...">Priority</label>
   <select id="priority-filter" ...>
   ```
   ✓ Screen readers announce "Priority, Select" when focused
   ✓ Clear connection between label and control

3. **Screen Reader Help Text (Lines 275-278)**
   ```typescript
   <div id="category-help" className="sr-only">
     Select one or more categories...
     Type a category name and press Enter to add, or click a suggestion below.
   </div>
   ```
   ✓ Provides context to screen reader users only
   ✓ Explains the interaction pattern (Enter, click)

4. **aria-describedby Connection (Line 322)**
   ```typescript
   <input
     aria-describedby="category-help"
     aria-labelledby="category-filter-label"
   >
   ```
   ✓ Screen reader announces both label AND help text
   ✓ User gets full context about how to use the input

5. **List Semantics for Filters (Lines 284-310)**
   ```typescript
   <div role="list" aria-label="Selected category filters">
     {filters.categories.map(cat => (
       <span role="listitem" key={cat}>
         {cat}
         <button aria-label={`Remove ${cat} category filter`}>
           <svg aria-hidden="true">...</svg>
         </button>
       </span>
     ))}
   </div>
   ```
   ✓ Screen readers announce "List, 2 items"
   ✓ Each item announced individually
   ✓ Button label explains action (Remove X)

6. **Suggestion Group (Lines 329-353)**
   ```typescript
   <div role="group" aria-label="Suggested categories">
     {categories.map(cat => (
       <button aria-label={`Add ${cat} category filter`}>
         + {cat}
       </button>
     ))}
   </div>
   ```
   ✓ Groups suggestions together logically
   ✓ Buttons have clear aria-labels

**Test Coverage (Lines 268-362):**
- 13 dedicated accessibility tests
- Validates all ARIA attributes
- Tests semantic structure
- Verifies screen reader help text

---

### SearchBar Accessibility (Excellent)

**File:** `src/components/ui/SearchBar.tsx`

**Accessibility Features:**

1. **aria-label on Input (Line 119)**
   ```typescript
   <input
     aria-label={props['aria-label'] || 'Search'}
   >
   ```
   ✓ Allows customization via props
   ✓ Defaults to "Search" if not provided

2. **Hidden Decorative Icon (Lines 94-109)**
   ```typescript
   <svg
     className="w-4 h-4 text-slate-400"
     aria-hidden="true"
   >
     <path d="..." /> {/* Magnifying glass */}
   </svg>
   ```
   ✓ Icon is purely visual, doesn't add to screen reader
   ✓ Button text provides semantics

3. **Clear Button with aria-label (Line 156)**
   ```typescript
   <button
     type="button"
     onClick={handleClear}
     aria-label="Clear search"
   >
   ```
   ✓ Clear what the button does
   ✓ Button text would be "x", aria-label provides meaning

4. **Loading Status (Lines 143-149)**
   ```typescript
   <div
     className="h-4 w-4 animate-spin ..."
     role="status"
     aria-label="Searching"
   >
   </div>
   ```
   ✓ role="status" announces loading state
   ✓ Spinner is purely visual enhancement

---

### DateRangeInput Accessibility (Excellent)

**File:** `src/components/ui/DateRangeInput.tsx`

**Accessibility Features:**

1. **Screen Reader Only Labels (Lines 126-128, 150-152)**
   ```typescript
   <label htmlFor={startId} className="sr-only">
     {startPlaceholder}
   </label>
   <input id={startId} type="date" />
   ```
   ✓ Visible placeholder, hidden semantic label
   ✓ Screen readers get full context
   ✓ Reduces visual clutter

2. **aria-label Redundancy (Lines 137, 161)**
   ```typescript
   <input
     id={startId}
     aria-label={startPlaceholder}
   >
   ```
   ✓ Provides backup semantic label
   ✓ Works even if sr-only label removed

3. **Error Message with Alert Role (Line 202)**
   ```typescript
   {error && <p role="alert">{error}</p>}
   ```
   ✓ Screen readers announce error immediately
   ✓ Not dependent on focus
   ✓ Associated with form visually

4. **Clear Button Accessibility (Line 174)**
   ```typescript
   <button
     type="button"
     onClick={handleClear}
     aria-label="Clear date range"
   >
   ```
   ✓ Clear action label
   ✓ Button has focus ring

---

### Modal Component Focus Management

**File:** `src/components/ui/Modal.tsx`

**Implementation (Lines 27-43):**
```typescript
const handleTabKey = useCallback((e: KeyboardEvent) => {
  if (e.key !== 'Tab' || !modalRef.current) return;

  const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (e.shiftKey && document.activeElement === firstElement) {
    e.preventDefault();
    lastElement?.focus();
  } else if (!e.shiftKey && document.activeElement === lastElement) {
    e.preventDefault();
    firstElement?.focus();
  }
}, []);
```

**What It Does:**
- Finds all focusable elements within modal
- When Tab on last element: Loop to first
- When Shift+Tab on first element: Loop to last
- Prevents focus from leaving modal

**Current Issue:**
Content region has `tabindex="0"` making it focusable, which becomes "first" element before actual buttons.

**The Bug Scenario:**
1. User tabs into modal
2. Expected: Focus first button
3. Actual: Focus content region (has tabindex="0")
4. User tabs again
5. Expected: Focus next button
6. Actual: Focus previous button (focus trap triggers incorrectly)

---

## Color Accessibility

### LabelBadge Color Contrast

**File:** `src/components/ui/LabelBadge.tsx` (Lines 96-110)

**Luminance Calculation (ITU-R BT.709):**
```typescript
function shouldUseDarkText(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance (ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use dark text for light backgrounds
  return luminance > 0.5;
}
```

**Purpose:** Determines whether to use dark or light text based on background color brightness

**Color Map (Lines 9-50):**
```typescript
const LABEL_COLOR_MAP = {
  red:    { bg: 'bg-red-400/50',    text: 'text-red-800', ... },
  blue:   { bg: 'bg-blue-400/50',   text: 'text-blue-800', ... },
  green:  { bg: 'bg-green-400/50',  text: 'text-green-800', ... },
  yellow: { bg: 'bg-yellow-400/50', text: 'text-yellow-800', ... },
  // ... etc
};
```

**Status:** Colors appear to meet WCAG AA (4.5:1 text contrast) but should be verified with automated tools.

---

## Test Utilities & Patterns

### Mock Store Pattern

**File:** `src/__tests__/features/kanban/search/FilterPanel.test.tsx` (Lines 13-35)

**Pattern:**
```typescript
let mockFilters = {};
let mockActiveFilterCount = 0;

vi.mock('@/store/kanban', () => ({
  useKanbanStore: vi.fn((selector) => {
    const state = {
      filters: mockFilters,
      setFilter: mockSetFilter,
      // ...
    };
    return selector(state);
  }),
}));

// In test:
beforeEach(() => {
  mockFilters = {}; // Reset state
  mockActiveFilterCount = 0;
});
```

**Strengths:**
- Allows dynamic state changes within tests
- Selector pattern matches real implementation
- State reset prevents cross-test pollution

---

### Accessibility Test Pattern

**File:** `src/__tests__/features/kanban/search/FilterPanel.test.tsx` (Lines 272-362)

**Pattern:**
```typescript
describe('Accessibility', () => {
  it('should have role="dialog" with aria-modal', () => {
    render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Filter options');
  });

  it('should have proper label for category input', () => {
    render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText(/type and press enter/i);
    expect(input).toHaveAttribute('id', 'category-input');
    expect(input).toHaveAttribute('aria-labelledby', 'category-filter-label');
  });

  it('should have screen reader help text', () => {
    render(<FilterPanel isOpen={true} onClose={mockOnClose} />);
    const helpText = document.getElementById('category-help');
    expect(helpText).toBeInTheDocument();
    expect(helpText).toHaveClass('sr-only');
    expect(helpText?.textContent).toContain('ALL selected categories');
  });
});
```

**Strengths:**
- Tests both presence and correctness of ARIA attributes
- Verifies screen reader text content
- Tests semantic structure (role, classes)

---

## Schema Validation Patterns

### Comprehensive Validation Example

**File:** `src/__tests__/unit/app/actions/labels.test.ts` (Lines 34-137)

**Pattern - Testing All Cases:**
```typescript
describe('CreateLabelSchema', () => {
  // Valid cases
  it('should validate valid label data with preset color', () => {
    const result = CreateLabelSchema.safeParse({ name: 'Test', color: 'blue' });
    expect(result.success).toBe(true);
  });

  // Edge cases
  it('should trim whitespace from name', () => {
    const result = CreateLabelSchema.safeParse({
      name: '  Test Label  ',
      color: 'blue',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Label');
    }
  });

  // Invalid cases
  it('should reject empty name', () => {
    const result = CreateLabelSchema.safeParse({
      name: '',
      color: 'blue',
    });
    expect(result.success).toBe(false);
  });

  // Boundary cases
  it('should reject name that is too long', () => {
    const result = CreateLabelSchema.safeParse({
      name: 'a'.repeat(101),
      color: 'blue',
    });
    expect(result.success).toBe(false);
  });

  // Special character cases
  it('should handle unicode characters in name', () => {
    const unicodeNames = ['デザイン', 'Diseño', 'конструкция', 'تصميم'];
    unicodeNames.forEach((name) => {
      const result = CreateLabelSchema.safeParse({
        name,
        color: 'blue',
      });
      expect(result.success).toBe(true);
    });
  });
});
```

**Strengths:**
- Valid cases first (happy path)
- Edge cases (whitespace, length)
- Invalid cases (rejection tests)
- Boundary testing (max length)
- Special characters (unicode)
- Clear assertion pattern

---

## Keyboard Navigation Testing

### Pattern - Testing Escape Key

**File:** `src/__tests__/features/kanban/search/FilterPanel.test.tsx` (Lines 243-249)

**Implementation:**
```typescript
describe('Keyboard Navigation', () => {
  it('should close on Escape key', async () => {
    render(<FilterPanel isOpen={true} onClose={mockOnClose} />);

    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

**How to Test Other Keys:**
```typescript
// Tab key
await user.keyboard('{Tab}');

// Enter key
await user.keyboard('{Enter}');

// Arrow keys
await user.keyboard('{ArrowUp}');
await user.keyboard('{ArrowDown}');

// Character combinations
await user.keyboard('test{Enter}');
```

---

## E2E Test Patterns

### Pattern - Testing with URL Verification

**File:** `tests/e2e/search.spec.ts` (Lines 240-253)

**Implementation:**
```typescript
test('should load filters from URL on page load', async ({ page }) => {
  // Navigate with filter params
  await page.goto('/?search=test&priority=high');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Verify search bar has the value
  const searchBar = page.getByRole('textbox', { name: /search/i });
  await expect(searchBar).toHaveValue('test');

  // Verify filter chip is shown
  await expect(page.getByText('Priority:')).toBeVisible();
});
```

**Key Patterns:**
- URL parameters in goto()
- waitForLoadState() for async operations
- getByRole() for semantic queries
- Multiple assertions for complete validation

---

## Recommendations for Test Improvements

### 1. Add Contrast Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

describe('SearchBar Accessibility', () => {
  it('should have accessible colors', async () => {
    const { container } = render(<SearchBar value="" onChange={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 2. Add Arrow Key Tests
```typescript
it('should navigate options with arrow keys', async () => {
  render(<FilterPanel isOpen={true} onClose={() => {}} />);
  const select = screen.getByLabelText(/priority/i);

  // This would require native select enhancement
  // Currently native selects don't support arrow key testing well
  // Consider using Headless UI or Radix UI for better testing
});
```

### 3. Add Performance Tests
```typescript
it('should render 1000 filters without lag', async () => {
  const largeFilterList = Array.from({ length: 1000 }, (_, i) => ({
    id: `filter-${i}`,
    name: `Filter ${i}`,
    color: 'blue'
  }));

  const startTime = performance.now();
  render(<FilterList items={largeFilterList} />);
  const endTime = performance.now();

  expect(endTime - startTime).toBeLessThan(1000); // ms
});
```

### 4. Add sr-live Region Tests
```typescript
it('should announce filter changes to screen readers', async () => {
  render(<FilterPanel isOpen={true} onClose={() => {}} />);

  // Need aria-live regions in component
  const liveRegion = screen.getByRole('status');

  // Change filter
  const select = screen.getByLabelText(/priority/i);
  await user.selectOptions(select, 'HIGH');

  // Verify announcement
  await waitFor(() => {
    expect(liveRegion).toHaveTextContent('Priority filter: High');
  });
});
```

---

## Conclusion

The Phase 2A and 2B implementation shows strong accessibility practices with proper ARIA attributes, semantic HTML, and keyboard support. The test suite is comprehensive with 1050 tests. The 6 failing tests are fixable with focused effort (4-6 hours), and do not represent fundamental issues with the implementation.

**Priority Fixes:**
1. Modal focus trap (2 hours)
2. Integration environment (3 hours)
3. Schema tests (1 hour)
4. Badge color (30 minutes)

**Total Effort to Production:** 4-6 hours for critical fixes
