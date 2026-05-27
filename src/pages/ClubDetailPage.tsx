import { useCallback, useState } from 'react';
import { useScrollPastSentinel } from '@hooks/useScrollPastSentinel';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  Lock,
  LogOut,
  MoreHorizontal,
  Rss,
  Settings,
  Swords,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { Layout } from '@components/layout';
import {
  ActionSheet,
  type ActionSheetItem,
  Avatar,
  BackButton,
  Button,
  ConfirmModal,
  EmptyState,
  EndOfList,
  GlassCard,
  Skeleton,
  Tab,
  TabList,
  Tabs,
} from '@components/ui';
import { challengesService, clubsService, feedService, leaderboardsService } from '@api/services';
import { ChatPreviewCard } from '@features/chat';
import { clubGradient, clubInitials } from '@features/clubs';
import { feedRenderers } from '@features/feed';
import { useToastStore } from '@store/toastStore';
import { formatDistance } from '@utils/format';
import type { Challenge, FeedPage as FeedPageData } from '@types';

const FEED_PAGE_SIZE = 20;
type ClubTab = 'overview' | 'feed' | 'chat' | 'board';
const CLUB_TABS: ClubTab[] = ['overview', 'feed', 'chat', 'board'];

/**
 * Club detail (Variant B): edge-to-edge gradient hero with overlaid identity,
 * a quick-stats strip, a prominent "Launch challenge" CTA, and a segmented
 * control. The hero scrolls away and a compact identity strip slides into the
 * sticky bar above the tabs. Only that bar gets a blurred backdrop — tab
 * content stays on the app's gradient background (no flat gray slab).
 *
 * Owner/admin/leave actions live in an overflow sheet on the hero, not a
 * stranded button row below the fold.
 */
