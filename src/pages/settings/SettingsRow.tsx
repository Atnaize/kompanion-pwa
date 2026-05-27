import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface SettingsRowProps {
  to: string;
  icon: ReactNode;
  title: string;
  /** Current state, e.g. "Enabled · 4 categories on". Optional. */
  value?: string;
  /** Apply a danger tint (red) to icon + chevron. */
  danger?: boolean;
}

/**
 * One nav row inside a settings GlassCard. Tap drills into the sub-page at
 * `to`. Designed to slot inside `divide-y divide-gray-200/60` containers so
 * a stack of these reads as a single grouped list.
 */
export const SettingsRow = ({ to, icon, title, value, danger = false }: SettingsRowProps) => (
  <Link
    to={to}
    className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-gray-100/40 dark:hover:bg-gray-800/40"
  >
    <span
      className={clsx(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
        danger ? 'bg-red-500/15 text-red-400' : 'bg-strava-orange/15 text-strava-orange'
      )}
    >
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm text-gray-900 dark:text-gray-100">{title}</span>
      {value && (
        <span className="mt-0.5 block truncate text-[11px] text-gray-500 dark:text-gray-400">
          {value}
        </span>
      )}
    </span>
    <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-gray-400" />
  </Link>
);
