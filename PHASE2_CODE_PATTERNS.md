# Phase 2 Code Patterns & Examples

**Reference Guide for Phase 2 Implementation Patterns**

This document provides detailed code examples showing the established patterns used across Phase 2 features.

---

## 1. Server Action Pattern

### Template: Complete Server Action Implementation

```typescript
'use server';

/**
 * Clear docstring explaining the operation
 *
 * Security considerations:
 * - Authentication required
 * - Ownership verification
 * - Input validation
 *
 * @param input - Validated input
 * @returns Standard ActionResponse
 */
export async function operationName(
  input: InputType
): Promise<ActionResponse<OutputType>> {
  try {
    // Step 1: Authenticate
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Step 2: Rate limit (if applicable)
    if (!checkRateLimit(userId)) {
      return {
        success: false,
        error: 'Rate limit exceeded...',
      };
    }

    // Step 3: Sanitize input
    const sanitized = {
      field: sanitizeString(input.field),
    };

    // Step 4: Validate input
    const validation = Schema.safeParse(sanitized);
    if (!validation.success) {
      return {
        success: false,
        error: formatZodErrors(validation.error.issues),
      };
    }

    // Step 5: Verify ownership/authorization
    const resource = await prisma.model.findFirst({
      where: {
        id: validation.data.id,
        userId, // Ownership check
      },
    });
    if (!resource) {
      return {
        success: false,
        error: 'Not found or access denied',
      };
    }

    // Step 6: Execute operation
    const result = await prisma.model.create({
      data: { ...validated },
      include: { relations: true }, // Load needed relations
    });

    // Step 7: Log activity (for audit trail)
    await prisma.activity.create({
      data: {
        type: 'OPERATION_TYPE',
        taskId: result.taskId,
        userId,
        data: { summary: result },
      },
    });

    // Step 8: Trigger notifications (if needed)
    if (shouldNotify) {
      await createNotification(
        otherUserId,
        'EVENT_TYPE',
        'Title',
        'Message',
        taskId,
        { metadata: 'data' }
      );
    }

    // Step 9: Invalidate cache
    revalidatePath('/');

    // Step 10: Return success
    return { success: true, data: transformToResponse(result) };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'operationName'),
    };
  }
}
```

### Key Features of Pattern

1. **Clear Step Comments**: Each step is numbered for easy understanding
2. **Authentication First**: All operations start with user verification
3. **Fail Fast**: Return early on validation failures
4. **Sanitization + Validation**: Two-layer input protection
5. **Ownership Checks**: Database query includes userId filter
6. **Audit Trail**: Activity logged automatically
7. **Notifications**: Optional notification creation
8. **Cache Invalidation**: Next.js ISR revalidation
9. **Error Handling**: Consistent error response format
10. **Documentation**: JSDoc and inline comments

---

## 2. Store Pattern

### Template: Complete Zustand Store

