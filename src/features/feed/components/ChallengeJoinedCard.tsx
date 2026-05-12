import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';
import { GlassCard } from '@components/ui';
import type { FeedEvent, ChallengeJoinedMetadata } from '@types';
import { FeedEventHeader } from './FeedEventHeader';

export const ChallengeJoinedCard = ({ event }: { event: FeedEvent }) => {
  const { t } = useTranslation();
  const meta = event.metadata as unknown as ChallengeJoinedMetadata | null;
  if (!meta) return null;

  const challengeHref = event.entityId ? `/challenges/${event.entityId}` : undefined;
  const title = <p className="font-semibold text-gray-900 dark:text-gray-50">{meta.name}</p>;

  return (
    <GlassCard className="p-4">
      <FeedEventHeader
        actor={event.actor}
        createdAt={event.createdAt}
        icon={Target}
        iconClass="bg-strava-orange/10 text-strava-orange"
      />
      <p className="text-sm text-gray-700 dark:text-gray-300">{t('feed.events.challengeJoined')}</p>
      <div className="mt-2">
        {challengeHref ? (
          <Link to={challengeHref} className="block hover:opacity-80">
            {title}
          </Link>
        ) : (
          title
        )}
      </div>
    </GlassCard>
  );
};
