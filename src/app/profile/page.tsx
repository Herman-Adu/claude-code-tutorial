import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/app/actions/user';
import { ProfileForm } from '@/features/profile/components/ProfileForm';
import { AccountInfo } from '@/features/profile/components/AccountInfo';
import { OAuthConnections } from '@/features/profile/components/OAuthConnections';
import { Alert } from '@/components/ui/Alert';

export const metadata = {
  title: 'Profile',
  description: 'Manage your profile information',
};

export default async function ProfilePage() {
  // Verify user is authenticated
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Fetch user profile
  const profileResult = await getUserProfile();
  if (!profileResult.success || !profileResult.data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Alert
            type="error"
            title="Error"
            message="Failed to load profile. Please try again later."
          />
        </div>
      </main>
    );
  }

  const { data: profile } = profileResult;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Profile</h1>
          <p className="text-lg text-slate-600">
            Manage your profile information and account settings
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Edit Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="p-6 rounded-xl backdrop-blur-md bg-white/65 border border-white/30 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    Edit Profile
                  </h2>
                  <ProfileForm initialName={profile.name} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Info Sections */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {/* Account Info */}
              <AccountInfo
                email={profile.email}
                name={profile.name}
                createdAt={profile.createdAt}
                emailVerified={profile.emailVerified}
              />

              {/* OAuth Connections */}
              <OAuthConnections
                accounts={profile.accounts}
                hasPassword={profile.hasPassword}
              />
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600">
            Need to change your password?{' '}
            <a
              href="/settings"
              className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
            >
              Go to Settings
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