```typescript
'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

// ============================================================================
// Types
// ============================================================================

export interface StoreItem {
  id: string;
  name: string;
  // ... fields
}

interface StoreState {
  // Data
  items: Map<string, StoreItem>;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Mutations
  addItem: (data: CreateInput, serverAction: (...) => Promise<ActionResponse>) => Promise<string | null>;
  updateItem: (id: string, data: UpdateInput, serverAction: (...) => Promise<ActionResponse>) => Promise<boolean>;
  removeItem: (id: string, serverAction: (...) => Promise<ActionResponse>) => Promise<boolean>;

  // Status
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getItems: () => StoreItem[];
  getItemById: (id: string) => StoreItem | undefined;
}

// ============================================================================
// Store
// ============================================================================

export const useStore = create<StoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      items: new Map(),
      isLoading: false,
      error: null,

      // Mutation: Create with optimistic update
      addItem: async (data, serverAction) => {
        // Generate optimistic ID
        const optimisticId = generateTempId();
        const optimisticItem = {
          id: optimisticId,
          ...data,
          _isOptimistic: true,
        };

        // Update store immediately (optimistic)
        set((state) => {
          state.items.set(optimisticId, optimisticItem as StoreItem);
          state.isLoading = true;
        });

        try {
          // Call server action
          const result = await serverAction(data);

          if (result.success && result.data) {
            // Replace optimistic with real
            const transformed = transformResponse(result.data);
            set((state) => {
              state.items.delete(optimisticId);
              state.items.set(transformed.id, transformed);
              state.isLoading = false;
            });
            return transformed.id;
          } else {
            // Rollback on error
            set((state) => {
              state.items.delete(optimisticId);
              state.error = result.error || 'Unknown error';
              state.isLoading = false;
            });
            return null;
          }
        } catch (error) {
          // Rollback on exception
          set((state) => {
            state.items.delete(optimisticId);
            state.error = String(error);
            state.isLoading = false;
          });
          return null;
        }
      },

      // Mutation: Update
      updateItem: async (id, data, serverAction) => {
        // Store original for rollback
        const original = get().items.get(id);
        if (!original) return false;

        // Optimistic update
        set((state) => {
          state.items.set(id, { ...original, ...data });
          state.isLoading = true;
        });

        try {
          const result = await serverAction(id, data);

          if (result.success && result.data) {
            set((state) => {
              state.items.set(id, transformResponse(result.data));
              state.isLoading = false;
            });
            return true;
          } else {
            // Rollback
            set((state) => {
              state.items.set(id, original);
              state.error = result.error || 'Unknown error';
              state.isLoading = false;
            });
            return false;
          }
        } catch (error) {
          // Rollback
          set((state) => {
            state.items.set(id, original);
            state.error = String(error);
            state.isLoading = false;
          });
          return false;
        }
      },

      // Mutation: Delete
      removeItem: async (id, serverAction) => {
        // Store original for rollback
        const original = get().items.get(id);
        if (!original) return false;

        // Optimistic delete
        set((state) => {
          state.items.delete(id);
          state.isLoading = true;
        });

        try {
          const result = await serverAction(id);

          if (result.success) {
            set((state) => { state.isLoading = false; });
            return true;
          } else {
            // Rollback
            set((state) => {
              state.items.set(id, original);
              state.error = result.error || 'Unknown error';
              state.isLoading = false;
            });
            return false;
          }
        } catch (error) {
          // Rollback
          set((state) => {
            state.items.set(id, original);
            state.error = String(error);
            state.isLoading = false;
          });
          return false;
        }
      },

      // Status setters
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Selectors
      getItems: () => Array.from(get().items.values()),
      getItemById: (id) => get().items.get(id),
    }),
    { name: 'ItemStore' }
  )
);

// ============================================================================
// Hooks
// ============================================================================

export const useItems = (): StoreItem[] => {
  return useStore(useShallow((state) => state.getItems()));
};

export const useItemById = (id: string): StoreItem | undefined => {
  return useStore((state) => state.getItemById(id));
};
```

### Key Features of Pattern

1. **Three Sections**: Types, Store, Hooks (clear organization)
2. **DevTools Integration**: For debugging in React DevTools
3. **Optimistic Updates**: Immediate UI feedback
4. **Automatic Rollback**: On error or exception
5. **Map-based Storage**: Efficient lookups by ID
6. **useShallow for Arrays**: Prevents unnecessary re-renders
7. **Single ID Select**: For primitive values
8. **Status Management**: isLoading and error states
9. **Transformation**: Converts server responses to store format
10. **Hook Shortcuts**: Convenient selectors for common queries

---

## 3. Feature Hook Pattern

### Template: Feature-Level Hook Wrapping Store + Server Actions

```typescript
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore, type StoreItem } from '@/store/feature';
import { getItems, createItem, updateItem, deleteItem } from '@/app/actions/feature';

// ============================================================================
// Types
// ============================================================================

export interface UseFeatureOptions {
  autoLoad?: boolean;
}

export interface UseFeatureReturn {
  items: Item[];
  isLoading: boolean;
  error: string | null;
  addItem: (data: CreateInput) => Promise<string | null>;
  editItem: (id: string, data: UpdateInput) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useFeature(options?: UseFeatureOptions): UseFeatureReturn {
  // Store selectors
  const storeItems = useStore(useShallow((state) => state.getItems()));
  const isLoading = useStore((state) => state.isLoading);
  const error = useStore((state) => state.error);

  // Store mutations
  const storeAdd = useStore((state) => state.addItem);
  const storeUpdate = useStore((state) => state.updateItem);
  const storeRemove = useStore((state) => state.removeItem);
  const setError = useStore((state) => state.setError);

  // Track initialization to avoid duplicate loads
  const isInitializing = useRef(false);

  // Load items on mount
  useEffect(() => {
    if (options?.autoLoad === false) return;

    async function initialize() {
      if (isInitializing.current) return;
      isInitializing.current = true;

      try {
        const result = await getItems();
        if (result.success && result.data) {
          // Store expects different format, transform if needed
          const transformed = result.data.map(transformResponse);
          // Assuming store has method to set initial data
          // This varies by store - some use setItems(), some addItem() in loop
        } else {
          setError(result.error || 'Failed to load items');
        }
      } catch (err) {
        setError(String(err));
      }
    }

    initialize();
  }, []); // Empty deps - run once on mount

  // Create item
  const add = useCallback(
    async (data: CreateInput): Promise<string | null> => {
      return await storeAdd(data, createItem);
    },
    [storeAdd]
  );

  // Update item
  const edit = useCallback(
    async (id: string, data: UpdateInput): Promise<boolean> => {
      return await storeUpdate(id, data, updateItem);
    },
    [storeUpdate]
  );

  // Delete item
  const deleteItemFunc = useCallback(
    async (id: string): Promise<boolean> => {
      return await storeRemove(id, deleteItem);
    },
    [storeRemove]
  );

  // Refresh from server
  const refresh = useCallback(async () => {
    const result = await getItems();
    if (result.success && result.data) {
      // Reload store
      const transformed = result.data.map(transformResponse);
      // Update store with fresh data
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    items: storeItems as Item[],
    isLoading,
    error,
    addItem: add,
    editItem: edit,
    deleteItem: deleteItemFunc,
    clearError,
    refresh,
  };
}
```

