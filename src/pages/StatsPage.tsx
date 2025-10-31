import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@components/layout';
import { GlassCard, StatTile, ProgressRing, StatTileSkeleton, EmptyState } from '@components/ui';
import { statsService } from '@api/services';
import { formatDistance, formatElevation, formatDuration } from '@utils/format';

export const StatsPage = () => {
  const navigate = useNavigate();
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
          <p className="text-gray-600">
            Level {stats.level} • {stats.xp} XP
          </p>
        </div>

        {/* Level Progress */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-bold text-gray-900">Level Progress</h3>
              <p className="text-sm text-gray-600">{stats.xp % 1000} / 1000 XP to next level</p>
            </div>
            <ProgressRing progress={(stats.xp % 1000) / 10} size={100} />
          </div>
        </GlassCard>

        {/* Overall Stats */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Overall</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon="🏃" label="Activities" value={stats.totalActivities.toString()} />
            <StatTile icon="📏" label="Distance" value={formatDistance(stats.totalDistance)} />
            <StatTile icon="⛰️" label="Elevation" value={formatElevation(stats.totalElevation)} />
            <StatTile icon="⏱️" label="Time" value={formatDuration(stats.totalTime)} />
            <StatTile icon="🔥" label="Current Streak" value={`${stats.currentStreak} days`} />
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
    </Layout>
  );
};
