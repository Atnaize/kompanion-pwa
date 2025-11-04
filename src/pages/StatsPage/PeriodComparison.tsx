import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassCard, Skeleton } from '@components/ui';
import { statsService } from '@api/services';
import { formatDistance, formatElevation, formatDuration } from '@utils/format';

type Period = 'week' | 'month' | 'year' | 'custom';

export const PeriodComparison = () => {
  const [period, setPeriod] = useState<Period>('week');

  // Custom date range state
  const [currentStart, setCurrentStart] = useState('');
  const [currentEnd, setCurrentEnd] = useState('');
  const [previousStart, setPreviousStart] = useState('');
  const [previousEnd, setPreviousEnd] = useState('');

  const isCustomValid =
    period !== 'custom' || Boolean(currentStart && currentEnd && previousStart && previousEnd);

  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['stats', 'compare', period, currentStart, currentEnd, previousStart, previousEnd],
    queryFn: async () => {
      if (period === 'custom') {
        const response = await statsService.compareCustomRanges({
          currentStart,
          currentEnd,
          previousStart,
          previousEnd,
        });
        return response.data;
      } else {
        const response = await statsService.comparePeriods(period as 'week' | 'month' | 'year');
        return response.data;
      }
    },
    enabled: isCustomValid,
  });

  const getPeriodLabel = (isCurrent: boolean): string => {
    if (period === 'custom') {
      if (isCurrent) {
        return `${currentStart} to ${currentEnd}`;
      }

      return `${previousStart} to ${previousEnd}`;
    }

    const labels: Record<Exclude<Period, 'custom'>, { current: string; previous: string }> = {
      week: { current: 'This Week', previous: 'Last Week' },
      month: { current: 'This Month', previous: 'Last Month' },
      year: { current: 'This Year', previous: 'Last Year' },
    };
    return isCurrent
      ? labels[period as Exclude<Period, 'custom'>].current
      : labels[period as Exclude<Period, 'custom'>].previous;
  };

  const formatMetricValue = (metric: string, value: number): string => {
    switch (metric) {
      case 'distance':
        return formatDistance(value);
      case 'elevation':
        return formatElevation(value);
      case 'time':
        return formatDuration(value);
      case 'count':
        return value.toString();
      default:
        return value.toString();
    }
  };

  const getMetricLabel = (metric: string): string => {
    const labels: Record<string, string> = {
      distance: 'Distance',
      elevation: 'Elevation',
      time: 'Time',
      count: 'Activities',
    };
    return labels[metric] || metric;
  };

  const getMetricIcon = (metric: string): string => {
    const icons: Record<string, string> = {
      distance: '📏',
      elevation: '⛰️',
      time: '⏱️',
      count: '🏃',
    };
    return icons[metric] || '📊';
  };

  const renderChangeIndicator = (change: number) => {
    if (change === 0) {
      return (
        <span className="text-sm text-gray-600">
          <span className="mr-1">→</span>
          No change
        </span>
      );
    }

    const isPositive = change > 0;
    return (
      <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <span className="mr-1">{isPositive ? '↑' : '↓'}</span>
        {Math.abs(change)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-4 h-10 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </GlassCard>
    );
  }

  const metrics: Array<'distance' | 'elevation' | 'time' | 'count'> = [
    'distance',
    'elevation',
    'time',
    'count',
  ];

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Period Comparison</h3>
        <p className="text-sm text-gray-600">Compare your performance across time periods</p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
        {(['week', 'month', 'year', 'custom'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              period === p
                ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                : 'bg-white/50 text-gray-700 backdrop-blur-sm hover:bg-white/80'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Custom Date Range Inputs */}
      {period === 'custom' && (
        <div className="mb-6 space-y-4 rounded-lg bg-white/50 p-4 backdrop-blur-sm">
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-900">Current Period</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="currentStart" className="mb-1 block text-xs text-gray-600">
                  Start Date
                </label>
                <input
                  id="currentStart"
                  type="date"
                  value={currentStart}
                  onChange={(e) => setCurrentStart(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                />
              </div>
              <div>
                <label htmlFor="currentEnd" className="mb-1 block text-xs text-gray-600">
                  End Date
                </label>
                <input
                  id="currentEnd"
                  type="date"
                  value={currentEnd}
                  onChange={(e) => setCurrentEnd(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-900">Previous Period</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="previousStart" className="mb-1 block text-xs text-gray-600">
                  Start Date
                </label>
                <input
                  id="previousStart"
                  type="date"
                  value={previousStart}
                  onChange={(e) => setPreviousStart(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                />
              </div>
              <div>
                <label htmlFor="previousEnd" className="mb-1 block text-xs text-gray-600">
                  End Date
                </label>
                <input
                  id="previousEnd"
                  type="date"
                  value={previousEnd}
                  onChange={(e) => setPreviousEnd(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation message */}
      {period === 'custom' && !isCustomValid && (
        <div className="mb-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
          Please fill in all date fields to compare custom periods
        </div>
      )}

      {/* Comparison Cards */}
      {comparisonData && (
        <div className="space-y-4">
          {metrics.map((metric) => {
            const currentValue = comparisonData.current[metric];
            const previousValue = comparisonData.previous[metric];
            const change = comparisonData.changes[metric];

            return (
              <div
                key={metric}
                className="rounded-lg border border-gray-200 bg-white/50 p-4 backdrop-blur-sm"
              >
                {/* Metric Header */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{getMetricIcon(metric)}</span>
                  <h4 className="font-bold text-gray-900">{getMetricLabel(metric)}</h4>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Current Period */}
                  <div>
                    <p className="mb-1 text-xs text-gray-600">{getPeriodLabel(true)}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatMetricValue(metric, currentValue)}
                    </p>
                  </div>

                  {/* Previous Period */}
                  <div>
                    <p className="mb-1 text-xs text-gray-600">{getPeriodLabel(false)}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatMetricValue(metric, previousValue)}
                    </p>
                  </div>
                </div>

                {/* Change Indicator */}
                <div className="mt-3 flex items-center justify-center rounded-md bg-gray-50 py-2">
                  {renderChangeIndicator(change)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};