### Key Features of Pattern

1. **Clear Separation**: Store logic vs feature logic vs server actions
2. **useCallback**: Prevents function recreation on every render
3. **Initialization Control**: autoLoad option for flexibility
4. **Error Handling**: Consolidated in hook
5. **Type Transformation**: Handles store format vs API format
6. **Refresh Capability**: Manually sync with server
7. **useShallow**: Array selector optimization
8. **useRef**: Track initialization state
9. **JSDoc**: Clear parameter and return documentation
10. **Clean Return Interface**: Only expose what UI needs

---

## 4. Component Pattern

### Template: Feature Component Using Hook

```typescript
'use client';

import { useState } from 'react';
import { useFeature } from './useFeature';

interface FeatureComponentProps {
  itemId?: string;
}

export function FeatureComponent({ itemId }: FeatureComponentProps) {
  const { items, isLoading, error, addItem, deleteItem, clearError } = useFeature();
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async (data: CreateInput) => {
    const id = await addItem(data);
    if (id) {
      setShowForm(false);
      // Success - store handles optimistic update
    }
    // Error state in store, will re-render with error
  };

  const handleDelete = async (id: string) => {
    const success = await deleteItem(id);
    if (success) {
      // Success - store handles optimistic update
    }
  };

  if (isLoading && items.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {error && (
        <div className="error">
          {error}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      {showForm && (
        <FeatureForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      <button onClick={() => setShowForm(true)}>
        Add Item
      </button>

      <FeatureList
        items={items}
        onDelete={handleDelete}
        isDeleting={isLoading}
      />
    </div>
  );
}
```

### Key Features of Pattern

1. **Hook Usage**: Get state and actions from feature hook
2. **Error Handling**: Display errors to user
3. **Loading States**: Show feedback during operations
4. **Async Operations**: Handle promise results
5. **Form Management**: Separate form component
6. **Optimistic Feedback**: No extra loading spinners needed
7. **Error Dismissal**: User can acknowledge errors
8. **Clean Props**: Only pass necessary props to children

---

## 5. Validation & Sanitization Pattern

### Complete Example from Comments

**Schema Definition** (`src/lib/schemas.ts`):
```typescript
export const CreateCommentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(VALIDATION.MIN_COMMENT_LENGTH, {
      message: 'Comment cannot be empty',
    })
    .max(VALIDATION.MAX_COMMENT_LENGTH, {
      message: `Comment must be ${VALIDATION.MAX_COMMENT_LENGTH} characters or less`,
    }),
  taskId: TaskIdSchema,
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
```

**Server Action Usage** (`src/app/actions/comments.ts`):
```typescript
async function createComment(
  input: CreateCommentInput
): Promise<ActionResponse<CommentResponse>> {
  // Step 1: Sanitize
  const sanitized = {
    text: sanitizeCommentInput(input.text), // trim + sanitizeString
    taskId: input.taskId.trim(),
  };

  // Step 2: Validate with Zod
  const validationResult = CreateCommentSchema.safeParse(sanitized);
  if (!validationResult.success) {
    return {
      success: false,
      error: formatZodErrors(validationResult.error.issues),
    };
  }

  // Step 3: Use validated data
  const { text, taskId } = validationResult.data; // Type-safe!

  // Step 4: Verify ownership (authorization)
  const task = await prisma.task.findFirst({
    where: { id: taskId, ownerId: userId },
  });

  // Step 5: Store sanitized, validated data
  await prisma.comment.create({
    data: {
      text: validationResult.data.text, // Already sanitized
      taskId: validationResult.data.taskId,
      authorId: userId,
    },
  });
}
```

