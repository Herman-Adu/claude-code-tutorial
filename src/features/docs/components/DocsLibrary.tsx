'use client';

import { useState } from 'react';
import { DocsFilter } from './DocsFilter';
import { DocsCategorySection } from './DocsCategorySection';
import { DocsCard } from './DocsCard';
import { useDocsData } from '../hooks/useDocsData';
import type { DocCategory } from '../types';
import { DOCS_CATEGORIES } from '../types';

export function DocsLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | null>(null);
  const { docs, docsByCategory } = useDocsData(selectedCategory);

  return (
    <div className="glass-lg p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-700 mb-2">Documentation</h1>
        <p className="text-slate-600">Browse project documentation, guides, and references.</p>
      </div>

      <DocsFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {selectedCategory ? (
        // Filtered view - show single category
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <DocsCard key={doc.slug} doc={doc} />
          ))}
          {docs.length === 0 && (
            <p className="text-slate-500 col-span-full text-center py-8">
              No documentation found in this category.
            </p>
          )}
        </div>
      ) : (
        // All categories view
        <div>
          {DOCS_CATEGORIES.map((category) => {
            const categoryDocs = docsByCategory.get(category.id) || [];
            return (
              <DocsCategorySection
                key={category.id}
                category={category.id}
                docs={categoryDocs}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
