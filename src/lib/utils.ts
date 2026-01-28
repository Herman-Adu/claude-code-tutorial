export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getTimestamp(): string {
  return new Date().toISOString();
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Sanitizes a string to prevent XSS attacks by escaping HTML entities
 */
export function sanitizeString(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitizes task data to prevent XSS attacks.
 * Handles title, description, tags, and categories fields.
 */
export function sanitizeTaskData<
  T extends { title?: string; description?: string; tags?: string[]; categories?: string[] }
>(data: T): T {
  return {
    ...data,
    ...(data.title !== undefined && { title: sanitizeString(data.title) }),
    ...(data.description !== undefined && { description: sanitizeString(data.description) }),
    ...(data.tags !== undefined && { tags: data.tags.map(sanitizeString) }),
    ...(data.categories !== undefined && { categories: data.categories.map(sanitizeString) }),
  };
}

// Validation constants
export const VALIDATION = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAG_LENGTH: 30,
  MAX_TAGS: 10,
  MAX_CATEGORY_LENGTH: 50,
  MAX_CATEGORIES: 10,
} as const;
