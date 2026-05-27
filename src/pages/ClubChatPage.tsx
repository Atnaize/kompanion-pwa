import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { BackButton, Skeleton } from '@components/ui';
import { ConversationView, useConversation } from '@features/chat';

/**
 * Full-screen chat for a single club. Route: `/clubs/:id/chat`. Mirrors
 * ChallengeChatPage in chrome and behaviour — the only difference is the
 * scope passed to the resolver.
 */
export const ClubChatPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const clubId = id ?? '';
  const { data: conversation, isLoading } = useConversation(
    clubId ? { kind: 'club', id: clubId } : null
  );

  return (
    <Layout fullScreen>
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200/60 bg-white/95 px-3 py-2.5 backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-900/95">
        <BackButton variant="icon" to={`/clubs/${clubId}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
            {conversation?.scopeName ?? t('common.loading')}
          </p>
        </div>
      </header>

      {isLoading || !conversation ? (
        <div className="mx-auto w-full max-w-lg space-y-3 px-3 py-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="ml-auto h-10 w-2/3" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      ) : (
        <ConversationView conversation={conversation} variant="fullscreen" />
      )}
    </Layout>
  );
};
