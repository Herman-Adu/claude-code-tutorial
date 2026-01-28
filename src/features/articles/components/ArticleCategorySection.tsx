'use client';

import { ArticleCard } from './ArticleCard';
import type { ArticleMetadata, ArticleCategory } from '../types';
import { ARTICLE_CATEGORIES } from '../types';

interface ArticleCategorySectionProps {
  category: ArticleCategory;
  articles: ArticleMetadata[];
}

/**
 * Section component for displaying articles grouped by category.
 * Renders a category heading with description and a grid of article cards.
 */
export function ArticleCategorySection({ category, articles }: ArticleCategorySectionProps) {
  const categoryInfo = ARTICLE_CATEGORIES.find(c => c.id === category);

  if (articles.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-700">
          {categoryInfo?.label || category}
        </h2>
        {categoryInfo?.description && (
          <p className="text-sm text-slate-500 mt-1">{categoryInfo.description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}
