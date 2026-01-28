import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  /** Section title displayed at the top */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Content to render inside the section */
  children: React.ReactNode;
  /** Whether to use danger styling (red tones) for destructive actions */
  isDanger?: boolean;
  /** Additional CSS classes to apply to the container */
  className?: string;
}

/**
 * Reusable card wrapper component for settings sections.
 *
 * Provides consistent glassmorphic styling with support for
 * a danger variant used for destructive action sections.
 *
 * @example
 * ```tsx
 * <SettingsSection title="Change Password" description="Update your account password">
 *   <ChangePasswordForm hasPassword={true} />
 * </SettingsSection>
 *
 * <SettingsSection title="Danger Zone" isDanger>
 *   <DeleteAccountForm hasPassword={true} />
 * </SettingsSection>
 * ```
 */
export function SettingsSection({
  title,
  description,
  children,
  isDanger = false,
  className,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        'p-6 rounded-xl backdrop-blur-md border',
        isDanger
          ? 'bg-red-50/65 border-red-200/40'
          : 'bg-white/65 border-white/30',
        className
      )}
    >
      <div className="space-y-4">
        <div>
          <h2
            className={cn(
              'text-lg font-semibold',
              isDanger ? 'text-red-700' : 'text-slate-700'
            )}
          >
            {title}
          </h2>
          {description && (
            <p
              className={cn(
                'mt-1 text-sm',
                isDanger ? 'text-red-600' : 'text-slate-600'
              )}
            >
              {description}
            </p>
          )}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}
