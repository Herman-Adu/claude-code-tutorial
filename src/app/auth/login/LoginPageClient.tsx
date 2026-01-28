'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoginForm, OAuthButtons } from '@/features/auth';

function LoginContent() {
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === 'true';

  return (
    <>
      {registered && (
        <div
          className="bg-emerald-50/90 backdrop-blur-sm border border-emerald-200/60 rounded-xl p-4 mb-6 text-emerald-700 text-sm font-medium"
          role="alert"
        >
          Account created successfully! Please sign in.
        </div>
      )}
      <OAuthButtons callbackUrl="/" />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200/60"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white/70 text-gray-500">or continue with email</span>
        </div>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/register"
          className="font-medium text-sky-600 hover:text-sky-500 transition-colors"
        >
          Create one
        </Link>
      </p>
    </>
  );
}

export default function LoginPageClient() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-lg border border-white/40 shadow-lg rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to continue to your account</p>
          </div>

          <Suspense fallback={null}>
            <LoginContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
