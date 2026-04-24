import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import { Layout } from '@components/layout';
import { GlassCard, Skeleton } from '@components/ui';
import { personalRecordsService } from '@api/services';
import { PersonalRecordsBoard } from './PersonalRecordsBoard';

export const PersonalRecordsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: bands = [], isLoading } = useQuery({
    queryKey: ['personal-records'],
    queryFn: async () => {
      const response = await personalRecordsService.list();
      return response.data || [];
    },
  });

  const totalRecords = bands.reduce((sum, b) => sum + b.records.length, 0);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </Layout>
    );
  }

  if (totalRecords === 0) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Trophy size={22} strokeWidth={1.75} className="text-strava-orange" />
              {t('personalRecords.title')}
            </h1>
            <p className="text-sm text-gray-600">{t('personalRecords.subtitle')}</p>
          </div>
          <GlassCard className="relative overflow-hidden p-10 text-center">
            <span
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-strava-orange/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-strava-orange to-amber-500 text-white shadow-lg shadow-strava-orange/30">
                <Trophy size={32} strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                {t('personalRecords.noPrsYet')}
              </h3>
              <p className="text-sm text-gray-600">{t('personalRecords.keepTraining')}</p>
            </div>
          </GlassCard>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PersonalRecordsBoard
        groups={bands}
        onActivityClick={(id) => navigate(`/activities/${id}`)}
      />
    </Layout>
  );
};
