/**
 * Unit Tests for Zod Validation Schemas
 *
 * Tests all validation schemas for task operations, including:
 * - Valid and invalid inputs
 * - Edge cases and boundary values
 * - Transformations (trim, filter, defaults)
 * - Error messages
 * - Type safety and validation rules
 */

import { describe, it, expect } from 'vitest';
import {
  PrioritySchema,
  ColumnIdSchema,
  TagsSchema,
  CategoriesSchema,
  TaskSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  MoveTaskSchema,
  TaskIdSchema,
  VALIDATION,
} from '@/lib/schemas';

describe('VALIDATION constants', () => {
  it('should export all validation constants', () => {
    expect(VALIDATION.MAX_TITLE_LENGTH).toBe(100);
    expect(VALIDATION.MAX_DESCRIPTION_LENGTH).toBe(500);
    expect(VALIDATION.MAX_TAG_LENGTH).toBe(30);
    expect(VALIDATION.MAX_TAGS).toBe(10);
    expect(VALIDATION.MAX_CATEGORY_LENGTH).toBe(50);
    expect(VALIDATION.MAX_CATEGORIES).toBe(10);
  });
});

describe('PrioritySchema', () => {
  describe('valid inputs', () => {
    it('should accept LOW priority', () => {
      const result = PrioritySchema.safeParse('LOW');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('LOW');
      }
    });

    it('should accept MEDIUM priority', () => {
      const result = PrioritySchema.safeParse('MEDIUM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('MEDIUM');
      }
    });

    it('should accept HIGH priority', () => {
      const result = PrioritySchema.safeParse('HIGH');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('HIGH');
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject lowercase priority values', () => {
      const result = PrioritySchema.safeParse('low');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid option');
      }
    });

    it('should reject invalid priority values', () => {
      const result = PrioritySchema.safeParse('CRITICAL');
      expect(result.success).toBe(false);
    });

    it('should reject non-string values', () => {
      const result = PrioritySchema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it('should reject null values', () => {
      const result = PrioritySchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should reject undefined values', () => {
      const result = PrioritySchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should reject empty strings', () => {
      const result = PrioritySchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});

describe('ColumnIdSchema', () => {
  describe('valid inputs', () => {
    it('should accept TODO column', () => {
      const result = ColumnIdSchema.safeParse('TODO');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('TODO');
      }
    });

    it('should accept IN_PROGRESS column', () => {
      const result = ColumnIdSchema.safeParse('IN_PROGRESS');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('IN_PROGRESS');
      }
    });

    it('should accept COMPLETED column', () => {
      const result = ColumnIdSchema.safeParse('COMPLETED');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('COMPLETED');
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject lowercase column values', () => {
      const result = ColumnIdSchema.safeParse('todo');
      expect(result.success).toBe(false);
    });

    it('should reject invalid column values', () => {
      const result = ColumnIdSchema.safeParse('DONE');
      expect(result.success).toBe(false);
    });

    it('should reject hyphenated format', () => {
      const result = ColumnIdSchema.safeParse('IN-PROGRESS');
      expect(result.success).toBe(false);
    });

    it('should reject non-string values', () => {
      const result = ColumnIdSchema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it('should reject null values', () => {
      const result = ColumnIdSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });
});

describe('TagsSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid tags array', () => {
      const result = TagsSchema.safeParse(['frontend', 'urgent']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['frontend', 'urgent']);
      }
    });

    it('should accept empty array', () => {
      const result = TagsSchema.safeParse([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should accept single tag', () => {
      const result = TagsSchema.safeParse(['bug']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['bug']);
      }
    });

    it('should accept exactly 10 tags (max limit)', () => {
      const tags = Array(10).fill('tag');
      const result = TagsSchema.safeParse(tags);
      expect(result.success).toBe(true);
    });

    it('should accept tag with exactly 30 characters (max length)', () => {
      const tag = 'a'.repeat(30);
      const result = TagsSchema.safeParse([tag]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]).toBe(tag);
      }
    });
  });

  describe('transformations', () => {
    it('should trim whitespace from tags', () => {
      const result = TagsSchema.safeParse(['  frontend  ', '  backend  ']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['frontend', 'backend']);
      }
    });

    it('should filter out empty strings', () => {
      const result = TagsSchema.safeParse(['frontend', '', 'backend']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['frontend', 'backend']);
      }
    });

    it('should filter out strings that become empty after trim', () => {
      const result = TagsSchema.safeParse(['frontend', '   ', 'backend']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['frontend', 'backend']);
      }
    });

    it('should apply both trim and filter', () => {
      const result = TagsSchema.safeParse(['  frontend  ', '', '  ', '  backend  ']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['frontend', 'backend']);
      }
    });
  });

  describe('defaults', () => {
    it('should default to empty array when undefined', () => {
      const result = TagsSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject more than 10 tags', () => {
      const tags = Array(11).fill('tag');
      const result = TagsSchema.safeParse(tags);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Maximum 10 tags allowed');
      }
    });

    it('should reject tag longer than 30 characters', () => {
      const tag = 'a'.repeat(31);
      const result = TagsSchema.safeParse([tag]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tag must be 30 characters or less');
      }
    });

    it('should reject non-array values', () => {
      const result = TagsSchema.safeParse('not-an-array');
      expect(result.success).toBe(false);
    });

    it('should reject array with non-string elements', () => {
      const result = TagsSchema.safeParse([123, 456]);
      expect(result.success).toBe(false);
    });

    it('should reject null values', () => {
      const result = TagsSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });
});

