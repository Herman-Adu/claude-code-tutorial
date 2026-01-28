import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { loadMarkdownFile } from '@/lib/markdown';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { Badge, getCategoryColor } from '@/components/ui/Badge';
import { getTutorialBySlug, getFilesystemPath, TUTORIAL_CATEGORIES, DIFFICULTY_LABELS, getDifficultyColor } from '@/features/tutorials';
import { cn } from '@/lib/utils';

interface TutorialPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Dynamic route page for individual tutorials.
 * Renders tutorial markdown content with metadata display.
 *
 * Protected by authentication - redirects to login if not authenticated.
 * Returns 404 if the tutorial slug is not found or the file cannot be loaded.
 */
export default async function TutorialPage({ params }: TutorialPageProps) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Await params for Next.js 15+
  const { slug } = await params;

  // Look up tutorial metadata
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) {
    notFound();
  }

  // Convert metadata path to filesystem path and load content
  const filesystemPath = getFilesystemPath(tutorial.filePath);
  const content = await loadMarkdownFile(filesystemPath);
  if (content === null) {
    notFound();
  }

  // Get category display info
  const categoryInfo = TUTORIAL_CATEGORIES.find((c) => c.id === tutorial.category);
  const categoryColor = getCategoryColor(tutorial.category);
  const difficultyColor = getDifficultyColor(tutorial.difficulty);

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/tutorials"
          className={cn(
            'inline-flex items-center gap-2 mb-6 text-sm font-medium',
            'text-slate-600 hover:text-slate-800 transition-colors'
          )}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tutorials
        </Link>

        {/* Tutorial header with glassmorphic styling */}
        <header
          className={cn(
            'mb-8 p-6 rounded-2xl',
            'bg-white/70 backdrop-blur-sm border border-white/40',
            'shadow-[0_4px_20px_rgba(100,100,140,0.08)]'
          )}
        >
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Category badge */}
            <Badge className={cn('flex-shrink-0', categoryColor)}>
              {categoryInfo?.label || tutorial.category}
            </Badge>

            {/* Difficulty badge */}
            <span
              className={cn('px-3 py-1 rounded-full text-xs font-medium', difficultyColor)}
            >
              {DIFFICULTY_LABELS[tutorial.difficulty]}
            </span>

            {/* Duration */}
            <span className="flex items-center text-sm text-slate-500">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              {tutorial.duration} min read
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-800 mb-3">{tutorial.title}</h1>

          {/* Description */}
          <p className="text-slate-600 leading-relaxed">{tutorial.description}</p>
        </header>

        {/* Tutorial content with glassmorphic container */}
        <article
          className={cn(
            'p-6 md:p-8 rounded-2xl',
            'bg-white/70 backdrop-blur-sm border border-white/40',
            'shadow-[0_4px_20px_rgba(100,100,140,0.08)]'
          )}
        >
          <MarkdownRenderer content={content} />
        </article>

        {/* Footer navigation */}
        <footer className="mt-8 pt-6 border-t border-slate-200/60">
          <Link
            href="/tutorials"
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium',
              'text-sky-600 hover:text-sky-700 transition-colors'
            )}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            View all tutorials
          </Link>
        </footer>
      </div>
    </main>
  );
}

/**
 * Generate static params for all known tutorials.
 * This enables static generation of tutorial pages at build time.
 */
export async function generateStaticParams() {
  const { getAllTutorialSlugs } = await import('@/features/tutorials/data');
  const slugs = getAllTutorialSlugs();

  return slugs.map((slug) => ({
    slug,
  }));
}

/**
 * Generate metadata for the tutorial page.
 */
export async function generateMetadata({ params }: TutorialPageProps) {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);

  if (!tutorial) {
    return {
      title: 'Tutorial Not Found',
    };
  }

  return {
    title: `${tutorial.title} | Tutorials`,
    description: tutorial.description,
  };
}
