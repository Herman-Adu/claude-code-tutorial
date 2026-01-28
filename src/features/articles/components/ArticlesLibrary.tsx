'use client';

import { useState } from 'react';
import { ArticleFilter } from './ArticleFilter';
import { ArticleCategorySection } from './ArticleCategorySection';
import { ArticleCard } from './ArticleCard';
import { useArticlesData } from '../hooks/useArticlesData';
import type { ArticleCategory } from '../types';
import { ARTICLE_CATEGORIES } from '../types';

/**
 * Main orchestrator component for the Articles feature.
 * Displays a filterable library of development articles and status updates.
 */
export function ArticlesLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | null>(null);
  const { articles, articlesByCategory } = useArticlesData(selectedCategory);

  return (
    <div className="glass-lg p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-700 mb-2">Articles</h1>
        <p className="text-slate-600">Read articles about development progress, testing updates, and project status.</p>
      </div>

      <ArticleFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {selectedCategory ? (
        // Filtered view - show single category
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
          {articles.length === 0 && (
            <p className="text-slate-500 col-span-full text-center py-8">
              No articles found in this category.
            </p>
          )}
        </div>
      ) : (
        // All categories view
        <div>
          {ARTICLE_CATEGORIES.map((category) => {
            const categoryArticles = articlesByCategory.get(category.id) || [];
            return (
              <ArticleCategorySection
                key={category.id}
                category={category.id}
                articles={categoryArticles}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
