'use client';

import Link from 'next/link';
import { Badge, getCategoryColor } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { TutorialMetadata } from '../types';
import { TUTORIAL_CATEGORIES, DIFFICULTY_LABELS } from '../types';
import { getDifficultyColor } from '../lib/colors';

interface TutorialCardProps {
  tutorial: TutorialMetadata;
}

/**
 * Renders an individual tutorial card with metadata display.
 * Uses glassmorphic styling consistent with the design system.
 */
export function TutorialCard({ tutorial }: TutorialCardProps) {
  const categoryInfo = TUTORIAL_CATEGORIES.find((c) => c.id === tutorial.category);
  const categoryColor = getCategoryColor(tutorial.category);
  const difficultyColor = getDifficultyColor(tutorial.difficulty);

  return (
    <Link
      href={`/tutorials/${tutorial.slug}`}
      className={cn(
        'group block p-5 rounded-xl transition-all duration-200',
        'bg-white/60 backdrop-blur-sm border border-white/40',
        'hover:bg-white/80 hover:shadow-[0_8px_24px_rgba(100,100,140,0.12)] hover:-translate-y-1',
        'focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-slate-700 group-hover:text-slate-800 transition-colors line-clamp-2">
          {tutorial.title}
        </h3>
        <Badge className={cn('flex-shrink-0', categoryColor)}>
          {categoryInfo?.label || tutorial.category}
        </Badge>
      </div>

      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
        {tutorial.description}
      </p>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          {/* Duration indicator */}
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <span>{tutorial.duration} min</span>
          </span>

          {/* Difficulty indicator */}
          <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium', difficultyColor)}>
            {DIFFICULTY_LABELS[tutorial.difficulty]}
          </span>
        </div>

        {/* File path indicator */}
        <div className="flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
          <span className="truncate max-w-[120px]">{tutorial.filePath.split('/').pop()}</span>
        </div>
      </div>
    </Link>
  );
}
