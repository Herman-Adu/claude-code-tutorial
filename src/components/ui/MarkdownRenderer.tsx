'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import type { Components } from 'react-markdown';

/**
 * Extracts plain text from React children, handling nested elements.
 * Recursively traverses React elements to build a single string.
 *
 * @param children - React children to extract text from
 * @returns Plain text string extracted from all children
 *
 * @example
 * ```tsx
 * const text = extractTextFromChildren(<span>Hello <strong>World</strong></span>);
 * // Returns: "Hello World"
 * ```
 */
export function extractTextFromChildren(children: React.ReactNode): string {
  if (children == null) {
    return '';
  }

  if (typeof children === 'string') {
    return children;
  }

  if (typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }

  // Handle React elements by extracting text from their children
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    return extractTextFromChildren(props.children);
  }

  return '';
}

/**
 * Generates a URL-safe heading ID from React children.
 * Converts text to a slug format suitable for anchor links.
 * Useful for creating table of contents or programmatic navigation.
 *
 * @param children - React children (typically heading content)
 * @returns A URL-safe slug string for use as an HTML id attribute
 *
 * @example
 * ```tsx
 * generateHeadingId("Getting Started") // "getting-started"
 * generateHeadingId("What's New in v2.0?") // "whats-new-in-v20"
 * generateHeadingId(<span>Code <code>examples</code></span>) // "code-examples"
 * ```
 */
export function generateHeadingId(children: React.ReactNode): string {
  const text = extractTextFromChildren(children);

  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces (including multiple) with single hyphen
    .replace(/[^\w-]/g, '')         // Remove non-alphanumeric characters except hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens into one
    .replace(/^-+/, '')             // Remove leading hyphens
    .replace(/-+$/, '');            // Remove trailing hyphens
}

interface MarkdownRendererProps {
  /** The markdown content to render */
  content: string;
  /** Additional CSS classes to apply to the container */
  className?: string;
}

/**
 * List of URL protocols considered safe for use in href attributes.
 * Other protocols (javascript:, data:, vbscript:, etc.) are blocked to prevent XSS.
 */
const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:'];

/**
 * Validates that a URL is safe to be used in href attributes.
 * Prevents XSS attacks by rejecting javascript:, data:, vbscript:,
 * and other dangerous URL protocols.
 *
 * @param url - The URL string to validate
 * @returns true if the URL is safe to use, false otherwise
 *
 * @example
 * ```typescript
 * isSafeUrl('https://example.com') // true
 * isSafeUrl('mailto:user@example.com') // true
 * isSafeUrl('/docs/intro') // true (relative path)
 * isSafeUrl('#section') // true (anchor link)
 * isSafeUrl('javascript:alert(1)') // false (XSS attempt)
 * isSafeUrl('data:text/html,...') // false (potential XSS)
 * ```
 */
function isSafeUrl(url?: string): boolean {
  if (!url) return false;

  // Trim and check for empty string
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return false;

  // Allow anchor links (same-page navigation)
  if (trimmedUrl.startsWith('#')) {
    return true;
  }

  // Allow relative paths (internal navigation)
  if (trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('//')) {
    return true;
  }

  try {
    // Parse the URL to check its protocol
    // Use a base URL for relative URL parsing (only matters if no protocol)
    const baseUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost';
    const parsed = new URL(trimmedUrl, baseUrl);

    // Only allow safe protocols
    return SAFE_URL_PROTOCOLS.includes(parsed.protocol);
  } catch {
    // URL parsing failed - this could be a malformed URL or protocol-relative URL
    // Protocol-relative URLs (//example.com) are allowed as they inherit the page protocol
    if (trimmedUrl.startsWith('//')) {
      return true;
    }
    return false;
  }
}

