import { useMemo } from 'react';
import type { DocMetadata, DocCategory } from '../types';
import { DOCS_DATA } from '../data';

/**
 * Hook for accessing documentation metadata with optional category filtering.
 *
 * Uses the shared DOCS_DATA from the data module to ensure consistency
 * between client-side and server-side access.
 *
 * @param filterCategory - Optional category to filter documents by
 * @returns Object containing filtered docs array and docs grouped by category
 */
export function useDocsData(filterCategory?: DocCategory | null) {
  const docs = useMemo(() => {
    if (!filterCategory) {
      return DOCS_DATA;
    }
    return DOCS_DATA.filter(doc => doc.category === filterCategory);
  }, [filterCategory]);

  const docsByCategory = useMemo(() => {
    const grouped = new Map<DocCategory, DocMetadata[]>();
    for (const doc of docs) {
      const existing = grouped.get(doc.category) || [];
      grouped.set(doc.category, [...existing, doc]);
    }
    return grouped;
  }, [docs]);

  return { docs, docsByCategory };
}
