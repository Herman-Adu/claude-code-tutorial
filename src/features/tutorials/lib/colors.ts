import type { TutorialMetadata } from '../types';

/**
 * Returns Tailwind CSS classes for difficulty level badges.
 * Used consistently across all tutorial components.
 */
export function getDifficultyColor(
  difficulty: TutorialMetadata['difficulty']
): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-emerald-100/70 text-emerald-700';
    case 'intermediate':
      return 'bg-amber-100/70 text-amber-700';
    case 'advanced':
      return 'bg-rose-100/70 text-rose-700';
    default:
      return 'bg-slate-100/70 text-slate-700';
  }
}