describe('CategoriesSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid categories array', () => {
      const result = CategoriesSchema.safeParse(['Development', 'Testing']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['Development', 'Testing']);
      }
    });

    it('should accept empty array', () => {
      const result = CategoriesSchema.safeParse([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should accept single category', () => {
      const result = CategoriesSchema.safeParse(['Design']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['Design']);
      }
    });

    it('should accept exactly 10 categories (max limit)', () => {
      const categories = Array(10).fill('category');
      const result = CategoriesSchema.safeParse(categories);
      expect(result.success).toBe(true);
    });

    it('should accept category with exactly 50 characters (max length)', () => {
      const category = 'a'.repeat(50);
      const result = CategoriesSchema.safeParse([category]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]).toBe(category);
      }
    });
  });

  describe('transformations', () => {
    it('should trim whitespace from categories', () => {
      const result = CategoriesSchema.safeParse(['  Development  ', '  Testing  ']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['Development', 'Testing']);
      }
    });

    it('should filter out empty strings', () => {
      const result = CategoriesSchema.safeParse(['Development', '', 'Testing']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['Development', 'Testing']);
      }
    });

    it('should filter out strings that become empty after trim', () => {
      const result = CategoriesSchema.safeParse(['Development', '   ', 'Testing']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['Development', 'Testing']);
      }
    });

    it('should apply both trim and filter', () => {
      const result = CategoriesSchema.safeParse(['  Dev  ', '', '  ', '  Test  ']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['Dev', 'Test']);
      }
    });
  });

  describe('defaults', () => {
    it('should default to empty array when undefined', () => {
      const result = CategoriesSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject more than 10 categories', () => {
      const categories = Array(11).fill('category');
      const result = CategoriesSchema.safeParse(categories);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Maximum 10 categories allowed');
      }
    });

    it('should reject category longer than 50 characters', () => {
      const category = 'a'.repeat(51);
      const result = CategoriesSchema.safeParse([category]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Category must be 50 characters or less');
      }
    });

    it('should reject non-array values', () => {
      const result = CategoriesSchema.safeParse('not-an-array');
      expect(result.success).toBe(false);
    });

    it('should reject array with non-string elements', () => {
      const result = CategoriesSchema.safeParse([123, 456]);
      expect(result.success).toBe(false);
    });

    it('should reject null values', () => {
      const result = CategoriesSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });
});

