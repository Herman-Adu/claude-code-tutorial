/**
 * Unit Test Template
 *
 * Use this template for testing pure functions, utilities, and business logic.
 * Unit tests should be fast, isolated, and test a single unit of functionality.
 *
 * Guidelines:
 * - Mock all external dependencies
 * - Test one function/method at a time
 * - Follow AAA pattern: Arrange, Act, Assert
 * - Use descriptive test names: "should do X when Y"
 * - Aim for 100% code coverage
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// =============================================================================
// IMPORTS
// =============================================================================

// Import the function/module to test
// import { functionToTest } from '@/lib/path-to-module';

// Import types if needed
// import type { SomeType } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock external dependencies
// jest.mock('@/lib/external-module', () => ({
//   externalFunction: jest.fn(),
// }));

// =============================================================================
// TEST SUITE
// =============================================================================

describe('FunctionName or ModuleName', () => {
  // ---------------------------------------------------------------------------
  // Setup and Teardown
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Set up test data
    // testData = { ... };
  });

  afterEach(() => {
    // Clean up after each test
    // jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Happy Path Tests
  // ---------------------------------------------------------------------------

  describe('Happy Path', () => {
    it('should return expected result with valid input', () => {
      // Arrange
      const input = 'valid input';
      const expected = 'expected output';

      // Act
      // const result = functionToTest(input);

      // Assert
      // expect(result).toBe(expected);
    });

    it('should handle typical use case correctly', () => {
      // Arrange
      const input = { /* typical input */ };

      // Act
      // const result = functionToTest(input);

      // Assert
      // expect(result).toBeDefined();
      // expect(result).toHaveProperty('expectedProperty');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      // Arrange
      const input = '';

      // Act & Assert
      // expect(() => functionToTest(input)).not.toThrow();
      // OR
      // expect(functionToTest(input)).toBe(expectedDefaultValue);
    });

    it('should handle null input', () => {
      // Arrange
      const input = null;

      // Act & Assert
      // Test how function handles null
    });

    it('should handle undefined input', () => {
      // Arrange
      const input = undefined;

      // Act & Assert
      // Test how function handles undefined
    });

    it('should handle maximum length input', () => {
      // Arrange
      const input = 'a'.repeat(1000);

      // Act & Assert
      // Test with max length
    });

    it('should handle special characters', () => {
      // Arrange
      const input = '<script>alert("xss")</script>';

      // Act
      // const result = functionToTest(input);

      // Assert
      // Verify XSS prevention
    });
  });

  // ---------------------------------------------------------------------------
  // Error Cases
  // ---------------------------------------------------------------------------

  describe('Error Handling', () => {
    it('should throw error for invalid input', () => {
      // Arrange
      const invalidInput = /* invalid data */;

      // Act & Assert
      // expect(() => functionToTest(invalidInput)).toThrow('Expected error message');
    });

    it('should throw specific error type', () => {
      // Arrange
      const invalidInput = /* invalid data */;

      // Act & Assert
      // expect(() => functionToTest(invalidInput)).toThrow(TypeError);
    });

    it('should handle error from dependency gracefully', () => {
      // Arrange
      // Mock dependency to throw error
      // mockedDependency.mockImplementation(() => {
      //   throw new Error('Dependency error');
      // });

      // Act & Assert
      // Test error handling
    });
  });

  // ---------------------------------------------------------------------------
  // Type Checking (TypeScript specific)
  // ---------------------------------------------------------------------------

  describe('Type Safety', () => {
    it('should accept correct types', () => {
      // Arrange
      const validInput: /* ExpectedType */ = /* ... */;

      // Act
      // const result = functionToTest(validInput);

      // Assert
      // expect(result).toBeDefined();
    });

    it('should provide correct return type', () => {
      // Arrange
      const input = /* ... */;

      // Act
      // const result = functionToTest(input);

      // Assert - check return type matches expectations
      // expect(typeof result).toBe('string');
      // OR use custom type guards
    });
  });

  // ---------------------------------------------------------------------------
  // Performance Tests (if applicable)
  // ---------------------------------------------------------------------------

  describe('Performance', () => {
    it('should complete within performance budget', () => {
      // Arrange
      const input = /* large dataset */;
      const startTime = performance.now();

      // Act
      // functionToTest(input);
      const endTime = performance.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(100); // 100ms budget
    });

    it('should handle large datasets efficiently', () => {
      // Arrange
      const largeInput = Array(10000).fill({ /* data */ });

      // Act & Assert - should not timeout or throw
      // expect(() => functionToTest(largeInput)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Integration with Dependencies
  // ---------------------------------------------------------------------------

  describe('Dependency Integration', () => {
    it('should call dependency with correct arguments', () => {
      // Arrange
      const input = /* ... */;
      // const mockDependency = jest.fn();

      // Act
      // functionToTest(input);

      // Assert
      // expect(mockDependency).toHaveBeenCalledWith(expectedArgs);
      // expect(mockDependency).toHaveBeenCalledTimes(1);
    });

    it('should handle dependency response correctly', () => {
      // Arrange
      // mockDependency.mockResolvedValue(expectedResponse);

      // Act
      // const result = await functionToTest(input);

      // Assert
      // expect(result).toEqual(expectedResult);
    });
  });

  // ---------------------------------------------------------------------------
  // Snapshot Tests (if applicable)
  // ---------------------------------------------------------------------------

  describe('Snapshots', () => {
    it('should match snapshot for typical output', () => {
      // Arrange
      const input = /* typical input */;

      // Act
      // const result = functionToTest(input);

      // Assert
      // expect(result).toMatchSnapshot();
    });
  });
});

// =============================================================================
// HELPER FUNCTIONS (if needed)
// =============================================================================

// function createTestData(): TestDataType {
//   return {
//     // ... test data
//   };
// }

// =============================================================================
// EXAMPLE: Testing a Sanitization Function
// =============================================================================

/*
import { sanitizeInput } from '@/lib/utils';

describe('sanitizeInput', () => {
  describe('XSS Prevention', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should handle mixed content', () => {
      const input = 'Hello <b>World</b> & friends';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello &lt;b&gt;World&lt;/b&gt; &amp; friends');
    });
  });

  describe('Edge Cases', () => {
    it('should return empty string for empty input', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle null gracefully', () => {
      expect(sanitizeInput(null as any)).toBe('');
    });

    it('should preserve safe text', () => {
      const safeText = 'Hello World 123';
      expect(sanitizeInput(safeText)).toBe(safeText);
    });
  });
});
*/

// =============================================================================
// TIPS FOR WRITING GOOD UNIT TESTS
// =============================================================================

/*
1. Test Behavior, Not Implementation
   - Focus on WHAT the function does, not HOW it does it
   - This makes tests resilient to refactoring

2. Use Descriptive Names
   - Good: "should return sanitized string when input contains HTML"
   - Bad: "test1" or "sanitize works"

3. Keep Tests Independent
   - Each test should be able to run in isolation
   - Don't rely on test execution order

4. Mock External Dependencies
   - Database calls
   - API requests
   - File system operations
   - Date/time functions

5. Test Edge Cases
   - Empty values
   - Null/undefined
   - Maximum values
   - Special characters
   - Boundary conditions

6. Aim for High Coverage
   - Strive for 100% line coverage
   - But also test logical branches
   - Don't forget error paths

7. Keep Tests Fast
   - Unit tests should run in milliseconds
   - Mock slow operations
   - Use test doubles instead of real implementations

8. Write Assertions That Matter
   - Be specific in what you're testing
   - Avoid testing framework internals
   - Focus on business logic

9. Use AAA Pattern
   - Arrange: Set up test data
   - Act: Execute the function
   - Assert: Verify the result

10. Clean Up
    - Reset mocks after each test
    - Restore original implementations
    - Clear any global state
*/
