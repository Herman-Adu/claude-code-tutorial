/**
 * Unit Tests for Docs Data Access Functions
 *
 * Tests the data lookup and utility functions for the docs feature:
 * - findDocBySlug: Find document by URL slug
 * - getFilesystemPath: Convert metadata paths to filesystem paths
 * - DOCS_DATA: Static documentation metadata array
 *
 * Coverage targets: >80% for the docs data module
 */

import { describe, it, expect } from 'vitest';
import {
  DOCS_DATA,
  findDocBySlug,
  getFilesystemPath,
} from '@/features/docs/data';
import type { DocMetadata } from '@/features/docs/types';

// =============================================================================
// DOCS_DATA Static Data Tests
// =============================================================================

describe('DOCS_DATA', () => {
  it('should be an array', () => {
    expect(Array.isArray(DOCS_DATA)).toBe(true);
  });

  it('should contain documents', () => {
    expect(DOCS_DATA.length).toBeGreaterThan(0);
  });

  it('should have unique slugs for all documents', () => {
    const slugs = DOCS_DATA.map((d) => d.slug);
    const uniqueSlugs = new Set(slugs);

    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  describe('document metadata structure', () => {
    it('each document should have required properties', () => {
      DOCS_DATA.forEach((doc, index) => {
        expect(doc.slug, `Doc ${index} missing slug`).toBeDefined();
        expect(doc.title, `Doc ${index} missing title`).toBeDefined();
        expect(doc.description, `Doc ${index} missing description`).toBeDefined();
        expect(doc.category, `Doc ${index} missing category`).toBeDefined();
        expect(doc.filePath, `Doc ${index} missing filePath`).toBeDefined();
      });
    });

    it('slugs should be URL-safe (lowercase, hyphens allowed)', () => {
      DOCS_DATA.forEach((doc) => {
        expect(doc.slug).toMatch(/^[a-z0-9-]+$/);
        expect(doc.slug).not.toContain(' ');
      });
    });

    it('filePaths should start with /docs/ and end with .md', () => {
      DOCS_DATA.forEach((doc) => {
        expect(doc.filePath).toMatch(/^\/docs\/.+\.md$/);
      });
    });

    it('titles should be non-empty strings', () => {
      DOCS_DATA.forEach((doc) => {
        expect(typeof doc.title).toBe('string');
        expect(doc.title.length).toBeGreaterThan(0);
      });
    });

    it('descriptions should be non-empty strings', () => {
      DOCS_DATA.forEach((doc) => {
        expect(typeof doc.description).toBe('string');
        expect(doc.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('category distribution', () => {
    const validCategories = [
      'getting-started',
      'guides',
      'architecture',
      'components',
      'api',
      'testing',
      'reviews',
      'blogs',
      'planned-features',
    ];

    it('all categories should be valid', () => {
      DOCS_DATA.forEach((doc) => {
        expect(validCategories).toContain(doc.category);
      });
    });

    it('should have documents in architecture category', () => {
      const architectureDocs = DOCS_DATA.filter((d) => d.category === 'architecture');
      expect(architectureDocs.length).toBeGreaterThan(0);
    });

    it('should have documents in components category', () => {
      const componentDocs = DOCS_DATA.filter((d) => d.category === 'components');
      expect(componentDocs.length).toBeGreaterThan(0);
    });

    it('should have documents in testing category', () => {
      const testingDocs = DOCS_DATA.filter((d) => d.category === 'testing');
      expect(testingDocs.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// findDocBySlug Tests
// =============================================================================

describe('findDocBySlug', () => {
  describe('valid slugs', () => {
    it('should return correct document for valid slug "project-setup"', () => {
      const result = findDocBySlug('project-setup');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('project-setup');
      expect(result?.title).toBe('Project Setup');
    });

    it('should return correct document for "architecture-overview"', () => {
      const result = findDocBySlug('architecture-overview');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('architecture-overview');
    });

    it('should return correct document for "kanban-board"', () => {
      const result = findDocBySlug('kanban-board');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('kanban-board');
    });

    it('should return complete document metadata', () => {
      const result = findDocBySlug('project-setup');

      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('filePath');
    });

    it('should return document with correct types', () => {
      const result = findDocBySlug('project-setup');

      expect(typeof result?.slug).toBe('string');
      expect(typeof result?.title).toBe('string');
      expect(typeof result?.description).toBe('string');
      expect(typeof result?.category).toBe('string');
      expect(typeof result?.filePath).toBe('string');
    });
  });

  describe('invalid slugs', () => {
    it('should return undefined for invalid slug', () => {
      const result = findDocBySlug('non-existent-document');

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = findDocBySlug('');

      expect(result).toBeUndefined();
    });

    it('should return undefined for partial slug match', () => {
      const result = findDocBySlug('project');

      expect(result).toBeUndefined();
    });

    it('should be case-sensitive (uppercase should not match)', () => {
      const result = findDocBySlug('PROJECT-SETUP');

      expect(result).toBeUndefined();
    });

    it('should not match with extra characters', () => {
      const result = findDocBySlug('project-setup-extra');

      expect(result).toBeUndefined();
    });

    it('should not match with leading/trailing spaces', () => {
      const result = findDocBySlug(' project-setup ');

      expect(result).toBeUndefined();
    });
  });

  describe('all documents findable', () => {
    it('should find all documents in DOCS_DATA by their slugs', () => {
      DOCS_DATA.forEach((doc) => {
        const found = findDocBySlug(doc.slug);

        expect(found).toBeDefined();
        expect(found?.slug).toBe(doc.slug);
        expect(found?.title).toBe(doc.title);
      });
    });
  });
});

// =============================================================================
// getFilesystemPath Tests
// =============================================================================

describe('getFilesystemPath (docs)', () => {
  describe('paths with leading slash', () => {
    it('should remove leading slash from "/docs/file.md"', () => {
      const result = getFilesystemPath('/docs/file.md');

      expect(result).toBe('docs/file.md');
    });

    it('should remove leading slash from "/docs/architecture/overview.md"', () => {
      const result = getFilesystemPath('/docs/architecture/overview.md');

      expect(result).toBe('docs/architecture/overview.md');
    });

    it('should handle deeply nested paths', () => {
      const result = getFilesystemPath('/docs/guides/sub/deep/file.md');

      expect(result).toBe('docs/guides/sub/deep/file.md');
    });
  });

  describe('paths without leading slash', () => {
    it('should return "docs/file.md" unchanged', () => {
      const result = getFilesystemPath('docs/file.md');

      expect(result).toBe('docs/file.md');
    });

    it('should return nested path unchanged', () => {
      const result = getFilesystemPath('docs/architecture/overview.md');

      expect(result).toBe('docs/architecture/overview.md');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = getFilesystemPath('');

      expect(result).toBe('');
    });

    it('should handle just a slash', () => {
      const result = getFilesystemPath('/');

      expect(result).toBe('');
    });
  });

  describe('real doc paths', () => {
    it('should correctly transform all doc filePaths', () => {
      DOCS_DATA.forEach((doc) => {
        const result = getFilesystemPath(doc.filePath);

        // Should not start with /
        expect(result).not.toMatch(/^\//);

        // Should be the path without leading slash
        expect(result).toBe(doc.filePath.slice(1));
      });
    });
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('docs data integration', () => {
  it('all doc slugs should be findable via findDocBySlug', () => {
    const slugs = DOCS_DATA.map((d) => d.slug);

    slugs.forEach((slug) => {
      const doc = findDocBySlug(slug);
      expect(doc).toBeDefined();
      expect(doc?.slug).toBe(slug);
    });
  });

  it('all doc filePaths should be transformable via getFilesystemPath', () => {
    DOCS_DATA.forEach((doc) => {
      const fsPath = getFilesystemPath(doc.filePath);

      // Should be a valid relative path
      expect(fsPath).not.toMatch(/^\//);
      expect(fsPath).toMatch(/\.md$/);
      expect(fsPath.length).toBeGreaterThan(0);
    });
  });

  it('should maintain data consistency', () => {
    const totalDocs = DOCS_DATA.length;
    const findableDocs = DOCS_DATA.filter((d) => findDocBySlug(d.slug)).length;

    expect(totalDocs).toBe(findableDocs);
  });
});
