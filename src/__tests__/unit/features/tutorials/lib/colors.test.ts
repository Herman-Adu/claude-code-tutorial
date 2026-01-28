/**
 * Unit Tests for Tutorial Difficulty Color Utility
 *
 * Tests the getDifficultyColor function that returns Tailwind CSS
 * classes for difficulty level badges in the tutorials feature.
 *
 * Coverage targets: >80% for the colors utility module
 */

import { describe, it, expect } from 'vitest';
import { getDifficultyColor } from '@/features/tutorials/lib/colors';
import type { TutorialMetadata } from '@/features/tutorials/types';

// =============================================================================
// getDifficultyColor Tests
// =============================================================================

describe('getDifficultyColor', () => {
  describe('valid difficulty levels', () => {
    it('should return emerald classes for "beginner"', () => {
      const result = getDifficultyColor('beginner');

      expect(result).toBe('bg-emerald-100/70 text-emerald-700');
    });

    it('should return amber classes for "intermediate"', () => {
      const result = getDifficultyColor('intermediate');

      expect(result).toBe('bg-amber-100/70 text-amber-700');
    });

    it('should return rose classes for "advanced"', () => {
      const result = getDifficultyColor('advanced');

      expect(result).toBe('bg-rose-100/70 text-rose-700');
    });
  });

  describe('invalid/unknown difficulty levels', () => {
    it('should return slate classes for unknown value', () => {
      // Cast to avoid TypeScript error since we're testing invalid input
      const result = getDifficultyColor('expert' as TutorialMetadata['difficulty']);

      expect(result).toBe('bg-slate-100/70 text-slate-700');
    });

    it('should return slate classes for empty string', () => {
      const result = getDifficultyColor('' as TutorialMetadata['difficulty']);

      expect(result).toBe('bg-slate-100/70 text-slate-700');
    });

    it('should return slate classes for uppercase BEGINNER', () => {
      const result = getDifficultyColor('BEGINNER' as TutorialMetadata['difficulty']);

      expect(result).toBe('bg-slate-100/70 text-slate-700');
    });

    it('should return slate classes for mixed case Beginner', () => {
      const result = getDifficultyColor('Beginner' as TutorialMetadata['difficulty']);

      expect(result).toBe('bg-slate-100/70 text-slate-700');
    });

    it('should return slate classes for undefined-like values', () => {
      const result = getDifficultyColor(undefined as unknown as TutorialMetadata['difficulty']);

      expect(result).toBe('bg-slate-100/70 text-slate-700');
    });

    it('should return slate classes for null-like values', () => {
      const result = getDifficultyColor(null as unknown as TutorialMetadata['difficulty']);

      expect(result).toBe('bg-slate-100/70 text-slate-700');
    });
  });

  describe('return type validation', () => {
    it('should always return a string', () => {
      const validResults = [
        getDifficultyColor('beginner'),
        getDifficultyColor('intermediate'),
        getDifficultyColor('advanced'),
        getDifficultyColor('unknown' as TutorialMetadata['difficulty']),
      ];

      validResults.forEach((result) => {
        expect(typeof result).toBe('string');
      });
    });

    it('should return non-empty strings', () => {
      const validResults = [
        getDifficultyColor('beginner'),
        getDifficultyColor('intermediate'),
        getDifficultyColor('advanced'),
      ];

      validResults.forEach((result) => {
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should return valid Tailwind classes format', () => {
      const result = getDifficultyColor('beginner');

      // Check that it contains expected Tailwind class patterns
      expect(result).toMatch(/^bg-\w+-\d+\/\d+ text-\w+-\d+$/);
    });
  });

  describe('color combinations', () => {
    it('beginner colors should use emerald palette', () => {
      const result = getDifficultyColor('beginner');

      expect(result).toContain('emerald');
      expect(result).not.toContain('amber');
      expect(result).not.toContain('rose');
      expect(result).not.toContain('slate');
    });

    it('intermediate colors should use amber palette', () => {
      const result = getDifficultyColor('intermediate');

      expect(result).toContain('amber');
      expect(result).not.toContain('emerald');
      expect(result).not.toContain('rose');
      expect(result).not.toContain('slate');
    });

    it('advanced colors should use rose palette', () => {
      const result = getDifficultyColor('advanced');

      expect(result).toContain('rose');
      expect(result).not.toContain('emerald');
      expect(result).not.toContain('amber');
      expect(result).not.toContain('slate');
    });

    it('default colors should use slate palette', () => {
      const result = getDifficultyColor('other' as TutorialMetadata['difficulty']);

      expect(result).toContain('slate');
      expect(result).not.toContain('emerald');
      expect(result).not.toContain('amber');
      expect(result).not.toContain('rose');
    });
  });

  describe('class structure', () => {
    it('should always include a background class (bg-)', () => {
      const results = [
        getDifficultyColor('beginner'),
        getDifficultyColor('intermediate'),
        getDifficultyColor('advanced'),
        getDifficultyColor('unknown' as TutorialMetadata['difficulty']),
      ];

      results.forEach((result) => {
        expect(result).toMatch(/bg-/);
      });
    });

    it('should always include a text color class (text-)', () => {
      const results = [
        getDifficultyColor('beginner'),
        getDifficultyColor('intermediate'),
        getDifficultyColor('advanced'),
        getDifficultyColor('unknown' as TutorialMetadata['difficulty']),
      ];

      results.forEach((result) => {
        expect(result).toMatch(/text-/);
      });
    });

    it('should use opacity modifier (/70) on background', () => {
      const results = [
        getDifficultyColor('beginner'),
        getDifficultyColor('intermediate'),
        getDifficultyColor('advanced'),
        getDifficultyColor('unknown' as TutorialMetadata['difficulty']),
      ];

      results.forEach((result) => {
        expect(result).toContain('/70');
      });
    });

    it('should use shade 100 for background', () => {
      const results = [
        getDifficultyColor('beginner'),
        getDifficultyColor('intermediate'),
        getDifficultyColor('advanced'),
      ];

      results.forEach((result) => {
        expect(result).toMatch(/bg-\w+-100/);
      });
    });

    it('should use shade 700 for text', () => {
      const results = [
        getDifficultyColor('beginner'),
        getDifficultyColor('intermediate'),
        getDifficultyColor('advanced'),
      ];

      results.forEach((result) => {
        expect(result).toMatch(/text-\w+-700/);
      });
    });
  });

  describe('all difficulty levels coverage', () => {
    it('should handle all three valid difficulty levels', () => {
      const difficulties: TutorialMetadata['difficulty'][] = [
        'beginner',
        'intermediate',
        'advanced',
      ];

      const expectedColors: Record<string, string> = {
        beginner: 'bg-emerald-100/70 text-emerald-700',
        intermediate: 'bg-amber-100/70 text-amber-700',
        advanced: 'bg-rose-100/70 text-rose-700',
      };

      difficulties.forEach((difficulty) => {
        const result = getDifficultyColor(difficulty);
        expect(result).toBe(expectedColors[difficulty]);
      });
    });

    it('should produce different colors for each difficulty level', () => {
      const beginner = getDifficultyColor('beginner');
      const intermediate = getDifficultyColor('intermediate');
      const advanced = getDifficultyColor('advanced');

      expect(beginner).not.toBe(intermediate);
      expect(intermediate).not.toBe(advanced);
      expect(beginner).not.toBe(advanced);
    });
  });

  describe('accessibility considerations', () => {
    it('should use light background (100) with dark text (700) for contrast', () => {
      // This test documents the accessibility pattern used:
      // Light backgrounds (shade 100) with dark text (shade 700)
      // provides good contrast for readability

      const result = getDifficultyColor('beginner');

      // Background uses light shade
      expect(result).toMatch(/bg-emerald-100/);

      // Text uses dark shade
      expect(result).toMatch(/text-emerald-700/);
    });

    it('should maintain consistent contrast pattern across all levels', () => {
      const levels: TutorialMetadata['difficulty'][] = [
        'beginner',
        'intermediate',
        'advanced',
      ];

      levels.forEach((level) => {
        const result = getDifficultyColor(level);

        // All should follow the same pattern: -100/70 bg and -700 text
        expect(result).toMatch(/-100\/70/);
        expect(result).toMatch(/-700/);
      });
    });
  });
});
