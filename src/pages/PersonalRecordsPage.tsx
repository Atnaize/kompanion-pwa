import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { GlassCard, Skeleton, EmptyState } from '@components/ui';
import { personalRecordsService } from '@api/services';
import { formatDate } from '@utils/format';
import type { PersonalRecordBandGroup } from '@types';

const PODIUM_MEDALS = ['🥇', '🥈', '🥉'];

// Formats record times as M:SS or H:MM:SS — the generic formatDuration rounds
// to minutes, which hides the seconds that matter for a PR.
const formatRecordTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${minutes}:${pad(secs)}`;
};

export const PersonalRecordsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: bands = [], isLoading } = useQuery({
    queryKey: ['personal-records'],
    queryFn: async () => {
      const response = await personalRecordsService.list();
      return response.data || [];
    },
  });

  const totalRecords = bands.reduce((sum, b) => sum + b.records.length, 0);
  const bandsWithRecords = bands.filter((b) => b.records.length > 0).length;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </Layout>
    );
  }

  if (totalRecords === 0) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('personalRecords.title')}</h1>
            <p className="text-sm text-gray-600">{t('personalRecords.subtitle')}</p>
          </div>
          <EmptyState
            icon="🏆"
            title={t('personalRecords.noPrsYet')}
            description={t('personalRecords.keepTraining')}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('personalRecords.title')}</h1>
          <p className="text-sm text-gray-600">
            {t('personalRecords.summary', { bands: bandsWithRecords, total: totalRecords })}
          </p>
        </div>

        <div className="space-y-4">
          {bands.map((group) => (
            <BandSection
              key={group.band}
              group={group}
              label={t(`personalRecords.bands.${group.band}`)}
              emptyLabel={t('personalRecords.noRecordForBand')}
              bestLabel={t('personalRecords.best')}
              onActivityClick={(id) => navigate(`/activities/${id}`)}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

interface BandSectionProps {
  group: PersonalRecordBandGroup;
  label: string;
  emptyLabel: string;
  bestLabel: string;
  onActivityClick: (activityId: string) => void;
}

const BandSection = ({
  group,
  label,
  emptyLabel,
  bestLabel,
  onActivityClick,
}: BandSectionProps) => {
  const hasRecords = group.records.length > 0;

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-gray-900">{label}</h2>
        {hasRecords && (
          <span className="text-xs font-medium text-gray-500">
            {bestLabel}: {formatRecordTime(group.records[0].bestTimeSeconds)}
          </span>
        )}
      </div>

      {hasRecords ? (
        <ol className="space-y-2">
          {group.records.map((record, index) => (
            <li key={record.activity.id}>
              <button
                type="button"
                onClick={() => onActivityClick(record.activity.id)}
                className="group flex w-full items-center gap-3 rounded-lg bg-white/40 p-3 text-left transition-all hover:bg-white/70"
              >
                <span className="text-2xl">{PODIUM_MEDALS[index] ?? '🎖️'}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-lg font-bold text-gray-900">
                    {formatRecordTime(record.bestTimeSeconds)}
                  </div>
                  <div className="truncate text-xs text-gray-600">
                    {record.activity.name} · {formatDate(record.achievedAt)}
                  </div>
                </div>
                <span className="text-gray-400 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm italic text-gray-500">{emptyLabel}</p>
      )}
    </GlassCard>
  );
};
