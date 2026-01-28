import { useMemo } from 'react';
import type { TutorialMetadata, TutorialCategory } from '../types';
import { TUTORIALS_DATA } from '../data';

/**
 * Hook for accessing tutorial data with optional category filtering.
 *
 * @param filterCategory - Optional category to filter tutorials by
 * @returns Object containing filtered tutorials and tutorials grouped by category
 */
export function useTutorialsData(filterCategory?: TutorialCategory | null) {
  const tutorials = useMemo(() => {
    if (!filterCategory) {
      return TUTORIALS_DATA;
    }
    return TUTORIALS_DATA.filter((tutorial) => tutorial.category === filterCategory);
  }, [filterCategory]);

  const tutorialsByCategory = useMemo(() => {
    const grouped = new Map<TutorialCategory, TutorialMetadata[]>();
    for (const tutorial of tutorials) {
      const existing = grouped.get(tutorial.category) || [];
      grouped.set(tutorial.category, [...existing, tutorial]);
    }
    return grouped;
  }, [tutorials]);

  return { tutorials, tutorialsByCategory };
}
