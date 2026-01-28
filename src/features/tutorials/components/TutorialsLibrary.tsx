'use client';

import { useState } from 'react';
import { TutorialFilter } from './TutorialFilter';
import { TutorialCategorySection } from './TutorialCategorySection';
import { TutorialCard } from './TutorialCard';
import { useTutorialsData } from '../hooks/useTutorialsData';
import type { TutorialCategory } from '../types';
import { TUTORIAL_CATEGORIES } from '../types';

/**
 * Main orchestrator component for the tutorials library.
 * Provides filtering by category and displays tutorials in a grid layout.
 */
export function TutorialsLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<TutorialCategory | null>(null);
  const { tutorials, tutorialsByCategory } = useTutorialsData(selectedCategory);

  return (
    <div className="glass-lg p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-700 mb-2">Tutorials</h1>
        <p className="text-slate-600">
          Learn how to use the Kanban board effectively with step-by-step guides.
        </p>
      </div>

      <TutorialFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {selectedCategory ? (
        // Filtered view - show single category as flat grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutorials.map((tutorial) => (
            <TutorialCard key={tutorial.slug} tutorial={tutorial} />
          ))}
          {tutorials.length === 0 && (
            <p className="text-slate-500 col-span-full text-center py-8">
              No tutorials found in this category.
            </p>
          )}
        </div>
      ) : (
        // All categories view - show grouped by category
        <div>
          {TUTORIAL_CATEGORIES.map((category) => {
            const categoryTutorials = tutorialsByCategory.get(category.id) || [];
            return (
              <TutorialCategorySection
                key={category.id}
                category={category.id}
                tutorials={categoryTutorials}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
