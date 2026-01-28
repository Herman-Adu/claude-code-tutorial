import type { ArticleMetadata } from '../types';
import { getFilesystemPath } from '@/lib/path';
export { getFilesystemPath };

/**
 * Static article metadata based on actual files in the docs/blogs/ folder.
 * Each article represents a development update, testing status, or project report.
 *
 * This data is extracted to a separate file so it can be imported by both
 * client-side hooks and server components (like the dynamic route page).
 */
export const ARTICLES_DATA: ArticleMetadata[] = [
  {
    slug: 'claude-recovery-sprint-c',
    title: 'Claude Recovery Sprint C',
    description: 'Development recovery sprint documentation for implementing store coverage enhancement to increase test coverage from 61% to 85%+.',
    category: 'development',
    filePath: '/docs/blogs/CLAUDE_RECOVERY_SPRINT_C.md',
    date: '2026-01-26',
  },
  {
    slug: 'server-actions-test-status',
    title: 'Server Actions Test Status',
    description: 'Current status of server action tests including technical challenges with Prisma mocking and Vitest environment configuration.',
    category: 'testing',
    filePath: '/docs/blogs/SERVER_ACTIONS_TEST_STATUS.md',
  },
  {
    slug: 'testing-plan-implementation-status',
    title: 'Testing Plan Implementation Status',
    description: 'Executive summary of testing phase implementation across all sprints with completion status and blockers.',
    category: 'status',
    filePath: '/docs/blogs/TESTING_PLAN_IMPLEMENTATION_STATUS.md',
    date: '2026-01-26',
  },
];

/**
 * Find an article by its slug.
 *
 * @param slug - The URL-friendly identifier for the article
 * @returns The article metadata if found, undefined otherwise
 */
export function findArticleBySlug(slug: string): ArticleMetadata | undefined {
  return ARTICLES_DATA.find(article => article.slug === slug);
}

