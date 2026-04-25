import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { GlassCard, Skeleton } from '@components/ui';
import { statsService } from '@api/services';
import { formatDistance, formatElevation, formatDuration } from '@utils/format';

type Metric = 'distance' | 'elevation' | 'count' | 'time';
type Period = 'week' | 'month' | 'year' | 'all';
type GroupBy = 'day' | 'week' | 'month';

export const ProgressCharts = () => {
  const { t } = useTranslation();
  const [metric, setMetric] = useState<Metric>('distance');
  const [period, setPeriod] = useState<Period>('month');
  const [groupBy, setGroupBy] = useState<GroupBy>('week');

  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ['stats', 'progress', metric, period, groupBy],
    queryFn: async () => {
      const response = await statsService.getProgressData({ metric, period, groupBy });
      return response.data;
    },
  });

  const formatValue = (value: number, forSummary = false): string => {
    switch (metric) {
      case 'distance':
        return formatDistance(value);
      case 'elevation':
        return formatElevation(value);
      case 'time':
        return formatDuration(value);
      case 'count':
        // For averages, show 1 decimal place; for totals/peaks, show whole number
        return forSummary && value % 1 !== 0 ? value.toFixed(1) : Math.round(value).toString();
    }
  };

  const formatYAxis = (value: number): string => {
    switch (metric) {
      case 'distance':
        return `${(value / 1000).toFixed(0)}km`;
      case 'elevation':
        return `${value.toFixed(0)}m`;
      case 'time':
        return `${(value / 3600).toFixed(0)}h`;
      case 'count':
        return value.toString();
    }
  };

  const formatXAxis = (dateString: string): string => {
    const date = new Date(dateString);
    switch (groupBy) {
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        return `W${Math.ceil(date.getDate() / 7)}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };

  const getMetricLabel = (): string => {
    switch (metric) {
      case 'distance':
        return t('common.distance');
      case 'elevation':
        return t('progressCharts.elevationGain');
      case 'time':
        return t('common.time');
      case 'count':
        return t('common.activities');
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
          {t('progressCharts.title')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('progressCharts.subtitle')}</p>
      </div>

      {/* Metric Selector */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.metric')}</label>
        <div className="grid grid-cols-4 gap-2">
          {(['distance', 'elevation', 'time', 'count'] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                metric === m
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                  : 'bg-white/50 text-gray-700 hover:bg-white/80 dark:bg-gray-900/50 dark:text-gray-300 dark:hover:bg-gray-900/80'
              }`}
            >
              {m === 'distance'
                ? t('common.distance')
                : m === 'elevation'
                  ? t('common.elevation')
                  : m === 'time'
                    ? t('common.time')
                    : t('progressCharts.count')}
            </button>
          ))}
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('common.timePeriod')}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['week', 'month', 'year', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                // Auto-adjust groupBy based on period
                if (p === 'week') setGroupBy('day');
                else if (p === 'month') setGroupBy('week');
                else setGroupBy('month');
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                  : 'bg-white/50 text-gray-700 hover:bg-white/80 dark:bg-gray-900/50 dark:text-gray-300 dark:hover:bg-gray-900/80'
              }`}
            >
              {p === 'week'
                ? t('progressCharts.week')
                : p === 'month'
                  ? t('progressCharts.month')
                  : p === 'year'
                    ? t('progressCharts.year')
                    : t('progressCharts.allTime')}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : progressData.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-950">
          <div className="flex flex-col items-center text-center">
            <BarChart3 className="h-8 w-8 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('progressCharts.noData')}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={progressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [formatValue(value), getMetricLabel()]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ea580c"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-200 pt-4 text-center dark:border-gray-800">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('common.total')}</p>
              <p className="font-bold text-gray-900 dark:text-gray-50">
                {formatValue(
                  progressData.reduce((sum, d) => sum + d.value, 0),
                  true
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('common.average')}</p>
              <p className="font-bold text-gray-900 dark:text-gray-50">
                {formatValue(
                  progressData.reduce((sum, d) => sum + d.value, 0) / progressData.length,
                  true
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('common.peak')}</p>
              <p className="font-bold text-gray-900 dark:text-gray-50">
                {formatValue(Math.max(...progressData.map((d) => d.value)), true)}
              </p>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
};
