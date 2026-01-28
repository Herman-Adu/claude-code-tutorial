'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}

/**
 * Navigation link component with active state highlighting and glassmorphic styling.
 * Uses Next.js Link for client-side navigation and usePathname for active detection.
 */
export function NavLink({ href, label, icon, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        // Base styles
        'group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
        'transition-all duration-200 ease-out',
        // Focus styles for keyboard accessibility
        'focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2 focus:ring-offset-transparent',
        // Glassmorphic styling
        isActive
          ? // Active state - more prominent glass effect
            'bg-white/80 text-slate-700 shadow-[0_4px_16px_rgba(100,100,140,0.12),inset_0_1px_1px_rgba(255,255,255,0.7)] border border-white/50'
          : // Default state with hover effects
            'text-slate-600 hover:bg-white/60 hover:text-slate-700 hover:shadow-[0_4px_12px_rgba(100,100,140,0.08),inset_0_1px_1px_rgba(255,255,255,0.5)] hover:border hover:border-white/40'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span
        className={cn(
          'flex-shrink-0 transition-transform duration-200',
          'group-hover:scale-110',
          isActive ? 'text-sky-500' : 'text-slate-500 group-hover:text-slate-600'
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
