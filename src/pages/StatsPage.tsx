import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { Layout } from '@components/layout';
import {
  ActivityBarsViz,
  AnimatedNumber,
  DistanceProgressViz,
  ElevationMountainViz,
  GlassCard,
  StatTile,
  StatTileSkeleton,
  StreakDotsViz,
  EmptyState,
  Tabs,
  TabList,
  Tab,
  TabPanel,
} from '@components/ui';
import { statsService } from '@api/services';
import { formatDistance, formatElevation, formatDuration } from '@utils/format';
import { ProgressCharts } from './StatsPage/ProgressCharts';
import { PeriodComparison } from './StatsPage/PeriodComparison';
import { HeatmapCalendar } from './StatsPage/HeatmapCalendar';

export const StatsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await statsService.getUserStats();
      return response.data!;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('stats.title')}</h2>
            <p className="text-gray-600">{t('stats.loading')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatTileSkeleton />
            <StatTileSkeleton />
            <StatTileSkeleton />
            <StatTileSkeleton />
            <StatTileSkeleton />
            <StatTileSkeleton />
          </div>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <EmptyState
          icon={<BarChart3 className="h-10 w-10 text-gray-400" strokeWidth={1.5} />}
          title={t('stats.noStats')}
          description={t('stats.noStatsDesc')}
          action={{
            label: t('stats.goToDashboard'),
            onClick: () => navigate('/dashboard'),
          }}
        />
      </Layout>
    );
  }

  const activityTypes = Object.entries(stats.byActivityType);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            {t('stats.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500">{t('stats.subtitle')}</p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList className="mb-6">
            <Tab value="overview" label={t('stats.overview')} />
            <Tab value="calendar" label={t('stats.calendar')} />
            <Tab value="charts" label={t('stats.charts')} />
            <Tab value="comparison" label={t('stats.comparison')} />
          </TabList>

          {/* Overview Tab */}
          <TabPanel value="overview">
            <div className="space-y-6">
              {/* Overall Stats */}
              <section>
                <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  {t('stats.overall')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatTile
                    label={t('common.activities')}
                    value={<AnimatedNumber value={stats.totalActivities} />}
                    viz={<ActivityBarsViz />}
                  />
                  <StatTile
                    label={t('common.distance')}
                    value={<AnimatedNumber value={stats.totalDistance} format={formatDistance} />}
                    viz={
                      <DistanceProgressViz progress={Math.min(1, stats.totalDistance / 100000)} />
                    }
                  />
                  <StatTile
                    label={t('common.elevation')}
                    value={<AnimatedNumber value={stats.totalElevation} format={formatElevation} />}
                    viz={<ElevationMountainViz />}
                  />
                  <StatTile
                    label={t('common.time')}
                    value={<AnimatedNumber value={stats.totalTime} format={formatDuration} />}
                  />
                  <StatTile
                    label={t('stats.currentStreak')}
                    value={
                      <AnimatedNumber
                        value={stats.currentStreak}
                        format={(n) => `${Math.round(n)} ${t('common.days')}`}
                      />
                    }
                    viz={<StreakDotsViz filled={stats.currentStreak} />}
                  />
                  <StatTile
                    label={t('stats.bestStreak')}
                    value={
                      <AnimatedNumber
                        value={stats.longestStreak}
                        format={(n) => `${Math.round(n)} ${t('common.days')}`}
                      />
                    }
                    viz={<StreakDotsViz filled={Math.min(7, stats.longestStreak)} />}
                  />
                </div>
              </section>

              {/* By Activity Type */}
              {activityTypes.length > 0 && (
                <section>
                  <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    {t('stats.byActivityType')}
                  </h3>
                  <div className="space-y-3">
                    {activityTypes.map(([type, data]) => (
                      <GlassCard key={type} className="p-4">
                        <div className="mb-3 flex items-baseline justify-between">
                          <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-700">
                            {type}
                          </h4>
                          <span className="font-mono text-[11px] tabular-nums text-gray-500">
                            {t('stats.activitiesCount', { count: data.count })}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                              {t('common.distance')}
                            </div>
                            <div className="mt-0.5 font-mono font-semibold tabular-nums text-gray-900">
                              {formatDistance(data.distance)}
                            </div>
                          </div>
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                              {t('common.elevation')}
                            </div>
                            <div className="mt-0.5 font-mono font-semibold tabular-nums text-gray-900">
                              {formatElevation(data.elevation)}
                            </div>
                          </div>
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                              {t('common.time')}
                            </div>
                            <div className="mt-0.5 font-mono font-semibold tabular-nums text-gray-900">
                              {formatDuration(data.time)}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </TabPanel>

          {/* Calendar Tab */}
          <TabPanel value="calendar">
            <HeatmapCalendar />
          </TabPanel>

          {/* Charts Tab */}
          <TabPanel value="charts">
            <ProgressCharts />
          </TabPanel>

          {/* Comparison Tab */}
          <TabPanel value="comparison">
            <PeriodComparison />
          </TabPanel>
        </Tabs>
      </div>
    </Layout>
  );
};
