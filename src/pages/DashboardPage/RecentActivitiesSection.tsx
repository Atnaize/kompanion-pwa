import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ActivityCardSkeleton, NoActivitiesEmpty, SyncButton } from '@components/ui';
import { ActivityCard } from '@components/activity';
import { activitiesService } from '@api/services';
import type { SyncProgress } from './useDashboardSync';

interface RecentActivitiesSectionProps {
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  onSync: () => void;
}

const RECENT_LIMIT = 5;

export const RecentActivitiesSection = ({
  isSyncing,
  syncProgress,
  onSync,
}: RecentActivitiesSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await activitiesService.list();
      return response.data || [];
    },
  });

  const recent = activities.slice(0, RECENT_LIMIT);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">{t('dashboard.recentActivities')}</h2>
        <SyncButton
          size="sm"
          onClick={onSync}
          isSyncing={isSyncing}
          progress={syncProgress}
          className="min-w-[180px]"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: RECENT_LIMIT }).map((_, i) => (
            <ActivityCardSkeleton key={i} />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <NoActivitiesEmpty onSync={onSync} />
      ) : (
        <div className="space-y-3">
          {recent.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              variant="compact"
              onClick={() => navigate(`/activities/${activity.id}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
