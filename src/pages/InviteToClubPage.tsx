import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Layout } from '@components/layout';
import { BackButton, Button, GlassCard } from '@components/ui';
import { clubsService, friendsService } from '@api/services';
import { FriendSelector } from '@features/friends';
import { useToastStore } from '@store/toastStore';

/**
 * Invite friends to an existing club. Friend-selector + submit. The server
 * filters out users who are already members and rejects non-friends, so we
 * don't need to pre-filter the list here.
 */
export const InviteToClubPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const clubId = params.id ?? '';
  const { success, error } = useToastStore();

  const [selected, setSelected] = useState<number[]>([]);

  const { data: club } = useQuery({
    queryKey: ['clubs', 'detail', clubId],
    queryFn: async () => (await clubsService.get(clubId)).data,
    enabled: clubId.length > 0,
  });

  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => (await friendsService.list()).data ?? [],
    staleTime: 60_000,
  });

  const invite = useMutation({
    mutationFn: () => clubsService.invite(clubId, selected),
    onSuccess: () => {
      success(t('clubs.invite.toast', { count: selected.length }));
      navigate(`/clubs/${clubId}`);
    },
    onError: (err) => error(err instanceof Error ? err.message : t('clubs.toast.actionFailed')),
  });

  // Exclude friends who are already members or invited so the picker is sane.
  const existingIds = new Set(
    club ? [...club.members.map((m) => m.userId), ...club.pendingInvites.map((m) => m.userId)] : []
  );
  const candidates = friends.filter((f) => !existingIds.has(f.id));

  const canSubmit = selected.length > 0 && !invite.isPending;

  return (
    <Layout>
      <div className="space-y-6">
        <BackButton to={`/clubs/${clubId}`} label={club?.name ?? t('clubs.title')} />

        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('clubs.invite.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{club ? club.name : ''}</p>
        </div>

        {candidates.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('clubs.invite.allInvited')}
            </p>
          </GlassCard>
        ) : (
          <FriendSelector
            selectedFriendIds={selected}
            onSelectionChange={setSelected}
            friends={candidates}
            isLoading={friendsLoading}
          />
        )}

        <Button type="button" fullWidth onClick={() => invite.mutate()} disabled={!canSubmit}>
          {invite.isPending
            ? t('common.processing')
            : t('clubs.invite.submit', { count: selected.length })}
        </Button>
      </div>
    </Layout>
  );
};