export const ClubDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const clubId = params.id ?? '';
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();
  const [tab, setTab] = useState<ClubTab>('overview');
  const { ref: bannerEndRef, hasPassed: isCompact } = useScrollPastSentinel();
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

  const { data: club, isLoading } = useQuery({
    queryKey: ['clubs', 'detail', clubId],
    queryFn: async () => (await clubsService.get(clubId)).data,
    enabled: clubId.length > 0,
  });

  // Active-challenge count for the hero stat. Same query key as
  // ClubChallengesSection so React Query serves both from one request.
  const { data: activeChallenges = [] } = useQuery({
    queryKey: ['challenges', 'club', clubId, 'active'],
    queryFn: async () => (await challengesService.list({ clubId, status: 'active' })).data ?? [],
    enabled: clubId.length > 0,
  });

  // Weekly distance across club members, summed client-side from the
  // member-scoped leaderboard (no dedicated aggregate endpoint needed).
  const { data: weekBoard } = useQuery({
    queryKey: ['leaderboard', 'club', clubId, 'distance', 'week'],
    queryFn: async () =>
      (await leaderboardsService.friends({ metric: 'distance', period: 'week', clubId })).data!,
    enabled: clubId.length > 0,
  });
  const weeklyDistance = weekBoard?.rows.reduce((sum, r) => sum + r.value, 0);

  const leave = useMutation({
    mutationFn: () => clubsService.leave(clubId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clubs'] });
      success(t('clubs.toast.left', { name: club?.name ?? '' }));
      navigate('/clubs');
    },
    onError: (err) => error(err instanceof Error ? err.message : t('clubs.toast.actionFailed')),
  });

  if (isLoading) {
    return (
      <Layout hideHeader>
        <div className="-mx-4 -mt-6">
          <Skeleton className="h-44 w-full rounded-none" />
        </div>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Layout>
    );
  }

  if (!club) {
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

  const canManage = club.myRole === 'owner' || club.myRole === 'admin';
  const isOwner = club.myRole === 'owner';
  const isMember = club.myStatus === 'active';
  const gradient = clubGradient(club.id, club.accentColor);
  const initials = clubInitials(club.name);

  const actionItems: ActionSheetItem[] = [
    ...(canManage
      ? [
          {
            id: 'invite',
            label: t('clubs.action.invite'),
            icon: <UserPlus size={16} strokeWidth={2} />,
          },
          {
            id: 'settings',
            label: t('clubs.settings.title'),
            icon: <Settings size={16} strokeWidth={2} />,
          },
        ]
      : []),
    ...(isMember && !isOwner
      ? [
          {
            id: 'leave',
            label: t('clubs.action.leave'),
            icon: <LogOut size={16} strokeWidth={2} />,
            variant: 'danger' as const,
            separator: canManage,
          },
        ]
      : []),
  ];

  const handleAction = (id: string) => {
    setActionsOpen(false);
    if (id === 'invite') navigate(`/clubs/${club.id}/invite`);
    else if (id === 'settings') navigate(`/clubs/${club.id}/settings`);
    else if (id === 'leave') setConfirmLeaveOpen(true);
  };

  return (
    <Layout hideHeader>
      {/* ─── Edge-to-edge gradient hero ─── */}
      <div className="-mx-4 -mt-6 px-4 pb-5 pt-4 text-white" style={{ backgroundImage: gradient }}>
        <div className="flex items-center justify-between">
          <BackButton variant="icon" tone="overlay" to="/clubs" />
          {actionItems.length > 0 && (
            <button
              type="button"
              onClick={() => setActionsOpen(true)}
              aria-label={t('clubs.detail.moreActions')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/45"
            >
              <MoreHorizontal size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-black/25 font-mono text-xl font-bold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold drop-shadow-sm">{club.name}</h1>
            {club.myRole && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-full bg-black/25 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]">
                  {t(`clubs.role.${club.myRole}`)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick-stats strip */}
        <div className="mt-4 flex items-center justify-around rounded-2xl bg-black/20 py-2.5">
          <HeroStat value={String(club.memberCount)} label={t('clubs.detail.stats.members')} />
          <HeroStat
            value={String(activeChallenges.length)}
            label={t('clubs.detail.stats.challenges')}
          />
          <HeroStat
            value={weeklyDistance === undefined ? '—' : formatDistance(weeklyDistance)}
            label={t('clubs.detail.stats.thisWeek')}
          />
        </div>
      </div>

      {club.description && (
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{club.description}</p>
      )}

      {/* Sentinel: once the hero scrolls past the viewport top, the compact
          identity strip in the sticky bar fades in. */}
      <div ref={bannerEndRef} aria-hidden className="h-0" />

      {/* ─── Sticky bar: compact header (when scrolled) + segmented control ───
          Only this bar gets a backdrop; tab content below stays transparent. */}
      <div
        className={clsx(
          'sticky top-0 z-30 -mx-4 mt-4 px-4 transition-shadow',
          isCompact ? 'bg-gray-50/95 pb-2 shadow-sm backdrop-blur-md dark:bg-gray-950/95' : ''
        )}
      >
        <div
          aria-hidden={!isCompact}
          className={clsx(
            'flex items-center gap-3 overflow-hidden transition-all duration-200 ease-out',
            isCompact ? 'max-h-14 py-2 opacity-100' : 'pointer-events-none max-h-0 py-0 opacity-0'
          )}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold text-white shadow"
            style={{ backgroundImage: gradient }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
              {club.name}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {t('clubs.memberCount', { count: club.memberCount })}
            </p>
          </div>
          {actionItems.length > 0 && (
            <button
              type="button"
              onClick={() => setActionsOpen(true)}
              aria-label={t('clubs.detail.moreActions')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <MoreHorizontal size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        <Tabs value={tab} onChange={(v) => setTab(v as ClubTab)}>
          <TabList>
            {CLUB_TABS.map((id) => (
              <Tab key={id} value={id} label={t(`clubs.tabs.${id}`)} />
            ))}
          </TabList>
        </Tabs>
      </div>

      {/* ─── Tab content (transparent background) ─── */}
      <div className="mt-4">
        {tab === 'overview' && (
          <div className="space-y-6">
            <ClubChallengesSection
              clubId={club.id}
              challenges={activeChallenges}
              canLaunch={isMember}
            />

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  <Users size={12} strokeWidth={2} />
                  {t('clubs.detail.members')} · {club.memberCount}
                </h3>
                {club.members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowAllMembers((v) => !v)}
                    className="text-[11px] font-semibold text-strava-orange hover:underline"
                  >
                    {showAllMembers ? t('clubs.detail.showLess') : t('clubs.detail.seeAll')}
                  </button>
                )}
              </div>

              {showAllMembers ? (
                <GlassCard className="divide-y divide-gray-200/60 p-0 dark:divide-gray-800/60">
                  {club.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar
                        src={m.user.profile}
                        firstname={m.user.firstname}
                        lastname={m.user.lastname}
                        size="sm"
                      />
                      <span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
                        {m.user.firstname} {m.user.lastname}
                      </span>
                      {m.role === 'owner' && (
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-orange-600 dark:text-orange-300">
                          {t('clubs.role.owner')}
                        </span>
                      )}
                      {m.role === 'admin' && (
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-purple-600 dark:text-purple-300">
                          {t('clubs.role.admin')}
                        </span>
                      )}
                    </div>
                  ))}
                </GlassCard>
              ) : (
                <MemberRail members={club.members} extra={club.memberCount - club.members.length} />
              )}
            </section>

            {canManage && club.pendingInvites.length > 0 && (
              <section>
                <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  {t('clubs.detail.pendingInvites', { count: club.pendingInvites.length })}
                </h3>
                <GlassCard className="divide-y divide-gray-200/60 p-0 dark:divide-gray-800/60">
                  {club.pendingInvites.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar
                        src={m.user.profile}
                        firstname={m.user.firstname}
                        lastname={m.user.lastname}
                        size="sm"
                      />
                      <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                        {m.user.firstname} {m.user.lastname}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {t('clubs.detail.invitePending')}
                      </span>
                    </div>
                  ))}
                </GlassCard>
              </section>
            )}
          </div>
        )}

        {tab === 'feed' && <ClubFeedPanel clubId={club.id} />}

        {tab === 'chat' &&
          (isMember ? (
            <ChatPreviewCard scope={{ kind: 'club', id: club.id }} to={`/clubs/${club.id}/chat`} />
          ) : (
            <EmptyState
              icon={<Lock size={28} strokeWidth={1.5} aria-hidden="true" />}
              title={t('clubs.chat.notMemberTitle')}
              description={t('clubs.chat.notMember')}
            />
          ))}

        {tab === 'board' && <ClubLeaderboardPanel clubId={club.id} />}
      </div>

      <ActionSheet
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        title={club.name}
        items={actionItems}
        onSelect={handleAction}
        cancelLabel={t('common.cancel')}
      />

      <ConfirmModal
        isOpen={confirmLeaveOpen}
        onClose={() => setConfirmLeaveOpen(false)}
        onConfirm={() => {
          setConfirmLeaveOpen(false);
          leave.mutate();
        }}
        title={t('clubs.confirmLeave.title', { name: club.name })}
        message={t('clubs.confirmLeave.message')}
        confirmText={t('clubs.action.leave')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        isLoading={leave.isPending}
      />
    </Layout>
  );
};

const HeroStat = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="font-mono text-lg font-bold tabular-nums leading-none">{value}</div>
    <div className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70">
      {label}
    </div>
  </div>
);

const MemberRail = ({
  members,
  extra,
}: {
  members: { id: number; user: { firstname: string; lastname: string; profile: string } }[];
  extra: number;
}) => {
  const shown = members.slice(0, 5);
  return (
    <div className="flex items-center">
      {shown.map((m, i) => (
        <div key={m.id} className={clsx(i > 0 && '-ml-2')}>
          <Avatar
            src={m.user.profile}
            firstname={m.user.firstname}
            lastname={m.user.lastname}
            size="sm"
            className="!h-9 !w-9 ring-2 ring-gray-50 dark:ring-gray-950"
          />
        </div>
      ))}
      {extra > 0 && (
        <div className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 font-mono text-[10px] font-semibold text-gray-500 ring-2 ring-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-950">
          +{extra}
        </div>
      )}
    </div>
  );
};

/**
 * Active club challenges + a primary CTA to launch a new one. Receives the
 * already-fetched active challenges from the page so the hero stat and this
 * list share one request.
 */
const ClubChallengesSection = ({
  clubId,
  challenges,
  canLaunch,
}: {
  clubId: string;
  challenges: Challenge[];
  canLaunch: boolean;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section>
      {canLaunch && (
        <Button
          type="button"
          fullWidth
          size="sm"
          onClick={() => navigate(`/challenges/create?clubId=${clubId}`)}
          className="mb-4 gap-2"
        >
          <Swords size={16} strokeWidth={2} />
          {t('clubs.action.launchChallenge')}
        </Button>
      )}

      <h3 className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
        <Swords size={12} strokeWidth={2} />
        {t('clubs.detail.activeChallenges')}
      </h3>

      {challenges.length > 0 ? (
        <ul className="space-y-2">
          {challenges.map((c) => (
            <li key={c.id}>
              <GlassCard
                className="cursor-pointer p-3 transition-colors hover:bg-white/80 dark:hover:bg-gray-800/60"
                onClick={() => navigate(`/challenges/${c.id}`)}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {c.name}
                  </p>
                  <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-strava-orange">
                    {c.type === 'competitive'
                      ? t('clubs.detail.challengeTypeCompetitive')
                      : t('clubs.detail.challengeTypeCollab')}
                  </span>
                </div>
                {c.description && (
                  <p className="mt-1 truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {c.description}
                  </p>
                )}
              </GlassCard>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('clubs.detail.noActiveChallenges')}
        </p>
      )}
    </section>
  );
};

/**
 * Feed panel scoped to a single club. Reuses the same `feedRenderers` as the
 * global feed. Infinite scroll via an IntersectionObserver sentinel.
 */
const ClubFeedPanel = ({ clubId }: { clubId: string }) => {
  const { t } = useTranslation();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
    FeedPageData,
    Error
  >({
    queryKey: ['feed', 'club', clubId],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const response = await feedService.list({
        cursor: pageParam as string | undefined,
        limit: FEED_PAGE_SIZE,
        clubId,
      });
      return (response.data ?? { events: [], nextCursor: null }) as FeedPageData;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const sentinelRef = useInfiniteScroll(loadMore, { rootMargin: '200px' });

  const events = data?.pages.flatMap((p) => p.events) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Rss size={28} strokeWidth={1.5} aria-hidden="true" />}
        title={t('clubs.feed.empty.title')}
        description={t('clubs.feed.empty.description')}
      />
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const Renderer = feedRenderers[event.type];
        if (!Renderer) return null;
        return <Renderer key={event.id} event={event} />;
      })}

      {hasNextPage ? (
        <div ref={sentinelRef} className="py-4 text-center">
          {isFetchingNextPage && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
          )}
        </div>
      ) : (
        events.length >= FEED_PAGE_SIZE && <EndOfList label={t('feed.endOfFeed')} />
      )}
    </div>
  );
};

