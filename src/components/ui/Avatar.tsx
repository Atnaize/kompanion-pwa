import { useState } from 'react';
import clsx from 'clsx';

export interface AvatarProps {
  src?: string;
  alt: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar = ({ src, alt, fallbackText, size = 'md', className }: AvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base',
  };

  const initials = fallbackText
    ? fallbackText
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : alt[0]?.toUpperCase() || '?';

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
          alt={alt}
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
