import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowUpFromLine, Crown, Eye, ShieldCheck, Trash2, UserX } from 'lucide-react';
import { Layout } from '@components/layout';
import {
  Avatar,
  BackButton,
  Button,
  ConfirmModal,
  GlassCard,
  Input,
  Skeleton,
  Textarea,
} from '@components/ui';
import { clubsService } from '@api/services';
import { ACCENT_OPTIONS, accentSwatch, clubGradient, clubInitials } from '@features/clubs';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import type { ClubAccentColor, ClubMember, ClubSummary, ClubVisibility } from '@types';

/**
 * Owner / admin control panel for a single club. Three sections:
 *   1. Identity — name, description, visibility, accent color
 *   2. Members — list with role chips and per-row actions (promote, demote,
 *      kick, transfer ownership). Action surface depends on viewer's role.
 *   3. Danger zone — delete club (owner only)
 *
 * The page redirects back to the detail view if the viewer isn't owner/admin
 * once the club loads (server enforces too, this is just for UX).
 */
export const ClubSettingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const clubId = params.id ?? '';
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((s) => s.user?.userId);
  const { success, error } = useToastStore();

  const {
    data: club,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ['clubs', 'detail', clubId],
    queryFn: async () => (await clubsService.get(clubId)).data,
    enabled: clubId.length > 0,
  });

  // Local form state. Initialized once the club loads, then driven by the
  // user — we only call update() on Save, not on every keystroke.
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<ClubVisibility>('private');
  const [accent, setAccent] = useState<ClubAccentColor>('default');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmTransferOf, setConfirmTransferOf] = useState<ClubMember | null>(null);

  useEffect(() => {
    if (!club) return;
    setName(club.name);
    setDescription(club.description ?? '');
    setVisibility(club.visibility);
    setAccent(club.accentColor ?? 'default');
  }, [club]);

  const invalidateClub = () => {
    void queryClient.invalidateQueries({ queryKey: ['clubs', 'detail', clubId] });
    void queryClient.invalidateQueries({ queryKey: ['clubs', 'mine'] });
  };

  const update = useMutation({
    mutationFn: () =>
      clubsService.update(clubId, {
        name: name.trim(),
        description: description.trim() || null,
        visibility,
        accentColor: accent,
      }),
    onSuccess: () => {
      invalidateClub();
      success(t('clubs.settings.toast.saved'));
    },
    onError: (err) => error(err instanceof Error ? err.message : t('clubs.toast.actionFailed')),
  });

  const setRole = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'admin' | 'member' }) =>
      clubsService.setMemberRole(clubId, userId, role),
    onSuccess: () => {
      invalidateClub();
      success(t('clubs.settings.toast.roleUpdated'));
    },
    onError: (err) => error(err instanceof Error ? err.message : t('clubs.toast.actionFailed')),
  });

  const kick = useMutation({
    mutationFn: (userId: number) => clubsService.kickMember(clubId, userId),
    onSuccess: () => {
      invalidateClub();
      success(t('clubs.settings.toast.kicked'));
    },
    onError: (err) => error(err instanceof Error ? err.message : t('clubs.toast.actionFailed')),
  });

  const transfer = useMutation({
    mutationFn: (userId: number) => clubsService.transferOwnership(clubId, userId),
    onSuccess: () => {
      invalidateClub();
      success(t('clubs.settings.toast.transferred'));
      navigate(`/clubs/${clubId}`);
    },
    onError: (err) => error(err instanceof Error ? err.message : t('clubs.toast.actionFailed')),
  });

  const remove = useMutation({
    mutationFn: () => clubsService.delete(clubId),
    onSuccess: () => {
      // Optimistically drop the club from the cached list so /clubs doesn't
      // show it for a beat after navigating.
      queryClient.setQueryData<ClubSummary[]>(['clubs', 'mine'], (old) =>
        old?.filter((c) => c.id !== clubId)
      );
      // Refresh the LIST queries only. Invalidating the broad ['clubs'] prefix
      // would force-refetch this still-mounted page's detail query
      // (['clubs','detail',clubId]) against a now-deleted club → 404 toast.
      void queryClient.invalidateQueries({ queryKey: ['clubs', 'mine'] });
      void queryClient.invalidateQueries({ queryKey: ['clubs', 'invites'] });
      success(t('clubs.toast.deleted', { name: club?.name ?? '' }));
      navigate('/clubs');
    },
    onError: (err) => error(err instanceof Error ? err.message : t('clubs.toast.actionFailed')),
  });

  // Bounce non-managers back to the detail page. Server also enforces, but
  // this avoids loading the settings UI just to fail every action.
  useEffect(() => {
    if (!club) return;
    if (club.myRole !== 'owner' && club.myRole !== 'admin') {
      navigate(`/clubs/${clubId}`, { replace: true });
    }
  }, [club, clubId, navigate]);

  const isOwner = club?.myRole === 'owner';
  const isAdmin = club?.myRole === 'admin';
  const hasUnsavedChanges = useMemo(() => {
    if (!club) return false;
    return (
      name.trim() !== club.name ||
      description.trim() !== (club.description ?? '') ||
      visibility !== club.visibility ||
      accent !== (club.accentColor ?? 'default')
    );
  }, [club, name, description, visibility, accent]);

  if (isLoading) {
    return (
      <Layout>
        <Skeleton className="h-40 w-full" />
      </Layout>
    );
  }

  if (loadError || !club) {
    return (
      <Layout>
        <GlassCard className="p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t('clubs.notFound')}
          </h2>
          <div className="mt-4 flex justify-center">
            <BackButton to="/clubs" />
          </div>
        </GlassCard>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <BackButton to={`/clubs/${clubId}`} label={club.name} />

        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('clubs.settings.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{club.name}</p>
        </div>

        {/* ─── Identity ─── */}
        <section>
          <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('clubs.settings.identity')}
          </h3>
          <GlassCard className="space-y-4 p-5">
            {/* Preview */}
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-mono text-lg font-bold text-white shadow-lg"
                style={{ backgroundImage: clubGradient(club.id, accent) }}
              >
                {clubInitials(name || '?')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {name || t('clubs.settings.namePreview')}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t('clubs.memberCount', { count: club.memberCount })}
                </p>
              </div>
            </div>

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
                maxLength={60}
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
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Accent color */}
            <div>
              <span className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('clubs.settings.accentLabel')}
              </span>
              <div className="flex flex-wrap gap-2">
                {ACCENT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAccent(option)}
                    aria-label={t(`clubs.settings.accent.${option}`)}
                    title={t(`clubs.settings.accent.${option}`)}
                    className={clsx(
                      'h-9 w-9 rounded-full ring-offset-2 ring-offset-white transition-transform dark:ring-offset-gray-900',
                      accent === option
                        ? 'scale-110 ring-2 ring-strava-orange'
                        : 'ring-1 ring-gray-300/60 dark:ring-gray-700'
                    )}
                    style={{ backgroundImage: accentSwatch(option) }}
                  />
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* ─── Members ─── */}
        <section>
          <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('clubs.settings.members')}
          </h3>
          <GlassCard className="divide-y divide-gray-200/60 p-0 dark:divide-gray-800/60">
            {club.members.map((m) => {
              const isViewer = m.userId === viewerId;
              // Promotion path: only the owner can change roles, and only
              // members ↔ admins. The owner themselves uses transferOwnership.
              const canPromote = isOwner && m.role === 'member' && !isViewer;
              const canDemote = isOwner && m.role === 'admin' && !isViewer;
              // Kick: admins can remove regular members; the owner can remove
              // anyone except themselves (they'd leave the club orphaned).
              const canKick =
                !isViewer && ((isOwner && m.role !== 'owner') || (isAdmin && m.role === 'member'));
              const canTransfer = isOwner && m.role !== 'owner' && !isViewer;

              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar
                    src={m.user.profile}
                    firstname={m.user.firstname}
                    lastname={m.user.lastname}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-900 dark:text-gray-100">
                      {m.user.firstname} {m.user.lastname}
                      {isViewer && (
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-strava-orange">
                          {t('clubs.settings.you')}
                        </span>
                      )}
                    </p>
                    <RoleBadge role={m.role} />
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {canPromote && (
                      <IconAction
                        title={t('clubs.settings.promote')}
                        onClick={() => setRole.mutate({ userId: m.userId, role: 'admin' })}
                        disabled={setRole.isPending}
                      >
                        <ShieldCheck size={16} strokeWidth={2} />
                      </IconAction>
                    )}
                    {canDemote && (
                      <IconAction
                        title={t('clubs.settings.demote')}
                        onClick={() => setRole.mutate({ userId: m.userId, role: 'member' })}
                        disabled={setRole.isPending}
                      >
                        <Eye size={16} strokeWidth={2} />
                      </IconAction>
                    )}
                    {canTransfer && (
                      <IconAction
                        title={t('clubs.settings.transfer')}
                        onClick={() => setConfirmTransferOf(m)}
                        disabled={transfer.isPending}
                      >
                        <ArrowUpFromLine size={16} strokeWidth={2} />
                      </IconAction>
                    )}
                    {canKick && (
                      <IconAction
                        title={t('clubs.settings.kick')}
                        danger
                        onClick={() => kick.mutate(m.userId)}
                        disabled={kick.isPending}
                      >
                        <UserX size={16} strokeWidth={2} />
                      </IconAction>
                    )}
                  </div>
                </div>
              );
            })}
          </GlassCard>

          {/* Tiny legend so the icon buttons don't feel cryptic */}
          <p className="mt-3 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
            {isOwner
              ? t('clubs.settings.legendOwner')
              : isAdmin
                ? t('clubs.settings.legendAdmin')
                : ''}
          </p>
        </section>

        {/* ─── Danger zone ─── */}
        {isOwner && (
          <section>
            <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-red-500">
              {t('clubs.settings.danger')}
            </h3>
            <GlassCard className="p-5">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('clubs.settings.dangerHint')}
              </p>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-400 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/25 ring-1 ring-red-500/30 transition-all hover:from-red-500 hover:to-red-700 active:scale-95 disabled:opacity-50"
              >
                <Trash2 size={14} strokeWidth={2} />
                {t('clubs.action.delete')}
              </button>
            </GlassCard>
          </section>
        )}

        {/* Sticky save bar — only while there are unsaved identity edits.
            Offset clears the fixed BottomNav so it floats just above it. */}
        {hasUnsavedChanges && (
          <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20">
            <div className="rounded-2xl border border-gray-200/60 bg-white/90 p-2 shadow-lg backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-900/90">
              <Button
                fullWidth
                onClick={() => update.mutate()}
                disabled={update.isPending || name.trim().length < 2}
              >
                {update.isPending ? t('common.processing') : t('common.save')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          remove.mutate();
        }}
        title={t('clubs.confirmDelete.title', { name: club.name })}
        message={t('clubs.confirmDelete.message')}
        confirmText={t('clubs.action.delete')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        isLoading={remove.isPending}
      />

      <ConfirmModal
        isOpen={!!confirmTransferOf}
        onClose={() => setConfirmTransferOf(null)}
        onConfirm={() => {
          const target = confirmTransferOf;
          setConfirmTransferOf(null);
          if (target) transfer.mutate(target.userId);
        }}
        title={t('clubs.settings.confirmTransfer.title', {
          name: confirmTransferOf
            ? `${confirmTransferOf.user.firstname} ${confirmTransferOf.user.lastname}`
            : '',
        })}
        message={t('clubs.settings.confirmTransfer.message')}
        confirmText={t('clubs.settings.transfer')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        isLoading={transfer.isPending}
      />
    </Layout>
  );
};

const RoleBadge = ({ role }: { role: ClubMember['role'] }) => {
  const { t } = useTranslation();
  if (role === 'owner') {
    return (
      <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-orange-600 dark:text-orange-300">
        <Crown size={10} strokeWidth={2.25} /> {t('clubs.role.owner')}
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-purple-600 dark:text-purple-300">
        <ShieldCheck size={10} strokeWidth={2.25} /> {t('clubs.role.admin')}
      </span>
    );
  }
  return (
    <span className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
      {t('clubs.role.member')}
    </span>
  );
};

const IconAction = ({
  title,
  children,
  onClick,
  disabled,
  danger,
}: {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      'flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-50',
      danger
        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40'
        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
    )}
  >
    {children}
  </button>
);
