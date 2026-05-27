import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2, Sparkles, Trophy } from 'lucide-react';
import { Layout } from '@components/layout';
import { GlassCard, PageHeader, Skeleton } from '@components/ui';
import { personalRecordsService } from '@api/services';
import { PersonalRecordsBoard } from './PersonalRecordsBoard';
import { usePersonalRecordsSync } from './usePersonalRecordsSync';

export const PersonalRecordsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state: syncState, start: startSync } = usePersonalRecordsSync();
  const autoStartedRef = useRef(false);

  const { data: bands = [], isLoading: bandsLoading } = useQuery({
    queryKey: ['personal-records'],
    queryFn: async () => {
      const response = await personalRecordsService.list();
      return response.data || [];
    },
  });

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['personal-records', 'status'],
    queryFn: async () => {
      const response = await personalRecordsService.status();
      return response.data ?? null;
    },
    refetchInterval: syncState.isSyncing ? 2000 : false,
  });

  const totalRecords = bands.reduce((sum, b) => sum + b.records.length, 0);
  const bandsWithRecords = bands.filter((b) => b.records.length > 0).length;
  const hasBacklog = !!status && status.processed < status.total;
  const canResume = !!status && status.userDailyRemaining > 0 && status.appDailyRemaining > 0;

  // Auto-start the backlog stream on first visit when there's work to do and
  // budget to do it. Runs once per mount; the user can manually retry after a
  // pause by re-visiting the page (or via a future explicit button).
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (!status) return;
    if (!hasBacklog) return;
    if (syncState.isSyncing) return;
    if (!canResume) return;
    autoStartedRef.current = true;
    void startSync();
  }, [status, hasBacklog, syncState.isSyncing, canResume, startSync]);

  if (bandsLoading || statusLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <PageHeader title={t('personalRecords.title')} subtitle={t('personalRecords.subtitle')} />
          <Skeleton className="h-24 w-full" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </Layout>
    );
  }

  if (totalRecords === 0 && !hasBacklog) {
    return (
      <Layout>
        <div className="space-y-6">
          <PageHeader title={t('personalRecords.title')} subtitle={t('personalRecords.subtitle')} />
          <GlassCard className="relative overflow-hidden p-10 text-center">
            <span
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-strava-orange/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-strava-orange to-amber-500 text-white shadow-lg shadow-strava-orange/30">
                <Trophy size={32} strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-50">
                {t('personalRecords.noPrsYet')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('personalRecords.keepTraining')}
              </p>
            </div>
          </GlassCard>
        </div>
      </Layout>
    );
  }

  const headerSubtitle =
    totalRecords > 0
      ? t('personalRecords.summary', { bands: bandsWithRecords, total: totalRecords })
      : t('personalRecords.subtitle');

  return (
    <Layout>
      <div className="space-y-4">
        <PageHeader title={t('personalRecords.title')} subtitle={headerSubtitle} />
        {hasBacklog && status && (
          <BacklogBanner
            isSyncing={syncState.isSyncing}
            paused={syncState.paused}
            pausedReason={syncState.pausedReason}
            current={syncState.isSyncing ? syncState.current : status.processed}
            total={status.total}
            userDailyRemaining={status.userDailyRemaining}
            userDailyCap={status.userDailyCap}
          />
        )}
        {totalRecords > 0 ? (
          <PersonalRecordsBoard
            groups={bands}
            onActivityClick={(id) => navigate(`/activities/${id}`)}
          />
        ) : null}
      </div>
    </Layout>
  );
};

interface BacklogBannerProps {
  isSyncing: boolean;
  paused: boolean;
  pausedReason: string | null;
  current: number;
  total: number;
  userDailyRemaining: number;
  userDailyCap: number;
}

const BacklogBanner = ({
  isSyncing,
  paused,
  pausedReason,
  current,
  total,
  userDailyRemaining,
  userDailyCap,
}: BacklogBannerProps) => {
  const { t } = useTranslation();
  const remaining = Math.max(0, total - current);
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  const etaDays = userDailyCap > 0 ? Math.ceil(remaining / userDailyCap) : null;

  if (paused) {
    const key =
      pausedReason === 'app_daily_cap'
        ? 'personalRecords.paused.appCap'
        : pausedReason === 'strava_rate_limit'
          ? 'personalRecords.paused.rateLimit'
          : 'personalRecords.paused.userCap';
    return (
      <GlassCard className="border border-amber-300/40 p-4 dark:border-amber-500/30">
        <div className="flex items-start gap-3">
          <Sparkles size={20} className="mt-0.5 text-amber-500" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50">{t(`${key}.title`)}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t(`${key}.body`)}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              {t('personalRecords.analysing.progress', { current, total })}
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="border border-strava-orange/30 p-4">
      <div className="flex items-start gap-3">
        {isSyncing ? (
          <Loader2 size={20} className="mt-0.5 animate-spin text-strava-orange" />
        ) : (
          <Sparkles size={20} className="mt-0.5 text-strava-orange" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-50">
            {t('personalRecords.analysing.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('personalRecords.analysing.progress', { current, total })}
            {etaDays !== null && etaDays > 1
              ? ` · ${t('personalRecords.analysing.eta', { days: etaDays })}`
              : ''}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200/60 dark:bg-gray-700/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-strava-orange to-amber-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          {remaining > userDailyRemaining && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              {t('personalRecords.analysing.budgetRemaining', {
                remaining: userDailyRemaining,
                cap: userDailyCap,
              })}
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
