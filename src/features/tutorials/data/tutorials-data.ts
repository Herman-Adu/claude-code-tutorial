import type { TutorialMetadata } from '../types';
import { getFilesystemPath } from '@/lib/path';
export { getFilesystemPath };

/**
 * Static tutorial metadata for the Kanban board application.
 * Each tutorial points to a markdown file in the docs/tutorials directory.
 *
 * This data is extracted to a separate file so it can be accessed by both:
 * - Client components (via the useTutorialsData hook)
 * - Server components (for the dynamic route page)
 */
export const TUTORIALS_DATA: TutorialMetadata[] = [
  // Basics - Getting started tutorials
  {
    slug: 'getting-started',
    title: 'Getting Started',
    description:
      'Introduction to the Kanban board application, including basic navigation and understanding the interface layout.',
    category: 'basics',
    filePath: '/docs/tutorials/getting-started.md',
    duration: 5,
    difficulty: 'beginner',
  },
  {
    slug: 'creating-tasks',
    title: 'Creating Tasks',
    description:
      'Learn how to create new tasks, set titles, add descriptions, and configure initial task properties.',
    category: 'basics',
    filePath: '/docs/tutorials/creating-tasks.md',
    duration: 8,
    difficulty: 'beginner',
  },
  {
    slug: 'understanding-columns',
    title: 'Understanding Columns',
    description:
      'Explore the three-column workflow: To Do, In Progress, and Completed. Learn what each column represents.',
    category: 'basics',
    filePath: '/docs/tutorials/understanding-columns.md',
    duration: 4,
    difficulty: 'beginner',
  },

  // Intermediate - Feature-focused tutorials
  {
    slug: 'organizing-tasks',
    title: 'Organizing Tasks',
    description:
      'Master task organization using drag-and-drop, priority levels, tags, and categories to keep your work structured.',
    category: 'intermediate',
    filePath: '/docs/tutorials/organizing-tasks.md',
    duration: 12,
    difficulty: 'intermediate',
  },
  {
    slug: 'using-the-calendar',
    title: 'Using the Calendar',
    description:
      'Discover the calendar view for deadline management, scheduling tasks, and visualizing your timeline.',
    category: 'intermediate',
    filePath: '/docs/tutorials/using-the-calendar.md',
    duration: 10,
    difficulty: 'intermediate',
  },
  {
    slug: 'filtering-and-search',
    title: 'Filtering and Search',
    description:
      'Find tasks quickly using filters by priority, category, and status. Master the search functionality.',
    category: 'intermediate',
    filePath: '/docs/tutorials/filtering-and-search.md',
    duration: 7,
    difficulty: 'intermediate',
  },
  {
    slug: 'task-details',
    title: 'Working with Task Details',
    description:
      'Deep dive into task editing, updating descriptions, changing priorities, and managing task metadata.',
    category: 'intermediate',
    filePath: '/docs/tutorials/task-details.md',
    duration: 9,
    difficulty: 'intermediate',
  },

  // Advanced - Power user tutorials
  {
    slug: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description:
      'Boost your productivity with keyboard shortcuts for navigation, task creation, and quick actions.',
    category: 'advanced',
    filePath: '/docs/tutorials/keyboard-shortcuts.md',
    duration: 6,
    difficulty: 'advanced',
  },
  {
    slug: 'bulk-operations',
    title: 'Bulk Operations',
    description:
      'Learn how to perform actions on multiple tasks at once for efficient workflow management.',
    category: 'advanced',
    filePath: '/docs/tutorials/bulk-operations.md',
    duration: 8,
    difficulty: 'advanced',
  },
  {
    slug: 'workflow-optimization',
    title: 'Workflow Optimization',
    description:
      'Advanced strategies for optimizing your personal or team workflow using the Kanban methodology.',
    category: 'advanced',
    filePath: '/docs/tutorials/workflow-optimization.md',
    duration: 15,
    difficulty: 'advanced',
  },
];

/**
 * Finds a tutorial by its slug.
 *
 * @param slug - The URL-safe identifier for the tutorial
 * @returns The tutorial metadata if found, undefined otherwise
 */
export function getTutorialBySlug(slug: string): TutorialMetadata | undefined {
  return TUTORIALS_DATA.find((tutorial) => tutorial.slug === slug);
}

/**
 * Gets all available tutorial slugs.
 * Useful for generating static paths.
 *
 * @returns Array of all tutorial slugs
 */
export function getAllTutorialSlugs(): string[] {
  return TUTORIALS_DATA.map((tutorial) => tutorial.slug);
}

