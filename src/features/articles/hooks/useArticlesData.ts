import { useMemo } from 'react';
import type { ArticleMetadata, ArticleCategory } from '../types';
import { ARTICLES_DATA } from '../data';

/**
 * Hook for accessing and filtering article data.
 * Provides memoized article lists and category groupings for efficient rendering.
 *
 * @param filterCategory - Optional category to filter articles by
 * @returns Object containing filtered articles and articles grouped by category
 */
export function useArticlesData(filterCategory?: ArticleCategory | null) {
  const articles = useMemo(() => {
    if (!filterCategory) {
      return ARTICLES_DATA;
    }
    return ARTICLES_DATA.filter(article => article.category === filterCategory);
  }, [filterCategory]);

  const articlesByCategory = useMemo(() => {
    const grouped = new Map<ArticleCategory, ArticleMetadata[]>();
    for (const article of articles) {
      const existing = grouped.get(article.category) || [];
      grouped.set(article.category, [...existing, article]);
    }
    return grouped;
  }, [articles]);

  return { articles, articlesByCategory };
}
