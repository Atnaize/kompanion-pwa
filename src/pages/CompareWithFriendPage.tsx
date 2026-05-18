import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ArrowRight, Lock, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Layout } from '@components/layout';
import { Avatar, Button, GlassCard, Skeleton, TimePeriodSelector } from '@components/ui';
import type { TimePeriod } from '@components/ui';
import { statsCompareService, usersService } from '@api/services';
import { formatDistance, formatDuration, formatElevation, formatSpeed } from '@utils/format';
import type { CompareWithFriendMetric, LeaderboardMetricKey, LeaderboardPeriod } from '@types';

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

export const CompareWithFriendPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const [period, setPeriod] = useState<TimePeriod>('month');
  const leaderboardPeriod: LeaderboardPeriod = period;

  // Profile drives friendship gate + avatar/name display. We rely on the
  // server's A5 check at /stats/compare-friend, but reading the profile lets
  // us short-circuit the UI before the network call returns 403.
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => (await usersService.getProfile(userId)).data!,
    enabled: Number.isInteger(userId) && userId > 0,
  });

  const isFriendOrSelf =
    profile && (profile.friendshipState === 'friends' || profile.friendshipState === 'self');

  const { data: compare, isLoading: compareLoading } = useQuery({
    queryKey: ['stats-compare-friend', userId, leaderboardPeriod],
    queryFn: async () =>
      (
        await statsCompareService.withFriend({
          userId,
          period: leaderboardPeriod,
        })
      ).data!,
    enabled: Boolean(isFriendOrSelf),
  });

  if (profileLoading) {
    return (
      <Layout>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <GlassCard className="p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t('userProfile.notFound')}
          </h2>
          <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)} size="sm">
            {t('common.back')}
          </Button>
        </GlassCard>
      </Layout>
    );
  }

  if (!isFriendOrSelf) {
    return (
      <Layout>
        <div className="space-y-4">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            {t('common.back')}
          </Button>
          <GlassCard className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <Lock size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('userProfile.lockedHint')}
              </p>
            </div>
          </GlassCard>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>

        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('compare.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('compare.subtitle')}</p>
        </div>

        <div className="flex items-center justify-end">
          <TimePeriodSelector value={period} onChange={setPeriod} storageKey="compare-period" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ComparePersonHeader label={t('compare.you')} avatarFallback={t('compare.you')} />
          <ComparePersonHeader
            label={`${profile.user.firstname} ${profile.user.lastname}`}
            avatarSrc={profile.user.profileMedium || profile.user.profile}
            firstname={profile.user.firstname}
            lastname={profile.user.lastname}
          />
        </div>

        {compareLoading && (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {compare && (
          <ul className="space-y-2">
            {compare.metrics.map((metric) => (
              <li key={metric.key}>
                <CompareRow metric={metric} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
};

interface ComparePersonHeaderProps {
  label: string;
  avatarSrc?: string;
  firstname?: string;
  lastname?: string;
  avatarFallback?: string;
}

const ComparePersonHeader = ({
  label,
  avatarSrc,
  firstname,
  lastname,
  avatarFallback,
}: ComparePersonHeaderProps) => (
  <GlassCard className="flex items-center gap-3 p-3">
    <Avatar
      src={avatarSrc}
      firstname={firstname}
      lastname={lastname}
      alt={avatarFallback ?? label}
      size="sm"
    />
    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{label}</p>
  </GlassCard>
);

interface CompareRowProps {
  metric: CompareWithFriendMetric;
}

const CompareRow = ({ metric }: CompareRowProps) => {
  const { t } = useTranslation();

  const viewerWins = metric.higherIsBetter
    ? metric.viewer > metric.other
    : metric.viewer < metric.other;
  const otherWins = metric.higherIsBetter
    ? metric.other > metric.viewer
    : metric.other < metric.viewer;
  const tie = metric.viewer === metric.other;

  return (
    <GlassCard className="p-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div
          className={clsx('text-right font-mono tabular-nums', viewerWins && 'text-strava-orange')}
        >
          <div className="text-base font-semibold">{formatValue(metric.key, metric.viewer)}</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t(metric.labelKey)}
          </p>
          <DeltaIcon viewerWins={viewerWins} otherWins={otherWins} tie={tie} />
        </div>
        <div
          className={clsx('text-left font-mono tabular-nums', otherWins && 'text-strava-orange')}
        >
          <div className="text-base font-semibold">{formatValue(metric.key, metric.other)}</div>
        </div>
      </div>
    </GlassCard>
  );
};

const DeltaIcon = ({
  viewerWins,
  otherWins,
  tie,
}: {
  viewerWins: boolean;
  otherWins: boolean;
  tie: boolean;
}) => {
  if (tie) {
    return <Minus className="h-3.5 w-3.5 text-gray-400" strokeWidth={2.25} aria-hidden="true" />;
  }
  if (viewerWins) {
    return (
      <TrendingUp
        className="h-3.5 w-3.5 -scale-x-100 text-strava-orange"
        strokeWidth={2.25}
        aria-hidden="true"
      />
    );
  }
  if (otherWins) {
    return (
      <TrendingDown
        className="h-3.5 w-3.5 -scale-x-100 text-strava-orange"
        strokeWidth={2.25}
        aria-hidden="true"
      />
    );
  }
  return <ArrowRight className="h-3.5 w-3.5 text-gray-400" strokeWidth={2.25} aria-hidden="true" />;
};
