import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassCard, Skeleton } from '@components/ui';
import { statsService } from '@api/services';
import { formatDistance } from '@utils/format';

type Metric = 'count' | 'distance';

interface DayData {
  date: string;
  value: number;
  dayOfWeek: number;
  weekIndex: number;
}

export const HeatmapCalendar = () => {
  const [metric, setMetric] = useState<Metric>('count');

  const { data: heatmapData = [], isLoading } = useQuery({
    queryKey: ['stats', 'heatmap', metric],
    queryFn: async () => {
      const response = await statsService.getHeatmapData(metric);
      return response.data;
    },
  });

  const generateCalendarData = (): DayData[] => {
    const now = new Date();
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Start from the beginning of the week for better alignment
    const startDate = new Date(yearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: DayData[] = [];
    const dataMap = new Map(heatmapData.map((d) => [d.date, d.value]));

    const currentDate = new Date(startDate);
    let weekIndex = 0;

    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const value = dataMap.get(dateStr) || 0;
      const dayOfWeek = currentDate.getDay();

      days.push({
        date: dateStr,
        value,
        dayOfWeek,
        weekIndex,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);

      // Increment week index on Monday
      if (dayOfWeek === 0) {
        weekIndex++;
      }
    }

    return days;
  };

  const getColorIntensity = (value: number): string => {
    if (value === 0) {
      return 'bg-gray-100';
    }

    // Calculate max value for color scaling
    const maxValue = Math.max(...heatmapData.map((d) => d.value), 1);
    const intensity = value / maxValue;

    if (intensity <= 0.25) {
      return 'bg-orange-200';
    }

    if (intensity <= 0.5) {
      return 'bg-orange-300';
    }

    if (intensity <= 0.75) {
      return 'bg-orange-400';
    }

    return 'bg-orange-500';
  };

  const formatTooltip = (day: DayData): string => {
    if (day.value === 0) {
      return `${day.date}: No activities`;
    }

    if (metric === 'count') {
      return `${day.date}: ${day.value} activit${day.value === 1 ? 'y' : 'ies'}`;
    }

    return `${day.date}: ${formatDistance(day.value)}`;
  };

  const getMonthLabels = (days: DayData[]): Array<{ label: string; weekIndex: number }> => {
    const labels: Array<{ label: string; weekIndex: number }> = [];
    let lastMonth = -1;

    for (const day of days) {
      const date = new Date(day.date);
      const month = date.getMonth();

      if (month !== lastMonth && day.dayOfWeek === 0) {
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        labels.push({
          label: monthNames[month],
          weekIndex: day.weekIndex,
        });
        lastMonth = month;
      }
    }

    return labels;
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-4 h-10 w-full" />
        <Skeleton className="h-32" />
      </GlassCard>
    );
  }

  const calendarDays = generateCalendarData();
  const monthLabels = getMonthLabels(calendarDays);
  const weeks = Math.max(...calendarDays.map((d) => d.weekIndex)) + 1;

  // Calculate total stats
  const totalActivities = heatmapData.reduce(
    (sum, d) => sum + (metric === 'count' ? d.value : 1),
    0
  );
  const totalDistance =
    metric === 'distance' ? heatmapData.reduce((sum, d) => sum + d.value, 0) : 0;

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Activity Calendar</h3>
        <p className="text-sm text-gray-600">Your activity pattern over the last 12 months</p>
      </div>

      {/* Metric Selector */}
      <div className="mb-6 flex gap-2">
        {(['count', 'distance'] as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              metric === m
                ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg'
                : 'bg-white/50 text-gray-700 backdrop-blur-sm hover:bg-white/80'
            }`}
          >
            {m === 'count' ? 'Activity Count' : 'Distance'}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mb-4 flex gap-4 text-sm text-gray-600">
        <div>
          <span className="font-medium text-gray-900">{totalActivities}</span> activities in the
          last year
        </div>
        {metric === 'distance' && (
          <div>
            <span className="font-medium text-gray-900">{formatDistance(totalDistance)}</span> total
            distance
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month Labels */}
          <div className="relative mb-2 h-4">
            {monthLabels.map((label) => (
              <div
                key={`${label.label}-${label.weekIndex}`}
                className="absolute text-xs text-gray-600"
                style={{ left: `${(label.weekIndex * 100) / weeks}%` }}
              >
                {label.label}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
            {calendarDays.map((day) => (
              <div
                key={day.date}
                className={`group relative h-3 w-3 rounded-sm ${getColorIntensity(day.value)} transition-all hover:ring-2 hover:ring-orange-400`}
                title={formatTooltip(day)}
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                  {formatTooltip(day)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-600">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-gray-100" />
          <div className="h-3 w-3 rounded-sm bg-orange-200" />
          <div className="h-3 w-3 rounded-sm bg-orange-300" />
          <div className="h-3 w-3 rounded-sm bg-orange-400" />
          <div className="h-3 w-3 rounded-sm bg-orange-500" />
        </div>
        <span>More</span>
      </div>
    </GlassCard>
  );
};
