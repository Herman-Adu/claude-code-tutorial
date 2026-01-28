'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { NavLink } from './NavLink';
import { MobileMenu } from './MobileMenu';
import { UserMenu } from '@/features/auth';

/**
 * Icon components for navigation items.
 * Using inline SVGs for performance (no additional HTTP requests).
 */
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const GraduationCapIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

/**
 * Navigation items configuration.
 * Centralized here for easy maintenance and consistency between desktop and mobile.
 */
const NAVIGATION_ITEMS = [
  { href: '/', label: 'Kanban Board', icon: <HomeIcon /> },
  { href: '/calendar', label: 'Calendar', icon: <CalendarIcon /> },
  { href: '/docs', label: 'Documentation', icon: <BookIcon /> },
  { href: '/articles', label: 'Articles', icon: <FileIcon /> },
  { href: '/tutorials', label: 'Tutorials', icon: <GraduationCapIcon /> },
];

/**
 * Main navigation bar component with responsive design.
 * - Desktop: Horizontal nav links with glassmorphic styling
 * - Mobile: Hamburger button that toggles slide-out menu
 */
export function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full"
        role="banner"
      >
        {/* Glassmorphic nav container */}
        <nav
          className="mx-auto px-4 sm:px-6 lg:px-8 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-[0_4px_24px_rgba(100,100,140,0.08)]"
          aria-label="Main navigation"
        >
          <div className="flex h-16 items-center justify-between">
            {/* Logo / App name */}
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold text-slate-700 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2 rounded-lg px-2 py-1"
            >
              {/* Kanban logo icon */}
              <svg
                className="w-7 h-7 text-sky-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z"
                />
              </svg>
              <span>Kanban</span>
            </Link>

            {/* Desktop navigation links - hidden on mobile */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {NAVIGATION_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </div>

            {/* Right side: User menu and mobile hamburger */}
            <div className="flex items-center gap-3">
              {/* User menu - always visible */}
              <UserMenu />

              {/* Mobile hamburger button - visible only on mobile */}
              <button
                type="button"
                onClick={openMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Open navigation menu"
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/60 text-slate-600 border border-white/40 shadow-[0_4px_12px_rgba(100,100,140,0.08)] hover:bg-white/80 hover:shadow-[0_6px_16px_rgba(100,100,140,0.12)] transition-all focus:outline-none focus:ring-2 focus:ring-sky-400/50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        navigationItems={NAVIGATION_ITEMS}
      />
    </>
  );
}