/**
 * Leaderboard panel scoped to club members. Distance/month default for MVP.
 * Viewer is always included and highlighted.
 */
const ClubLeaderboardPanel = ({ clubId }: { clubId: string }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', 'club', clubId, 'distance', 'month'],
    queryFn: async () => {
      const response = await leaderboardsService.friends({
        metric: 'distance',
        period: 'month',
        clubId,
      });
      return response.data!;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <EmptyState
        icon={<Trophy size={28} strokeWidth={1.5} aria-hidden="true" />}
        title={t('clubs.leaderboard.empty.title')}
        description={t('clubs.leaderboard.empty.description')}
      />
    );
  }

  return (
    <>
      <p className="mb-3 text-[11px] text-gray-500 dark:text-gray-400">
        {t('clubs.leaderboard.scope')}
      </p>
      <ol className="space-y-2">
        {data.rows.map((row) => {
          const isPodium = row.rank <= 3;
          return (
            <li key={row.user.id}>
              <GlassCard
                className={clsx(
                  'flex items-center gap-3 p-3 transition-colors',
                  row.isViewer && 'ring-2 ring-strava-orange',
                  !row.isViewer && 'cursor-pointer hover:bg-white/80 dark:hover:bg-gray-800/60'
                )}
                onClick={() => {
                  if (!row.isViewer) {
                    navigate(`/users/${row.user.id}`);
                  }
                }}
              >
                <div
                  className={clsx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold tabular-nums',
                    isPodium
                      ? 'bg-strava-orange/15 text-strava-orange'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  )}
                >
                  {row.rank === 1 ? (
                    <Trophy className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  ) : (
                    row.rank
                  )}
                </div>
                <Avatar
                  src={row.user.profileMedium || row.user.profile}
                  firstname={row.user.firstname}
                  lastname={row.user.lastname}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {row.user.firstname} {row.user.lastname}
                    {row.isViewer && (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-strava-orange">
                        {t('leaderboards.you')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="shrink-0 font-mono text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                  {formatDistance(row.value)}
                </div>
              </GlassCard>
            </li>
          );
        })}
      </ol>
    </>
  );
};