describe('TaskSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid complete task', () => {
      const task = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'HIGH' as const,
        columnId: 'TODO' as const,
        tags: ['frontend'],
        categories: ['Development'],
      };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        // Check core fields match (ignores optional calendar fields dueDate, dueTime, isAllDay)
        expect(result.data.title).toBe(task.title);
        expect(result.data.description).toBe(task.description);
        expect(result.data.priority).toBe(task.priority);
        expect(result.data.columnId).toBe(task.columnId);
        expect(result.data.tags).toEqual(task.tags);
        expect(result.data.categories).toEqual(task.categories);
      }
    });

    it('should accept minimal task with only required title', () => {
      const task = { title: 'Minimal Task' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Minimal Task');
        expect(result.data.description).toBe('');
        expect(result.data.priority).toBe('MEDIUM');
        expect(result.data.columnId).toBe('TODO');
        expect(result.data.tags).toEqual([]);
        expect(result.data.categories).toEqual([]);
      }
    });

    it('should accept title with exactly 100 characters', () => {
      const title = 'a'.repeat(100);
      const task = { title };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe(title);
      }
    });

    it('should accept description with exactly 500 characters', () => {
      const description = 'a'.repeat(500);
      const task = { title: 'Test', description };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(description);
      }
    });

    it('should accept empty description', () => {
      const task = { title: 'Test', description: '' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });
  });

  describe('transformations and defaults', () => {
    it('should trim title whitespace', () => {
      const task = { title: '  Test Task  ' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Task');
      }
    });

    it('should trim description whitespace', () => {
      const task = { title: 'Test', description: '  Test Description  ' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Test Description');
      }
    });

    it('should apply default description when not provided', () => {
      const task = { title: 'Test' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });

    it('should apply default priority when not provided', () => {
      const task = { title: 'Test' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('MEDIUM');
      }
    });

    it('should apply default columnId when not provided', () => {
      const task = { title: 'Test' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.columnId).toBe('TODO');
      }
    });

    it('should apply default empty arrays for tags and categories', () => {
      const task = { title: 'Test' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
        expect(result.data.categories).toEqual([]);
      }
    });

    it('should apply all defaults simultaneously', () => {
      const task = { title: 'Test' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        // Check core fields with defaults (ignores optional calendar fields dueDate, dueTime, isAllDay)
        expect(result.data.title).toBe('Test');
        expect(result.data.description).toBe('');
        expect(result.data.priority).toBe('MEDIUM');
        expect(result.data.columnId).toBe('TODO');
        expect(result.data.tags).toEqual([]);
        expect(result.data.categories).toEqual([]);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing title', () => {
      const task = { description: 'Test' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const task = { title: '' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required');
      }
    });

    it('should reject title that becomes empty after trim', () => {
      const task = { title: '   ' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required');
      }
    });

    it('should reject title longer than 100 characters', () => {
      const title = 'a'.repeat(101);
      const task = { title };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be 100 characters or less');
      }
    });

    it('should reject description longer than 500 characters', () => {
      const description = 'a'.repeat(501);
      const task = { title: 'Test', description };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must be 500 characters or less');
      }
    });

    it('should reject invalid priority', () => {
      const task = { title: 'Test', priority: 'INVALID' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    it('should reject invalid columnId', () => {
      const task = { title: 'Test', columnId: 'INVALID' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    it('should reject invalid tags', () => {
      const task = { title: 'Test', tags: 'not-an-array' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    it('should reject invalid categories', () => {
      const task = { title: 'Test', categories: 'not-an-array' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    it('should reject non-object values', () => {
      const result = TaskSchema.safeParse('not-an-object');
      expect(result.success).toBe(false);
    });

    it('should reject null values', () => {
      const result = TaskSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should reject multiple validation errors', () => {
      const task = {
        title: '',
        description: 'a'.repeat(501),
        priority: 'INVALID',
      };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });
  });
});

describe('CreateTaskSchema', () => {
  it('should be identical to TaskSchema', () => {
    const task = { title: 'Test Task' };
    const taskResult = TaskSchema.safeParse(task);
    const createResult = CreateTaskSchema.safeParse(task);

    expect(taskResult.success).toBe(createResult.success);
    if (taskResult.success && createResult.success) {
      expect(taskResult.data).toEqual(createResult.data);
    }
  });

  it('should accept same valid inputs as TaskSchema', () => {
    const task = {
      title: 'Create Task Test',
      description: 'Test Description',
      priority: 'HIGH' as const,
      columnId: 'TODO' as const,
      tags: ['test'],
      categories: ['Testing'],
    };
    const result = CreateTaskSchema.safeParse(task);
    expect(result.success).toBe(true);
  });

  it('should reject same invalid inputs as TaskSchema', () => {
    const task = { title: '' };
    const result = CreateTaskSchema.safeParse(task);
    expect(result.success).toBe(false);
  });
});

describe('UpdateTaskSchema', () => {
  describe('partial updates', () => {
    it('should accept partial task with only title', () => {
      const update = { title: 'Updated Title' };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Title');
      }
    });

    it('should accept partial task with only description', () => {
      const update = { description: 'Updated Description' };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Updated Description');
      }
    });

    it('should accept partial task with only priority', () => {
      const update = { priority: 'HIGH' as const };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('HIGH');
      }
    });

    it('should accept partial task with only columnId', () => {
      const update = { columnId: 'COMPLETED' as const };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.columnId).toBe('COMPLETED');
      }
    });

    it('should accept partial task with only tags', () => {
      const update = { tags: ['updated-tag'] };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['updated-tag']);
      }
    });

    it('should accept partial task with only categories', () => {
      const update = { categories: ['Updated Category'] };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toEqual(['Updated Category']);
      }
    });

    it('should accept empty object (no fields to update)', () => {
      const update = {};
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        // Note: Even with partial(), default values are still applied for missing fields
        expect(result.data).toMatchObject({
          description: '',
          priority: 'MEDIUM',
          columnId: 'TODO',
          tags: [],
          categories: [],
        });
      }
    });

    it('should accept multiple fields in partial update', () => {
      const update = {
        title: 'Updated Title',
        priority: 'LOW' as const,
        tags: ['new-tag'],
      };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        // Note: Default values are still applied for missing fields
        expect(result.data).toMatchObject(update);
        expect(result.data.description).toBe('');
        expect(result.data.columnId).toBe('TODO');
        expect(result.data.categories).toEqual([]);
      }
    });

    it('should accept complete task (all fields)', () => {
      const update = {
        title: 'Complete Update',
        description: 'Complete Description',
        priority: 'HIGH' as const,
        columnId: 'IN_PROGRESS' as const,
        tags: ['tag1', 'tag2'],
        categories: ['Cat1', 'Cat2'],
      };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        // Check core fields match (ignores optional calendar fields dueDate, dueTime, isAllDay)
        expect(result.data.title).toBe(update.title);
        expect(result.data.description).toBe(update.description);
        expect(result.data.priority).toBe(update.priority);
        expect(result.data.columnId).toBe(update.columnId);
        expect(result.data.tags).toEqual(update.tags);
        expect(result.data.categories).toEqual(update.categories);
      }
    });
  });

  describe('validation on provided fields', () => {
    it('should still validate title if provided', () => {
      const update = { title: 'a'.repeat(101) };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it('should still validate description if provided', () => {
      const update = { description: 'a'.repeat(501) };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it('should still validate priority if provided', () => {
      const update = { priority: 'INVALID' };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it('should still validate columnId if provided', () => {
      const update = { columnId: 'INVALID' };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it('should still validate tags if provided', () => {
      const update = { tags: Array(11).fill('tag') };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it('should still validate categories if provided', () => {
      const update = { categories: Array(11).fill('category') };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it('should allow empty title in partial update (different from create)', () => {
      const update = { title: '' };
      const result = UpdateTaskSchema.safeParse(update);
      // UpdateTaskSchema is partial, so min(1) still applies if title is provided
      expect(result.success).toBe(false);
    });
  });

  describe('optional behavior', () => {
    it('should apply defaults for missing fields in partial schema', () => {
      const update = { title: 'Test' };
      const result = UpdateTaskSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        // Zod's .partial() makes fields optional but still applies defaults during parsing
        // This is documented Zod behavior - defaults are applied even in partial schemas
        // Check core fields (ignores optional calendar fields dueDate, dueTime, isAllDay)
        expect(result.data.title).toBe('Test');
        expect(result.data.description).toBe('');
        expect(result.data.priority).toBe('MEDIUM');
        expect(result.data.columnId).toBe('TODO');
        expect(result.data.tags).toEqual([]);
        expect(result.data.categories).toEqual([]);
      }
    });
  });
});

describe('MoveTaskSchema', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const anotherValidUUID = '987fcdeb-51a2-43d1-b789-123456789abc';

  describe('valid inputs', () => {
    it('should accept valid move operation with required fields', () => {
      const move = {
        taskId: validUUID,
        newColumnId: 'IN_PROGRESS' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(move);
      }
    });

    it('should accept move operation with targetTaskId', () => {
      const move = {
        taskId: validUUID,
        newColumnId: 'COMPLETED' as const,
        targetTaskId: anotherValidUUID,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(move);
      }
    });

    it('should accept move to TODO column', () => {
      const move = { taskId: validUUID, newColumnId: 'TODO' as const };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
    });

    it('should accept move to IN_PROGRESS column', () => {
      const move = { taskId: validUUID, newColumnId: 'IN_PROGRESS' as const };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
    });

    it('should accept move to COMPLETED column', () => {
      const move = { taskId: validUUID, newColumnId: 'COMPLETED' as const };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
    });
  });

  describe('UUID validation', () => {
    it('should accept UUID v4 format', () => {
      const move = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
    });

    it('should accept UUID v1 format', () => {
      const move = {
        taskId: 'a0eebc99-9c0b-1ef8-bb6d-6bb9bd380a11',
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
    });

    it('should accept lowercase UUID', () => {
      const move = {
        taskId: 'abcdef01-2345-6789-abcd-ef0123456789',
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
    });

    it('should accept uppercase UUID', () => {
      const move = {
        taskId: 'ABCDEF01-2345-6789-ABCD-EF0123456789',
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
    });

    it('should accept mixed case UUID', () => {
      const move = {
        taskId: 'AbCdEf01-2345-6789-AbCd-Ef0123456789',
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
    });
  });

  describe('optional targetTaskId', () => {
    it('should accept undefined targetTaskId', () => {
      const move = {
        taskId: validUUID,
        newColumnId: 'TODO' as const,
        targetTaskId: undefined,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
    });

    it('should accept valid targetTaskId UUID', () => {
      const move = {
        taskId: validUUID,
        newColumnId: 'TODO' as const,
        targetTaskId: anotherValidUUID,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing taskId', () => {
      const move = { newColumnId: 'TODO' as const };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(false);
    });

    it('should reject missing newColumnId', () => {
      const move = { taskId: validUUID };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(false);
    });

    it('should reject invalid taskId format', () => {
      const move = {
        taskId: 'not-a-uuid',
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid task ID format');
      }
    });

    it('should reject invalid UUID with wrong length', () => {
      const move = {
        taskId: '123e4567-e89b-12d3-a456',
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID with missing hyphens', () => {
      const move = {
        taskId: '123e4567e89b12d3a456426614174000',
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID with wrong segment lengths', () => {
      const move = {
        taskId: '123e4567-e89b-12d3-a456-4266141740',
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(false);
    });

    it('should reject invalid targetTaskId format', () => {
      const move = {
        taskId: validUUID,
        newColumnId: 'TODO' as const,
        targetTaskId: 'not-a-uuid',
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid target task ID format');
      }
    });

    it('should reject invalid newColumnId', () => {
      const move = {
        taskId: validUUID,
        newColumnId: 'INVALID',
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(false);
    });

    it('should reject empty string as taskId', () => {
      const move = {
        taskId: '',
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(false);
    });

    it('should reject numeric taskId', () => {
      const move = {
        taskId: 123,
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(false);
    });

    it('should reject null taskId', () => {
      const move = {
        taskId: null,
        newColumnId: 'TODO' as const,
      };
      const result = MoveTaskSchema.safeParse(move);
      expect(result.success).toBe(false);
    });
  });
});

describe('TaskIdSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid UUID v4', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = TaskIdSchema.safeParse(uuid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(uuid);
      }
    });

    it('should accept valid UUID v1', () => {
      const uuid = 'a0eebc99-9c0b-1ef8-bb6d-6bb9bd380a11';
      const result = TaskIdSchema.safeParse(uuid);
      expect(result.success).toBe(true);
    });

    it('should accept lowercase UUID', () => {
      const uuid = 'abcdef01-2345-6789-abcd-ef0123456789';
      const result = TaskIdSchema.safeParse(uuid);
      expect(result.success).toBe(true);
    });

    it('should accept uppercase UUID', () => {
      const uuid = 'ABCDEF01-2345-6789-ABCD-EF0123456789';
      const result = TaskIdSchema.safeParse(uuid);
      expect(result.success).toBe(true);
    });

    it('should accept mixed case UUID', () => {
      const uuid = 'AbCdEf01-2345-6789-AbCd-Ef0123456789';
      const result = TaskIdSchema.safeParse(uuid);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject non-UUID string', () => {
      const result = TaskIdSchema.safeParse('not-a-uuid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid task ID format');
      }
    });

    it('should reject UUID with wrong length', () => {
      const result = TaskIdSchema.safeParse('123e4567-e89b-12d3-a456');
      expect(result.success).toBe(false);
    });

    it('should reject UUID without hyphens', () => {
      const result = TaskIdSchema.safeParse('123e4567e89b12d3a456426614174000');
      expect(result.success).toBe(false);
    });

    it('should reject UUID with wrong segment lengths', () => {
      const result = TaskIdSchema.safeParse('123e4567-e89b-12d3-a456-4266141740');
      expect(result.success).toBe(false);
    });

    it('should reject UUID with invalid characters', () => {
      const result = TaskIdSchema.safeParse('123e4567-e89b-12d3-a456-42661417400z');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = TaskIdSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject numeric value', () => {
      const result = TaskIdSchema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it('should reject null value', () => {
      const result = TaskIdSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should reject undefined value', () => {
      const result = TaskIdSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should reject object value', () => {
      const result = TaskIdSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject array value', () => {
      const result = TaskIdSchema.safeParse([]);
      expect(result.success).toBe(false);
    });
  });
});
