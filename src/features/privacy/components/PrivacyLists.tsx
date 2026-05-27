import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ban, BellOff } from 'lucide-react';
import { privacyService } from '@api/services';
import { Avatar, GlassCard, Skeleton } from '@components/ui';
import { useToastStore } from '@store/toastStore';
import { usePrivacyActions } from '../hooks/usePrivacyActions';

/**
 * Settings → Privacy section. Two glass cards listing blocked and muted users
 * with unblock / unmute buttons. Lazy-loaded via react-query.
 */
export const PrivacyLists = () => {
  const { t } = useTranslation();
  const { success, error } = useToastStore();
  const { unblock, unmute } = usePrivacyActions();

  const { data: blocked = [], isLoading: blockedLoading } = useQuery({
    queryKey: ['privacy-blocked'],
    queryFn: async () => (await privacyService.listBlocked()).data,
  });

  const { data: muted = [], isLoading: mutedLoading } = useQuery({
    queryKey: ['privacy-muted'],
    queryFn: async () => (await privacyService.listMuted()).data,
  });

  const handleUnblock = async (userId: number, name: string) => {
    try {
      await unblock.mutateAsync(userId);
      success(t('privacy.toast.unblocked', { name }));
    } catch (err) {
      error(err instanceof Error ? err.message : t('privacy.toast.actionFailed'));
    }
  };

  const handleUnmute = async (userId: number, name: string) => {
    try {
      await unmute.mutateAsync(userId);
      success(t('privacy.toast.unmuted', { name }));
    } catch (err) {
      error(err instanceof Error ? err.message : t('privacy.toast.actionFailed'));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
          <BellOff size={12} strokeWidth={2} />
          {t('privacy.muted.title', { count: muted.length })}
        </h3>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          {t('privacy.muted.description')}
        </p>
        <GlassCard className="p-2">
          {mutedLoading ? (
            <div className="space-y-2 p-1">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ) : muted.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
              {t('privacy.muted.empty')}
            </p>
          ) : (
            <ul className="divide-y divide-gray-200/60 dark:divide-gray-800/60">
              {muted.map((user) => (
                <li key={user.id} className="flex items-center gap-3 px-2 py-2.5">
                  <Avatar
                    src={user.profile}
                    firstname={user.firstname}
                    lastname={user.lastname}
                    size="sm"
                  />
                  <span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
                    {user.firstname} {user.lastname}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUnmute(user.id, `${user.firstname} ${user.lastname}`)}
                    disabled={unmute.isPending}
                    className="text-xs font-semibold text-strava-orange hover:underline disabled:opacity-50"
                  >
                    {t('privacy.action.unmute')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
          <Ban size={12} strokeWidth={2} />
          {t('privacy.blocked.title', { count: blocked.length })}
        </h3>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          {t('privacy.blocked.description')}
        </p>
        <GlassCard className="p-2">
          {blockedLoading ? (
            <div className="space-y-2 p-1">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ) : blocked.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
              {t('privacy.blocked.empty')}
            </p>
          ) : (
            <ul className="divide-y divide-gray-200/60 dark:divide-gray-800/60">
              {blocked.map((user) => (
                <li key={user.id} className="flex items-center gap-3 px-2 py-2.5">
                  <Avatar
                    src={user.profile}
                    firstname={user.firstname}
                    lastname={user.lastname}
                    size="sm"
                  />
                  <span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
                    {user.firstname} {user.lastname}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUnblock(user.id, `${user.firstname} ${user.lastname}`)}
                    disabled={unblock.isPending}
                    className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
                  >
                    {t('privacy.action.unblock')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </section>
  );
};
