import { ReactNode } from 'react';
import { GlassCard } from './GlassCard';

interface StatTileProps {
  label: string;
  value: ReactNode;
  subValue?: string;
  /** Background viz (absolute-positioned). See stat-vizzes.tsx. */
  viz?: ReactNode;
}

export const StatTile = ({ label, value, subValue, viz }: StatTileProps) => {
  return (
    <GlassCard className="relative overflow-hidden p-4">
      {viz}
      <div className="relative">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
          {label}
        </div>
        <div className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-gray-50">
          {value}
        </div>
        {subValue && <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subValue}</div>}
      </div>
    </GlassCard>
  );
};
