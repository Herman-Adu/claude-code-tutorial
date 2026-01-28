import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { loadMarkdownFile } from '@/lib/markdown';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { Badge, getCategoryColor } from '@/components/ui/Badge';
import { findArticleBySlug, getFilesystemPath, ARTICLE_CATEGORIES } from '@/features/articles';
import { ARTICLES_DATA } from '@/features/articles/data';
import { cn } from '@/lib/utils';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Dynamic route page for rendering individual articles.
 * Loads markdown content from the filesystem and renders it with
 * the MarkdownRenderer component.
 *
 * Protected by authentication - redirects to login if not authenticated.
 */
export default async function ArticlePage({ params }: ArticlePageProps) {
  // Authentication check
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Await params (Next.js 15+ requirement)
  const { slug } = await params;

  // Find article metadata by slug
  const article = findArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  // Load markdown content from filesystem
  const filesystemPath = getFilesystemPath(article.filePath);
  const content = await loadMarkdownFile(filesystemPath);

  if (content === null) {
    notFound();
  }

  // Get category display info
  const categoryInfo = ARTICLE_CATEGORIES.find(c => c.id === article.category);
  const categoryColor = getCategoryColor(article.category);

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/articles"
          className={cn(
            'inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-lg',
            'text-sm font-medium text-slate-600 hover:text-slate-800',
            'bg-white/60 backdrop-blur-sm border border-white/40',
            'hover:bg-white/80 hover:shadow-sm transition-all duration-200'
          )}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Articles
        </Link>

        {/* Article header */}
        <header className={cn(
          'mb-8 p-6 rounded-2xl',
          'bg-white/70 backdrop-blur-sm border border-white/40',
          'shadow-[0_4px_20px_rgba(100,100,140,0.08)]'
        )}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              {article.title}
            </h1>
            <Badge className={cn('flex-shrink-0', categoryColor)}>
              {categoryInfo?.label || article.category}
            </Badge>
          </div>

          <p className="text-slate-600 mb-4">
            {article.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            {article.date && (
              <div className="flex items-center gap-1.5">
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
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
                <time dateTime={article.date}>
                  {new Date(article.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
            )}
            <div className="flex items-center gap-1.5">
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
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <span className="truncate max-w-[200px]">
                {article.filePath.split('/').pop()}
              </span>
            </div>
          </div>
        </header>

        {/* Article content */}
        <article className={cn(
          'p-6 md:p-8 rounded-2xl',
          'bg-white/70 backdrop-blur-sm border border-white/40',
          'shadow-[0_4px_20px_rgba(100,100,140,0.08)]'
        )}>
          <MarkdownRenderer content={content} />
        </article>
      </div>
    </main>
  );
}

/**
 * Generate static params for all article pages.
 * This enables static generation at build time for better performance.
 */
export async function generateStaticParams() {
  return ARTICLES_DATA.map((article) => ({
    slug: article.slug,
  }));
}
