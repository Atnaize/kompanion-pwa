import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { getSportPresentation } from '@utils/sport';

interface ActivityTypePickerProps {
  /** Activity types with their counts. Sorted internally by count desc. */
  types: Array<{ type: string; count: number }>;
  /** Count shown on the "All" chip. */
  totalCount: number;
  /** Currently selected type, or null for "All". */
  selected: string | null;
  onChange: (type: string | null) => void;
  /** How many type chips to show before collapsing the rest behind "+N more". */
  visibleCount?: number;
}

/**
 * Shared activity-type filter used on the Activities and Stats pages. Renders
 * a row of polished chips (icon + label + count) with the most-used types
 * inline and the remainder behind a "+N more" toggle. The currently selected
 * type stays visible even when it would otherwise be hidden in the overflow.
 */
export const ActivityTypePicker = ({
  types,
  totalCount,
  selected,
  onChange,
  visibleCount = 4,
}: ActivityTypePickerProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => [...types].sort((a, b) => b.count - a.count), [types]);

  const visible = expanded ? sorted : sorted.slice(0, visibleCount);
  const overflowCount = Math.max(0, sorted.length - visibleCount);
  const selectedInOverflow = selected !== null && !visible.some((row) => row.type === selected);
  const selectedOverflowRow = selectedInOverflow
    ? sorted.find((row) => row.type === selected)
    : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip
        label={t('common.all')}
        count={totalCount}
        isSelected={selected === null}
        onClick={() => onChange(null)}
      />
      {visible.map(({ type, count }) => {
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
      {selectedOverflowRow && (
        <Chip
          icon={getSportPresentation(selectedOverflowRow.type).icon}
          label={selectedOverflowRow.type}
          count={selectedOverflowRow.count}
          isSelected
          onClick={() => onChange(selectedOverflowRow.type)}
        />
      )}
      {overflowCount > 0 && (
        <ToggleChip
          expanded={expanded}
          overflowCount={overflowCount}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? t('common.filter.less') : t('common.filter.more', { count: overflowCount })}
        </ToggleChip>
      )}
    </div>
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

interface ToggleChipProps {
  expanded: boolean;
  overflowCount: number;
  onClick: () => void;
  children: ReactNode;
}

const ToggleChip = ({ expanded, onClick, children }: ToggleChipProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={expanded}
    className="inline-flex items-center rounded-full bg-white/70 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-900/5 backdrop-blur-sm transition-all duration-150 hover:bg-white hover:shadow-md active:scale-95 dark:bg-gray-900/70 dark:text-gray-300 dark:ring-gray-100/10 dark:hover:bg-gray-800"
  >
    {children}
  </button>
);
