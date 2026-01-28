'use client';

import { Badge } from '@/components/ui/Badge';

interface OAuthConnectionsProps {
  accounts: Array<{
    provider: string;
    displayName: string;
  }>;
  hasPassword: boolean;
}

const providerIcons: Record<string, string> = {
  github: '🐙',
  google: '🔍',
};

export function OAuthConnections({ accounts, hasPassword }: OAuthConnectionsProps) {
  return (
    <div className="p-6 rounded-xl backdrop-blur-md bg-white/65 border border-white/30 space-y-4">
      <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
        Connected Accounts
      </h4>

      {accounts.length === 0 && !hasPassword && (
        <p className="text-sm text-slate-600">
          No external accounts connected. Consider linking an OAuth provider for
          easier login.
        </p>
      )}

      {accounts.length > 0 ? (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.provider}
              className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-white/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {providerIcons[account.provider.toLowerCase()] || '🔗'}
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {account.displayName}
                </span>
              </div>
              <Badge variant="default">Connected</Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 italic">No OAuth providers connected</p>
      )}

      {!hasPassword && accounts.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-50/65 border border-amber-200/40">
          <p className="text-xs text-amber-700">
            <span className="font-medium">Note:</span> This account uses OAuth
            authentication only. You cannot change your password.
          </p>
        </div>
      )}

      {hasPassword && (
        <div className="p-3 rounded-lg bg-emerald-50/65 border border-emerald-200/40">
          <p className="text-xs text-emerald-700">
            <span className="font-medium">✓</span> Password authentication is
            enabled. You can change your password in Settings.
          </p>
        </div>
      )}
    </div>
  );
}
