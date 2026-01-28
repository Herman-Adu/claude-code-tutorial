import Link from 'next/link';
import { RegisterForm, OAuthButtons } from '@/features/auth';

export const metadata = {
  title: 'Create Account',
  description: 'Create a new account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-lg border border-white/40 shadow-lg rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600 mt-2">Get started with your free account</p>
          </div>

          <OAuthButtons callbackUrl="/" />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200/60"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/70 text-gray-500">or register with email</span>
            </div>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-sky-600 hover:text-sky-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
