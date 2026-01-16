import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'priority';
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';

  const variants = {
    default: 'bg-gray-100 text-gray-800',
    priority: '', // Will be passed via className for dynamic priority colors
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)}>
      {children}
    </span>
  );
}
