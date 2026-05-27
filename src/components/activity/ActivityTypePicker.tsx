import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { ChipScroller } from '@components/ui';
import { getSportPresentation } from '@utils/sport';

interface ActivityTypePickerProps {
  /** Activity types with their counts. Sorted internally by count desc. */
  types: Array<{ type: string; count: number }>;
  /** Count shown on the "All" chip. */
  totalCount: number;
  /** Currently selected type, or null for "All". */
  selected: string | null;
  onChange: (type: string | null) => void;
}

/**
 * Shared activity-type filter used on the Activities, Stats and Leaderboards
 * pages. Renders polished chips (icon + label + count) in a horizontal-scroll
 * ChipScroller — replaces the older flex-wrap + "+N more" toggle that pushed
 * page content down by 60-80px on narrow phones.
 */
export const ActivityTypePicker = ({
  types,
  totalCount,
  selected,
  onChange,
}: ActivityTypePickerProps) => {
  const { t } = useTranslation();

  const sorted = useMemo(() => [...types].sort((a, b) => b.count - a.count), [types]);

  return (
    <ChipScroller ariaLabel={t('common.filter.more', { count: sorted.length })}>
      <Chip
        label={t('common.all')}
        count={totalCount}
        isSelected={selected === null}
        onClick={() => onChange(null)}
      />
      {sorted.map(({ type, count }) => {
        const { icon: Icon } = getSportPresentation(type);
        return (
          <Chip
            key={type}
            icon={Icon}
            label={type}
            count={count}
            isSelected={selected === type}
            onClick={() => onChange(type)}
          />
        );
      })}
    </ChipScroller>
  );
};

interface ChipProps {
  icon?: LucideIcon;
  label: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}

const Chip = ({ icon: Icon, label, count, isSelected, onClick }: ChipProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isSelected}
    className={clsx(
      'inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-1.5 text-sm font-medium transition-all duration-150 active:scale-95',
      isSelected
        ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-500/30'
        : 'bg-white/70 text-gray-700 shadow-sm ring-1 ring-gray-900/5 backdrop-blur-sm hover:bg-white hover:shadow-md dark:bg-gray-900/70 dark:text-gray-300 dark:ring-gray-100/10 dark:hover:bg-gray-800'
    )}
  >
    {Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" />}
    <span>{label}</span>
    <span
      className={clsx(
        'ml-0.5 inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        isSelected
          ? 'bg-white/25 text-white'
          : 'bg-gray-900/5 text-gray-600 dark:bg-gray-100/10 dark:text-gray-400'
      )}
    >
      {count}
    </span>
  </button>
);
