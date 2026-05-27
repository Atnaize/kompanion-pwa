import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { Layout } from '@components/layout';
import {
  EmptyState,
  GlassCard,
  ListSkeleton,
  PageHeader,
  Tab,
  TabList,
  Tabs,
} from '@components/ui';
import { clubsService } from '@api/services';
import { clubGradient, clubInitials } from '@features/clubs';
import { useToastStore } from '@store/toastStore';
import type { ClubSummary } from '@types';

type ClubsTab = 'mine' | 'invites';

/**
 * Hub: list of clubs I'm a member of + pending invites I've received.
 * Card layout mirrors the FriendsPage row style. Discover is intentionally
 * deferred to a later milestone — without `visibility=public` clubs in the
 * wild yet, there's nothing to show.
 */
export const ClubsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ClubsTab>('mine');

  const { data: clubs = [], isLoading: clubsLoading } = useQuery({
    queryKey: ['clubs', 'mine'],
    queryFn: async () => (await clubsService.list()).data ?? [],
  });

  const { data: invites = [], isLoading: invitesLoading } = useQuery({
    queryKey: ['clubs', 'invites'],
    queryFn: async () => (await clubsService.listInvites()).data ?? [],
  });

  return (
    <Layout>
      <div className="space-y-5">
        <PageHeader
          title={t('clubs.title')}
          subtitle={t('clubs.subtitle')}
          action={
            <button
              type="button"
              onClick={() => navigate('/clubs/create')}
              aria-label={t('clubs.createCta')}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-3.5 py-2 text-sm font-medium text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-500/30 transition-all hover:from-orange-500 hover:to-orange-700 hover:shadow-lg active:scale-95"
            >
              <Plus size={16} strokeWidth={2} />
              {t('clubs.createCta')}
            </button>
          }
        />

        <Tabs value={tab} onChange={(v) => setTab(v as ClubsTab)}>
          <TabList>
            <Tab value="mine" label={t('clubs.tabs.mine')} count={clubs.length} />
            <Tab value="invites" label={t('clubs.tabs.invites')} count={invites.length} />
          </TabList>
        </Tabs>

        {tab === 'mine' &&
          (clubsLoading ? (
            <ListSkeleton count={3} />
          ) : clubs.length === 0 ? (
            <EmptyState
              icon={<Users size={32} strokeWidth={1.5} aria-hidden="true" />}
              title={t('clubs.empty.mineTitle')}
              description={t('clubs.empty.mineDescription')}
            />
          ) : (
            <ul className="space-y-3">
              {clubs.map((club) => (
                <li key={club.id}>
                  <ClubCard club={club} />
                </li>
              ))}
            </ul>
          ))}

        {tab === 'invites' &&
          (invitesLoading ? (
            <ListSkeleton count={2} />
          ) : invites.length === 0 ? (
            <EmptyState
              icon={<Users size={32} strokeWidth={1.5} aria-hidden="true" />}
              title={t('clubs.empty.invitesTitle')}
              description={t('clubs.empty.invitesDescription')}
            />
          ) : (
            <ul className="space-y-3">
              {invites.map((club) => (
                <li key={club.id}>
                  <InviteCard club={club} />
                </li>
              ))}
            </ul>
          ))}
      </div>
    </Layout>
  );
};

const ClubCard = ({ club }: { club: ClubSummary }) => {
  const { t } = useTranslation();
  const initials = clubInitials(club.name);
  const role = club.myRole;

  return (
    <Link
      to={`/clubs/${club.id}`}
      className="block transition-transform active:scale-[0.98]"
      aria-label={club.name}
    >
      <GlassCard className="flex items-center gap-3 p-3" hover>
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-mono text-base font-semibold text-white shadow"
          style={{ backgroundImage: clubGradient(club.id, club.accentColor) }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
            {club.name}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {t('clubs.memberCount', { count: club.memberCount })}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {role === 'owner' && <RoleChip label={t('clubs.role.owner')} variant="owner" />}
            {role === 'admin' && <RoleChip label={t('clubs.role.admin')} variant="admin" />}
            {role === 'member' && <RoleChip label={t('clubs.role.member')} variant="member" />}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
};

const InviteCard = ({ club }: { club: ClubSummary }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();
  const initials = clubInitials(club.name);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['clubs', 'mine'] });
    void queryClient.invalidateQueries({ queryKey: ['clubs', 'invites'] });
  };

  const accept = useMutation({
    mutationFn: () => clubsService.accept(club.id),
    onSuccess: () => {
      invalidate();
      success(t('clubs.toast.accepted', { name: club.name }));
      navigate(`/clubs/${club.id}`);
    },
    onError: (err) => error(err instanceof Error ? err.message : t('clubs.toast.actionFailed')),
  });

  const decline = useMutation({
    mutationFn: () => clubsService.decline(club.id),
    onSuccess: () => {
      invalidate();
      success(t('clubs.toast.declined', { name: club.name }));
    },
    onError: (err) => error(err instanceof Error ? err.message : t('clubs.toast.actionFailed')),
  });

  return (
    <GlassCard className="flex items-center gap-3 p-3">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-mono text-base font-semibold text-white shadow"
        style={{ backgroundImage: clubGradient(club.id, club.accentColor) }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
          {club.name}
        </p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          {t('clubs.memberCount', { count: club.memberCount })}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => decline.mutate()}
          disabled={decline.isPending || accept.isPending}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t('clubs.action.decline')}
        </button>
        <button
          type="button"
          onClick={() => accept.mutate()}
          disabled={accept.isPending || decline.isPending}
          className="rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-500/30 transition-all hover:from-orange-500 hover:to-orange-700 disabled:opacity-50"
        >
          {t('clubs.action.accept')}
        </button>
      </div>
    </GlassCard>
  );
};

const RoleChip = ({
  label,
  variant,
}: {
  label: string;
  variant: 'owner' | 'admin' | 'member' | 'muted';
}) => {
  const styles: Record<typeof variant, string> = {
    owner: 'bg-orange-500/20 text-orange-600 dark:text-orange-300',
    admin: 'bg-purple-500/20 text-purple-600 dark:text-purple-300',
    member: 'bg-sky-500/20 text-sky-600 dark:text-sky-300',
    muted: 'bg-gray-500/20 text-gray-600 dark:text-gray-300',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] ${styles[variant]}`}
    >
      {label}
    </span>
  );
};
