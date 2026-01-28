/**
 * Unit Tests for MarkdownRenderer XSS Protection
 *
 * Tests the isSafeUrl function and related security measures
 * to prevent XSS attacks through malicious URLs in markdown content.
 *
 * Coverage targets: >80% for MarkdownRenderer security functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// The isSafeUrl function is internal to MarkdownRenderer
// We test it indirectly through the component's rendering behavior
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Helper to render markdown with a link and check the href
 */
function renderMarkdownWithLink(url: string): string | null {
  const markdown = `[Click here](${url})`;
  const { container } = render(<MarkdownRenderer content={markdown} />);
  const link = container.querySelector('a');
  return link?.getAttribute('href') ?? null;
}

/**
 * Helper to check if a URL is marked as safe (not converted to #)
 */
function isUrlAllowed(url: string): boolean {
  const href = renderMarkdownWithLink(url);
  return href !== '#' && href === url;
}

// =============================================================================
// isSafeUrl Tests (via component behavior)
// =============================================================================

describe('MarkdownRenderer URL Safety', () => {
  describe('safe URLs allowed', () => {
    it('should allow http:// URLs', () => {
      const markdown = '[Example](http://example.com)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('http://example.com');
    });

    it('should allow https:// URLs', () => {
      const markdown = '[Secure Example](https://example.com)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('https://example.com');
    });

    it('should allow mailto: URLs', () => {
      const markdown = '[Email Us](mailto:user@example.com)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('mailto:user@example.com');
    });

    it('should allow relative paths', () => {
      const markdown = '[Docs](/docs/intro)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('/docs/intro');
    });

    it('should allow anchor links', () => {
      const markdown = '[Section](#anchor-link)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('#anchor-link');
    });

    it('should allow relative paths with subdirectories', () => {
      const markdown = '[Guide](/docs/guides/getting-started)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('href')).toBe('/docs/guides/getting-started');
    });

    it('should allow https URLs with paths', () => {
      const markdown = '[Docs](https://example.com/docs/page)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('href')).toBe('https://example.com/docs/page');
    });

    it('should allow https URLs with query parameters', () => {
      const markdown = '[Search](https://example.com/search?q=test)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('href')).toBe('https://example.com/search?q=test');
    });

    it('should allow https URLs with fragments', () => {
      const markdown = '[Section](https://example.com/page#section)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('href')).toBe('https://example.com/page#section');
    });
  });

  describe('dangerous URLs rejected', () => {
    it('should reject javascript: protocol', () => {
      const markdown = '[XSS](javascript:alert(\'xss\'))';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('#');
    });

    it('should reject javascript: with uppercase', () => {
      const markdown = '[XSS](JavaScript:alert(1))';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('href')).toBe('#');
    });

    it('should reject data: protocol', () => {
      const markdown = '[XSS](data:text/html,<script>alert(\'xss\')</script>)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('href')).toBe('#');
    });

    it('should reject vbscript: protocol', () => {
      const markdown = '[XSS](vbscript:msgbox(\'xss\'))';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('href')).toBe('#');
    });

    it('should reject file: protocol', () => {
      const markdown = '[File](file:///etc/passwd)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('href')).toBe('#');
    });

    it('should reject javascript: with encoded characters', () => {
      const markdown = '[XSS](java&#115;cript:alert(1))';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      // The encoded version might be handled differently by markdown parser
      // but the output href should still be safe
      const link = container.querySelector('a');
      const href = link?.getAttribute('href') ?? '';
      expect(href.toLowerCase()).not.toContain('javascript:');
    });

    it('should reject javascript: with leading whitespace', () => {
      const markdown = '[XSS](   javascript:alert(1))';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('href')).toBe('#');
    });
  });

  describe('malformed URLs', () => {
    it('should handle empty href gracefully', () => {
      const markdown = '[Empty]()';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      // Empty URLs should be converted to # for safety
      expect(link?.getAttribute('href')).toBe('#');
    });

    it('should handle URLs with only whitespace', () => {
      const markdown = '[Whitespace](   )';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('href')).toBe('#');
    });
  });

  describe('null/undefined URLs', () => {
    it('should handle undefined href via component internals', () => {
      // Test the component with content that might produce undefined href
      const markdown = '# No links here';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      // No link should exist
      expect(link).toBeNull();
    });
  });

  describe('external link attributes', () => {
    it('should add target="_blank" to external http links', () => {
      const markdown = '[External](http://external.com)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should add target="_blank" to external https links', () => {
      const markdown = '[External](https://external.com)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should not add target="_blank" to relative links', () => {
      const markdown = '[Internal](/docs/page)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('target')).toBeNull();
      expect(link?.getAttribute('rel')).toBeNull();
    });

    it('should not add target="_blank" to anchor links', () => {
      const markdown = '[Anchor](#section)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('target')).toBeNull();
    });

    it('should add target="_blank" to protocol-relative links (//) ', () => {
      const markdown = '[Protocol-relative](//example.com/page)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('target')).toBe('_blank');
    });
  });
});

// =============================================================================
// MarkdownRenderer Component Tests
// =============================================================================

