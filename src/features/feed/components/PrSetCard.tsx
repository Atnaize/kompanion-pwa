import { useTranslation } from 'react-i18next';
import { Timer } from 'lucide-react';
import { GlassCard } from '@components/ui';
import type { FeedEvent, PrSetMetadata } from '@types';
import { FeedEventHeader } from './FeedEventHeader';

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

export const PrSetCard = ({ event }: { event: FeedEvent }) => {
  const { t } = useTranslation();
  const meta = event.metadata as unknown as PrSetMetadata | null;
  if (!meta) return null;

  const bandLabel = t(`personalRecords.bands.${meta.band}`, { defaultValue: meta.band });

  return (
    <GlassCard className="p-4">
      <FeedEventHeader
        actor={event.actor}
        createdAt={event.createdAt}
        icon={Timer}
        iconClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
      />
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
        {t('feed.events.prSet', { band: bandLabel })}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-300">
        {formatTime(meta.timeSeconds)}
      </p>
    </GlassCard>
  );
};
