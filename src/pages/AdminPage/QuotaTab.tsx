import { useCallback, useState } from 'react';
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

export const QuotaTab = () => {
  const [grantTarget, setGrantTarget] = useState<AdminQuotaUserRow | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [running, setRunning] = useState<RunningAction | null>(null);
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToastStore();

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

  const usersQuery = useQuery({
    queryKey: ['admin', 'quota', 'users', { activeOnly }],
    queryFn: async () => (await adminQuotaService.users({ activeOnly })).data ?? [],
    refetchInterval: 10_000,
  });

  const backlogQuery = useQuery({
    queryKey: ['admin', 'quota', 'backlog'],
    queryFn: async () => (await adminQuotaService.backlog()).data ?? [],
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-4">
      <OverviewCard data={overviewQuery.data} isLoading={overviewQuery.isLoading} />

      <GlassCard className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Per-user usage today
          </h2>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Active users only
          </label>
        </div>

        {usersQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : usersQuery.data && usersQuery.data.length > 0 ? (
          <UserTable
            users={usersQuery.data}
            onGrant={setGrantTarget}
            onSync={(u) => void syncUser(u.userId, `${u.firstname} ${u.lastname}`)}
            onProcessBacklog={(u) =>
              void processBacklogFor(u.userId, `${u.firstname} ${u.lastname}`)
            }
            running={running}
          />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No usage today.</p>
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
}

const UserTable = ({ users, onGrant, onSync, onProcessBacklog, running }: UserTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <th className="py-2 pr-3 font-medium">User</th>
          <th className="py-2 pr-3 text-right font-medium">PR</th>
          <th className="py-2 pr-3 text-right font-medium">Webhook</th>
          <th className="py-2 pr-3 text-right font-medium">Sync</th>
          <th className="py-2 pr-3 text-right font-medium">Cap / Remaining</th>
          <th className="py-2 pr-3 text-right font-medium">Backlog</th>
          <th className="py-2 text-right font-medium" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {users.map((u) => {
          const isRunning = running?.userId === u.userId;
          const isBusy = running !== null && !isRunning;
          return (
            <tr key={u.userId} className="text-gray-800 dark:text-gray-200">
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