/**
 * A client component that renders markdown content with GitHub Flavored Markdown support.
 * Applies glassmorphic styling consistent with the application's design system.
 *
 * Features:
 * - Full GFM support (tables, strikethrough, task lists, autolinks)
 * - Syntax highlighting for code blocks
 * - Responsive typography
 * - Glassmorphic design elements
 *
 * @example
 * ```tsx
 * <MarkdownRenderer content={markdownString} />
 * ```
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const components: Components = {
    // Headings with gradient underline accent and anchor IDs
    h1: ({ children }) => (
      <h1
        id={generateHeadingId(children)}
        className="text-3xl font-bold text-slate-800 mb-6 mt-8 first:mt-0 pb-3 border-b border-slate-200/60"
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        id={generateHeadingId(children)}
        className="text-2xl font-semibold text-slate-700 mb-4 mt-8 pb-2 border-b border-slate-200/40"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        id={generateHeadingId(children)}
        className="text-xl font-semibold text-slate-700 mb-3 mt-6"
      >
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4
        id={generateHeadingId(children)}
        className="text-lg font-medium text-slate-600 mb-2 mt-4"
      >
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5
        id={generateHeadingId(children)}
        className="text-base font-medium text-slate-600 mb-2 mt-4"
      >
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6
        id={generateHeadingId(children)}
        className="text-sm font-medium text-slate-500 mb-2 mt-4 uppercase tracking-wide"
      >
        {children}
      </h6>
    ),

    // Paragraphs
    p: ({ children }) => (
      <p className="text-slate-600 leading-relaxed mb-4">
        {children}
      </p>
    ),

    // Links with hover effect and XSS prevention
    a: ({ href, children }) => {
      // Validate URL to prevent XSS via javascript:, data:, etc.
      const safeHref = isSafeUrl(href) ? href : '#';
      const isExternal = href?.startsWith('http') || href?.startsWith('//');

      return (
        <a
          href={safeHref}
          className="text-sky-600 hover:text-sky-700 underline decoration-sky-300 hover:decoration-sky-500 underline-offset-2 transition-colors duration-200"
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      );
    },

    // Lists
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-1 text-slate-600 ml-2">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 text-slate-600 ml-2">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed">
        {children}
      </li>
    ),

    // Inline code
    code: ({ className: codeClassName, children, ...props }) => {
      const isInline = !codeClassName;

      if (isInline) {
        return (
          <code
            className="bg-slate-100/80 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }

      // Code block - extract language from className (e.g., "language-typescript")
      const language = codeClassName?.replace('language-', '') || '';

      return (
        <code
          className={cn(
            'block text-sm font-mono',
            codeClassName
          )}
          data-language={language}
          {...props}
        >
          {children}
        </code>
      );
    },

    // Code blocks with glassmorphic styling
    pre: ({ children }) => (
      <pre className="bg-slate-800/95 backdrop-blur-sm text-slate-100 rounded-xl p-4 mb-4 overflow-x-auto border border-slate-700/50 shadow-lg">
        {children}
      </pre>
    ),

    // Blockquotes with left accent
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-sky-400/60 bg-sky-50/50 backdrop-blur-sm pl-4 pr-4 py-3 mb-4 rounded-r-lg italic text-slate-600">
        {children}
      </blockquote>
    ),

    // Tables with glassmorphic styling
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4 rounded-xl border border-white/40 shadow-sm">
        <table className="w-full border-collapse bg-white/70 backdrop-blur-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-slate-100/80">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-slate-200/60">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-slate-50/50 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200/60">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-sm text-slate-600">
        {children}
      </td>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="my-8 border-t border-slate-200/60" />
    ),

    // Images with rounded corners and shadow
    // Using native img for markdown content where dimensions are unknown
    // and external URLs may not be configured in next.config.js
    img: ({ src, alt }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || ''}
        className="rounded-xl shadow-md max-w-full h-auto my-4 border border-white/40"
      />
    ),

    // Strong and emphasis
    strong: ({ children }) => (
      <strong className="font-semibold text-slate-700">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-slate-600">
        {children}
      </em>
    ),

    // Strikethrough (GFM)
    del: ({ children }) => (
      <del className="text-slate-400 line-through">
        {children}
      </del>
    ),

    // Task list items (GFM) - handled via input checkbox
    input: ({ type, checked, disabled, ...props }) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            readOnly
            className="mr-2 h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400/50"
            {...props}
          />
        );
      }
      return <input type={type} checked={checked} disabled={disabled} {...props} />;
    },
  };

  return (
    <div
      className={cn(
        'prose prose-slate max-w-none',
        // Override prose defaults with our custom styling
        'prose-headings:font-sans',
        'prose-p:text-slate-600',
        'prose-a:no-underline', // We handle link styling in the component
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
