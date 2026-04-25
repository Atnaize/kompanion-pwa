import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export type SyncPhase = 'fetching' | 'saving' | 'processing' | 'complete' | 'error';

export interface SyncButtonProgress {
  type: SyncPhase;
  current?: number;
  total?: number;
}

interface SyncButtonProps {
  onClick: () => void;
  isSyncing: boolean;
  progress?: SyncButtonProgress | null;
  size?: 'sm' | 'md';
  className?: string;
}

export const SyncButton = ({
  onClick,
  isSyncing,
  progress,
  size = 'sm',
  className,
}: SyncButtonProps) => {
  const { t } = useTranslation();

  const sizeClasses =
    size === 'sm' ? 'min-h-[44px] px-4 py-2.5 text-sm' : 'min-h-[48px] px-6 py-3 text-base';

  if (!isSyncing) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          'rounded-2xl bg-strava-orange font-medium text-white shadow-md transition-all',
          'hover:bg-strava-orange-dark hover:shadow-lg active:scale-95',
          sizeClasses,
          className
        )}
      >
        {t('common.sync')}
      </button>
    );
  }

  const phase: SyncPhase = progress?.type ?? 'fetching';
  const pct = computePercent(progress);
  const label = renderLabel(phase, progress, t);

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl bg-orange-100 shadow-inner dark:bg-orange-950/40',
        sizeClasses,
        'flex items-center justify-center font-medium text-gray-900 dark:text-gray-50',
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={clsx(
          'absolute inset-y-0 left-0 bg-gradient-to-r from-strava-orange to-strava-orange-dark transition-[width] duration-300 ease-out',
          pct === null && 'animate-pulse'
        )}
        style={{ width: `${pct ?? 100}%` }}
      />
      <span className="relative z-10 text-white mix-blend-difference">{label}</span>
    </div>
  );
};

// Maps the current phase to an overall 0-100 progress percentage.
// Fetching has no known total (we don't know the final page count), so return
// null — the bar renders as an indeterminate pulse during that phase.
const computePercent = (progress: SyncButtonProgress | null | undefined): number | null => {
  if (!progress) {
    return null;
  }

  const { type, current = 0, total = 0 } = progress;

  switch (type) {
    case 'fetching':
      return null;
    case 'saving':
      // Saving is fast (bulk insert); allocate 10-30% of the bar.
      return total > 0 ? 10 + (current / total) * 20 : 10;
    case 'processing':
      // Processing dominates real time; allocate 30-100%.
      return total > 0 ? 30 + (current / total) * 70 : 30;
    case 'complete':
      return 100;
    case 'error':
      return 0;
  }
};

const renderLabel = (
  phase: SyncPhase,
  progress: SyncButtonProgress | null | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string
): string => {
  const current = progress?.current ?? 0;
  const total = progress?.total ?? 0;

  switch (phase) {
    case 'fetching':
      return t('sync.fetching', { count: current });
    case 'saving':
      return t('sync.saving', { current, total });
    case 'processing':
      return t('sync.processing', { current, total });
    case 'complete':
      return t('sync.done');
    case 'error':
      return t('sync.failed');
  }
};
