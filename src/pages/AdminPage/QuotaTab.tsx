import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassCard, Skeleton, Button } from '@components/ui';
import { adminQuotaService, type AdminQuotaUserRow } from '@api/services';
import { GrantQuotaModal } from './GrantQuotaModal';

export const QuotaTab = () => {
  const [grantTarget, setGrantTarget] = useState<AdminQuotaUserRow | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);

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
          <UserTable users={usersQuery.data} onGrant={setGrantTarget} />
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
            {backlogQuery.data.map((row) => (
              <li
                key={row.userId}
                className="flex items-center justify-between py-2 text-gray-800 dark:text-gray-200"
              >
                <span>
                  {row.firstname} {row.lastname}
                  {row.username ? (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      @{row.username}
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-gray-600 dark:text-gray-400">
                  {row.unprocessedRuns} runs to analyse
                </span>
              </li>
            ))}
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
}

const UserTable = ({ users, onGrant }: UserTableProps) => (
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
        {users.map((u) => (
          <tr key={u.userId} className="text-gray-800 dark:text-gray-200">
            <td className="py-2 pr-3">
              {u.firstname} {u.lastname}
              {u.username ? (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">@{u.username}</span>
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
              <Button variant="secondary" onClick={() => onGrant(u)}>
                Grant +N
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
