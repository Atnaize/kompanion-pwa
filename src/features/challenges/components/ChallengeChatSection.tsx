import { ChatPreviewCard } from '@features/chat';

interface Props {
  challengeId: string;
}

/**
 * Thin wrapper around the generic ChatPreviewCard for the challenge detail
 * page. Resolves the challenge's conversation and navigates to
 * `/challenges/:id/chat` (where the full ConversationView lives) on tap.
 */
export const ChallengeChatSection = ({ challengeId }: Props) => (
  <ChatPreviewCard
    scope={{ kind: 'challenge', id: challengeId }}
    to={`/challenges/${challengeId}/chat`}
  />
);
