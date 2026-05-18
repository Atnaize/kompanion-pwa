import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GlassCard, Skeleton, Button } from '@components/ui';
import {
  adminQuotaService,
  type AdminQuotaUserRow,
  type ActivitySyncProgressEvent,
  type PersonalRecordsBacklogEvent,
} from '@api/services';
import { useToastStore } from '@store/toastStore';
import { GrantQuotaModal } from './GrantQuotaModal';

type AdminActionKind = 'sync' | 'backlog';

interface RunningAction {
  userId: number;
  kind: AdminActionKind;
  label: string;
}

type SortKey = 'name' | 'prFetch' | 'webhookFetch' | 'activitySync' | 'remaining' | 'backlog';
type SortDir = 'asc' | 'desc';

const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

// Below this fraction of cap we tint the row amber; at 0 we tint red.
const CAP_WARNING_FRACTION = 0.2;

export const QuotaTab = () => {
  const [grantTarget, setGrantTarget] = useState<AdminQuotaUserRow | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<string>(todayIsoDate());
  const [sortKey, setSortKey] = useState<SortKey>('activitySync');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [running, setRunning] = useState<RunningAction | null>(null);
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToastStore();

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        // Numbers default to desc (most usage first); name defaults to asc.
        setSortDir(key === 'name' ? 'asc' : 'desc');
      }
    },
    [sortKey]
  );

  const refetchAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'quota'] });
  }, [queryClient]);

  const syncUser = useCallback(
    async (userId: number, name: string) => {
      if (running) return;
      setRunning({ userId, kind: 'sync', label: 'starting…' });
      try {
        await adminQuotaService.syncUserActivities(userId, (event: ActivitySyncProgressEvent) => {
          setRunning({ userId, kind: 'sync', label: formatSyncEvent(event) });
        });
        success(`Synced activities for ${name}`);
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Activity sync failed');
      } finally {
        setRunning(null);
        refetchAll();
      }
    },
    [running, success, toastError, refetchAll]
  );

  const processBacklogFor = useCallback(
    async (userId: number, name: string) => {
      if (running) return;
      setRunning({ userId, kind: 'backlog', label: 'starting…' });
      try {
        let finalEvent: PersonalRecordsBacklogEvent | null = null;
        await adminQuotaService.processUserBacklog(userId, (event: PersonalRecordsBacklogEvent) => {
          finalEvent = event;
          setRunning({ userId, kind: 'backlog', label: formatBacklogEvent(event) });
        });
        if (finalEvent && (finalEvent as PersonalRecordsBacklogEvent).type === 'paused') {
          const reason = (finalEvent as PersonalRecordsBacklogEvent).reason ?? 'paused';
          toastError(`Paused for ${name} (${reason})`);
        } else {
          success(`Processed backlog for ${name}`);
        }
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Backlog processing failed');
      } finally {
        setRunning(null);
        refetchAll();
      }
    },
    [running, success, toastError, refetchAll]
  );

  const overviewQuery = useQuery({
    queryKey: ['admin', 'quota', 'overview'],
    queryFn: async () => (await adminQuotaService.overview()).data ?? null,
    refetchInterval: 10_000,
  });

  const isToday = date === todayIsoDate();
  const usersQuery = useQuery({
    queryKey: ['admin', 'quota', 'users', { activeOnly, date }],
    queryFn: async () =>
      (await adminQuotaService.users({ activeOnly, date: isToday ? undefined : date })).data ?? [],
    // Only poll while looking at today — historical dates are frozen.
    refetchInterval: isToday ? 10_000 : false,
  });

  const visibleUsers = useMemo(
    () => filterAndSortUsers(usersQuery.data ?? [], searchTerm, sortKey, sortDir),
    [usersQuery.data, searchTerm, sortKey, sortDir]
  );

  const backlogQuery = useQuery({
    queryKey: ['admin', 'quota', 'backlog'],
    queryFn: async () => (await adminQuotaService.backlog()).data ?? [],
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-4">
      <OverviewCard data={overviewQuery.data} isLoading={overviewQuery.isLoading} />

      <GlassCard className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Per-user usage {isToday ? 'today' : date}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <label className="flex items-center gap-1.5">
              Date
              <input
                type="date"
                value={date}
                max={todayIsoDate()}
                onChange={(e) => setDate(e.target.value || todayIsoDate())}
                className="rounded border border-gray-300 bg-white px-2 py-1 font-mono text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>
            {!isToday && (
              <Button variant="secondary" onClick={() => setDate(todayIsoDate())}>
                Today
              </Button>
            )}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
              />
              Active users only
            </label>
          </div>
        </div>

        <div className="mb-3">
          <input
            type="search"
            placeholder="Search users by name or username…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {usersQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : visibleUsers.length > 0 ? (
          <UserTable
            users={visibleUsers}
            onGrant={setGrantTarget}
            onSync={(u) => void syncUser(u.userId, `${u.firstname} ${u.lastname}`)}
            onProcessBacklog={(u) =>
              void processBacklogFor(u.userId, `${u.firstname} ${u.lastname}`)
            }
            running={running}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={toggleSort}
          />
        ) : usersQuery.data && usersQuery.data.length > 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No users match &ldquo;{searchTerm}&rdquo;.
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isToday ? 'No usage today.' : `No usage on ${date}.`}
          </p>
        )}
      </GlassCard>

      <GlassCard className="p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
          Backlog by user
        </h2>
        {backlogQuery.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : backlogQuery.data && backlogQuery.data.length > 0 ? (
          <ul className="divide-y divide-gray-200 text-sm dark:divide-gray-700">
            {backlogQuery.data.map((row) => {
              const isRunning = running?.userId === row.userId;
              const isBusy = running !== null && !isRunning;
              return (
                <li
                  key={row.userId}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-gray-800 dark:text-gray-200"
                >
                  <span>
                    {row.firstname} {row.lastname}
                    {row.username ? (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        @{row.username}
                      </span>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-600 dark:text-gray-400">
                      {row.unprocessedRuns} runs to analyse
                    </span>
                    {isRunning ? (
                      <span className="font-mono text-xs text-strava-orange">{running.label}</span>
                    ) : null}
                    <Button
                      variant="secondary"
                      disabled={isBusy}
                      onClick={() =>
                        void processBacklogFor(row.userId, `${row.firstname} ${row.lastname}`)
                      }
                    >
                      {isRunning && running.kind === 'backlog' ? 'Processing…' : 'Process backlog'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No backlog — all caught up.</p>
        )}
      </GlassCard>

      <GrantQuotaModal
        isOpen={!!grantTarget}
        onClose={() => setGrantTarget(null)}
        user={grantTarget}
      />
    </div>
  );
};

interface OverviewCardProps {
  data: import('@api/services').AdminQuotaOverview | null | undefined;
  isLoading: boolean;
}

const OverviewCard = ({ data, isLoading }: OverviewCardProps) => {
  if (isLoading || !data) {
    return (
      <GlassCard className="p-4">
        <Skeleton className="h-32 w-full" />
      </GlassCard>
    );
  }
  const percent = Math.round((data.appDailyUsed / data.appDailyBudget) * 100);
  const sparkMax = Math.max(1, ...data.sparkline.map((p) => p.total));
  return (
    <GlassCard className="p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Strava API usage — {data.date}
        </h2>
        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
          {data.appDailyUsed} / {data.appDailyBudget}
        </span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full ${percent >= 90 ? 'bg-red-500' : percent >= 60 ? 'bg-amber-500' : 'bg-strava-orange'}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
        <KindBox label="PR fetch" value={data.byKind.pr_fetch} />
        <KindBox label="Webhook fetch" value={data.byKind.webhook_fetch} />
        <KindBox label="Activity sync" value={data.byKind.activity_sync} />
      </div>

      <div>
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Last 14 days
        </div>
        <div className="flex h-16 items-end gap-1">
          {data.sparkline.map((p) => {
            const h = Math.max(2, Math.round((p.total / sparkMax) * 60));
            return (
              <div
                key={p.date}
                title={`${p.date}: ${p.total}`}
                className="flex-1 rounded-t bg-strava-orange/60 dark:bg-strava-orange/80"
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
};

const KindBox = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg bg-gray-100 px-2 py-1.5 dark:bg-gray-800">
    <div className="text-gray-500 dark:text-gray-400">{label}</div>
    <div className="font-mono text-base text-gray-900 dark:text-gray-50">{value}</div>
  </div>
);

interface UserTableProps {
  users: AdminQuotaUserRow[];
  onGrant: (user: AdminQuotaUserRow) => void;
  onSync: (user: AdminQuotaUserRow) => void;
  onProcessBacklog: (user: AdminQuotaUserRow) => void;
  running: RunningAction | null;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
}

const SortHeader = ({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onClick: () => void;
  align?: 'left' | 'right';
}) => {
  const isActive = sortKey === activeKey;
  const arrow = isActive ? (dir === 'asc' ? '▲' : '▼') : '';
  return (
    <th
      className={`cursor-pointer select-none py-2 pr-3 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={onClick}
    >
      <span className={isActive ? 'text-gray-900 dark:text-gray-50' : ''}>
        {label}
        {arrow ? <span className="ml-1 text-[10px]">{arrow}</span> : null}
      </span>
    </th>
  );
};

const rowTintForRemaining = (u: AdminQuotaUserRow): string => {
  if (u.userDailyCap <= 0) return '';
  if (u.userDailyRemaining === 0) return 'bg-red-50 dark:bg-red-950/30';
  if (u.userDailyRemaining / u.userDailyCap < CAP_WARNING_FRACTION) {
    return 'bg-amber-50 dark:bg-amber-950/30';
  }
  return '';
};

const UserTable = ({
  users,
  onGrant,
  onSync,
  onProcessBacklog,
  running,
  sortKey,
  sortDir,
  onToggleSort,
}: UserTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <SortHeader
            label="User"
            sortKey="name"
            activeKey={sortKey}
            dir={sortDir}
            onClick={() => onToggleSort('name')}
          />
          <SortHeader
            label="PR"
            sortKey="prFetch"
            activeKey={sortKey}
            dir={sortDir}
            onClick={() => onToggleSort('prFetch')}
            align="right"
          />
          <SortHeader
            label="Webhook"
            sortKey="webhookFetch"
            activeKey={sortKey}
            dir={sortDir}
            onClick={() => onToggleSort('webhookFetch')}
            align="right"
          />
          <SortHeader
            label="Sync"
            sortKey="activitySync"
            activeKey={sortKey}
            dir={sortDir}
            onClick={() => onToggleSort('activitySync')}
            align="right"
          />
          <SortHeader
            label="Cap / Remaining"
            sortKey="remaining"
            activeKey={sortKey}
            dir={sortDir}
            onClick={() => onToggleSort('remaining')}
            align="right"
          />
          <SortHeader
            label="Backlog"
            sortKey="backlog"
            activeKey={sortKey}
            dir={sortDir}
            onClick={() => onToggleSort('backlog')}
            align="right"
          />
          <th className="py-2 text-right font-medium" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {users.map((u) => {
          const isRunning = running?.userId === u.userId;
          const isBusy = running !== null && !isRunning;
          const tint = rowTintForRemaining(u);
          return (
            <tr key={u.userId} className={`text-gray-800 dark:text-gray-200 ${tint}`}>
              <td className="py-2 pr-3">
                {u.firstname} {u.lastname}
                {u.username ? (
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    @{u.username}
                  </span>
                ) : null}
                {isRunning ? (
                  <div className="font-mono text-xs text-strava-orange">{running.label}</div>
                ) : null}
              </td>
              <td className="py-2 pr-3 text-right font-mono">{u.prFetch}</td>
              <td className="py-2 pr-3 text-right font-mono">{u.webhookFetch}</td>
              <td className="py-2 pr-3 text-right font-mono">{u.activitySync}</td>
              <td className="py-2 pr-3 text-right font-mono">
                {u.userDailyCap} ({u.userDailyRemaining} left)
              </td>
              <td className="py-2 pr-3 text-right font-mono">{u.unprocessedRuns}</td>
              <td className="py-2 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" disabled={isBusy} onClick={() => onSync(u)}>
                    {isRunning && running.kind === 'sync' ? 'Syncing…' : 'Sync'}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={isBusy || u.unprocessedRuns === 0}
                    onClick={() => onProcessBacklog(u)}
                  >
                    {isRunning && running.kind === 'backlog' ? 'Processing…' : 'Process'}
                  </Button>
                  <Button variant="secondary" disabled={isBusy} onClick={() => onGrant(u)}>
                    Grant +N
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// Local filter + sort. Memoised once per (users, term, sortKey, sortDir) tuple.
const filterAndSortUsers = (
  users: AdminQuotaUserRow[],
  term: string,
  sortKey: SortKey,
  sortDir: SortDir
): AdminQuotaUserRow[] => {
  const t = term.trim().toLowerCase();
  const filtered = t
    ? users.filter((u) => {
        const fullName = `${u.firstname} ${u.lastname}`.toLowerCase();
        const username = u.username?.toLowerCase() ?? '';
        return fullName.includes(t) || username.includes(t);
      })
    : users.slice();

  const sortValue = (u: AdminQuotaUserRow): number | string => {
    switch (sortKey) {
      case 'name':
        return `${u.firstname} ${u.lastname}`.toLowerCase();
      case 'prFetch':
        return u.prFetch;
      case 'webhookFetch':
        return u.webhookFetch;
      case 'activitySync':
        return u.activitySync;
      // Sort by absolute remaining headroom — most-throttled users float to
      // the top in ascending order.
      case 'remaining':
        return u.userDailyRemaining;
      case 'backlog':
        return u.unprocessedRuns;
    }
  };

  const mult = sortDir === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    const av = sortValue(a);
    const bv = sortValue(b);
    if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * mult;
    return ((av as number) - (bv as number)) * mult;
  });
  return filtered;
};

const formatSyncEvent = (event: ActivitySyncProgressEvent): string => {
  switch (event.type) {
    case 'fetching':
      return event.current && event.total
        ? `fetching ${event.current}/${event.total}`
        : 'fetching…';
    case 'saving':
      return event.current && event.total ? `saving ${event.current}/${event.total}` : 'saving…';
    case 'processing':
      return event.current && event.total
        ? `processing ${event.current}/${event.total}`
        : 'processing…';
    case 'complete':
      return `done (${event.total ?? 0})`;
    case 'error':
      return event.message ?? 'error';
  }
};

const formatBacklogEvent = (event: PersonalRecordsBacklogEvent): string => {
  switch (event.type) {
    case 'processing':
      return event.current && event.total
        ? `processing ${event.current}/${event.total}`
        : 'processing…';
    case 'paused':
      return `paused (${event.reason ?? 'unknown'}) ${event.current ?? 0}/${event.total ?? 0}`;
    case 'complete':
      return `done (${event.total ?? 0})`;
    case 'error':
      return event.message ?? 'error';
  }
};
