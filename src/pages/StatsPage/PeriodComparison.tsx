import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Activity, BarChart3, Minus, Ruler, Timer, TrendingDown, TrendingUp } from 'lucide-react';
import { GlassCard, Skeleton } from '@components/ui';
import { statsService } from '@api/services';
import { formatDistance, formatElevation, formatDuration } from '@utils/format';

type Period = 'week' | 'month' | 'year' | 'custom';

export const PeriodComparison = () => {
  const { t } = useTranslation();
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
      week: { current: t('periodComparison.thisWeek'), previous: t('periodComparison.lastWeek') },
      month: {
        current: t('periodComparison.thisMonth'),
        previous: t('periodComparison.lastMonth'),
      },
      year: { current: t('periodComparison.thisYear'), previous: t('periodComparison.lastYear') },
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
      distance: t('common.distance'),
      elevation: t('common.elevation'),
      time: t('common.time'),
      count: t('common.activities'),
    };
    return labels[metric] || metric;
  };

  const getMetricIcon = (metric: string) => {
    const iconProps = { size: 18, strokeWidth: 2, className: 'text-strava-orange' };
    switch (metric) {
      case 'distance':
        return <Ruler {...iconProps} />;
      case 'elevation':
        return <TrendingUp {...iconProps} />;
      case 'time':
        return <Timer {...iconProps} />;
      case 'count':
        return <Activity {...iconProps} />;
      default:
        return <BarChart3 {...iconProps} />;
    }
  };

  const renderDeltaBadge = (change: number) => {
    if (change === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
          <Minus size={12} strokeWidth={2.5} />
          {t('common.noChange')}
        </span>
      );
    }

    const isPositive = change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
          isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        )}
      >
        <Icon size={12} strokeWidth={2.5} />
        {isPositive ? '+' : '−'}
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
      <div className="mb-5">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          {t('periodComparison.title')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{t('periodComparison.subtitle')}</p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex">
        <div className="inline-flex rounded-full bg-white/70 p-1 shadow-sm ring-1 ring-gray-900/5 backdrop-blur-sm">
          {(['week', 'month', 'year', 'custom'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150',
                period === p
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {p === 'week'
                ? t('periodComparison.week')
                : p === 'month'
                  ? t('periodComparison.month')
                  : p === 'year'
                    ? t('periodComparison.year')
                    : t('periodComparison.custom')}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {period === 'custom' && (
        <div className="mb-6 space-y-4 rounded-lg bg-white/50 p-4 backdrop-blur-sm">
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-900">
              {t('periodComparison.currentPeriod')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="currentStart" className="mb-1 block text-xs text-gray-600">
                  {t('common.startDate')}
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
                  {t('common.endDate')}
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
            <h4 className="mb-2 text-sm font-medium text-gray-900">
              {t('periodComparison.previousPeriod')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="previousStart" className="mb-1 block text-xs text-gray-600">
                  {t('common.startDate')}
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
                  {t('common.endDate')}
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
          {t('periodComparison.fillAllDates')}
        </div>
      )}

      {/* Comparison Cards */}
      {comparisonData && (
        <div className="space-y-3">
          {metrics.map((metric) => {
            const currentValue = comparisonData.current[metric];
            const previousValue = comparisonData.previous[metric];
            const change = comparisonData.changes[metric];
            const maxValue = Math.max(currentValue, previousValue, 1);
            const currentPct = (currentValue / maxValue) * 100;
            const previousPct = (previousValue / maxValue) * 100;

            const currentBarColor =
              change > 0 ? 'bg-emerald-500' : change < 0 ? 'bg-red-500' : 'bg-gray-400';

            return (
              <div
                key={metric}
                className="rounded-lg border border-gray-200/60 bg-white/50 p-4 backdrop-blur-sm"
              >
                {/* Metric Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getMetricIcon(metric)}
                    <h4 className="font-semibold text-gray-900">{getMetricLabel(metric)}</h4>
                  </div>
                  {renderDeltaBadge(change)}
                </div>

                {/* Comparison bars */}
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate text-gray-600">{getPeriodLabel(true)}</span>
                      <span className="shrink-0 font-mono text-base font-bold tabular-nums text-gray-900">
                        {formatMetricValue(metric, currentValue)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200/60">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-500',
                          currentBarColor
                        )}
                        style={{ width: `${currentPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate text-gray-500">{getPeriodLabel(false)}</span>
                      <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-gray-500">
                        {formatMetricValue(metric, previousValue)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200/60">
                      <div
                        className="h-full rounded-full bg-gray-300 transition-all duration-500"
                        style={{ width: `${previousPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};
