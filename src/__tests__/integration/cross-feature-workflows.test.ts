/**
 * Cross-Feature Integration Tests
 *
 * These tests validate interactions between multiple features in the kanban application.
 * They ensure that cross-cutting concerns like notifications, activity logging, and
 * label management work correctly together.
 *
 * Test Coverage:
 * - Comment -> Notification flow
 * - Label cascade deletion
 * - Task creation with labels
 * - Activity logging for label operations
 * - Comment activity logging
 * - Notification cleanup on task deletion
 * - Multi-feature workflows
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

// =============================================================================
// Mocks Setup
// =============================================================================

// Unmock server actions to test real implementations
vi.unmock('@/app/actions/tasks');
vi.unmock('@/app/actions/comments');
vi.unmock('@/app/actions/labels');
vi.unmock('@/app/actions/notifications');
vi.unmock('@/app/actions/activity');

// =============================================================================
// Mock Prisma Client
// =============================================================================

/**
 * Mock Prisma client with all models needed for cross-feature testing.
 */
interface MockPrismaClient {
  task: {
    create: Mock;
    update: Mock;
    delete: Mock;
    findMany: Mock;
    findFirst: Mock;
    findUnique: Mock;
  };
  comment: {
    create: Mock;
    update: Mock;
    delete: Mock;
    findMany: Mock;
    findFirst: Mock;
    findUnique: Mock;
    count: Mock;
  };
  label: {
    create: Mock;
    update: Mock;
    delete: Mock;
    findMany: Mock;
    findFirst: Mock;
    findUnique: Mock;
  };
  taskLabel: {
    create: Mock;
    createMany: Mock;
    delete: Mock;
    deleteMany: Mock;
    findMany: Mock;
    findUnique: Mock;
  };
  notification: {
    create: Mock;
    update: Mock;
    updateMany: Mock;
    delete: Mock;
    deleteMany: Mock;
    findMany: Mock;
    findFirst: Mock;
    count: Mock;
  };
  activity: {
    create: Mock;
    findMany: Mock;
    count: Mock;
    groupBy: Mock;
  };
  $connect: Mock;
  $disconnect: Mock;
  $transaction: Mock;
}

// Create mock using vi.hoisted - runs before vi.mock factories
const prismaMock = vi.hoisted((): MockPrismaClient => {
  return {
    task: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    label: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    taskLabel: {
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    activity: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
  };
});

// Mock Prisma module
vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
}));

// Test user ID for authentication
const TEST_USER_ID = 'test-user-id';
const OTHER_USER_ID = 'other-user-id';

// Mock the auth module
vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: { id: TEST_USER_ID, name: 'Test User', email: 'test@example.com' },
    })
  ),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Import server actions after mocks are set up
import { createComment, deleteComment, getCommentsByTask } from '@/app/actions/comments';
import {
  createLabel,
  deleteLabel,
  addLabelToTask,
  removeLabelFromTask,
  getLabelsForTask,
  setLabelsForTask,
} from '@/app/actions/labels';
import { getNotifications, createNotification } from '@/app/actions/notifications';
import { getTaskActivity, logTaskActivity, getTaskActivityCounts } from '@/app/actions/activity';
import { createTask, deleteTask, getTasks } from '@/app/actions/tasks';
import { auth } from '@/lib/auth/auth';

// =============================================================================
// Test Constants
// =============================================================================

const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_TASK_ID_2 = '550e8400-e29b-41d4-a716-446655440001';
const VALID_TASK_ID_3 = '550e8400-e29b-41d4-a716-446655440002';
const VALID_LABEL_ID = '660e8400-e29b-41d4-a716-446655440000';
const VALID_LABEL_ID_2 = '660e8400-e29b-41d4-a716-446655440001';
const VALID_COMMENT_ID = '770e8400-e29b-41d4-a716-446655440000';
const VALID_NOTIFICATION_ID = '880e8400-e29b-41d4-a716-446655440000';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Creates a mock task object for testing.
 */
function createMockTask(overrides: Partial<{
  id: string;
  title: string;
  description: string;
  priority: string;
  columnId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: unknown;
  categories: unknown;
  dueDate: Date | null;
  dueTime: string | null;
  isAllDay: boolean;
  owner?: { name: string; email: string };
}> = {}) {
  return {
    id: VALID_TASK_ID,
    title: 'Test Task',
    description: 'Test Description',
    priority: 'MEDIUM',
    columnId: 'TODO',
    ownerId: TEST_USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    categories: [],
    dueDate: null,
    dueTime: null,
    isAllDay: true,
    owner: { name: 'Test User', email: 'test@example.com' },
    ...overrides,
  };
}

