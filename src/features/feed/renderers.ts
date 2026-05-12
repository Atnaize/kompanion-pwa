import type { FC } from 'react';
import type { FeedEvent } from '@types';
import { ActivityPostedCard } from './components/ActivityPostedCard';
import { PhotoAddedCard } from './components/PhotoAddedCard';
import { PrSetCard } from './components/PrSetCard';
import { AchievementUnlockedCard } from './components/AchievementUnlockedCard';
import { ChallengeJoinedCard } from './components/ChallengeJoinedCard';

export interface FeedItemProps {
  event: FeedEvent;
}

/**
 * Renderer registry (abstraction A2). Add a new card:
 *   1. write a component that takes FeedItemProps
 *   2. register it here under its `type` key
 *
 * Unknown event types fall through to `null` and the FeedPage skips them
 * silently (forward-compat: backend can emit new types before the frontend
 * knows about them, no crashes).
 */
export const feedRenderers: Record<string, FC<FeedItemProps>> = {
  activity_posted: ActivityPostedCard,
  photo_added: PhotoAddedCard,
  pr_set: PrSetCard,
  achievement_unlocked: AchievementUnlockedCard,
  challenge_joined: ChallengeJoinedCard,
};
