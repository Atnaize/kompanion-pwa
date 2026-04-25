import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, ChevronRight, Sparkles, Timer } from 'lucide-react';
import { GlassCard } from '@components/ui';
import { formatDate } from '@utils/format';
import type { PersonalRecordBandGroup } from '@types';
import { BAND_TIERS, findFreshestBand, formatPace, formatRecordTime } from './shared';

interface PersonalRecordsBoardProps {
  groups: PersonalRecordBandGroup[];
  onActivityClick: (activityId: string) => void;
}

export const PersonalRecordsBoard = ({ groups, onActivityClick }: PersonalRecordsBoardProps) => {
  const { t } = useTranslation();
  const freshestBand = findFreshestBand(groups);

  const totalRecords = groups.reduce((sum, g) => sum + g.records.length, 0);
  const bandsWithRecords = groups.filter((g) => g.records.length > 0).length;

  const chartData = useMemo(
    () =>
      groups
        .filter((g) => g.records.length > 0)
        .map((g) => {
          const best = g.records[0];
          const paceSec = Math.round(best.bestTimeSeconds / (g.distanceMeters / 1000));
          return {
            band: g.band,
            distanceKm: g.distanceMeters / 1000,
            paceSec,
            pace: formatPace(best.bestTimeSeconds, g.distanceMeters),
            label: t(`personalRecords.bandsShort.${g.band}`),
          };
        }),
    [groups, t]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-50">
          <Sparkles size={20} className="text-strava-orange" strokeWidth={2} />
          {t('personalRecords.title')}
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
          {t('personalRecords.summary', { bands: bandsWithRecords, total: totalRecords })}
        </p>
      </div>

      {/* Hero: totals + pace curve */}
      <GlassCard className="relative overflow-hidden p-5">
        <span
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-strava-orange/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-6">
          <div className="flex shrink-0 gap-6 sm:flex-col sm:gap-4">
            <Stat
              icon={<Timer size={14} strokeWidth={2} />}
              label="PR count"
              value={totalRecords}
            />
            <Stat
              icon={<Activity size={14} strokeWidth={2} />}
              label="Distances"
              value={`${bandsWithRecords}/${groups.length}`}
            />
          </div>

          <div className="min-w-0">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              Pace · distance curve
            </div>
            {chartData.length >= 2 ? (
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(15, 23, 42, 0.08)" strokeDasharray="2 4" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey="paceSec"
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                      tickFormatter={(v: number) => {
                        const m = Math.floor(v / 60);
                        const s = v % 60;
                        return `${m}:${s.toString().padStart(2, '0')}`;
                      }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      reversed
                    />
                    <Tooltip
                      cursor={{ stroke: '#f97316', strokeDasharray: '3 3' }}
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(15, 23, 42, 0.1)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(_, __, payload) => [`${payload?.payload?.pace} /km`, 'Pace']}
                      labelFormatter={(label: string) => label}
                    />
                    <Line
                      type="monotone"
                      dataKey="paceSec"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/40 font-mono text-xs uppercase tracking-widest text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500">
                Need 2+ PRs to plot
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Band grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <BandTile
            key={group.band}
            group={group}
            isFreshest={group.band === freshestBand}
            shortLabel={t(`personalRecords.bandsShort.${group.band}`)}
            emptyLabel={t('personalRecords.noRecordForBand')}
            onActivityClick={onActivityClick}
          />
        ))}
      </div>
    </div>
  );
};

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const Stat = ({ icon, label, value }: StatProps) => (
  <div>
    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
      <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      {label}
    </div>
    <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-gray-900 dark:text-gray-50">{value}</div>
  </div>
);

interface BandTileProps {
  group: PersonalRecordBandGroup;
  isFreshest: boolean;
  shortLabel: string;
  emptyLabel: string;
  onActivityClick: (activityId: string) => void;
}

