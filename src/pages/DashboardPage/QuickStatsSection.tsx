import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityBarsViz,
  AnimatedNumber,
  DistanceProgressViz,
  ElevationMountainViz,
  PageHeader,
  StatTile,
  StatTileSkeleton,
  StreakDotsViz,
  TimePeriodSelector,
} from '@components/ui';
import type { TimePeriod } from '@components/ui';
import { statsService } from '@api/services';
import { formatDistance, formatElevation } from '@utils/format';

export const QuickStatsSection = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<TimePeriod>('week');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', period],
    queryFn: async () => {
      const response = await statsService.getUserStats(period === 'overall' ? undefined : period);
      return response.data!;
    },
  });

  return (
    <section>
      <PageHeader
        title={t('dashboard.quickStats')}
        className="mb-4 items-center"
        action={
          <TimePeriodSelector
            value={period}
            onChange={setPeriod}
            storageKey="dashboard-stats-period"
          />
        }
      />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <StatTileSkeleton />
          <StatTileSkeleton />
          <StatTileSkeleton />
          <StatTileSkeleton />
        </div>
      ) : (
        <div key={period} className="grid grid-cols-2 gap-3">
          <StatTile
            label={t('common.activities')}
            value={<AnimatedNumber value={stats?.totalActivities || 0} />}
            viz={<ActivityBarsViz />}
          />
          <StatTile
            label={t('common.distance')}
            value={<AnimatedNumber value={stats?.totalDistance || 0} format={formatDistance} />}
            viz={
              <DistanceProgressViz progress={Math.min(1, (stats?.totalDistance || 0) / 100000)} />
            }
          />
          <StatTile
            label={t('common.elevation')}
            value={<AnimatedNumber value={stats?.totalElevation || 0} format={formatElevation} />}
            viz={<ElevationMountainViz />}
          />
          <StatTile
            label={t('common.streak')}
            value={
              <AnimatedNumber
                value={stats?.currentStreak || 0}
                format={(n) => `${Math.round(n)} ${t('common.days')}`}
              />
            }
            viz={<StreakDotsViz filled={stats?.currentStreak || 0} />}
          />
        </div>
      )}
    </section>
  );
};
