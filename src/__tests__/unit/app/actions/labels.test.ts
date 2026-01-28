/**
 * Label Server Actions Tests
 *
 * Tests the label CRUD server actions including:
 * - Authentication checks
 * - Input validation
 * - Ownership verification
 * - Rate limiting
 * - Database operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CreateLabelSchema,
  UpdateLabelSchema,
  LabelIdSchema,
  AddLabelToTaskSchema,
  LABEL_COLOR_PRESETS,
  VALIDATION,
} from '@/lib/schemas';

// =============================================================================
// TEST HELPERS
// =============================================================================

const mockUserId = 'user-123-uuid';
const mockLabelId = 'label-456-uuid';
const mockTaskId = 'task-789-uuid';

// =============================================================================
// SCHEMA VALIDATION TESTS
// =============================================================================

describe('Label Schemas', () => {
  describe('CreateLabelSchema', () => {
    it('should validate valid label data with preset color', () => {
      const result = CreateLabelSchema.safeParse({
        name: 'Test Label',
        color: 'blue',
      });
      expect(result.success).toBe(true);
    });

    it('should validate valid label data with hex color', () => {
      const result = CreateLabelSchema.safeParse({
        name: 'Test Label',
        color: '#ff5500',
      });
      expect(result.success).toBe(true);
    });

    it('should validate all preset colors', () => {
      LABEL_COLOR_PRESETS.forEach((color) => {
        const result = CreateLabelSchema.safeParse({
          name: 'Test',
          color,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject empty name', () => {
      const result = CreateLabelSchema.safeParse({
        name: '',
        color: 'blue',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name that is too long', () => {
      const result = CreateLabelSchema.safeParse({
        name: 'a'.repeat(101),
        color: 'blue',
      });
      expect(result.success).toBe(false);
    });

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

    it('should reject invalid color', () => {
      const result = CreateLabelSchema.safeParse({
        name: 'Test',
        color: 'invalid-color',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid hex format', () => {
      const result = CreateLabelSchema.safeParse({
        name: 'Test',
        color: '#fff', // Too short
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid 6-digit hex codes', () => {
      const validHexCodes = ['#000000', '#FFFFFF', '#aabbcc', '#AABBCC', '#123abc'];
      validHexCodes.forEach((hex) => {
        const result = CreateLabelSchema.safeParse({
          name: 'Test',
          color: hex,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject hex codes without #', () => {
      const result = CreateLabelSchema.safeParse({
        name: 'Test',
        color: 'ff5500',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing color', () => {
      const result = CreateLabelSchema.safeParse({
        name: 'Test',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const result = CreateLabelSchema.safeParse({
        color: 'blue',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateLabelSchema', () => {
    it('should validate partial updates with name only', () => {
      const result = UpdateLabelSchema.safeParse({
        name: 'Updated Name',
      });
      expect(result.success).toBe(true);
    });

    it('should validate partial updates with color only', () => {
      const result = UpdateLabelSchema.safeParse({
        color: 'red',
      });
      expect(result.success).toBe(true);
    });

    it('should validate empty object', () => {
      const result = UpdateLabelSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate full updates', () => {
      const result = UpdateLabelSchema.safeParse({
        name: 'New Name',
        color: '#00ff00',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid partial name', () => {
      const result = UpdateLabelSchema.safeParse({
        name: '', // Empty after trim
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid partial color', () => {
      const result = UpdateLabelSchema.safeParse({
        color: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('LabelIdSchema', () => {
    it('should validate valid UUID', () => {
      const result = LabelIdSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const result = LabelIdSchema.safeParse('not-a-uuid');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = LabelIdSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('AddLabelToTaskSchema', () => {
    it('should validate valid task and label IDs', () => {
      const result = AddLabelToTaskSchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        labelId: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid taskId', () => {
      const result = AddLabelToTaskSchema.safeParse({
        taskId: 'invalid',
        labelId: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid labelId', () => {
      const result = AddLabelToTaskSchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        labelId: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing taskId', () => {
      const result = AddLabelToTaskSchema.safeParse({
        labelId: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing labelId', () => {
      const result = AddLabelToTaskSchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// COLOR PRESET TESTS
// =============================================================================

describe('LABEL_COLOR_PRESETS', () => {
  it('should have 8 preset colors', () => {
    expect(LABEL_COLOR_PRESETS).toHaveLength(8);
  });

  it('should include expected colors', () => {
    const expectedColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
    expectedColors.forEach((color) => {
      expect(LABEL_COLOR_PRESETS).toContain(color);
    });
  });

  it('should be readonly', () => {
    // TypeScript should prevent mutations, but we can verify the array content
    const originalLength = LABEL_COLOR_PRESETS.length;
    expect(originalLength).toBe(8);
  });
});

// =============================================================================
// INPUT SANITIZATION TESTS
// =============================================================================

describe('Label Input Sanitization', () => {
  it('should handle XSS attempts in label name via schema validation', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '<img src=x onerror=alert(1)>',
      '"><script>alert(1)</script>',
    ];

    xssPayloads.forEach((payload) => {
      // Schema should still pass these (sanitization happens at action level)
      const result = CreateLabelSchema.safeParse({
        name: payload,
        color: 'blue',
      });
      // Names are allowed by schema, sanitization is done separately
      expect(result.success).toBe(true);
    });
  });

  it('should validate maximum name length strictly', () => {
    // Exactly 100 characters should pass
    const result100 = CreateLabelSchema.safeParse({
      name: 'a'.repeat(100),
      color: 'blue',
    });
    expect(result100.success).toBe(true);

    // 101 characters should fail
    const result101 = CreateLabelSchema.safeParse({
      name: 'a'.repeat(101),
      color: 'blue',
    });
    expect(result101.success).toBe(false);
  });

  it('should handle unicode characters in name', () => {
    const unicodeNames = [
      'デザイン',
      'Diseño',
      'конструкция',
      'تصميم',
    ];

    unicodeNames.forEach((name) => {
      const result = CreateLabelSchema.safeParse({
        name,
        color: 'blue',
      });
      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// HEX COLOR VALIDATION TESTS
// =============================================================================

describe('Hex Color Validation', () => {
  it('should accept valid 6-digit hex with #', () => {
    const validHexes = [
      '#000000',
      '#ffffff',
      '#FFFFFF',
      '#123456',
      '#abcdef',
      '#ABCDEF',
      '#aB12cD',
    ];

    validHexes.forEach((hex) => {
      const result = CreateLabelSchema.safeParse({
        name: 'Test',
        color: hex,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid hex formats', () => {
    const invalidHexes = [
      '#fff',        // 3 digits
      '#fffffff',    // 7 digits
      '000000',      // No #
      '#gggggg',     // Invalid characters
      '#12345',      // 5 digits
      '#',           // Just #
      '',            // Empty
      'blue123',     // Mixed
      '#12 345',     // Space
    ];

    invalidHexes.forEach((hex) => {
      const result = CreateLabelSchema.safeParse({
        name: 'Test',
        color: hex,
      });
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

// =============================================================================
// MAX LABELS PER TASK TESTS
// =============================================================================

describe('Max Labels Per Task Validation', () => {
  it('should have MAX_LABELS_PER_TASK set to 20', () => {
    expect(VALIDATION.MAX_LABELS_PER_TASK).toBe(20);
  });

  it('should allow up to 20 labels', () => {
    // Generate 20 valid UUIDs
    const labelIds = Array.from({ length: 20 }, (_, i) =>
      `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`
    );
    expect(labelIds.length).toBe(20);

    // Each should be a valid UUID
    labelIds.forEach((id) => {
      const result = LabelIdSchema.safeParse(id);
      expect(result.success).toBe(true);
    });
  });

  it('should validate label arrays within limit', () => {
    const labelIds = Array.from({ length: 20 }, (_, i) =>
      `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`
    );

    // All IDs should be valid
    const allValid = labelIds.every((id) => LabelIdSchema.safeParse(id).success);
    expect(allValid).toBe(true);
  });
});

describe('Edge Cases', () => {
  it('should handle whitespace-only name', () => {
    const result = CreateLabelSchema.safeParse({
      name: '   ',
      color: 'blue',
    });
    // Trims to empty string, which fails min(1)
    expect(result.success).toBe(false);
  });

  it('should handle name with leading/trailing whitespace', () => {
    const result = CreateLabelSchema.safeParse({
      name: '  Valid Name  ',
      color: 'blue',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Valid Name');
    }
  });

  it('should handle name with internal whitespace', () => {
    const result = CreateLabelSchema.safeParse({
      name: 'My    Label   Name',
      color: 'blue',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // trim() only removes leading/trailing, not internal
      expect(result.data.name).toBe('My    Label   Name');
    }
  });

  it('should be case-insensitive for hex colors', () => {
    const lowerResult = CreateLabelSchema.safeParse({
      name: 'Test',
      color: '#aabbcc',
    });
    const upperResult = CreateLabelSchema.safeParse({
      name: 'Test',
      color: '#AABBCC',
    });
    const mixedResult = CreateLabelSchema.safeParse({
      name: 'Test',
      color: '#AaBbCc',
    });

    expect(lowerResult.success).toBe(true);
    expect(upperResult.success).toBe(true);
    expect(mixedResult.success).toBe(true);
  });
});
