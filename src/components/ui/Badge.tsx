import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'priority' | 'tag' | 'category';
}

/**
 * Badge component for displaying labels, tags, priorities, and categories.
 *
 * Variants:
 * - default: Neutral white/gray badge
 * - priority: Empty (colors passed via className for dynamic styling)
 * - tag: Violet-themed for task tags
 * - category: Teal/cyan-themed glassmorphic badges for categories
 */
export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-1 text-xs font-medium tracking-wide rounded-lg backdrop-blur-sm';

  const variants = {
    default: 'bg-white/70 text-slate-600 border border-white/40',
    priority: '', // Will be passed via className for dynamic priority colors
    tag: 'bg-violet-100/70 text-violet-700 border border-violet-200/40',
    category: 'bg-teal-100/70 text-teal-700 border border-teal-200/40',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)}>
      {children}
    </span>
  );
}

/**
 * Category-specific badge colors for visual variety.
 * Uses pastel colors consistent with the glassmorphic design system.
 */
export const CATEGORY_COLORS = [
  'bg-teal-100/70 text-teal-700 border-teal-200/40',
  'bg-cyan-100/70 text-cyan-700 border-cyan-200/40',
  'bg-indigo-100/70 text-indigo-700 border-indigo-200/40',
  'bg-fuchsia-100/70 text-fuchsia-700 border-fuchsia-200/40',
  'bg-lime-100/70 text-lime-700 border-lime-200/40',
  'bg-pink-100/70 text-pink-700 border-pink-200/40',
  'bg-sky-100/70 text-sky-700 border-sky-200/40',
  'bg-orange-100/70 text-orange-700 border-orange-200/40',
  'bg-purple-100/70 text-purple-700 border-purple-200/40',
  'bg-emerald-100/70 text-emerald-700 border-emerald-200/40',
] as const;

/**
 * Returns a consistent color for a category based on its name.
 * Uses string hashing to ensure the same category always gets the same color.
 */
export function getCategoryColor(category: string): string {
  // Simple hash function for consistent color assignment
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    const char = category.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}
