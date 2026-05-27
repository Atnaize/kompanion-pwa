import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, PenSquare } from 'lucide-react';
import { Layout } from '@components/layout';
import { EmptyState, ListSkeleton, PageHeader } from '@components/ui';
import { ConversationRow, NewMessageSheet } from '@features/chat';
import { conversationsService } from '@api/services';

const POLL_INTERVAL_MS = 60_000;

/**
 * Unified Messages inbox: every conversation (DMs, groups, club + challenge
 * chats) in one recency-sorted list. Live reordering/unread comes from the
 * app-wide `useRealtimeUser` subscription in `Layout`; the 60s poll is the
 * fallback when realtime is disabled. "New message" opens the compose sheet.
 */
export const MessagesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [composeOpen, setComposeOpen] = useState(false);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => (await conversationsService.listConversations()).data ?? [],
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  return (
    <Layout>
      <div className="space-y-4">
        <PageHeader
          title={t('messages.title', { defaultValue: 'Messages' })}
          action={
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              aria-label={t('messages.new.title', { defaultValue: 'New message' })}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-3.5 py-2 text-sm font-medium text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-500/30 transition-all hover:from-orange-500 hover:to-orange-700 hover:shadow-lg active:scale-95"
            >
              <PenSquare size={16} strokeWidth={2} />
              {t('messages.new.cta', { defaultValue: 'New' })}
            </button>
          }
        />

        {isLoading ? (
          <ListSkeleton count={6} />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={48} strokeWidth={1.5} className="text-gray-400" />}
            title={t('messages.empty.title', { defaultValue: 'No conversations yet' })}
            description={t('messages.empty.description', {
              defaultValue: 'Start a chat with a friend, or jump into a club or challenge.',
            })}
            action={{
              label: t('messages.new.title', { defaultValue: 'New message' }),
              onClick: () => setComposeOpen(true),
            }}
          />
        ) : (
          <div className="space-y-0.5">
            {conversations.map((item) => (
              <ConversationRow
                key={item.id}
                item={item}
                onClick={() => navigate(`/messages/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <NewMessageSheet open={composeOpen} onClose={() => setComposeOpen(false)} />
    </Layout>
  );
};
