import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { Layout } from '@components/layout';
import { Avatar, BackButton, Skeleton } from '@components/ui';
import { ConversationView, useConversation } from '@features/chat';

/**
 * Full-screen thread for any conversation reached from the Messages hub or a
 * deep-link. Route: `/messages/:conversationId`. Resolves the summary by id,
 * then hands off to the shared ConversationView in fullscreen.
 */
export const MessageThreadPage = () => {
  const { t } = useTranslation();
  const { conversationId } = useParams<{ conversationId: string }>();
  const id = conversationId ?? '';
  const { data: conversation, isLoading } = useConversation(
    id ? { kind: 'conversation', id } : null
  );

  return (
    <Layout fullScreen>
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200/60 bg-white/95 px-3 py-2.5 backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-900/95">
        <BackButton variant="icon" to="/messages" />
        {conversation?.image ? (
          <Avatar src={conversation.image} size="sm" className="!h-8 !w-8" />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-strava-orange/10 text-strava-orange">
            <Users size={16} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
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
