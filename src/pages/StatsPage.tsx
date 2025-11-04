import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
            <h2 className="text-2xl font-bold text-gray-900">Your Stats</h2>
            <p className="text-gray-600">Loading your performance data...</p>
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
          title="No Stats Available"
          description="Start by syncing your activities on the Dashboard to see your performance statistics."
          action={{
            label: 'Go to Dashboard',
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
          <h2 className="text-2xl font-bold text-gray-900">Your Stats</h2>
          <p className="text-gray-600">Track your progress and achievements</p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList className="mb-6">
            <Tab value="overview" label="Overview" />
            <Tab value="calendar" label="Calendar" />
            <Tab value="charts" label="Charts" />
            <Tab value="comparison" label="Comparison" />
          </TabList>

          {/* Overview Tab */}
          <TabPanel value="overview">
            <div className="space-y-6">
              {/* Overall Stats */}
              <section>
                <h3 className="mb-4 text-lg font-bold text-gray-900">Overall</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatTile icon="🏃" label="Activities" value={stats.totalActivities.toString()} />
                  <StatTile
                    icon="📏"
                    label="Distance"
                    value={formatDistance(stats.totalDistance)}
                  />
                  <StatTile
                    icon="⛰️"
                    label="Elevation"
                    value={formatElevation(stats.totalElevation)}
                  />
                  <StatTile icon="⏱️" label="Time" value={formatDuration(stats.totalTime)} />
                  <StatTile
                    icon="🔥"
                    label="Current Streak"
                    value={`${stats.currentStreak} days`}
                  />
                  <StatTile icon="🏆" label="Best Streak" value={`${stats.longestStreak} days`} />
                </div>
              </section>

              {/* By Activity Type */}
              {activityTypes.length > 0 && (
                <section>
                  <h3 className="mb-4 text-lg font-bold text-gray-900">By Activity Type</h3>
                  <div className="space-y-3">
                    {activityTypes.map(([type, data]) => (
                      <GlassCard key={type} className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="font-bold text-gray-900">{type}</h4>
                          <span className="text-sm text-gray-600">{data.count} activities</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="text-xs text-gray-600">Distance</div>
                            <div className="font-medium">{formatDistance(data.distance)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Elevation</div>
                            <div className="font-medium">{formatElevation(data.elevation)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Time</div>
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
