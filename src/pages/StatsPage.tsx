import { useEffect, useState } from 'react';
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
  PageHeader,
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
import { ActivityTypePicker } from '@components/activity';
import { useScrollPastSentinel } from '@hooks/useScrollPastSentinel';
import clsx from 'clsx';
import { ProgressCharts } from './StatsPage/ProgressCharts';
import { PeriodComparison } from './StatsPage/PeriodComparison';
import { HeatmapCalendar } from './StatsPage/HeatmapCalendar';

const STATS_ACTIVITY_TYPE_KEY = 'stats-activity-type';

export const StatsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  // Sticky tabs once the user scrolls past the ActivityTypePicker row.
  const { ref: controlsEndRef, hasPassed: isCompact } = useScrollPastSentinel();
  const [selectedType, setSelectedType] = useState<string | null>(() => {
    // Mirrors the DashboardPage period selector's persistence approach
    // (raw localStorage, kebab-cased key). Lazy init so the first render
    // already uses the saved value.
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STATS_ACTIVITY_TYPE_KEY);
  });

  useEffect(() => {
    if (selectedType === null) {
      localStorage.removeItem(STATS_ACTIVITY_TYPE_KEY);
    } else {
      localStorage.setItem(STATS_ACTIVITY_TYPE_KEY, selectedType);
    }
  }, [selectedType]);

  // Unfiltered query — always runs, drives the chip list (so chips don't
  // disappear when the user filters) and the overview when nothing is
  // selected.
  const { data: allStats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await statsService.getUserStats();
      return response.data!;
    },
  });

  // Filtered query — runs only when a type is selected. Returns stats
  // scoped to that activity type without overwriting the canonical totals.
  const { data: filteredStats } = useQuery({
    queryKey: ['stats', { activityType: selectedType }],
    queryFn: async () => {
      const response = await statsService.getUserStats(undefined, selectedType);
      return response.data!;
    },
    enabled: selectedType !== null,
  });

  const stats = selectedType === null ? allStats : filteredStats;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <PageHeader title={t('stats.title')} subtitle={t('stats.loading')} />
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
          icon={
            <BarChart3 className="h-10 w-10 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
          }
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
        <PageHeader title={t('stats.title')} subtitle={t('stats.subtitle')} />

        {allStats && (
          <ActivityTypePicker
            types={Object.entries(allStats.byActivityType).map(([type, data]) => ({
              type,
              count: data.count,
            }))}
            totalCount={allStats.totalActivities}
            selected={selectedType}
            onChange={setSelectedType}
          />
        )}

        {/* Sentinel: TabList sticks to the top once this scrolls past. */}
        <div ref={controlsEndRef} aria-hidden className="h-0" />

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <div
            className={clsx(
              'sticky top-0 z-30 -mx-4 mb-6 px-4 transition-shadow',
              isCompact
                ? 'bg-gray-50/95 py-2 shadow-sm backdrop-blur-md dark:bg-gray-950/95'
                : 'bg-transparent'
            )}
          >
            <TabList fade>
              <Tab value="overview" label={t('stats.overview')} compact />
              <Tab value="calendar" label={t('stats.calendar')} compact />
              <Tab value="charts" label={t('stats.charts')} compact />
              <Tab value="comparison" label={t('stats.comparison')} compact />
            </TabList>
          </div>

          {/* Overview Tab */}
          <TabPanel value="overview">
            <div className="space-y-6">
              {/* Overall Stats */}
              <section>
                <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
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

              {/* By Activity Type — only shown in the unfiltered view; when
                  a single type is selected this section would just repeat
                  the totals above. */}
              {selectedType === null && activityTypes.length > 0 && (
                <section>
                  <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                    {t('stats.byActivityType')}
                  </h3>
                  <div className="space-y-3">
                    {activityTypes.map(([type, data]) => (
                      <GlassCard key={type} className="p-4">
                        <div className="mb-3 flex items-baseline justify-between">
                          <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                            {type}
                          </h4>
                          <span className="font-mono text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
                            {t('stats.activitiesCount', { count: data.count })}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              {t('common.distance')}
                            </div>
                            <div className="mt-0.5 font-mono font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                              {formatDistance(data.distance)}
                            </div>
                          </div>
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              {t('common.elevation')}
                            </div>
                            <div className="mt-0.5 font-mono font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                              {formatElevation(data.elevation)}
                            </div>
                          </div>
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              {t('common.time')}
                            </div>
                            <div className="mt-0.5 font-mono font-semibold tabular-nums text-gray-900 dark:text-gray-50">
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
            <HeatmapCalendar activityType={selectedType} />
          </TabPanel>

          {/* Charts Tab */}
          <TabPanel value="charts">
            <ProgressCharts activityType={selectedType} />
          </TabPanel>

          {/* Comparison Tab */}
          <TabPanel value="comparison">
            <PeriodComparison activityType={selectedType} />
          </TabPanel>
        </Tabs>
      </div>
    </Layout>
  );
};