### Key Features of Pattern

1. **Zod Schema**: Single source of truth for validation
2. **Type Inference**: Get types from schema with `z.infer<typeof>`
3. **Chained Validation**: Multiple constraints (trim, min, max)
4. **Sanitization**: Before Zod validation
5. **Error Formatting**: Human-readable validation messages
6. **Type Safety**: After validation, values are type-safe
7. **Authorization**: Separate from validation
8. **Storage**: Store already-sanitized values

---

## 6. Error Handling Pattern

### Database Error Handler (Used Everywhere)

```typescript
/**
 * Handles database errors with secure error messaging.
 * Logs details server-side, returns generic message to client.
 */
function handleDatabaseError(error: unknown, context: string): string {
  // Log detailed information server-side
  if (error instanceof Error) {
    console.error(`Database error in ${context}:`, {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } else {
    console.error(`Database error in ${context}:`, error);
  }

  // Map Prisma errors to user-friendly messages
  if (isPrismaKnownError(error)) {
    switch (error.code) {
      case 'P2025':
        return 'The requested item was not found or you do not have permission to access it.';
      case 'P2002':
        return 'A label with this name already exists.';
      default:
        return 'An error occurred while processing your request. Please try again.';
    }
  }

  // Fallback for unknown errors
  return 'An error occurred while processing your request. Please try again.';
}

/**
 * Type guard for Prisma known errors.
 */
function isPrismaKnownError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}
```

### Usage in Server Action

```typescript
export async function operation(...): Promise<ActionResponse> {
  try {
    // ... validation and execution ...
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'operationName'),
    };
  }
}
```

### Key Features

1. **Information Security**: Detailed logs server-side, generic messages to client
2. **Prisma Error Mapping**: Common errors mapped to user messages
3. **Unknown Error Fallback**: Catches unexpected errors
4. **Development Mode**: Stack traces only in dev
5. **Context Tracking**: Function name logged with error
6. **Type Guard**: Safe type checking for Prisma errors

---

## 7. Rate Limiting Pattern

### In-Memory Implementation (MVP)

```typescript
/**
 * Rate limiting for label creation.
 * In-memory implementation suitable for single-instance deployments.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_LABELS = 10;            // Max per window

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  // If no entry or window expired, start fresh
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  // Check if limit exceeded
  if (userLimit.count >= RATE_LIMIT_MAX_LABELS) {
    return false;
  }

  // Increment counter
  userLimit.count++;
  return true;
}
```

### Usage in Server Action

```typescript
export async function createLabel(
  data: CreateLabelInput
): Promise<ActionResponse<LabelResponse>> {
  try {
    // Authenticate
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: 'Auth required' };

    // Rate limit
    if (!checkRateLimit(userId)) {
      return {
        success: false,
        error: 'Rate limit exceeded. You can create up to 10 labels per hour.',
      };
    }

    // Continue with operation...
  } catch (error) {
    // ...
  }
}
```

### Key Features

1. **Per-User Tracking**: Map keyed by userId
2. **Time Window**: Resets every hour
3. **Counter Increment**: Efficient tracking
4. **Window Reset**: Auto-resets when time expires
5. **Limit Exceeded Check**: Before incrementing
6. **Production TODO**: Documented need for Redis in multi-instance

---

## 8. Optimistic Update Pattern

### Store Implementation

