import { useState, useEffect } from 'react';

export type TimePeriod = 'week' | 'month' | 'year' | 'overall';

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
  storageKey?: string;
}

const periods: { value: TimePeriod; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'overall', label: 'Overall' },
];

export const TimePeriodSelector = ({
  value,
  onChange,
  storageKey = 'stats-period',
}: TimePeriodSelectorProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(value);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as TimePeriod | null;
    if (saved && periods.some((p) => p.value === saved)) {
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
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => handleChange(period.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            selectedPeriod === period.value
              ? 'bg-white text-[#FF4B00] shadow-sm'
              : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};
