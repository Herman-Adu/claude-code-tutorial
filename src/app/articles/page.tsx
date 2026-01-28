import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { ArticlesLibrary } from '@/features/articles';

export default async function ArticlesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ArticlesLibrary />
      </div>
    </main>
  );
}
