import { useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Infinity as InfinityIcon } from 'lucide-react';

export type TimePeriod = 'week' | 'month' | 'year' | 'overall';

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
  storageKey?: string;
}

const periodKeys: TimePeriod[] = ['week', 'month', 'year', 'overall'];

const shortLabels: Record<TimePeriod, ReactNode> = {
  week: '7d',
  month: '30d',
  year: '1y',
  overall: <InfinityIcon className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />,
};

export const TimePeriodSelector = ({
  value,
  onChange,
  storageKey = 'stats-period',
}: TimePeriodSelectorProps) => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(value);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as TimePeriod | null;
    if (saved && periodKeys.includes(saved)) {
      setSelectedPeriod(saved);
      onChange(saved);
    }
  }, [storageKey, onChange]);

  const handleChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    localStorage.setItem(storageKey, period);
    onChange(period);
  };

  return (
    <div className="flex gap-1 rounded-lg bg-white/50 p-1">
      {periodKeys.map((period) => (
        <button
          key={period}
          onClick={() => handleChange(period)}
          className={`rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:px-3 ${
            selectedPeriod === period
              ? 'bg-white text-[#FF4B00] shadow-sm'
              : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
          }`}
        >
          <span className="inline-flex items-center justify-center sm:hidden">
            {shortLabels[period]}
          </span>
          <span className="hidden sm:inline">{t(`common.${period}`)}</span>
        </button>
      ))}
    </div>
  );
};
