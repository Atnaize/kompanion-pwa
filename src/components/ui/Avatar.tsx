import { useState } from 'react';
import clsx from 'clsx';

export interface AvatarProps {
  src?: string;
  firstname?: string;
  lastname?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar = ({ src, firstname, lastname, alt, size = 'md', className }: AvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base',
  };

  // Auto-generate alt text from name if not provided
  const altText = alt || [firstname, lastname].filter(Boolean).join(' ') || 'User';

  // Derive initials from firstname/lastname, fallback to alt text
  const initials = firstname
    ? `${firstname[0]}${lastname?.[0] || ''}`.toUpperCase()
    : altText
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?';

  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center overflow-hidden rounded-full border-0 shadow-md',
        sizeClasses[size],
        className
      )}
    >
      {!imageError && src ? (
        <img
          src={src}
          alt={altText}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-strava-orange to-orange-600 font-bold text-white">
          {initials}
        </div>
      )}
    </div>
  );
};
