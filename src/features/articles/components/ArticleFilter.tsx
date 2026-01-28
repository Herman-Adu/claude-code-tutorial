'use client';

import { cn } from '@/lib/utils';
import { ARTICLE_CATEGORIES, type ArticleCategory } from '../types';

interface ArticleFilterProps {
  selectedCategory: ArticleCategory | null;
  onCategoryChange: (category: ArticleCategory | null) => void;
}

/**
 * Filter buttons for article categories.
 * Allows users to filter articles by category or view all articles.
 */
export function ArticleFilter({ selectedCategory, onCategoryChange }: ArticleFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onCategoryChange(null)}
        className={cn(
          'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2',
          selectedCategory === null
            ? 'bg-white/80 text-slate-700 shadow-[0_4px_16px_rgba(100,100,140,0.12),inset_0_1px_1px_rgba(255,255,255,0.7)] border border-white/50'
            : 'bg-white/40 text-slate-600 hover:bg-white/60 border border-white/30'
        )}
      >
        All
      </button>
      {ARTICLE_CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2',
            selectedCategory === category.id
              ? 'bg-white/80 text-slate-700 shadow-[0_4px_16px_rgba(100,100,140,0.12),inset_0_1px_1px_rgba(255,255,255,0.7)] border border-white/50'
              : 'bg-white/40 text-slate-600 hover:bg-white/60 border border-white/30'
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