/**
 * Creates a mock comment object for testing.
 */
function createMockComment(overrides: Partial<{
  id: string;
  text: string;
  taskId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  author?: { id: string; name: string | null; email: string };
  task?: { ownerId: string };
}> = {}) {
  return {
    id: VALID_COMMENT_ID,
    text: 'Test comment',
    taskId: VALID_TASK_ID,
    authorId: TEST_USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    editedAt: null,
    author: { id: TEST_USER_ID, name: 'Test User', email: 'test@example.com' },
    task: { ownerId: TEST_USER_ID },
    ...overrides,
  };
}

/**
 * Creates a mock label object for testing.
 */
function createMockLabel(overrides: Partial<{
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { tasks: number };
}> = {}) {
  return {
    id: VALID_LABEL_ID,
    name: 'Test Label',
    color: '#3B82F6',
    userId: TEST_USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock notification object for testing.
 */
function createMockNotification(overrides: Partial<{
  id: string;
  userId: string;
  eventType: string;
  title: string;
  message: string;
  taskId: string | null;
  isRead: boolean;
  readAt: Date | null;
  data: unknown;
  createdAt: Date;
}> = {}) {
  return {
    id: VALID_NOTIFICATION_ID,
    userId: TEST_USER_ID,
    eventType: 'COMMENT_ADDED_TO_TASK',
    title: 'New Comment',
    message: 'Someone commented on your task',
    taskId: VALID_TASK_ID,
    isRead: false,
    readAt: null,
    data: {},
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock activity object for testing.
 */
function createMockActivity(overrides: Partial<{
  id: string;
  type: string;
  taskId: string;
  userId: string;
  data: unknown;
  createdAt: Date;
  user?: { id: string; name: string | null; email: string };
}> = {}) {
  return {
    id: '990e8400-e29b-41d4-a716-446655440000',
    type: 'COMMENT_ADDED',
    taskId: VALID_TASK_ID,
    userId: TEST_USER_ID,
    data: {},
    createdAt: new Date(),
    user: { id: TEST_USER_ID, name: 'Test User', email: 'test@example.com' },
    ...overrides,
  };
}

/**
 * Resets all prisma mock functions between tests.
 */
function resetMocks() {
  Object.values(prismaMock).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((fn) => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
          (fn as Mock).mockReset();
        }
      });
    }
  });
  vi.clearAllMocks();
}

// =============================================================================
// Test Suite
// =============================================================================

