import crypto from 'crypto';

/**
 * Generates a Gravatar URL for an email address
 * @param email - The email address
 * @param size - Avatar size in pixels (default: 200)
 * @returns Gravatar URL
 */
export function getGravatarUrl(email: string, size: number = 200): string {
  const hash = crypto
    .createHash('md5')
    .update(email.toLowerCase().trim())
    .digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

/**
 * Gets initials from a name for fallback avatar
 * @param name - Full name
 * @returns Two-letter initials
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
