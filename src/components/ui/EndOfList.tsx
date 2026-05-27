import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface EndOfListProps {
  /** Override the default copy. Defaults to `common.endOfList`. */
  label?: string;
  /** Extra classes (e.g. spacing). */
  className?: string;
}

/**
 * Small centered marker shown at the bottom of an infinite-scroll list once
 * the user has reached the end. Removes the "is more loading or is this the
 * end?" ambiguity that plagues Activities, Feed, Notifications — and any
 * future paginated list.
 *
 * Visual: two short rules flanking a piece of secondary copy. Standard
 * "you're caught up" pattern from iOS Mail / Strava / Slack.
 */
export const EndOfList = ({ label, className }: EndOfListProps) => {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className={clsx(
        'mx-auto flex max-w-xs items-center gap-3 py-6 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500',
        className
      )}
    >
      <span aria-hidden className="h-px flex-1 bg-gray-300/60 dark:bg-gray-700/60" />
      <span>{label ?? t('common.endOfList')}</span>
      <span aria-hidden className="h-px flex-1 bg-gray-300/60 dark:bg-gray-700/60" />
    </div>
  );
};
