import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface ActivityTypeFilterProps {
  byActivityType: Record<string, { count: number }>;
  selected: string | null;
  onChange: (type: string | null) => void;
  visibleCount?: number;
}

/**
 * Sticky chip row at the top of the Stats page that filters every tab by
 * a single Strava activity type. Chips are derived from the user's actual
 * `byActivityType` breakdown, sorted by activity count desc. The top N are
 * shown inline; the rest collapse behind a "More" toggle.
 *
 * "All" is always the first chip and is the default state (selected === null).
 */
export const ActivityTypeFilter = ({
  byActivityType,
  selected,
  onChange,
  visibleCount = 5,
}: ActivityTypeFilterProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    return Object.entries(byActivityType)
      .map(([type, data]) => ({ type, count: data.count }))
      .sort((a, b) => b.count - a.count);
  }, [byActivityType]);

  if (sorted.length === 0) {
    return null;
  }

  const visible = expanded ? sorted : sorted.slice(0, visibleCount);
  const overflowCount = Math.max(0, sorted.length - visibleCount);

  // If the current selection is in the overflow, keep it visible.
  const selectedInOverflow = selected !== null && !visible.some((v) => v.type === selected);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip
        label={t('stats.filter.all')}
        active={selected === null}
        onClick={() => onChange(null)}
      />
      {visible.map((row) => (
        <Chip
          key={row.type}
          label={row.type}
          count={row.count}
          active={selected === row.type}
          onClick={() => onChange(row.type)}
        />
      ))}
      {selectedInOverflow && (
        <Chip
          label={selected}
          count={sorted.find((s) => s.type === selected)?.count}
          active
          onClick={() => onChange(selected)}
        />
      )}
      {overflowCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {expanded ? t('stats.filter.less') : t('stats.filter.more', { count: overflowCount })}
        </button>
      )}
    </div>
  );
};

interface ChipProps {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

const Chip = ({ label, count, active, onClick }: ChipProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={clsx(
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition',
      active
        ? 'bg-strava-orange text-white shadow-sm'
        : 'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
    )}
  >
    <span>{label}</span>
    {count !== undefined && (
      <span
        className={clsx(
          'font-mono text-[10px] tabular-nums',
          active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
        )}
      >
        {count}
      </span>
    )}
  </button>
);
