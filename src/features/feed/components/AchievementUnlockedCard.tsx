import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import clsx from 'clsx';
import { GlassCard } from '@components/ui';
import type { FeedEvent, AchievementUnlockedMetadata } from '@types';
import { FeedEventHeader } from './FeedEventHeader';

const RARITY_STYLES: Record<string, string> = {
  common: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  rare: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  epic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  legendary: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export const AchievementUnlockedCard = ({ event }: { event: FeedEvent }) => {
  const { t } = useTranslation();
  const meta = event.metadata as unknown as AchievementUnlockedMetadata | null;
  if (!meta) return null;

  return (
    <GlassCard className="p-4">
      <FeedEventHeader
        actor={event.actor}
        createdAt={event.createdAt}
        icon={Trophy}
        iconClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
      />
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {t('feed.events.achievementUnlocked')}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={clsx(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            RARITY_STYLES[meta.rarity] ?? RARITY_STYLES.common
          )}
        >
          {meta.rarity}
        </span>
        <p className="font-semibold text-gray-900 dark:text-gray-50">{meta.name}</p>
      </div>
    </GlassCard>
  );
};