```typescript
addItem: async (data: CreateInput, serverAction) => {
  // 1. Generate temporary ID
  const optimisticId = generateTempId(); // e.g., "temp-1234567890-abc123"

  // 2. Create optimistic item with temp ID
  const optimisticItem: StoreItem = {
    ...data,
    id: optimisticId,
    _isOptimistic: true, // Flag for UI if needed
  };

  // 3. Update store immediately (optimistic)
  set((state) => {
    state.items.set(optimisticId, optimisticItem);
    state.isLoading = true;
  });

  try {
    // 4. Call server action
    const result = await serverAction(data);

    if (result.success && result.data) {
      // 5a. Replace temp ID with real ID
      const transformed = transformResponse(result.data);
      set((state) => {
        // Remove temp entry
        state.items.delete(optimisticId);
        // Add real entry with server-generated ID
        state.items.set(transformed.id, transformed);
        state.isLoading = false;
      });
      return transformed.id;
    } else {
      // 5b. Error - rollback optimistic update
      set((state) => {
        state.items.delete(optimisticId);
        state.error = result.error;
        state.isLoading = false;
      });
      return null;
    }
  } catch (error) {
    // 5c. Exception - rollback optimistic update
    set((state) => {
      state.items.delete(optimisticId);
      state.error = String(error);
      state.isLoading = false;
    });
    return null;
  }
};
```

### Key Features

1. **Immediate Feedback**: User sees item immediately
2. **Temp ID**: Placeholder until server returns real ID
3. **Rollback on Error**: Removes optimistic item if fails
4. **Rollback on Exception**: Handles thrown errors
5. **ID Replacement**: Seamlessly swaps temp ID for real ID
6. **Loading State**: UI can show feedback during operation
7. **No Loading Spinner Needed**: Optimistic update provides feedback

---

## 9. Pagination Pattern

### Server Action with Pagination

```typescript
export async function getCommentsByTask(
  taskId: string,
  options?: { limit?: number; offset?: number }
): Promise<ActionResponse<CommentsListResponse>> {
  try {
    // Validate and limit pagination params
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
    const offset = Math.max(options?.offset ?? 0, 0);

    // Fetch comments with pagination
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { taskId },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.comment.count({ where: { taskId } }),
    ]);

    return {
      success: true,
      data: {
        comments: comments.map(transformComment),
        total, // Client can calculate page count
      },
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error, 'getCommentsByTask'),
    };
  }
}
```

### Response Type

```typescript
export interface CommentsListResponse {
  comments: CommentResponse[];
  total: number;
}
```

### Client Usage

```typescript
const [page, setPage] = useState(1);
const limit = 50;

const { data } = await getCommentsByTask(taskId, {
  limit,
  offset: (page - 1) * limit,
});

const totalPages = Math.ceil(data.total / limit);
```

### Key Features

1. **Safe Params**: Clamps limit between 1-100
2. **Offset-based**: Standard pagination pattern
3. **Total Count**: Enables UI pagination
4. **Efficient Query**: Uses `findMany` + `count` in parallel
5. **Default Limit**: 50 items (good default)
6. **Type-Safe**: Response includes total for calculation

---

## 10. Testing Pattern Reference

### Mock Server Action

```typescript
// In tests/setup.ts
vi.mock('@/app/actions/comments', () => ({
  createComment: vi.fn(async (input: CreateCommentInput) => ({
    success: true,
    data: {
      id: 'test-comment-123',
      text: input.text,
      taskId: input.taskId,
      authorId: 'test-user-456',
      authorName: 'Test User',
      authorEmail: 'test@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editedAt: null,
    },
  })),
  updateComment: vi.fn(async () => ({ success: true })),
  deleteComment: vi.fn(async () => ({ success: true })),
  getCommentsByTask: vi.fn(async () => ({
    success: true,
    data: { comments: [], total: 0 },
  })),
}));
```

### Testing Optimistic Update

```typescript
it('should optimistically update store before server response', async () => {
  const store = useCommentsStore.getState();

  const result = await store.addComment(
    { text: 'Test comment', taskId: 'task-123' },
    vi.fn(async () => ({ success: true, data: { id: 'real-id' } }))
  );

  // After optimistic update, store has item with temp ID
  expect(store.getComments('task-123')).toHaveLength(1);

  // After server response, temp ID replaced with real ID
  expect(result).toBe('real-id');
});
```

---

## Summary

These patterns establish a consistent, secure, and maintainable architecture across Phase 2:

- **Server Actions**: Validation → Sanitization → Authorization → Execution → Activity → Notification
- **Stores**: Optimistic updates with automatic rollback
- **Hooks**: Clean abstraction layer between components and state
- **Components**: Simple, focused UI logic
- **Validation**: Zod for type-safe validation
- **Error Handling**: Secure, user-friendly messages
- **Testing**: Comprehensive mocking and validation

Following these patterns ensures:
✅ Security (validation, sanitization, authorization)
✅ Performance (optimistic updates, efficient queries)
✅ Maintainability (consistent across features)
✅ Testability (mockable server actions)
✅ UX (no loading spinners, immediate feedback)
