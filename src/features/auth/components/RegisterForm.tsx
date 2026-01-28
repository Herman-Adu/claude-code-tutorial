'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
      } else {
        router.push('/auth/login?registered=true');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          id="form-error"
          role="alert"
          className="p-3 text-sm text-rose-700 bg-rose-50/90 backdrop-blur-sm rounded-xl border border-rose-200/60"
        >
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
          aria-describedby={error ? 'form-error' : undefined}
          className="glass-input w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="glass-input w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="glass-input w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all"
          placeholder="At least 8 characters"
        />

        {/* Password requirements feedback */}
        <ul className="mt-2 text-xs text-slate-500 space-y-1">
          <li className={formData.password.length >= 8 ? 'text-emerald-600' : ''}>
            {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
          </li>
        </ul>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="glass-input w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all"
          placeholder="Confirm your password"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gradient-to-br from-sky-400 to-indigo-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}
