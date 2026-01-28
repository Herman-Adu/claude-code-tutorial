import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/app/actions/user';
import {
  ChangePasswordForm,
  DeleteAccountForm,
  SettingsSection,
} from '@/features/settings';
import { Alert } from '@/components/ui/Alert';

export const metadata = {
  title: 'Settings',
  description: 'Manage your account settings',
};

export default async function SettingsPage() {
  // Verify user is authenticated
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Fetch user profile to check hasPassword
  const profileResult = await getUserProfile();
  if (!profileResult.success || !profileResult.data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Alert
            type="error"
            title="Error"
            message="Failed to load settings. Please try again later."
          />
        </div>
      </main>
    );
  }

  const { hasPassword } = profileResult.data;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-lg text-slate-600">
            Manage your account security and preferences
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Change Password Section */}
              <SettingsSection
                title="Change Password"
                description="Update your account password to keep your account secure."
              >
                <ChangePasswordForm hasPassword={hasPassword} />
              </SettingsSection>

              {/* Delete Account Section */}
              <SettingsSection
                title="Danger Zone"
                description="Permanently delete your account and all associated data."
                isDanger
              >
                <DeleteAccountForm hasPassword={hasPassword} />
              </SettingsSection>
            </div>
          </div>

          {/* Right Column - Help/Info */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {/* Security Tips Card */}
              <div className="p-6 rounded-xl backdrop-blur-md bg-white/65 border border-white/30">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Security Tips
                </h2>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-medium">
                      1
                    </span>
                    <span>
                      Use a strong, unique password that you do not use elsewhere.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-medium">
                      2
                    </span>
                    <span>
                      Include a mix of uppercase, lowercase, numbers, and special
                      characters.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-medium">
                      3
                    </span>
                    <span>
                      Consider using a password manager to generate and store
                      secure passwords.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-medium">
                      4
                    </span>
                    <span>
                      Change your password immediately if you suspect unauthorized
                      access.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Account Data Card */}
              <div className="p-6 rounded-xl backdrop-blur-md bg-white/65 border border-white/30">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  About Account Deletion
                </h2>
                <div className="space-y-4 text-sm text-slate-600">
                  <p>
                    Deleting your account is a permanent action. Once deleted, we
                    cannot recover your account or any of your data.
                  </p>
                  <p>When you delete your account:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>All your tasks and boards will be permanently removed</li>
                    <li>Your profile information will be deleted</li>
                    <li>Any active sessions will be terminated</li>
                    <li>Connected OAuth accounts will be unlinked</li>
                  </ul>
                  <p className="text-amber-700 font-medium">
                    This action cannot be undone. Please be certain before
                    proceeding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600">
            Need to update your name?{' '}
            <a
              href="/profile"
              className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
            >
              Go to Profile
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
