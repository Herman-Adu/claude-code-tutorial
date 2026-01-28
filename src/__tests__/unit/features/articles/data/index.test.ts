/**
 * Unit Tests for Articles Data Access Functions
 *
 * Tests the data lookup and utility functions for the articles feature:
 * - findArticleBySlug: Find article by URL slug
 * - getFilesystemPath: Convert metadata paths to filesystem paths
 * - ARTICLES_DATA: Static article metadata array
 *
 * Coverage targets: >80% for the articles data module
 */

import { describe, it, expect } from 'vitest';
import {
  ARTICLES_DATA,
  findArticleBySlug,
  getFilesystemPath,
} from '@/features/articles/data';
import type { ArticleMetadata } from '@/features/articles/types';

// =============================================================================
// ARTICLES_DATA Static Data Tests
// =============================================================================

describe('ARTICLES_DATA', () => {
  it('should be an array', () => {
    expect(Array.isArray(ARTICLES_DATA)).toBe(true);
  });

  it('should contain articles', () => {
    expect(ARTICLES_DATA.length).toBeGreaterThan(0);
  });

  it('should have unique slugs for all articles', () => {
    const slugs = ARTICLES_DATA.map((a) => a.slug);
    const uniqueSlugs = new Set(slugs);

    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  describe('article metadata structure', () => {
    it('each article should have required properties', () => {
      ARTICLES_DATA.forEach((article, index) => {
        expect(article.slug, `Article ${index} missing slug`).toBeDefined();
        expect(article.title, `Article ${index} missing title`).toBeDefined();
        expect(article.description, `Article ${index} missing description`).toBeDefined();
        expect(article.category, `Article ${index} missing category`).toBeDefined();
        expect(article.filePath, `Article ${index} missing filePath`).toBeDefined();
      });
    });

    it('slugs should be URL-safe (lowercase, hyphens allowed)', () => {
      ARTICLES_DATA.forEach((article) => {
        expect(article.slug).toMatch(/^[a-z0-9-]+$/);
        expect(article.slug).not.toContain(' ');
      });
    });

    it('filePaths should start with /docs/blogs/ and end with .md', () => {
      ARTICLES_DATA.forEach((article) => {
        expect(article.filePath).toMatch(/^\/docs\/blogs\/.+\.md$/);
      });
    });

    it('titles should be non-empty strings', () => {
      ARTICLES_DATA.forEach((article) => {
        expect(typeof article.title).toBe('string');
        expect(article.title.length).toBeGreaterThan(0);
      });
    });

    it('descriptions should be non-empty strings', () => {
      ARTICLES_DATA.forEach((article) => {
        expect(typeof article.description).toBe('string');
        expect(article.description.length).toBeGreaterThan(0);
      });
    });

    it('optional date field should be valid ISO date when present', () => {
      ARTICLES_DATA.forEach((article) => {
        if (article.date) {
          // Should match YYYY-MM-DD format
          expect(article.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

          // Should be a valid date
          const date = new Date(article.date);
          expect(date.toString()).not.toBe('Invalid Date');
        }
      });
    });
  });

  describe('category values', () => {
    it('categories should be non-empty strings', () => {
      ARTICLES_DATA.forEach((article) => {
        expect(typeof article.category).toBe('string');
        expect(article.category.length).toBeGreaterThan(0);
      });
    });

    it('should have known category values', () => {
      const knownCategories = ['development', 'testing', 'status'];

      ARTICLES_DATA.forEach((article) => {
        expect(knownCategories).toContain(article.category);
      });
    });
  });
});

// =============================================================================
// findArticleBySlug Tests
// =============================================================================

describe('findArticleBySlug', () => {
  describe('valid slugs', () => {
    it('should return correct article for valid slug "claude-recovery-sprint-c"', () => {
      const result = findArticleBySlug('claude-recovery-sprint-c');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('claude-recovery-sprint-c');
      expect(result?.title).toBe('Claude Recovery Sprint C');
    });

    it('should return correct article for "server-actions-test-status"', () => {
      const result = findArticleBySlug('server-actions-test-status');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('server-actions-test-status');
    });

    it('should return correct article for "testing-plan-implementation-status"', () => {
      const result = findArticleBySlug('testing-plan-implementation-status');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('testing-plan-implementation-status');
    });

    it('should return complete article metadata', () => {
      const result = findArticleBySlug('claude-recovery-sprint-c');

      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('filePath');
    });

    it('should return article with correct types', () => {
      const result = findArticleBySlug('claude-recovery-sprint-c');

      expect(typeof result?.slug).toBe('string');
      expect(typeof result?.title).toBe('string');
      expect(typeof result?.description).toBe('string');
      expect(typeof result?.category).toBe('string');
      expect(typeof result?.filePath).toBe('string');
    });

    it('should return article with optional date when present', () => {
      const result = findArticleBySlug('claude-recovery-sprint-c');

      // This article has a date
      if (result?.date) {
        expect(typeof result.date).toBe('string');
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe('invalid slugs', () => {
    it('should return undefined for invalid slug', () => {
      const result = findArticleBySlug('non-existent-article');

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = findArticleBySlug('');

      expect(result).toBeUndefined();
    });

    it('should return undefined for partial slug match', () => {
      const result = findArticleBySlug('claude');

      expect(result).toBeUndefined();
    });

    it('should be case-sensitive (uppercase should not match)', () => {
      const result = findArticleBySlug('CLAUDE-RECOVERY-SPRINT-C');

      expect(result).toBeUndefined();
    });

    it('should not match with extra characters', () => {
      const result = findArticleBySlug('claude-recovery-sprint-c-extra');

      expect(result).toBeUndefined();
    });

    it('should not match with leading/trailing spaces', () => {
      const result = findArticleBySlug(' claude-recovery-sprint-c ');

      expect(result).toBeUndefined();
    });

    it('should return undefined for similar but wrong slug', () => {
      const result = findArticleBySlug('claude-recovery-sprint');

      expect(result).toBeUndefined();
    });
  });

  describe('all articles findable', () => {
    it('should find all articles in ARTICLES_DATA by their slugs', () => {
      ARTICLES_DATA.forEach((article) => {
        const found = findArticleBySlug(article.slug);

        expect(found).toBeDefined();
        expect(found?.slug).toBe(article.slug);
        expect(found?.title).toBe(article.title);
      });
    });
  });
});

// =============================================================================
// getFilesystemPath Tests
// =============================================================================

describe('getFilesystemPath (articles)', () => {
  describe('paths with leading slash', () => {
    it('should remove leading slash from "/docs/blogs/file.md"', () => {
      const result = getFilesystemPath('/docs/blogs/file.md');

      expect(result).toBe('docs/blogs/file.md');
    });

    it('should handle typical article path', () => {
      const result = getFilesystemPath('/docs/blogs/CLAUDE_RECOVERY_SPRINT_C.md');

      expect(result).toBe('docs/blogs/CLAUDE_RECOVERY_SPRINT_C.md');
    });
  });

  describe('paths without leading slash', () => {
    it('should return "docs/blogs/file.md" unchanged', () => {
      const result = getFilesystemPath('docs/blogs/file.md');

      expect(result).toBe('docs/blogs/file.md');
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

  describe('real article paths', () => {
    it('should correctly transform all article filePaths', () => {
      ARTICLES_DATA.forEach((article) => {
        const result = getFilesystemPath(article.filePath);

        // Should not start with /
        expect(result).not.toMatch(/^\//);

        // Should be the path without leading slash
        expect(result).toBe(article.filePath.slice(1));
      });
    });
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('articles data integration', () => {
  it('all article slugs should be findable via findArticleBySlug', () => {
    const slugs = ARTICLES_DATA.map((a) => a.slug);

    slugs.forEach((slug) => {
      const article = findArticleBySlug(slug);
      expect(article).toBeDefined();
      expect(article?.slug).toBe(slug);
    });
  });

  it('all article filePaths should be transformable via getFilesystemPath', () => {
    ARTICLES_DATA.forEach((article) => {
      const fsPath = getFilesystemPath(article.filePath);

      // Should be a valid relative path
      expect(fsPath).not.toMatch(/^\//);
      expect(fsPath).toMatch(/\.md$/);
      expect(fsPath.length).toBeGreaterThan(0);
    });
  });

  it('should maintain data consistency', () => {
    const totalArticles = ARTICLES_DATA.length;
    const findableArticles = ARTICLES_DATA.filter((a) => findArticleBySlug(a.slug)).length;

    expect(totalArticles).toBe(findableArticles);
  });

  it('articles should have unique filePaths', () => {
    const filePaths = ARTICLES_DATA.map((a) => a.filePath);
    const uniquePaths = new Set(filePaths);

    expect(filePaths.length).toBe(uniquePaths.size);
  });
});
