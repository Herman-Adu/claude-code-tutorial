/**
 * Tutorial metadata interface describing a tutorial's properties.
 */
export interface TutorialMetadata {
  slug: string;
  title: string;
  description: string;
  category: TutorialCategory;
  filePath: string;
  /** Estimated time to complete in minutes */
  duration: number;
  /** Difficulty level for visual indication */
  difficulty: TutorialDifficulty;
}

export type TutorialCategory = 'basics' | 'intermediate' | 'advanced';

export type TutorialDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Category metadata for display and filtering purposes.
 */
export interface TutorialCategoryInfo {
  id: TutorialCategory;
  label: string;
  description: string;
}

/**
 * Static category definitions with display information.
 * Order determines display order in the filter and category sections.
 */
export const TUTORIAL_CATEGORIES: TutorialCategoryInfo[] = [
  {
    id: 'basics',
    label: 'Basics',
    description: 'Get started with the fundamentals',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'Dive deeper into features and workflows',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Master power-user techniques and shortcuts',
  },
];

/**
 * Maps difficulty levels to human-readable labels.
 */
export const DIFFICULTY_LABELS: Record<TutorialDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
