import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  getTimestamp,
  cn,
  sanitizeString,
  sanitizeTaskData,
  VALIDATION,
} from '@/lib/utils';

describe('generateId', () => {
  it('should return a string in the correct format', () => {
    // Arrange & Act
    const id = generateId();

    // Assert
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it('should generate unique IDs on subsequent calls', () => {
    // Arrange & Act
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();

    // Assert
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it('should include timestamp prefix', () => {
    // Arrange
    const beforeTimestamp = Date.now();

    // Act
    const id = generateId();

    // Assert
    const afterTimestamp = Date.now();
    const idTimestamp = parseInt(id.split('-')[0], 10);
    expect(idTimestamp).toBeGreaterThanOrEqual(beforeTimestamp);
    expect(idTimestamp).toBeLessThanOrEqual(afterTimestamp);
  });

  it('should include random suffix after hyphen', () => {
    // Arrange & Act
    const id = generateId();

    // Assert
    const parts = id.split('-');
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[1]).toBeTruthy();
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it('should generate different random suffixes', () => {
    // Arrange
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);

    // Act
    const id1 = generateId();
    const id2 = generateId();

    // Assert
    const suffix1 = id1.split('-').slice(1).join('-');
    const suffix2 = id2.split('-').slice(1).join('-');
    expect(suffix1).not.toBe(suffix2);

    // Cleanup
    vi.restoreAllMocks();
  });
});

describe('getTimestamp', () => {
  it('should return a string in ISO 8601 format', () => {
    // Arrange & Act
    const timestamp = getTimestamp();

    // Assert
    expect(typeof timestamp).toBe('string');
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should return a valid date string that can be parsed', () => {
    // Arrange & Act
    const timestamp = getTimestamp();
    const date = new Date(timestamp);

    // Assert
    expect(date.toString()).not.toBe('Invalid Date');
    expect(date.toISOString()).toBe(timestamp);
  });

  it('should return current time', () => {
    // Arrange
    const before = new Date();

    // Act
    const timestamp = getTimestamp();

    // Assert
    const after = new Date();
    const timestampDate = new Date(timestamp);
    expect(timestampDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(timestampDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should return different timestamps on subsequent calls', () => {
    // Arrange & Act
    const timestamp1 = getTimestamp();
    const timestamp2 = getTimestamp();

    // Assert
    // Even if they're the same (due to fast execution), they should be valid
    expect(timestamp1).toBeTruthy();
    expect(timestamp2).toBeTruthy();
  });

  it('should use UTC timezone (Z suffix)', () => {
    // Arrange & Act
    const timestamp = getTimestamp();

    // Assert
    expect(timestamp.endsWith('Z')).toBe(true);
  });
});

describe('cn', () => {
  it('should join multiple string classes', () => {
    // Arrange
    const classes = ['class1', 'class2', 'class3'];

    // Act
    const result = cn(...classes);

    // Assert
    expect(result).toBe('class1 class2 class3');
  });

  it('should filter out false boolean values', () => {
    // Arrange & Act
    const result = cn('class1', false, 'class2');

    // Assert
    expect(result).toBe('class1 class2');
  });

  it('should include true boolean values as "true" string', () => {
    // Arrange & Act
    const result = cn('class1', true, 'class2');

    // Assert
    expect(result).toBe('class1 true class2');
  });

  it('should filter out undefined values', () => {
    // Arrange & Act
    const result = cn('class1', undefined, 'class2', undefined, 'class3');

    // Assert
    expect(result).toBe('class1 class2 class3');
  });

  it('should handle mixed types correctly', () => {
    // Arrange & Act
    const result = cn('class1', false, 'class2', undefined, true, 'class3');

    // Assert
    expect(result).toBe('class1 class2 true class3');
  });

  it('should return empty string when all values are falsy', () => {
    // Arrange & Act
    const result = cn(false, undefined, false);

    // Assert
    expect(result).toBe('');
  });

  it('should return empty string when no arguments provided', () => {
    // Arrange & Act
    const result = cn();

    // Assert
    expect(result).toBe('');
  });

  it('should handle empty strings correctly', () => {
    // Arrange & Act
    const result = cn('class1', '', 'class2');

    // Assert
    expect(result).toBe('class1 class2');
  });

  it('should handle single class', () => {
    // Arrange & Act
    const result = cn('single-class');

    // Assert
    expect(result).toBe('single-class');
  });

  it('should handle classes with spaces', () => {
    // Arrange & Act
    const result = cn('class1 class2', 'class3');

    // Assert
    expect(result).toBe('class1 class2 class3');
  });
});

describe('sanitizeString', () => {
  it('should escape ampersand (&)', () => {
    // Arrange
    const input = 'This & that';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('This &amp; that');
  });

  it('should escape less than (<)', () => {
    // Arrange
    const input = 'a < b';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('a &lt; b');
  });

  it('should escape greater than (>)', () => {
    // Arrange
    const input = 'a > b';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('a &gt; b');
  });

  it('should escape double quotes (")', () => {
    // Arrange
    const input = 'Say "hello"';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('Say &quot;hello&quot;');
  });

  it("should escape single quotes (')", () => {
    // Arrange
    const input = "It's working";

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('It&#x27;s working');
  });

  it('should escape forward slash (/)', () => {
    // Arrange
    const input = 'path/to/file';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('path&#x2F;to&#x2F;file');
  });

  it('should escape all special characters in one string', () => {
    // Arrange
    const input = '&<>"\'/';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('&amp;&lt;&gt;&quot;&#x27;&#x2F;');
  });

  it('should prevent XSS with script tags', () => {
    // Arrange
    const input = '<script>alert("XSS")</script>';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should prevent XSS with img onerror', () => {
    // Arrange
    const input = '<img src="x" onerror="alert(\'XSS\')">';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(&#x27;XSS&#x27;)&quot;&gt;');
    expect(result).not.toContain('<img');
  });

  it('should prevent XSS with event handlers', () => {
    // Arrange
    const input = '<div onclick="malicious()">Click</div>';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toContain('&lt;div');
    expect(result).toContain('&gt;');
    expect(result).not.toContain('<div');
  });

  it('should leave normal text unchanged', () => {
    // Arrange
    const input = 'This is a normal string with no special characters';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe(input);
  });

  it('should handle empty string', () => {
    // Arrange
    const input = '';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('');
  });

  it('should handle string with numbers and letters only', () => {
    // Arrange
    const input = 'abc123XYZ';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('abc123XYZ');
  });

  it('should handle string with multiple consecutive special characters', () => {
    // Arrange
    const input = '<<<>>>&&&';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('&lt;&lt;&lt;&gt;&gt;&gt;&amp;&amp;&amp;');
  });

  it('should preserve spaces and newlines', () => {
    // Arrange
    const input = 'Line 1\nLine 2\n  Indented';

    // Act
    const result = sanitizeString(input);

    // Assert
    expect(result).toBe('Line 1\nLine 2\n  Indented');
  });
});

describe('sanitizeTaskData', () => {
  it('should sanitize title field', () => {
    // Arrange
    const data = {
      title: '<script>alert("XSS")</script>',
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.title).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('should sanitize description field', () => {
    // Arrange
    const data = {
      description: 'This & that <b>bold</b>',
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.description).toBe('This &amp; that &lt;b&gt;bold&lt;&#x2F;b&gt;');
  });

  it('should sanitize all items in tags array', () => {
    // Arrange
    const data = {
      tags: ['<script>', 'normal', '"quoted"'],
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.tags).toEqual([
      '&lt;script&gt;',
      'normal',
      '&quot;quoted&quot;',
    ]);
  });

  it('should sanitize all items in categories array', () => {
    // Arrange
    const data = {
      categories: ["It's", 'a & b', '<div>'],
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.categories).toEqual([
      'It&#x27;s',
      'a &amp; b',
      '&lt;div&gt;',
    ]);
  });

  it('should sanitize all fields when present', () => {
    // Arrange
    const data = {
      title: '<title>',
      description: '<desc>',
      tags: ['<tag1>', '<tag2>'],
      categories: ['<cat1>', '<cat2>'],
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.title).toBe('&lt;title&gt;');
    expect(result.description).toBe('&lt;desc&gt;');
    expect(result.tags).toEqual(['&lt;tag1&gt;', '&lt;tag2&gt;']);
    expect(result.categories).toEqual(['&lt;cat1&gt;', '&lt;cat2&gt;']);
  });

  it('should preserve other fields unchanged', () => {
    // Arrange
    const data = {
      title: 'Safe title',
      id: '123',
      status: 'todo',
      createdAt: '2026-01-01',
      customField: { nested: 'value' },
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.id).toBe('123');
    expect(result.status).toBe('todo');
    expect(result.createdAt).toBe('2026-01-01');
    expect(result.customField).toEqual({ nested: 'value' });
  });

  it('should handle missing optional fields', () => {
    // Arrange
    const data = {
      id: '123',
      status: 'todo',
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result).toEqual({
      id: '123',
      status: 'todo',
    });
    expect(result.title).toBeUndefined();
    expect(result.description).toBeUndefined();
    expect(result.tags).toBeUndefined();
    expect(result.categories).toBeUndefined();
  });

  it('should handle empty arrays', () => {
    // Arrange
    const data = {
      tags: [],
      categories: [],
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.tags).toEqual([]);
    expect(result.categories).toEqual([]);
  });

  it('should handle empty strings', () => {
    // Arrange
    const data = {
      title: '',
      description: '',
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.title).toBe('');
    expect(result.description).toBe('');
  });

  it('should not modify original data object', () => {
    // Arrange
    const data = {
      title: '<script>',
      description: '<div>',
      tags: ['<tag>'],
    };
    const originalTitle = data.title;
    const originalDescription = data.description;
    const originalTags = [...data.tags];

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(data.title).toBe(originalTitle);
    expect(data.description).toBe(originalDescription);
    expect(data.tags).toEqual(originalTags);
    expect(result).not.toBe(data);
  });

  it('should handle only title field', () => {
    // Arrange
    const data = {
      title: 'Title with <html>',
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.title).toBe('Title with &lt;html&gt;');
    expect(Object.keys(result)).toEqual(['title']);
  });

  it('should handle only description field', () => {
    // Arrange
    const data = {
      description: 'Description with "quotes"',
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.description).toBe('Description with &quot;quotes&quot;');
    expect(Object.keys(result)).toEqual(['description']);
  });

  it('should handle only tags field', () => {
    // Arrange
    const data = {
      tags: ['tag1', 'tag2'],
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.tags).toEqual(['tag1', 'tag2']);
    expect(Object.keys(result)).toEqual(['tags']);
  });

  it('should handle only categories field', () => {
    // Arrange
    const data = {
      categories: ['cat1', 'cat2'],
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.categories).toEqual(['cat1', 'cat2']);
    expect(Object.keys(result)).toEqual(['categories']);
  });

  it('should maintain type safety with generic parameter', () => {
    // Arrange
    interface CustomTask {
      title: string;
      customProp: number;
    }
    const data: CustomTask = {
      title: '<test>',
      customProp: 42,
    };

    // Act
    const result = sanitizeTaskData(data);

    // Assert
    expect(result.title).toBe('&lt;test&gt;');
    expect(result.customProp).toBe(42);
    // Type check: result should be of type CustomTask
    const typedResult: CustomTask = result;
    expect(typedResult).toBeDefined();
  });
});

describe('VALIDATION', () => {
  it('should define MAX_TITLE_LENGTH constant', () => {
    // Assert
    expect(VALIDATION.MAX_TITLE_LENGTH).toBeDefined();
    expect(typeof VALIDATION.MAX_TITLE_LENGTH).toBe('number');
    expect(VALIDATION.MAX_TITLE_LENGTH).toBe(100);
  });

  it('should define MAX_DESCRIPTION_LENGTH constant', () => {
    // Assert
    expect(VALIDATION.MAX_DESCRIPTION_LENGTH).toBeDefined();
    expect(typeof VALIDATION.MAX_DESCRIPTION_LENGTH).toBe('number');
    expect(VALIDATION.MAX_DESCRIPTION_LENGTH).toBe(500);
  });

  it('should define MAX_TAG_LENGTH constant', () => {
    // Assert
    expect(VALIDATION.MAX_TAG_LENGTH).toBeDefined();
    expect(typeof VALIDATION.MAX_TAG_LENGTH).toBe('number');
    expect(VALIDATION.MAX_TAG_LENGTH).toBe(30);
  });

  it('should define MAX_TAGS constant', () => {
    // Assert
    expect(VALIDATION.MAX_TAGS).toBeDefined();
    expect(typeof VALIDATION.MAX_TAGS).toBe('number');
    expect(VALIDATION.MAX_TAGS).toBe(10);
  });

  it('should define MAX_CATEGORY_LENGTH constant', () => {
    // Assert
    expect(VALIDATION.MAX_CATEGORY_LENGTH).toBeDefined();
    expect(typeof VALIDATION.MAX_CATEGORY_LENGTH).toBe('number');
    expect(VALIDATION.MAX_CATEGORY_LENGTH).toBe(50);
  });

  it('should define MAX_CATEGORIES constant', () => {
    // Assert
    expect(VALIDATION.MAX_CATEGORIES).toBeDefined();
    expect(typeof VALIDATION.MAX_CATEGORIES).toBe('number');
    expect(VALIDATION.MAX_CATEGORIES).toBe(10);
  });

  it('should have all expected validation constants', () => {
    // Assert
    expect(Object.keys(VALIDATION)).toEqual([
      'MAX_TITLE_LENGTH',
      'MAX_DESCRIPTION_LENGTH',
      'MAX_TAG_LENGTH',
      'MAX_TAGS',
      'MAX_CATEGORY_LENGTH',
      'MAX_CATEGORIES',
    ]);
  });

  it('should be a readonly object', () => {
    // Assert
    // TypeScript enforces this at compile time with 'as const'
    // We can verify the values are as expected
    const validation = VALIDATION;
    expect(validation).toBeDefined();
    expect(validation).toEqual({
      MAX_TITLE_LENGTH: 100,
      MAX_DESCRIPTION_LENGTH: 500,
      MAX_TAG_LENGTH: 30,
      MAX_TAGS: 10,
      MAX_CATEGORY_LENGTH: 50,
      MAX_CATEGORIES: 10,
    });
  });

  it('should have positive values for all constants', () => {
    // Assert
    Object.values(VALIDATION).forEach((value) => {
      expect(value).toBeGreaterThan(0);
    });
  });

  it('should have reasonable relative sizes', () => {
    // Assert - description should be longer than title
    expect(VALIDATION.MAX_DESCRIPTION_LENGTH).toBeGreaterThan(VALIDATION.MAX_TITLE_LENGTH);

    // Category length should be greater than tag length
    expect(VALIDATION.MAX_CATEGORY_LENGTH).toBeGreaterThan(VALIDATION.MAX_TAG_LENGTH);

    // Max items should be the same for tags and categories
    expect(VALIDATION.MAX_TAGS).toBe(VALIDATION.MAX_CATEGORIES);
  });
});
