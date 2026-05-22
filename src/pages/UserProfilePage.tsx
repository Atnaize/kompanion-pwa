import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GitCompareArrows, Lock, Users } from 'lucide-react';
import { Layout } from '@components/layout';
import { Avatar, Button, GlassCard, StatTile } from '@components/ui';
import { usersService } from '@api/services';
import { FriendActionButton } from '@features/friends';
import { UserActionsMenu } from '@features/privacy';

export const UserProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => (await usersService.getProfile(userId)).data,
    enabled: Number.isInteger(userId) && userId > 0,
  });

  if (isLoading) {
    return (
      <Layout>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <GlassCard className="p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t('userProfile.notFound')}
          </h2>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => navigate('/friends')}
            size="sm"
          >
            {t('common.back')}
          </Button>
        </GlassCard>
      </Layout>
    );
  }

  const { user, friendshipState, counters, stats } = data;
  const hasFullAccess = friendshipState === 'self' || friendshipState === 'friends';
  // Compare-vs-friend is only meaningful with another person, so hide when
  // viewing your own profile (`self`). The server enforces this too (A5).
  const canCompare = friendshipState === 'friends';
  // Show the privacy menu (block / mute) on anyone but yourself.
  const showActionsMenu = friendshipState !== 'self';

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>

        {/* Profile header */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={user.profile}
              firstname={user.firstname}
              lastname={user.lastname}
              size="lg"
              className="border-4"
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-gray-900 dark:text-gray-50">
                {user.firstname} {user.lastname}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Users size={14} strokeWidth={2} />
                {t('userProfile.friendsCount', { count: counters.friends })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <FriendActionButton userId={user.id} state={friendshipState} compact allowUnfriend />
              {showActionsMenu && (
                <UserActionsMenu userId={user.id} userName={`${user.firstname} ${user.lastname}`} />
              )}
            </div>
          </div>
        </GlassCard>

        {/* Compare action (friends only — server enforces A5) */}
        {canCompare && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/users/${user.id}/compare`)}
            className="inline-flex items-center gap-1.5"
          >
            <GitCompareArrows size={14} strokeWidth={2} aria-hidden="true" />
            {t('userProfile.compareWith', { name: user.firstname })}
          </Button>
        )}

        {/* Stats (visible to friends + self only) */}
        {hasFullAccess && stats && (
          <section>
            <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {t('userProfile.stats')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <StatTile
                label={t('common.activities')}
                value={stats.totalActivities.toLocaleString()}
              />
              <StatTile
                label={t('common.distance')}
                value={`${Math.round(stats.totalDistance / 1000).toLocaleString()} km`}
              />
              <StatTile
                label={t('common.elevation')}
                value={`${Math.round(stats.totalElevation).toLocaleString()} m`}
              />
            </div>
          </section>
        )}

        {/* Privacy hint shown when viewer doesn't have full access */}
        {!hasFullAccess && (
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
        )}
      </div>
    </Layout>
  );
};
