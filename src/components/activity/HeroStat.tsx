import type { ReactNode } from 'react';

interface HeroStatProps {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
}

export const HeroStat = ({ label, value, sub, icon }: HeroStatProps) => {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-white/70">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 truncate text-xl font-bold leading-tight text-white sm:text-2xl">
        {value}
      </div>
      {sub && <div className="truncate text-[11px] text-white/70">{sub}</div>}
    </div>
  );
};
