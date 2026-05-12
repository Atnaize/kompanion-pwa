import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { GlassCard } from '@components/ui';
import type { FeedEvent, PhotoAddedMetadata } from '@types';
import { FeedEventHeader } from './FeedEventHeader';

export const PhotoAddedCard = ({ event }: { event: FeedEvent }) => {
  const { t } = useTranslation();
  const meta = event.metadata as unknown as PhotoAddedMetadata | null;
  if (!meta) return null;

  const activityHref = event.entityId ? `/activities/${event.entityId}` : undefined;
  const body = (
    <p className="text-sm text-gray-700 dark:text-gray-300">
      {t('feed.events.photoAdded', { count: meta.count })}
    </p>
  );

  return (
    <GlassCard className="p-4">
      <FeedEventHeader
        actor={event.actor}
        createdAt={event.createdAt}
        icon={Camera}
        iconClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
      />
      {activityHref ? (
        <Link to={activityHref} className="block hover:opacity-80">
          {body}
        </Link>
      ) : (
        body
      )}
    </GlassCard>
  );
};
