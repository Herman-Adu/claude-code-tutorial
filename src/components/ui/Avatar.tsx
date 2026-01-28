'use client';

import { cn } from '@/lib/utils';
import { getGravatarUrl, getInitials } from '@/lib/gravatar';
import Image from 'next/image';
import { useState } from 'react';

interface AvatarProps {
  email: string;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  alt?: string;
}

const sizeMap = {
  sm: { container: 32, image: 32 },
  md: { container: 48, image: 48 },
  lg: { container: 64, image: 64 },
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
};

export function Avatar({
  email,
  name,
  size = 'md',
  className,
  alt = 'User avatar',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const gravatarUrl = getGravatarUrl(email, sizeMap[size].image);
  const initials = getInitials(name);

  const baseStyles =
    'inline-flex items-center justify-center rounded-full border border-white/40 bg-gradient-to-br from-sky-100 to-indigo-100 text-slate-700 font-semibold tracking-wide';

  if (imageError) {
    return (
      <div className={cn(baseStyles, sizeClasses[size], className)}>
        {initials}
      </div>
    );
  }

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <Image
        src={gravatarUrl}
        alt={alt}
        width={sizeMap[size].image}
        height={sizeMap[size].image}
        className={cn(
          'rounded-full border border-white/40 bg-white/65',
          'object-cover'
        )}
        onError={() => setImageError(true)}
        priority={size === 'lg'}
      />
    </div>
  );
}
