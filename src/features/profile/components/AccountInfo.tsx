'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface AccountInfoProps {
  email: string;
  name: string | null;
  createdAt: Date;
  emailVerified: Date | null;
}

export function AccountInfo({
  email,
  name,
  createdAt,
  emailVerified,
}: AccountInfoProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Avatar and Basic Info */}
      <div className="p-6 rounded-xl backdrop-blur-md bg-white/65 border border-white/30 space-y-4">
        <div className="flex items-start gap-4">
          <Avatar email={email} name={name} size="lg" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-700">
              {name || 'User'}
            </h3>
            <p className="text-sm text-slate-600">{email}</p>
          </div>
        </div>

        {emailVerified && (
          <div className="flex items-center gap-2">
            <Badge variant="default">Email Verified</Badge>
            <span className="text-xs text-slate-500">
              {formatDate(emailVerified)}
            </span>
          </div>
        )}
      </div>

      {/* Account Dates */}
      <div className="p-6 rounded-xl backdrop-blur-md bg-white/65 border border-white/30 space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Account Information
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Member Since</span>
            <span className="text-sm font-medium text-slate-700">
              {formatDate(createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Gravatar Help */}
      <div className="p-4 rounded-xl backdrop-blur-md bg-sky-50/65 border border-sky-200/40">
        <p className="text-sm text-sky-700">
          <span className="font-medium">Tip:</span> Your profile picture is
          managed by{' '}
          <a
            href="https://gravatar.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-sky-800 transition-colors"
          >
            Gravatar
          </a>
          . Sign up with your email address there to set a custom avatar.
        </p>
      </div>
    </div>
  );
}
