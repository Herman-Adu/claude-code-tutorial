'use client';

import Link from 'next/link';
import { Badge, getCategoryColor } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { DocMetadata } from '../types';
import { DOCS_CATEGORIES } from '../types';

interface DocsCardProps {
  doc: DocMetadata;
}

/**
 * Card component for displaying a documentation entry.
 *
 * Links to the dynamic route /docs/[slug] to render the markdown
 * content within the application instead of opening raw files.
 */
export function DocsCard({ doc }: DocsCardProps) {
  const categoryInfo = DOCS_CATEGORIES.find(c => c.id === doc.category);
  const categoryColor = getCategoryColor(doc.category);

  return (
    <Link
      href={`/docs/${doc.slug}`}
      className={cn(
        'group block p-5 rounded-xl transition-all duration-200',
        'bg-white/60 backdrop-blur-sm border border-white/40',
        'hover:bg-white/80 hover:shadow-[0_8px_24px_rgba(100,100,140,0.12)] hover:-translate-y-1',
        'focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-slate-700 group-hover:text-slate-800 transition-colors line-clamp-2">
          {doc.title}
        </h3>
        <Badge className={cn('flex-shrink-0', categoryColor)}>
          {categoryInfo?.label || doc.category}
        </Badge>
      </div>
      <p className="text-sm text-slate-600 line-clamp-2">
        {doc.description}
      </p>
      <div className="mt-3 flex items-center text-xs text-slate-500">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <span className="truncate">{doc.filePath.split('/').pop()}</span>
      </div>
    </Link>
  );
}
