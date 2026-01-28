'use client';

import { DocsCard } from './DocsCard';
import type { DocMetadata, DocCategory } from '../types';
import { DOCS_CATEGORIES } from '../types';

interface DocsCategorySectionProps {
  category: DocCategory;
  docs: DocMetadata[];
}

export function DocsCategorySection({ category, docs }: DocsCategorySectionProps) {
  const categoryInfo = DOCS_CATEGORIES.find(c => c.id === category);

  if (docs.length === 0) return null;

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
        {docs.map((doc) => (
          <DocsCard key={doc.slug} doc={doc} />
        ))}
      </div>
    </section>
  );
}