describe('MarkdownRenderer Component', () => {
  describe('heading IDs', () => {
    it('should add id attribute to h1 headings', () => {
      const markdown = '# Getting Started';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const heading = container.querySelector('h1');

      expect(heading).not.toBeNull();
      expect(heading?.getAttribute('id')).toBe('getting-started');
    });

    it('should add id attribute to h2 headings', () => {
      const markdown = '## Installation Guide';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const heading = container.querySelector('h2');

      expect(heading?.getAttribute('id')).toBe('installation-guide');
    });

    it('should add id attribute to h3 headings', () => {
      const markdown = '### Quick Reference';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const heading = container.querySelector('h3');

      expect(heading?.getAttribute('id')).toBe('quick-reference');
    });

    it('should handle headings with special characters', () => {
      const markdown = "## What's New?";
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const heading = container.querySelector('h2');

      expect(heading?.getAttribute('id')).toBe('whats-new');
    });
  });

  describe('code blocks', () => {
    it('should render inline code', () => {
      const markdown = 'Use `npm install` to install.';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const code = container.querySelector('code');

      expect(code).not.toBeNull();
      expect(code?.textContent).toBe('npm install');
    });

    it('should render code blocks with language class', () => {
      const markdown = '```typescript\nconst x = 1;\n```';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const code = container.querySelector('code');

      expect(code).not.toBeNull();
      expect(code?.getAttribute('data-language')).toBe('typescript');
    });

    it('should wrap code blocks in pre tag', () => {
      const markdown = '```javascript\nfunction test() {}\n```';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const pre = container.querySelector('pre');

      expect(pre).not.toBeNull();
      expect(pre?.querySelector('code')).not.toBeNull();
    });
  });

  describe('lists', () => {
    it('should render unordered lists', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const ul = container.querySelector('ul');
      const items = container.querySelectorAll('li');

      expect(ul).not.toBeNull();
      expect(items).toHaveLength(3);
    });

    it('should render ordered lists', () => {
      const markdown = '1. First\n2. Second\n3. Third';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const ol = container.querySelector('ol');
      const items = container.querySelectorAll('li');

      expect(ol).not.toBeNull();
      expect(items).toHaveLength(3);
    });
  });

  describe('tables (GFM)', () => {
    it('should render tables', () => {
      const markdown = `| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |`;

      const { container } = render(<MarkdownRenderer content={markdown} />);
      const table = container.querySelector('table');
      const headers = container.querySelectorAll('th');
      const cells = container.querySelectorAll('td');

      expect(table).not.toBeNull();
      expect(headers).toHaveLength(2);
      expect(cells).toHaveLength(2);
    });
  });

  describe('blockquotes', () => {
    it('should render blockquotes', () => {
      const markdown = '> This is a quote';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const blockquote = container.querySelector('blockquote');

      expect(blockquote).not.toBeNull();
      expect(blockquote?.textContent).toContain('This is a quote');
    });
  });

  describe('images', () => {
    it('should render images with alt text', () => {
      const markdown = '![Alt text](https://example.com/image.png)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const img = container.querySelector('img');

      expect(img).not.toBeNull();
      expect(img?.getAttribute('alt')).toBe('Alt text');
      expect(img?.getAttribute('src')).toBe('https://example.com/image.png');
    });

    it('should handle images without alt text', () => {
      const markdown = '![](https://example.com/image.png)';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const img = container.querySelector('img');

      expect(img).not.toBeNull();
      expect(img?.getAttribute('alt')).toBe('');
    });
  });

  describe('text formatting', () => {
    it('should render strong/bold text', () => {
      const markdown = '**bold text**';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const strong = container.querySelector('strong');

      expect(strong).not.toBeNull();
      expect(strong?.textContent).toBe('bold text');
    });

    it('should render emphasized/italic text', () => {
      const markdown = '*italic text*';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const em = container.querySelector('em');

      expect(em).not.toBeNull();
      expect(em?.textContent).toBe('italic text');
    });

    it('should render strikethrough text (GFM)', () => {
      const markdown = '~~deleted~~';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const del = container.querySelector('del');

      expect(del).not.toBeNull();
      expect(del?.textContent).toBe('deleted');
    });
  });

  describe('task lists (GFM)', () => {
    it('should render task list with checkboxes', () => {
      const markdown = '- [ ] Unchecked\n- [x] Checked';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');

      expect(checkboxes).toHaveLength(2);
      expect((checkboxes[0] as HTMLInputElement).checked).toBe(false);
      expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
    });

    it('should render checkboxes as read-only', () => {
      const markdown = '- [x] Done task';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const checkbox = container.querySelector('input[type="checkbox"]');

      expect(checkbox?.hasAttribute('readonly')).toBe(true);
    });
  });

  describe('horizontal rules', () => {
    it('should render horizontal rules', () => {
      const markdown = 'Above\n\n---\n\nBelow';
      const { container } = render(<MarkdownRenderer content={markdown} />);
      const hr = container.querySelector('hr');

      expect(hr).not.toBeNull();
    });
  });

  describe('className prop', () => {
    it('should apply custom className to container', () => {
      const markdown = '# Test';
      const { container } = render(
        <MarkdownRenderer content={markdown} className="custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper.classList.contains('custom-class')).toBe(true);
    });

    it('should merge custom className with default classes', () => {
      const markdown = '# Test';
      const { container } = render(
        <MarkdownRenderer content={markdown} className="my-class" />
      );
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper.classList.contains('prose')).toBe(true);
      expect(wrapper.classList.contains('my-class')).toBe(true);
    });
  });
});
