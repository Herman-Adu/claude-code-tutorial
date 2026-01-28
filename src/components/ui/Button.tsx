import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium tracking-wide rounded-xl border border-white/30 backdrop-blur-md transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0';

    const variants = {
      primary:
        'bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-[0_6px_24px_rgba(100,150,230,0.3)] hover:shadow-[0_10px_32px_rgba(100,150,230,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_16px_rgba(100,150,230,0.25)] focus:ring-sky-400/50',
      secondary:
        'bg-gradient-to-br from-violet-300/90 to-pink-300/90 text-slate-700 shadow-[0_6px_24px_rgba(200,180,220,0.3)] hover:shadow-[0_10px_32px_rgba(200,180,220,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_16px_rgba(200,180,220,0.25)] focus:ring-violet-400/50',
      danger:
        'bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-[0_6px_24px_rgba(240,150,150,0.3)] hover:shadow-[0_10px_32px_rgba(240,150,150,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_16px_rgba(240,150,150,0.25)] focus:ring-rose-400/50',
      ghost:
        'bg-white/65 text-slate-600 shadow-[0_4px_16px_rgba(100,100,140,0.08),inset_0_1px_1px_rgba(255,255,255,0.6)] hover:bg-white/85 hover:shadow-[0_6px_20px_rgba(100,100,140,0.12),inset_0_1px_1px_rgba(255,255,255,0.7)] hover:-translate-y-0.5 active:translate-y-0 focus:ring-slate-400/40',
    };

    const sizes = {
      sm: 'px-3.5 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
