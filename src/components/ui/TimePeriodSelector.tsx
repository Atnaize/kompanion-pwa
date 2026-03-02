import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export type TimePeriod = 'week' | 'month' | 'year' | 'overall';

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
  storageKey?: string;
}

const periodKeys: TimePeriod[] = ['week', 'month', 'year', 'overall'];

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
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            selectedPeriod === period
              ? 'bg-white text-[#FF4B00] shadow-sm'
              : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
          }`}
        >
          {t(`common.${period}`)}
        </button>
      ))}
    </div>
  );
};
