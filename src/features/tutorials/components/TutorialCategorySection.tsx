'use client';

import { TutorialCard } from './TutorialCard';
import type { TutorialMetadata, TutorialCategory } from '../types';
import { TUTORIAL_CATEGORIES } from '../types';

interface TutorialCategorySectionProps {
  category: TutorialCategory;
  tutorials: TutorialMetadata[];
}

/**
 * Renders a section for a specific tutorial category with its tutorials.
 * Returns null if there are no tutorials in the category.
 */
export function TutorialCategorySection({ category, tutorials }: TutorialCategorySectionProps) {
  const categoryInfo = TUTORIAL_CATEGORIES.find((c) => c.id === category);

  if (tutorials.length === 0) return null;

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
        {tutorials.map((tutorial) => (
          <TutorialCard key={tutorial.slug} tutorial={tutorial} />
        ))}
      </div>
    </section>
  );
}
