'use client';

import Link from 'next/link';
import { Badge, getCategoryColor } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { ArticleMetadata } from '../types';
import { ARTICLE_CATEGORIES } from '../types';

interface ArticleCardProps {
  article: ArticleMetadata;
}

/**
 * Card component for displaying individual article previews.
 * Features glassmorphic styling with hover effects and category badges.
 */
export function ArticleCard({ article }: ArticleCardProps) {
  const categoryInfo = ARTICLE_CATEGORIES.find(c => c.id === article.category);
  const categoryColor = getCategoryColor(article.category);

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={cn(
        'group block p-5 rounded-xl transition-all duration-200',
        'bg-white/60 backdrop-blur-sm border border-white/40',
        'hover:bg-white/80 hover:shadow-[0_8px_24px_rgba(100,100,140,0.12)] hover:-translate-y-1',
        'focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-slate-700 group-hover:text-slate-800 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <Badge className={cn('flex-shrink-0', categoryColor)}>
          {categoryInfo?.label || article.category}
        </Badge>
      </div>
      <p className="text-sm text-slate-600 line-clamp-2">
        {article.description}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
          </svg>
          <span className="truncate">{article.filePath.split('/').pop()}</span>
        </div>
        {article.date && (
          <span className="text-slate-400">{article.date}</span>
        )}
      </div>
    </Link>
  );
}
