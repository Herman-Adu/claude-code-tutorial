/**
 * Unit Tests for Path Utility Functions
 *
 * Tests the getFilesystemPath utility function that converts
 * metadata paths to filesystem-relative paths.
 *
 * Coverage targets: >80% for the path utility module
 */

import { describe, it, expect } from 'vitest';
import { getFilesystemPath } from '@/lib/path';

// =============================================================================
// getFilesystemPath Tests
// =============================================================================

describe('getFilesystemPath', () => {
  describe('paths with leading slash', () => {
    it('should remove leading slash from "/docs/file.md"', () => {
      const result = getFilesystemPath('/docs/file.md');
      expect(result).toBe('docs/file.md');
    });

    it('should remove leading slash from "/docs/guides/intro.md"', () => {
      const result = getFilesystemPath('/docs/guides/intro.md');
      expect(result).toBe('docs/guides/intro.md');
    });

    it('should remove leading slash from "/single-file.md"', () => {
      const result = getFilesystemPath('/single-file.md');
      expect(result).toBe('single-file.md');
    });

    it('should remove leading slash from "/deeply/nested/path/file.md"', () => {
      const result = getFilesystemPath('/deeply/nested/path/file.md');
      expect(result).toBe('deeply/nested/path/file.md');
    });

    it('should handle path with only a leading slash', () => {
      const result = getFilesystemPath('/');
      expect(result).toBe('');
    });
  });

  describe('paths without leading slash', () => {
    it('should return "docs/file.md" unchanged', () => {
      const result = getFilesystemPath('docs/file.md');
      expect(result).toBe('docs/file.md');
    });

    it('should return "file.md" unchanged', () => {
      const result = getFilesystemPath('file.md');
      expect(result).toBe('file.md');
    });

    it('should return nested path unchanged', () => {
      const result = getFilesystemPath('docs/tutorials/guide.md');
      expect(result).toBe('docs/tutorials/guide.md');
    });

    it('should return deeply nested path unchanged', () => {
      const result = getFilesystemPath('a/b/c/d/e/f.md');
      expect(result).toBe('a/b/c/d/e/f.md');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = getFilesystemPath('');
      expect(result).toBe('');
    });

    it('should not remove internal slashes', () => {
      const result = getFilesystemPath('/docs/sub/dir/file.md');
      expect(result).toBe('docs/sub/dir/file.md');
      expect(result).toContain('/');
    });

    it('should only remove the first leading slash', () => {
      // Edge case: path starting with double slash
      const result = getFilesystemPath('//double/slash.md');
      // Since it only checks startsWith('/'), it removes one slash
      expect(result).toBe('/double/slash.md');
    });

    it('should preserve trailing slash if present', () => {
      const result = getFilesystemPath('/docs/');
      expect(result).toBe('docs/');
    });

    it('should handle paths with special characters', () => {
      const result = getFilesystemPath('/docs/file-with_special.chars.md');
      expect(result).toBe('docs/file-with_special.chars.md');
    });

    it('should handle paths with spaces', () => {
      const result = getFilesystemPath('/docs/file with spaces.md');
      expect(result).toBe('docs/file with spaces.md');
    });

    it('should handle paths with encoded characters', () => {
      const result = getFilesystemPath('/docs/file%20name.md');
      expect(result).toBe('docs/file%20name.md');
    });
  });

  describe('real-world path patterns', () => {
    it('should handle tutorial paths', () => {
      const paths = [
        '/docs/tutorials/getting-started.md',
        '/docs/tutorials/creating-tasks.md',
        '/docs/tutorials/understanding-columns.md',
      ];

      paths.forEach((path) => {
        const result = getFilesystemPath(path);
        expect(result).toBe(path.slice(1));
        expect(result).not.toMatch(/^\//);
      });
    });

    it('should handle documentation paths', () => {
      const paths = [
        '/docs/architecture/overview.md',
        '/docs/components/kanban-board.md',
        '/docs/api/api-and-actions.md',
      ];

      paths.forEach((path) => {
        const result = getFilesystemPath(path);
        expect(result).toBe(path.slice(1));
        expect(result).not.toMatch(/^\//);
      });
    });

    it('should handle article/blog paths', () => {
      const paths = [
        '/docs/blogs/CLAUDE_RECOVERY_SPRINT_C.md',
        '/docs/blogs/SERVER_ACTIONS_TEST_STATUS.md',
      ];

      paths.forEach((path) => {
        const result = getFilesystemPath(path);
        expect(result).toBe(path.slice(1));
        expect(result).not.toMatch(/^\//);
      });
    });
  });

  describe('return type', () => {
    it('should always return a string', () => {
      const inputs = [
        '/docs/file.md',
        'docs/file.md',
        '',
        '/',
        '/a/b/c.md',
      ];

      inputs.forEach((input) => {
        const result = getFilesystemPath(input);
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('idempotency', () => {
    it('should be idempotent for paths without leading slash', () => {
      const path = 'docs/file.md';
      const result1 = getFilesystemPath(path);
      const result2 = getFilesystemPath(result1);
      const result3 = getFilesystemPath(result2);

      expect(result1).toBe(path);
      expect(result2).toBe(path);
      expect(result3).toBe(path);
    });

    it('should reach stable state after one call for paths with leading slash', () => {
      const path = '/docs/file.md';
      const result1 = getFilesystemPath(path);
      const result2 = getFilesystemPath(result1);

      expect(result1).toBe('docs/file.md');
      expect(result2).toBe('docs/file.md');
    });
  });
});
