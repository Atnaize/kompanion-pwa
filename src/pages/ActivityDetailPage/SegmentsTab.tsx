import { useTranslation } from 'react-i18next';
import { GlassCard } from '@components/ui';
import { formatDistance, formatDuration } from '@utils/format';
import type { SegmentEffort } from '@types';

interface SegmentsTabProps {
  prSegments: SegmentEffort[];
}

export const SegmentsTab = ({ prSegments }: SegmentsTabProps) => {
  const { t } = useTranslation();
  const sorted = [...prSegments].sort((a, b) => (a.pr_rank ?? 99) - (b.pr_rank ?? 99));

  return (
    <GlassCard className="p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t('activityDetail.segmentPrs')}
      </h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('activityDetail.segmentPrsHint')}</p>
      <div className="mt-4 space-y-3">
        {sorted.map((effort) => (
          <SegmentRow key={effort.id} effort={effort} />
        ))}
      </div>
    </GlassCard>
  );
};

const RANK_LABELS: Record<number, string> = {
  1: 'activityDetail.prRank1',
  2: 'activityDetail.prRank2',
  3: 'activityDetail.prRank3',
};

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const SegmentRow = ({ effort }: { effort: SegmentEffort }) => {
  const { t } = useTranslation();
  const isNewPr = effort.pr_rank === 1;
  const rankKey = RANK_LABELS[effort.pr_rank ?? 0];

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
        isNewPr
          ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50 dark:border-orange-700 dark:from-orange-950/30 dark:to-yellow-950/30'
          : 'border-gray-200 bg-white/60 dark:border-gray-800 dark:bg-gray-900/60'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-gray-900 dark:text-gray-50">{effort.segment.name}</h3>
          {isNewPr && (
            <span className="shrink-0 rounded-full bg-gradient-to-r from-strava-orange to-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              {t('activityDetail.newPr')}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600 dark:text-gray-400">
          <span>📏 {formatDistance(effort.segment.distance)}</span>
          <span>⏱️ {formatDuration(effort.elapsed_time)}</span>
          {effort.segment.average_grade !== 0 && (
            <span>
              📈 {effort.segment.average_grade > 0 ? '+' : ''}
              {effort.segment.average_grade.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-center">
        <div
          className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-lg ${
            isNewPr ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow' : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {RANK_MEDALS[effort.pr_rank ?? 0] ?? '🎖️'}
        </div>
        {rankKey && <p className="mt-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">{t(rankKey)}</p>}
      </div>
    </div>
  );
};