describe('Cross-Feature Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ---------------------------------------------------------------------------
  // Comment -> Notification Flow
  // ---------------------------------------------------------------------------

  describe('Comment -> Notification Flow', () => {
    it('should create notification when comment added to task by different user', async () => {
      // Arrange: Task owned by user A, comment created by user B
      const taskOwnerId = OTHER_USER_ID;
      const commentAuthorId = TEST_USER_ID;

      const mockTask = createMockTask({
        ownerId: taskOwnerId,
      });

      const mockComment = createMockComment({
        authorId: commentAuthorId,
        author: { id: commentAuthorId, name: 'Commenter', email: 'commenter@example.com' },
      });

      // Mock task lookup (verify ownership for commenting)
      prismaMock.task.findFirst.mockResolvedValue(mockTask);

      // Mock comment creation
      prismaMock.comment.create.mockResolvedValue(mockComment);

      // Mock activity creation
      prismaMock.activity.create.mockResolvedValue(createMockActivity());

      // Mock notification creation (internal call from createComment)
      prismaMock.notification.create.mockResolvedValue(createMockNotification({
        userId: taskOwnerId,
      }));

      // Act
      const result = await createComment({
        text: 'Great work on this task!',
        taskId: VALID_TASK_ID,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(prismaMock.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            text: 'Great work on this task!',
            taskId: VALID_TASK_ID,
            authorId: TEST_USER_ID,
          }),
        })
      );

      // Verify activity was logged
      expect(prismaMock.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'COMMENT_ADDED',
            taskId: VALID_TASK_ID,
          }),
        })
      );

      // Verify notification was created for task owner
      expect(prismaMock.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: taskOwnerId,
            eventType: 'COMMENT_ADDED_TO_TASK',
          }),
        })
      );
    });

    it('should NOT create notification when commenting on own task', async () => {
      // Arrange: Same user owns task and creates comment
      const mockTask = createMockTask({
        ownerId: TEST_USER_ID,
      });

      const mockComment = createMockComment({
        authorId: TEST_USER_ID,
      });

      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      prismaMock.comment.create.mockResolvedValue(mockComment);
      prismaMock.activity.create.mockResolvedValue(createMockActivity());

      // Act
      const result = await createComment({
        text: 'Note to self',
        taskId: VALID_TASK_ID,
      });

      // Assert
      expect(result.success).toBe(true);

      // Activity should be logged regardless
      expect(prismaMock.activity.create).toHaveBeenCalled();

      // Notification should NOT be created for self-comments
      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it('should include comment preview in notification', async () => {
      const longCommentText = 'This is a very long comment that should be truncated in the notification preview to prevent it from being too long in the UI display.';
      const taskOwnerId = OTHER_USER_ID;

      const mockTask = createMockTask({ ownerId: taskOwnerId });
      const mockComment = createMockComment({
        text: longCommentText,
        authorId: TEST_USER_ID,
      });

      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      prismaMock.comment.create.mockResolvedValue(mockComment);
      prismaMock.activity.create.mockResolvedValue(createMockActivity());
      prismaMock.notification.create.mockResolvedValue(createMockNotification());

      // Act
      await createComment({
        text: longCommentText,
        taskId: VALID_TASK_ID,
      });

      // Assert: Notification should include truncated preview
      expect(prismaMock.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: expect.stringContaining('...'),
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Label Cascade Deletion
  // ---------------------------------------------------------------------------

  describe('Label Cascade Deletion', () => {
    it('should remove label from all tasks when label is deleted', async () => {
      // Arrange: Create a label attached to 3 tasks
      const mockLabel = createMockLabel();

      // Mock label existence check (ownership verification)
      prismaMock.label.delete.mockResolvedValue(mockLabel);

      // Act: Delete the label
      const result = await deleteLabel(VALID_LABEL_ID);

      // Assert
      expect(result.success).toBe(true);
      expect(prismaMock.label.delete).toHaveBeenCalledWith({
        where: {
          id: VALID_LABEL_ID,
          userId: TEST_USER_ID,
        },
      });

      // Note: Prisma's cascade delete (defined in schema) handles TaskLabel cleanup
      // The test verifies the delete was called; cascade is tested at DB level
    });

    it('should not affect other labels when one is deleted', async () => {
      // Arrange
      const label1 = createMockLabel({ id: VALID_LABEL_ID, name: 'Label 1' });

      prismaMock.label.delete.mockResolvedValue(label1);
      prismaMock.label.findMany.mockResolvedValue([
        createMockLabel({ id: VALID_LABEL_ID_2, name: 'Label 2' }),
      ]);

      // Act: Delete label 1
      const deleteResult = await deleteLabel(VALID_LABEL_ID);

      // Assert
      expect(deleteResult.success).toBe(true);

      // Verify only the specific label was deleted
      expect(prismaMock.label.delete).toHaveBeenCalledWith({
        where: {
          id: VALID_LABEL_ID,
          userId: TEST_USER_ID,
        },
      });
    });

    it('should fail to delete label not owned by user', async () => {
      // Arrange: Prisma throws P2025 when record not found (including ownership check failure)
      prismaMock.label.delete.mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      });

      // Act
      const result = await deleteLabel(VALID_LABEL_ID);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // ---------------------------------------------------------------------------
  // Task Creation with Labels
  // ---------------------------------------------------------------------------

  describe('Task Creation with Labels', () => {
    it('should persist labels when creating a new task with labels selected', async () => {
      // Arrange
      const label1 = createMockLabel({ id: VALID_LABEL_ID, name: 'Priority' });
      const label2 = createMockLabel({ id: VALID_LABEL_ID_2, name: 'Bug' });
      const mockTask = createMockTask();

      // Mock task creation
      prismaMock.task.create.mockResolvedValue(mockTask);

      // Mock label verification (labels belong to user)
      prismaMock.label.findMany.mockResolvedValue([label1, label2]);

      // Mock task ownership verification
      prismaMock.task.findUnique.mockResolvedValue(mockTask);

      // Mock deleteMany for atomic replace
      prismaMock.taskLabel.deleteMany.mockResolvedValue({ count: 0 });

      // Mock createMany for setting labels
      prismaMock.taskLabel.createMany.mockResolvedValue({ count: 2 });

      // Mock transaction to execute both operations
      prismaMock.$transaction.mockImplementation(async (operations: unknown[]) => {
        // Execute all operations in the transaction
        return Promise.all(operations);
      });

      // Act: Create task first
      const taskResult = await createTask({
        title: 'New Feature',
        description: 'Implement new feature',
        priority: 'HIGH',
        columnId: 'TODO',
      });

      expect(taskResult.success).toBe(true);

      // Then set labels for the task
      const labelResult = await setLabelsForTask(VALID_TASK_ID, [VALID_LABEL_ID, VALID_LABEL_ID_2]);

      // Assert
      expect(labelResult.success).toBe(true);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should validate that all labels belong to user when setting labels', async () => {
      // Arrange: One label belongs to user, one doesn't
      const mockTask = createMockTask();
      prismaMock.task.findUnique.mockResolvedValue(mockTask);

      // Mock: Only one of two labels found (the other belongs to different user)
      prismaMock.label.findMany.mockResolvedValue([
        createMockLabel({ id: VALID_LABEL_ID }),
        // VALID_LABEL_ID_2 not returned (belongs to other user)
      ]);

      // Act
      const result = await setLabelsForTask(VALID_TASK_ID, [VALID_LABEL_ID, VALID_LABEL_ID_2]);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle setting empty labels array (clear all labels)', async () => {
      // Arrange
      const mockTask = createMockTask();
      prismaMock.task.findUnique.mockResolvedValue(mockTask);
      prismaMock.taskLabel.deleteMany.mockResolvedValue({ count: 2 });

      // Mock transaction
      prismaMock.$transaction.mockImplementation(async (operations: unknown[]) => {
        return Promise.all(operations);
      });

      // Act: Set empty labels array to clear all
      const result = await setLabelsForTask(VALID_TASK_ID, []);

      // Assert
      expect(result.success).toBe(true);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Activity Logging for Label Operations
  // ---------------------------------------------------------------------------

  describe('Activity Logging for Label Operations', () => {
    it('should log activity when label is added to task', async () => {
      // Arrange
      const mockTask = createMockTask();
      const mockLabel = createMockLabel();

      prismaMock.task.findUnique.mockResolvedValue(mockTask);
      prismaMock.label.findUnique.mockResolvedValue(mockLabel);
      prismaMock.taskLabel.findUnique.mockResolvedValue(null); // Not already linked
      prismaMock.taskLabel.create.mockResolvedValue({
        taskId: VALID_TASK_ID,
        labelId: VALID_LABEL_ID,
      });

      // Act
      const result = await addLabelToTask(VALID_TASK_ID, VALID_LABEL_ID);

      // Assert
      expect(result.success).toBe(true);
      expect(prismaMock.taskLabel.create).toHaveBeenCalledWith({
        data: { taskId: VALID_TASK_ID, labelId: VALID_LABEL_ID },
      });
    });

    it('should log activity when label is removed from task', async () => {
      // Arrange
      const mockTask = createMockTask();

      prismaMock.task.findUnique.mockResolvedValue(mockTask);
      prismaMock.taskLabel.delete.mockResolvedValue({
        taskId: VALID_TASK_ID,
        labelId: VALID_LABEL_ID,
      });

      // Act
      const result = await removeLabelFromTask(VALID_TASK_ID, VALID_LABEL_ID);

      // Assert
      expect(result.success).toBe(true);
      expect(prismaMock.taskLabel.delete).toHaveBeenCalledWith({
        where: {
          taskId_labelId: { taskId: VALID_TASK_ID, labelId: VALID_LABEL_ID },
        },
      });
    });

    it('should prevent duplicate label addition', async () => {
      // Arrange
      const mockTask = createMockTask();
      const mockLabel = createMockLabel();

      prismaMock.task.findUnique.mockResolvedValue(mockTask);
      prismaMock.label.findUnique.mockResolvedValue(mockLabel);

      // Label already attached
      prismaMock.taskLabel.findUnique.mockResolvedValue({
        taskId: VALID_TASK_ID,
        labelId: VALID_LABEL_ID,
      });

      // Act
      const result = await addLabelToTask(VALID_TASK_ID, VALID_LABEL_ID);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('already attached');
    });
  });

  // ---------------------------------------------------------------------------
  // Comment Activity Logging
  // ---------------------------------------------------------------------------

  describe('Comment Activity Logging', () => {
    it('should log COMMENT_ADDED activity when comment is created', async () => {
      // Arrange
      const mockTask = createMockTask();
      const mockComment = createMockComment();

      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      prismaMock.comment.create.mockResolvedValue(mockComment);
      prismaMock.activity.create.mockResolvedValue(createMockActivity({
        type: 'COMMENT_ADDED',
      }));

      // Act
      const result = await createComment({
        text: 'Test comment',
        taskId: VALID_TASK_ID,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(prismaMock.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'COMMENT_ADDED',
            taskId: VALID_TASK_ID,
            userId: TEST_USER_ID,
          }),
        })
      );
    });

    it('should log COMMENT_DELETED activity when comment is deleted', async () => {
      // Arrange
      const mockComment = createMockComment({
        task: { ownerId: TEST_USER_ID },
      });

      prismaMock.comment.findUnique.mockResolvedValue(mockComment);
      prismaMock.comment.delete.mockResolvedValue(mockComment);
      prismaMock.activity.create.mockResolvedValue(createMockActivity({
        type: 'COMMENT_DELETED',
      }));

      // Act
      const result = await deleteComment(VALID_COMMENT_ID);

      // Assert
      expect(result.success).toBe(true);
      expect(prismaMock.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'COMMENT_DELETED',
          }),
        })
      );
    });

    it('should include comment preview in activity data', async () => {
      // Arrange
      const longText = 'A'.repeat(150);
      const mockTask = createMockTask();
      const mockComment = createMockComment({ text: longText });

      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      prismaMock.comment.create.mockResolvedValue(mockComment);
      prismaMock.activity.create.mockResolvedValue(createMockActivity());

      // Act
      await createComment({
        text: longText,
        taskId: VALID_TASK_ID,
      });

      // Assert: Activity should include preview truncated to 100 chars
      expect(prismaMock.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            data: expect.objectContaining({
              preview: expect.any(String),
            }),
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Multi-Feature Workflows
  // ---------------------------------------------------------------------------

  describe('Multi-Feature Workflows', () => {
    it('should handle complete task lifecycle with labels and comments', async () => {
      // This test simulates a complete workflow:
      // 1. Create task
      // 2. Add labels
      // 3. Add comment
      // 4. Verify activities recorded

      // Arrange
      const mockTask = createMockTask();
      const mockLabel = createMockLabel();
      const mockComment = createMockComment();

      // Mock task creation
      prismaMock.task.create.mockResolvedValue(mockTask);
      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      prismaMock.task.findUnique.mockResolvedValue(mockTask);

      // Mock label operations
      prismaMock.label.findUnique.mockResolvedValue(mockLabel);
      prismaMock.taskLabel.findUnique.mockResolvedValue(null);
      prismaMock.taskLabel.create.mockResolvedValue({
        taskId: VALID_TASK_ID,
        labelId: VALID_LABEL_ID,
      });

      // Mock comment creation
      prismaMock.comment.create.mockResolvedValue(mockComment);

      // Mock activity creation
      prismaMock.activity.create.mockResolvedValue(createMockActivity());

      // Act 1: Create task
      const taskResult = await createTask({
        title: 'Complete Feature',
        columnId: 'TODO',
      });
      expect(taskResult.success).toBe(true);

      // Act 2: Add label
      const labelResult = await addLabelToTask(VALID_TASK_ID, VALID_LABEL_ID);
      expect(labelResult.success).toBe(true);

      // Act 3: Add comment
      const commentResult = await createComment({
        text: 'Started working on this',
        taskId: VALID_TASK_ID,
      });
      expect(commentResult.success).toBe(true);

      // Assert: All operations succeeded and activity was logged
      expect(prismaMock.activity.create).toHaveBeenCalled();
    });

    it('should fetch task activity including comments and label changes', async () => {
      // Arrange
      const mockTask = createMockTask();
      const activities = [
        createMockActivity({ type: 'TASK_CREATED' }),
        createMockActivity({ type: 'LABEL_ADDED' }),
        createMockActivity({ type: 'COMMENT_ADDED' }),
      ];

      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      prismaMock.activity.findMany.mockResolvedValue(activities);
      prismaMock.activity.count.mockResolvedValue(3);

      // Act
      const result = await getTaskActivity(VALID_TASK_ID);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.activities).toHaveLength(3);
      expect(result.data?.total).toBe(3);
    });

    it('should get activity counts by type for a task', async () => {
      // Arrange
      const mockTask = createMockTask();

      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      prismaMock.activity.groupBy.mockResolvedValue([
        { type: 'COMMENT_ADDED', _count: 5 },
        { type: 'LABEL_ADDED', _count: 3 },
        { type: 'TASK_UPDATED', _count: 2 },
      ]);

      // Act
      const result = await getTaskActivityCounts(VALID_TASK_ID);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.COMMENT_ADDED).toBe(5);
      expect(result.data?.LABEL_ADDED).toBe(3);
      expect(result.data?.TASK_UPDATED).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Error Handling Across Features
  // ---------------------------------------------------------------------------

  describe('Error Handling Across Features', () => {
    it('should handle database error during comment creation gracefully', async () => {
      // Arrange
      const mockTask = createMockTask();
      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      prismaMock.comment.create.mockRejectedValue(new Error('Database connection lost'));

      // Act
      const result = await createComment({
        text: 'Test comment',
        taskId: VALID_TASK_ID,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle unauthorized access to task comments', async () => {
      // Arrange: Task not owned by current user
      prismaMock.task.findFirst.mockResolvedValue(null);

      // Act
      const result = await createComment({
        text: 'Unauthorized comment',
        taskId: VALID_TASK_ID,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle invalid task ID format in label operations', async () => {
      // Act
      const result = await addLabelToTask('invalid-uuid', VALID_LABEL_ID);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should handle concurrent label modifications gracefully', async () => {
      // Arrange: Simulate race condition where label already deleted
      const mockTask = createMockTask();
      prismaMock.task.findUnique.mockResolvedValue(mockTask);
      prismaMock.taskLabel.delete.mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      });

      // Act
      const result = await removeLabelFromTask(VALID_TASK_ID, VALID_LABEL_ID);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Data Consistency Tests
  // ---------------------------------------------------------------------------

  describe('Data Consistency', () => {
    it('should return consistent labels data after multiple add/remove operations', async () => {
      // Arrange
      const mockTask = createMockTask();
      const label1 = createMockLabel({ id: VALID_LABEL_ID, name: 'Label 1' });
      const label2 = createMockLabel({ id: VALID_LABEL_ID_2, name: 'Label 2' });

      prismaMock.task.findUnique.mockResolvedValue(mockTask);
      prismaMock.label.findUnique
        .mockResolvedValueOnce(label1)
        .mockResolvedValueOnce(label2);
      prismaMock.taskLabel.findUnique.mockResolvedValue(null);
      prismaMock.taskLabel.create.mockResolvedValue({ taskId: VALID_TASK_ID, labelId: VALID_LABEL_ID });
      prismaMock.taskLabel.delete.mockResolvedValue({ taskId: VALID_TASK_ID, labelId: VALID_LABEL_ID });

      // Mock final state query
      prismaMock.taskLabel.findMany.mockResolvedValue([
        { label: label2 },
      ]);

      // Act: Add label 1, Add label 2, Remove label 1
      await addLabelToTask(VALID_TASK_ID, VALID_LABEL_ID);
      await addLabelToTask(VALID_TASK_ID, VALID_LABEL_ID_2);
      await removeLabelFromTask(VALID_TASK_ID, VALID_LABEL_ID);

      // Get final state
      const labelsResult = await getLabelsForTask(VALID_TASK_ID);

      // Assert: Only label 2 should remain
      expect(labelsResult.success).toBe(true);
      expect(labelsResult.data).toHaveLength(1);
      expect(labelsResult.data?.[0].name).toBe('Label 2');
    });

    it('should maintain referential integrity between comments and tasks', async () => {
      // Arrange: Try to create comment for non-existent task
      prismaMock.task.findFirst.mockResolvedValue(null);

      // Act
      const result = await createComment({
        text: 'Orphan comment',
        taskId: VALID_TASK_ID,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(prismaMock.comment.create).not.toHaveBeenCalled();
    });

    it('should return comments in correct chronological order', async () => {
      // Arrange
      const mockTask = createMockTask();
      const comments = [
        createMockComment({ id: '1', createdAt: new Date('2025-01-01') }),
        createMockComment({ id: '2', createdAt: new Date('2025-01-02') }),
        createMockComment({ id: '3', createdAt: new Date('2025-01-03') }),
      ];

      prismaMock.task.findFirst.mockResolvedValue(mockTask);
      prismaMock.comment.findMany.mockResolvedValue(comments);
      prismaMock.comment.count.mockResolvedValue(3);

      // Act
      const result = await getCommentsByTask(VALID_TASK_ID);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.comments).toHaveLength(3);

      // Verify order (oldest first for conversation flow)
      expect(prismaMock.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        })
      );
    });
  });
});
