import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export const Skeleton = ({ className, variant = 'rectangular', width, height }: SkeletonProps) => {
  return (
    <div
      className={clsx(
        'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
        {
          'rounded-full': variant === 'circular',
          'rounded-md': variant === 'rectangular',
          'h-4 rounded': variant === 'text',
        },
        className
      )}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%'),
      }}
    />
  );
};

// Skeleton for activity card
export const ActivityCardSkeleton = () => {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-md dark:border-gray-700/40 dark:bg-gray-900/70">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton width="70%" height="20px" />
          <Skeleton width="40%" height="16px" />
          <div className="flex gap-4">
            <Skeleton width="80px" height="16px" />
            <Skeleton width="80px" height="16px" />
          </div>
        </div>
        <Skeleton variant="rectangular" width="60px" height="24px" className="rounded-full" />
      </div>
    </div>
  );
};

// Skeleton for stat tile
export const StatTileSkeleton = () => {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-md dark:border-gray-700/40 dark:bg-gray-900/70">
      <Skeleton width="40%" height="10px" />
      <Skeleton width="60%" height="28px" className="mt-3" />
    </div>
  );
};

// Skeleton for achievement card
export const AchievementCardSkeleton = () => {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-md dark:border-gray-700/40 dark:bg-gray-900/70">
      <div className="space-y-3">
        <div className="flex items-center justify-center">
          <Skeleton variant="circular" width="60px" height="60px" />
        </div>
        <Skeleton width="100%" height="18px" />
        <Skeleton width="80%" height="14px" />
        <Skeleton width="100%" height="32px" className="mt-2" />
      </div>
    </div>
  );
};

/**
 * Generic list placeholder: N avatar-row cards. Replaces the bare "Loading…"
 * text that several list pages (clubs, notifications, feed) used to show, so
 * loading reserves the list's shape and avoids layout shift.
 */
export const ListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-md dark:border-gray-700/40 dark:bg-gray-900/70"
      >
        <Skeleton variant="circular" width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <Skeleton width="55%" height="14px" />
          <Skeleton width="35%" height="12px" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for quest card
