export interface DocMetadata {
  slug: string;
  title: string;
  description: string;
  category: DocCategory;
  filePath: string;
}

export type DocCategory = 'guides' | 'reviews' | 'blogs' | 'architecture' | 'testing' | 'api' | 'components' | 'getting-started' | 'planned-features';

export interface DocsCategoryInfo {
  id: DocCategory;
  label: string;
  description: string;
}

export const DOCS_CATEGORIES: DocsCategoryInfo[] = [
  { id: 'getting-started', label: 'Getting Started', description: 'Setup and initial configuration' },
  { id: 'guides', label: 'Guides', description: 'How-to guides and references' },
  { id: 'architecture', label: 'Architecture', description: 'System design documentation' },
  { id: 'components', label: 'Components', description: 'UI component documentation' },
  { id: 'api', label: 'API', description: 'API documentation and types' },
  { id: 'testing', label: 'Testing', description: 'Test strategy and coverage' },
  { id: 'reviews', label: 'Reviews', description: 'Architecture and test reviews' },
  { id: 'blogs', label: 'Articles', description: 'Development updates and articles' },
  { id: 'planned-features', label: 'Planned Features', description: 'Upcoming features documentation' },
];
