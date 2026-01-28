import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { TutorialsLibrary } from '@/features/tutorials';

export default async function TutorialsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <TutorialsLibrary />
      </div>
    </main>
  );
}
