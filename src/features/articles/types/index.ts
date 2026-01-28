/**
 * Type definitions for the Articles feature module.
 * Articles are development blog posts and status updates from the docs/blogs/ directory.
 */

export interface ArticleMetadata {
  slug: string;
  title: string;
  description: string;
  category: ArticleCategory;
  filePath: string;
  date?: string;
}

export type ArticleCategory = 'development' | 'testing' | 'status';

export interface ArticleCategoryInfo {
  id: ArticleCategory;
  label: string;
  description: string;
}

/**
 * Available article categories with display information.
 * Categories help organize articles by their primary focus area.
 */
export const ARTICLE_CATEGORIES: ArticleCategoryInfo[] = [
  { id: 'development', label: 'Development', description: 'Development sprints and implementation updates' },
  { id: 'testing', label: 'Testing', description: 'Testing strategy and coverage reports' },
  { id: 'status', label: 'Status Updates', description: 'Project status and progress tracking' },
];
