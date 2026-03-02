import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import {
  GlassCard,
  StatTile,
  StatTileSkeleton,
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
          icon="📊"
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
          <h2 className="text-2xl font-bold text-gray-900">{t('stats.title')}</h2>
          <p className="text-gray-600">{t('stats.subtitle')}</p>
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
                <h3 className="mb-4 text-lg font-bold text-gray-900">{t('stats.overall')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatTile icon="🏃" label={t('common.activities')} value={stats.totalActivities.toString()} />
                  <StatTile
                    icon="📏"
                    label={t('common.distance')}
                    value={formatDistance(stats.totalDistance)}
                  />
                  <StatTile
                    icon="⛰️"
                    label={t('common.elevation')}
                    value={formatElevation(stats.totalElevation)}
                  />
                  <StatTile icon="⏱️" label={t('common.time')} value={formatDuration(stats.totalTime)} />
                  <StatTile
                    icon="🔥"
                    label={t('stats.currentStreak')}
                    value={`${stats.currentStreak} ${t('common.days')}`}
                  />
                  <StatTile icon="🏆" label={t('stats.bestStreak')} value={`${stats.longestStreak} ${t('common.days')}`} />
                </div>
              </section>

              {/* By Activity Type */}
              {activityTypes.length > 0 && (
                <section>
                  <h3 className="mb-4 text-lg font-bold text-gray-900">{t('stats.byActivityType')}</h3>
                  <div className="space-y-3">
                    {activityTypes.map(([type, data]) => (
                      <GlassCard key={type} className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="font-bold text-gray-900">{type}</h4>
                          <span className="text-sm text-gray-600">{t('stats.activitiesCount', { count: data.count })}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="text-xs text-gray-600">{t('common.distance')}</div>
                            <div className="font-medium">{formatDistance(data.distance)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">{t('common.elevation')}</div>
                            <div className="font-medium">{formatElevation(data.elevation)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">{t('common.time')}</div>
                            <div className="font-medium">{formatDuration(data.time)}</div>
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
