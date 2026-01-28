'use client';

import { useEffect, useCallback, useRef } from 'react';
import { NavLink } from './NavLink';
import { ReactNode } from 'react';

interface NavigationItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
}

/**
 * Mobile navigation menu with full-screen overlay and glassmorphic styling.
 * Implements focus trap, escape key handling, and click-outside to close.
 */
export function MobileMenu({ isOpen, onClose, navigationItems }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key to close menu
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Focus trap - keep focus within menu when open
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !menuRef.current) return;

    const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Store currently focused element to restore later
      previousActiveElement.current = document.activeElement as HTMLElement;

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'hidden';

      // Focus the close button after menu renders
      requestAnimationFrame(() => {
        const closeButton = menuRef.current?.querySelector<HTMLButtonElement>('[aria-label="Close menu"]');
        closeButton?.focus();
      });
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'unset';

      // Restore focus to the element that opened the menu
      if (previousActiveElement.current && !isOpen) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleEscape, handleTabKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="presentation">
      {/* Backdrop overlay with blur */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu panel - slide from right */}
      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        className="fixed inset-y-0 right-0 w-full max-w-sm bg-white/90 backdrop-blur-xl border-l border-white/40 shadow-[-8px_0_32px_rgba(100,100,140,0.15)] animate-slide-in-right"
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-white/30">
          <span className="text-lg font-semibold text-slate-700">Menu</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/60 text-slate-500 border border-white/40 shadow-[0_4px_12px_rgba(100,100,140,0.1)] hover:bg-rose-50 hover:text-rose-500 hover:shadow-[0_6px_16px_rgba(240,150,150,0.15)] transition-all focus:outline-none focus:ring-2 focus:ring-rose-400/50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="p-4" aria-label="Mobile navigation">
          <ul className="flex flex-col gap-2">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  onClick={onClose}
                />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
