import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Trophy, Users } from 'lucide-react';
import { Layout } from '@components/layout';
import { Avatar, EmptyState, GlassCard, Skeleton, TimePeriodSelector } from '@components/ui';
import type { TimePeriod } from '@components/ui';
import { ActivityTypePicker } from '@components/activity';
import { leaderboardsService, statsService } from '@api/services';
import { formatDistance, formatDuration, formatElevation, formatSpeed } from '@utils/format';
import type { LeaderboardMetricKey, LeaderboardPeriod } from '@types';

const LEADERBOARD_ACTIVITY_TYPE_KEY = 'leaderboard-activity-type';

const METRIC_KEYS: readonly LeaderboardMetricKey[] = [
  'distance',
  'elevation',
  'count',
  'movingTime',
  'avgSpeed',
  'elevationPerKm',
] as const;

const formatValue = (key: LeaderboardMetricKey, value: number): string => {
  switch (key) {
    case 'distance':
      return formatDistance(value);
    case 'elevation':
      return formatElevation(value);
    case 'count':
      return String(Math.round(value));
    case 'movingTime':
      return formatDuration(value);
    case 'avgSpeed':
      return formatSpeed(value);
    case 'elevationPerKm':
      return `${value.toFixed(1)} m/km`;
  }
};

export const LeaderboardsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [metric, setMetric] = useState<LeaderboardMetricKey>('distance');
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [selectedType, setSelectedType] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LEADERBOARD_ACTIVITY_TYPE_KEY);
  });

  useEffect(() => {
    if (selectedType === null) {
      localStorage.removeItem(LEADERBOARD_ACTIVITY_TYPE_KEY);
    } else {
      localStorage.setItem(LEADERBOARD_ACTIVITY_TYPE_KEY, selectedType);
    }
  }, [selectedType]);

  const leaderboardPeriod: LeaderboardPeriod = period;

  // Viewer's own stats power the activity-type picker chips. Reused query
  // (same key as StatsPage), so navigating between pages doesn't refetch.
  const { data: allStats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await statsService.getUserStats();
      return response.data!;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', 'friends', metric, leaderboardPeriod, selectedType],
    queryFn: async () => {
      const response = await leaderboardsService.friends({
        metric,
        period: leaderboardPeriod,
        activityType: selectedType,
      });
      return response.data!;
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('leaderboards.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('leaderboards.subtitle')}
          </p>
        </div>

        {allStats && (
          <ActivityTypePicker
            types={Object.entries(allStats.byActivityType).map(([type, info]) => ({
              type,
              count: info.count,
            }))}
            totalCount={allStats.totalActivities}
            selected={selectedType}
            onChange={setSelectedType}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {METRIC_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMetric(key)}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  metric === key
                    ? 'bg-strava-orange text-white shadow-sm'
                    : 'bg-white/60 text-gray-600 hover:bg-white dark:bg-gray-800/60 dark:text-gray-400 dark:hover:bg-gray-800'
                )}
              >
                {t(`leaderboards.metric.${key}`)}
              </button>
            ))}
          </div>
          <TimePeriodSelector value={period} onChange={setPeriod} storageKey="leaderboard-period" />
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {!isLoading && data && data.rows.length === 0 && (
          <EmptyState
            icon={
              <Users className="h-10 w-10 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
            }
            title={t('leaderboards.empty.title')}
            description={t('leaderboards.empty.description')}
          />
        )}

        {!isLoading && data && data.rows.length > 0 && (
          <ol className="space-y-2">
            {data.rows.map((row) => {
              const isPodium = row.rank <= 3;
              return (
                <li key={row.user.id}>
                  <GlassCard
                    className={clsx(
                      'flex items-center gap-3 p-3 transition-colors',
                      row.isViewer && 'ring-2 ring-strava-orange',
                      !row.isViewer && 'cursor-pointer hover:bg-white/80 dark:hover:bg-gray-800/60'
                    )}
                    onClick={() => {
                      if (!row.isViewer) {
                        navigate(`/users/${row.user.id}`);
                      }
                    }}
                  >
                    <div
                      className={clsx(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold tabular-nums',
                        isPodium
                          ? 'bg-strava-orange/15 text-strava-orange'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {row.rank === 1 ? (
                        <Trophy className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                      ) : (
                        row.rank
                      )}
                    </div>
                    <Avatar
                      src={row.user.profileMedium || row.user.profile}
                      firstname={row.user.firstname}
                      lastname={row.user.lastname}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {row.user.firstname} {row.user.lastname}
                        {row.isViewer && (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-strava-orange">
                            {t('leaderboards.you')}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0 font-mono text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                      {formatValue(metric, row.value)}
                    </div>
                  </GlassCard>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Layout>
  );
};
