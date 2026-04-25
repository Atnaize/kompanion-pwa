import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { GlassCard } from '@components/ui';
import { personalRecordsService } from '@api/services';
import type { PersonalRecordBandGroup } from '@types';

interface PersonalRecordsPreviewProps {
  /** When true, skip the query — used before the user has ever synced. */
  disabled?: boolean;
}

export const PersonalRecordsPreview = ({ disabled = false }: PersonalRecordsPreviewProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: bands = [] } = useQuery({
    queryKey: ['personal-records'],
    queryFn: async () => {
      const response = await personalRecordsService.list();
      return response.data || [];
    },
    enabled: !disabled,
  });

  const achieved = bands.filter((g) => g.records.length > 0);
  if (achieved.length === 0) return null;

  const freshestBand = findFreshestBand(bands);
  const perRow = achieved.length <= 4 ? achieved.length : Math.ceil(achieved.length / 2);

  return (
    <section>
      <GlassCard
        className="group cursor-pointer p-5 transition-all hover:shadow-lg"
        onClick={() => navigate('/personal-records')}
      >
        <div className="mb-5 flex items-baseline justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('dashboard.personalRecords')}
          </h3>
          <span className="text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500">›</span>
        </div>

        <div
          className="grid justify-items-center gap-y-5"
          style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}
        >
          {achieved.map((group) => (
            <BandPill
              key={group.band}
              label={t(`personalRecords.bandsShort.${group.band}`)}
              time={formatRecordTime(group.records[0].bestTimeSeconds)}
              isFreshest={group.band === freshestBand}
            />
          ))}
        </div>
      </GlassCard>
    </section>
  );
};

interface BandPillProps {
  label: string;
  time: string;
  isFreshest: boolean;
}

const BandPill = ({ label, time, isFreshest }: BandPillProps) => (
  <div className="flex w-[72px] flex-col items-center">
    <div className="inline-flex items-center rounded-full border border-strava-orange/40 bg-white/60 px-2.5 py-0.5 shadow-sm backdrop-blur-sm dark:bg-gray-900/40">
      <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-strava-orange">
        {label}
      </span>
    </div>
    <div className="mt-2 font-mono text-base font-semibold tabular-nums tracking-tight text-gray-900 dark:text-gray-50">
      {time}
    </div>
    <div
      className={clsx(
        'mt-1.5 h-[3px] w-full bg-gradient-to-r transition-opacity',
        isFreshest ? 'from-transparent via-strava-orange to-transparent opacity-100' : 'opacity-0'
      )}
    />
  </div>
);

// Formats record times as M:SS or H:MM:SS — the generic formatDuration rounds to
// minutes, which hides the seconds that matter for a PR.
const formatRecordTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
};

const findFreshestBand = (bands: PersonalRecordBandGroup[]): string | null => {
  return bands.reduce<string | null>((latest, group) => {
    const best = group.records[0];
    if (!best) return latest;
    if (!latest) return group.band;
    const current = bands.find((g) => g.band === latest)?.records[0];
    return current && new Date(best.achievedAt) > new Date(current.achievedAt)
      ? group.band
      : latest;
  }, null);
};
