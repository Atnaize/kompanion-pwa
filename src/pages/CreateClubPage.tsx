import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Layout } from '@components/layout';
import { BackButton, Button, GlassCard, Input, Textarea } from '@components/ui';
import { clubsService, friendsService } from '@api/services';
import { clubGradient, clubInitials } from '@features/clubs';
import { FriendSelector } from '@features/friends';
import { useToastStore } from '@store/toastStore';

/**
 * Create-a-club form. One screen for MVP: name, optional description,
 * visibility, optional invited friends. Wizardification (multi-step + avatar
 * upload + banner picker) lands later.
 */
export const CreateClubPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error } = useToastStore();

  // Pre-seed invited friends from `?invite=1,2,3` — used by the "save crew as
  // a club" nudge on the challenge create page so the selection survives the
  // navigation.
  const preseededIds = useMemo<number[]>(() => {
    const raw = searchParams.get('invite');
    if (!raw) return [];
    return raw
      .split(',')
      .map((part) => Number.parseInt(part, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
  }, [searchParams]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [invitedIds, setInvitedIds] = useState<number[]>(preseededIds);

  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => (await friendsService.list()).data ?? [],
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: () =>
      clubsService.create({
        name: name.trim(),
        description: description.trim() || undefined,
        // Clubs are invite-only for now. The public/private selector is hidden
        // until Discover + join-requests land — see todo.md.
        visibility: 'private',
        invitedUserIds: invitedIds.length > 0 ? invitedIds : undefined,
      }),
    onSuccess: (response) => {
      success(t('clubs.toast.created', { name: name.trim() }));
      const created = response.data;
      if (created) {
        navigate(`/clubs/${created.id}`);
      } else {
        navigate('/clubs');
      }
    },
    onError: (err) => error(err instanceof Error ? err.message : t('clubs.toast.actionFailed')),
  });

  const canSubmit = name.trim().length >= 2 && !create.isPending;

  return (
    <Layout>
      <div className="space-y-6">
        <BackButton to="/clubs" label={t('clubs.title')} />

        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('clubs.create.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('clubs.create.subtitle')}
          </p>
        </div>

        {/* Live identity preview — updates as the name is typed. */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full font-mono text-2xl font-bold text-white shadow-lg"
            style={{ backgroundImage: clubGradient(name || 'new-club') }}
          >
            {name.trim() ? clubInitials(name) : '?'}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {t('clubs.create.previewHint')}
          </p>
        </div>

        {/* Name + description */}
        <GlassCard className="space-y-4 p-5">
          <div>
            <label
              htmlFor="club-name"
              className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              {t('clubs.create.nameLabel')}
            </label>
            <Input
              id="club-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('clubs.create.namePlaceholder')}
              maxLength={60}
              autoFocus
            />
          </div>
          <div>
            <label
              htmlFor="club-description"
              className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              {t('clubs.create.descriptionLabel')}
            </label>
            <Textarea
              id="club-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('clubs.create.descriptionPlaceholder')}
              maxLength={500}
              rows={3}
            />
          </div>
        </GlassCard>

        {/* Invite friends */}
        <section>
          <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('clubs.create.inviteLabel')}
          </h3>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            {t('clubs.create.inviteHint')}
          </p>
          <FriendSelector
            selectedFriendIds={invitedIds}
            onSelectionChange={setInvitedIds}
            friends={friends}
            isLoading={friendsLoading}
          />
        </section>

        <Button type="button" fullWidth onClick={() => create.mutate()} disabled={!canSubmit}>
          {create.isPending ? t('common.processing') : t('clubs.create.submit')}
        </Button>
      </div>
    </Layout>
  );
};