const BandTile = ({
  group,
  isFreshest,
  shortLabel,
  emptyLabel,
  onActivityClick,
}: BandTileProps) => {
  const tier = BAND_TIERS[group.band];
  const best = group.records[0];
  const hasRecord = !!best;

  return (
    <GlassCard
      className={clsx(
        'relative overflow-hidden p-5 transition-all duration-200',
        hasRecord && 'hover:-translate-y-0.5 hover:shadow-xl',
        isFreshest && 'ring-2 ring-offset-2 ring-offset-transparent',
        isFreshest && tier.ring
      )}
    >
      {isFreshest && (
        <span
          className={clsx(
            'pointer-events-none absolute inset-0 animate-pulse-slow rounded-2xl',
            tier.tint
          )}
          aria-hidden="true"
        />
      )}
      <span className={clsx('absolute left-0 top-0 h-full w-1', tier.bg)} aria-hidden="true" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div
            className={clsx('font-mono text-sm font-bold uppercase tracking-[0.2em]', tier.text)}
          >
            {shortLabel}
          </div>
          {isFreshest && hasRecord && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em]',
                tier.tint,
                tier.text
              )}
            >
              <Sparkles size={10} strokeWidth={2.5} />
              Fresh
            </span>
          )}
        </div>

        {hasRecord ? (
          <>
            <button
              type="button"
              onClick={() => onActivityClick(best.activity.id)}
              className="mt-5 block w-full text-left"
            >
              <div className="flex items-stretch gap-4">
                <div className="flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Time
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold tabular-nums leading-none text-gray-900 dark:text-gray-50">
                    {formatRecordTime(best.bestTimeSeconds)}
                  </div>
                </div>
                <div className="w-px bg-gray-200/70 dark:bg-gray-800/70" aria-hidden="true" />
                <div className="flex-1 text-right">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Pace
                  </div>
                  <div
                    className={clsx(
                      'mt-1 font-mono text-xl font-semibold tabular-nums leading-none',
                      tier.text
                    )}
                  >
                    {formatPace(best.bestTimeSeconds, group.distanceMeters)}
                    <span className="ml-0.5 align-baseline text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      /km
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 truncate text-xs text-gray-600 dark:text-gray-400">
                <span className="truncate">{best.activity.name}</span>
                <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                <span className="text-gray-500 dark:text-gray-400">{formatDate(best.achievedAt)}</span>
              </div>
            </button>

            {group.records.length > 1 && (
              <div className="mt-4 space-y-1 border-t border-gray-200/60 pt-3 dark:border-gray-800/60">
                {group.records.slice(1).map((record, index) => (
                  <AttemptRow
                    key={record.activity.id}
                    rank={index + 2}
                    tier={tier}
                    time={formatRecordTime(record.bestTimeSeconds)}
                    activityName={record.activity.name}
                    achievedAt={record.achievedAt}
                    onClick={() => onActivityClick(record.activity.id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="mt-5">
            <div className="font-mono text-4xl font-semibold leading-none text-gray-300 dark:text-gray-600">—:—</div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {emptyLabel}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

interface AttemptRowProps {
  rank: number;
  tier: (typeof BAND_TIERS)[keyof typeof BAND_TIERS];
  time: string;
  activityName: string;
  achievedAt: string;
  onClick: () => void;
}

const AttemptRow = ({ rank, tier, time, activityName, achievedAt, onClick }: AttemptRowProps) => {
  // Rank 2 uses a tinted tier chip; rank 3+ uses a plain outline so the ranking
  // still reads as a descending podium.
  const rankStyle =
    rank === 2
      ? clsx(tier.tint, tier.text)
      : 'bg-transparent text-gray-500 ring-1 ring-inset ring-gray-300 dark:text-gray-400 dark:ring-gray-700';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-white/70 active:scale-[0.99] dark:hover:bg-gray-900/70"
    >
      <span
        className={clsx(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold tabular-nums',
          rankStyle
        )}
      >
        {rank.toString().padStart(2, '0')}
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">{time}</span>
      <div className="min-w-0 flex-1 truncate text-[11px] text-gray-500 dark:text-gray-400" title={activityName}>
        {activityName}
      </div>
      <span className="shrink-0 font-mono text-[10px] text-gray-400 dark:text-gray-500">{formatDate(achievedAt)}</span>
      <ChevronRight
        size={14}
        strokeWidth={1.75}
        className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400"
        aria-hidden="true"
      />
    </button>
  );
};
