/**
 * Unit Tests for Tutorials Data Access Functions
 *
 * Tests the data lookup and utility functions for the tutorials feature:
 * - getTutorialBySlug: Find tutorial by URL slug
 * - getAllTutorialSlugs: Get all available slugs for static generation
 * - getFilesystemPath: Convert metadata paths to filesystem paths
 * - TUTORIALS_DATA: Static tutorial metadata array
 *
 * Coverage targets: >80% for the tutorials data module
 */

import { describe, it, expect } from 'vitest';
import {
  TUTORIALS_DATA,
  getTutorialBySlug,
  getAllTutorialSlugs,
  getFilesystemPath,
} from '@/features/tutorials/data';
import type { TutorialMetadata } from '@/features/tutorials/types';

// =============================================================================
// TUTORIALS_DATA Static Data Tests
// =============================================================================

describe('TUTORIALS_DATA', () => {
  it('should be an array', () => {
    expect(Array.isArray(TUTORIALS_DATA)).toBe(true);
  });

  it('should contain tutorials (at least 9 based on CLAUDE.md)', () => {
    // CLAUDE.md mentions 9 tutorials for the expected count
    expect(TUTORIALS_DATA.length).toBeGreaterThanOrEqual(9);
  });

  it('should have unique slugs for all tutorials', () => {
    const slugs = TUTORIALS_DATA.map((t) => t.slug);
    const uniqueSlugs = new Set(slugs);

    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  describe('tutorial metadata structure', () => {
    it('each tutorial should have required properties', () => {
      TUTORIALS_DATA.forEach((tutorial, index) => {
        expect(tutorial.slug, `Tutorial ${index} missing slug`).toBeDefined();
        expect(tutorial.title, `Tutorial ${index} missing title`).toBeDefined();
        expect(tutorial.description, `Tutorial ${index} missing description`).toBeDefined();
        expect(tutorial.category, `Tutorial ${index} missing category`).toBeDefined();
        expect(tutorial.filePath, `Tutorial ${index} missing filePath`).toBeDefined();
        expect(tutorial.duration, `Tutorial ${index} missing duration`).toBeDefined();
        expect(tutorial.difficulty, `Tutorial ${index} missing difficulty`).toBeDefined();
      });
    });

    it('slugs should be URL-safe (lowercase, no spaces)', () => {
      TUTORIALS_DATA.forEach((tutorial) => {
        expect(tutorial.slug).toMatch(/^[a-z0-9-]+$/);
        expect(tutorial.slug).not.toContain(' ');
        expect(tutorial.slug).not.toMatch(/[A-Z]/);
      });
    });

    it('filePaths should start with /docs/tutorials/', () => {
      TUTORIALS_DATA.forEach((tutorial) => {
        expect(tutorial.filePath).toMatch(/^\/docs\/tutorials\/.+\.md$/);
      });
    });

    it('durations should be positive numbers', () => {
      TUTORIALS_DATA.forEach((tutorial) => {
        expect(typeof tutorial.duration).toBe('number');
        expect(tutorial.duration).toBeGreaterThan(0);
      });
    });

    it('difficulties should be valid values', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];

      TUTORIALS_DATA.forEach((tutorial) => {
        expect(validDifficulties).toContain(tutorial.difficulty);
      });
    });

    it('categories should be valid values', () => {
      const validCategories = ['basics', 'intermediate', 'advanced'];

      TUTORIALS_DATA.forEach((tutorial) => {
        expect(validCategories).toContain(tutorial.category);
      });
    });
  });

  describe('category distribution', () => {
    it('should have tutorials in basics category', () => {
      const basics = TUTORIALS_DATA.filter((t) => t.category === 'basics');
      expect(basics.length).toBeGreaterThan(0);
    });

    it('should have tutorials in intermediate category', () => {
      const intermediate = TUTORIALS_DATA.filter((t) => t.category === 'intermediate');
      expect(intermediate.length).toBeGreaterThan(0);
    });

    it('should have tutorials in advanced category', () => {
      const advanced = TUTORIALS_DATA.filter((t) => t.category === 'advanced');
      expect(advanced.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// getTutorialBySlug Tests
// =============================================================================

describe('getTutorialBySlug', () => {
  describe('valid slugs', () => {
    it('should return correct tutorial for valid slug "getting-started"', () => {
      const result = getTutorialBySlug('getting-started');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('getting-started');
      expect(result?.title).toBe('Getting Started');
    });

    it('should return correct tutorial for valid slug "creating-tasks"', () => {
      const result = getTutorialBySlug('creating-tasks');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('creating-tasks');
    });

    it('should return correct tutorial for valid slug "understanding-columns"', () => {
      const result = getTutorialBySlug('understanding-columns');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('understanding-columns');
    });

    it('should return complete tutorial metadata', () => {
      const result = getTutorialBySlug('getting-started');

      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('difficulty');
    });

    it('should return tutorial with correct types', () => {
      const result = getTutorialBySlug('getting-started');

      expect(typeof result?.slug).toBe('string');
      expect(typeof result?.title).toBe('string');
      expect(typeof result?.description).toBe('string');
      expect(typeof result?.category).toBe('string');
      expect(typeof result?.filePath).toBe('string');
      expect(typeof result?.duration).toBe('number');
      expect(typeof result?.difficulty).toBe('string');
    });
  });

  describe('invalid slugs', () => {
    it('should return undefined for invalid slug', () => {
      const result = getTutorialBySlug('non-existent-tutorial');

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = getTutorialBySlug('');

      expect(result).toBeUndefined();
    });

    it('should return undefined for partial slug match', () => {
      const result = getTutorialBySlug('getting');

      expect(result).toBeUndefined();
    });

    it('should be case-sensitive (uppercase should not match)', () => {
      const result = getTutorialBySlug('GETTING-STARTED');

      expect(result).toBeUndefined();
    });

    it('should not match with extra characters', () => {
      const result = getTutorialBySlug('getting-started-extra');

      expect(result).toBeUndefined();
    });

    it('should not match with leading/trailing spaces', () => {
      const result = getTutorialBySlug(' getting-started ');

      expect(result).toBeUndefined();
    });
  });

  describe('all tutorials findable', () => {
    it('should find all tutorials in TUTORIALS_DATA by their slugs', () => {
      TUTORIALS_DATA.forEach((tutorial) => {
        const found = getTutorialBySlug(tutorial.slug);

        expect(found).toBeDefined();
        expect(found?.slug).toBe(tutorial.slug);
        expect(found?.title).toBe(tutorial.title);
      });
    });
  });
});

// =============================================================================
// getAllTutorialSlugs Tests
// =============================================================================

describe('getAllTutorialSlugs', () => {
  it('should return an array', () => {
    const result = getAllTutorialSlugs();

    expect(Array.isArray(result)).toBe(true);
  });

  it('should return array of strings', () => {
    const result = getAllTutorialSlugs();

    result.forEach((slug) => {
      expect(typeof slug).toBe('string');
    });
  });

  it('should return correct number of slugs (matches TUTORIALS_DATA)', () => {
    const result = getAllTutorialSlugs();

    expect(result.length).toBe(TUTORIALS_DATA.length);
  });

  it('should return at least 9 slugs (based on requirements)', () => {
    const result = getAllTutorialSlugs();

    expect(result.length).toBeGreaterThanOrEqual(9);
  });

  it('should return all unique slugs', () => {
    const result = getAllTutorialSlugs();
    const uniqueSlugs = new Set(result);

    expect(result.length).toBe(uniqueSlugs.size);
  });

  it('should include specific known slugs', () => {
    const result = getAllTutorialSlugs();

    expect(result).toContain('getting-started');
    expect(result).toContain('creating-tasks');
    expect(result).toContain('understanding-columns');
  });

  it('each slug should correspond to a findable tutorial', () => {
    const slugs = getAllTutorialSlugs();

    slugs.forEach((slug) => {
      const tutorial = getTutorialBySlug(slug);
      expect(tutorial).toBeDefined();
    });
  });

  it('should return slugs matching TUTORIALS_DATA slugs', () => {
    const result = getAllTutorialSlugs();
    const expectedSlugs = TUTORIALS_DATA.map((t) => t.slug);

    expect(result.sort()).toEqual(expectedSlugs.sort());
  });
});

// =============================================================================
// getFilesystemPath Tests
// =============================================================================

describe('getFilesystemPath', () => {
  describe('paths with leading slash', () => {
    it('should remove leading slash from "/docs/file.md"', () => {
      const result = getFilesystemPath('/docs/file.md');

      expect(result).toBe('docs/file.md');
    });

    it('should remove leading slash from "/docs/tutorials/getting-started.md"', () => {
      const result = getFilesystemPath('/docs/tutorials/getting-started.md');

      expect(result).toBe('docs/tutorials/getting-started.md');
    });

    it('should remove single leading slash only', () => {
      const result = getFilesystemPath('/single-slash.md');

      expect(result).toBe('single-slash.md');
    });
  });

  describe('paths without leading slash', () => {
    it('should return "docs/file.md" unchanged', () => {
      const result = getFilesystemPath('docs/file.md');

      expect(result).toBe('docs/file.md');
    });

    it('should return nested path unchanged', () => {
      const result = getFilesystemPath('docs/tutorials/guide.md');

      expect(result).toBe('docs/tutorials/guide.md');
    });

    it('should return filename without path unchanged', () => {
      const result = getFilesystemPath('readme.md');

      expect(result).toBe('readme.md');
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

    it('should not remove slashes in the middle of path', () => {
      const result = getFilesystemPath('/docs/sub/dir/file.md');

      expect(result).toBe('docs/sub/dir/file.md');
      expect(result).toContain('/');
    });

    it('should not affect Windows backslash paths', () => {
      // This function is specifically for metadata paths which use forward slashes
      const result = getFilesystemPath('\\docs\\file.md');

      expect(result).toBe('\\docs\\file.md');
    });
  });

  describe('real tutorial paths', () => {
    it('should correctly transform all tutorial filePaths', () => {
      TUTORIALS_DATA.forEach((tutorial) => {
        const result = getFilesystemPath(tutorial.filePath);

        // Should not start with /
        expect(result).not.toMatch(/^\//);

        // Should be the path without leading slash
        expect(result).toBe(tutorial.filePath.slice(1));
      });
    });
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('tutorials data integration', () => {
  it('slugs from getAllTutorialSlugs should all be findable via getTutorialBySlug', () => {
    const slugs = getAllTutorialSlugs();

    slugs.forEach((slug) => {
      const tutorial = getTutorialBySlug(slug);
      expect(tutorial).toBeDefined();
      expect(tutorial?.slug).toBe(slug);
    });
  });

  it('all tutorial filePaths should be transformable via getFilesystemPath', () => {
    TUTORIALS_DATA.forEach((tutorial) => {
      const fsPath = getFilesystemPath(tutorial.filePath);

      // Should be a valid relative path
      expect(fsPath).not.toMatch(/^\//);
      expect(fsPath).toMatch(/\.md$/);
      expect(fsPath.length).toBeGreaterThan(0);
    });
  });

  it('should maintain data consistency between all functions', () => {
    const count1 = TUTORIALS_DATA.length;
    const count2 = getAllTutorialSlugs().length;
    const count3 = TUTORIALS_DATA.filter((t) => getTutorialBySlug(t.slug)).length;

    expect(count1).toBe(count2);
    expect(count2).toBe(count3);
  });
});
