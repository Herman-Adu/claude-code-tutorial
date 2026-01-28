import { auth } from '@/lib/auth/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { loadMarkdownFile } from '@/lib/markdown';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { Badge, getCategoryColor } from '@/components/ui/Badge';
import { findDocBySlug, getFilesystemPath, DOCS_CATEGORIES } from '@/features/docs';
import { DOCS_DATA } from '@/features/docs/data';

interface DocPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Dynamic documentation page that renders markdown content.
 *
 * This server component:
 * - Authenticates the user before rendering
 * - Looks up document metadata by slug
 * - Loads and renders the markdown file
 * - Provides navigation back to the docs index
 */
export default async function DocPage({ params }: DocPageProps) {
  // Authenticate user
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Get slug from params
  const { slug } = await params;

  // Find document metadata by slug
  const doc = findDocBySlug(slug);
  if (!doc) {
    notFound();
  }

  // Convert metadata path to filesystem path and load content
  const filesystemPath = getFilesystemPath(doc.filePath);
  const content = await loadMarkdownFile(filesystemPath);

  if (content === null) {
    notFound();
  }

  // Get category display info
  const categoryInfo = DOCS_CATEGORIES.find(c => c.id === doc.category);
  const categoryColor = getCategoryColor(doc.category);

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back link and metadata */}
        <header className="mb-8">
          {/* Back link */}
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Documentation
          </Link>

          {/* Title and category */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-800">
              {doc.title}
            </h1>
            <Badge className={categoryColor}>
              {categoryInfo?.label || doc.category}
            </Badge>
          </div>

          {/* Description */}
          <p className="mt-3 text-lg text-slate-600">
            {doc.description}
          </p>
        </header>

        {/* Markdown content in glassmorphic container */}
        <article className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/40 shadow-[0_8px_32px_rgba(100,100,140,0.08)] p-6 md:p-8">
          <MarkdownRenderer content={content} />
        </article>

        {/* Footer with back link */}
        <footer className="mt-8 pt-6 border-t border-slate-200/60">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Documentation
          </Link>
        </footer>
      </div>
    </main>
  );
}

/**
 * Generate metadata for the page based on the document.
 */
export async function generateMetadata({ params }: DocPageProps) {
  const { slug } = await params;
  const doc = findDocBySlug(slug);

  if (!doc) {
    return {
      title: 'Document Not Found',
    };
  }

  return {
    title: `${doc.title} | Documentation`,
    description: doc.description,
  };
}

/**
 * Generate static params for all documentation pages.
 * This enables static generation at build time for better performance.
 */
export async function generateStaticParams() {
  return DOCS_DATA.map((doc) => ({
    slug: doc.slug,
  }));
}
