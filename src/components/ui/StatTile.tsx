import { ReactNode } from 'react';
import { GlassCard } from './GlassCard';

interface StatTileProps {
  icon: ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

export const StatTile = ({ icon, label, value, subValue }: StatTileProps) => {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-600">{label}</div>
          <div className="text-xl font-bold text-gray-900">{value}</div>
          {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
        </div>
      </div>
    </GlassCard>
  );
};
