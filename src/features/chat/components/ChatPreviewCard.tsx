import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BellOff, ChevronRight, MessageCircle } from 'lucide-react';
import { Avatar, GlassCard, Skeleton } from '@components/ui';
import { conversationsService } from '@api/services';
import { useConversation, type ConversationScope } from '../hooks/useConversation';
import type { ChatPage } from '@types';

interface Props {
  scope: ConversationScope;
  /** Route to navigate to on tap (typically the fullscreen chat page). */
  to: string;
  /** Optional override label — defaults to `t('chat.title')`. */
  title?: string;
}

/**
 * Preview tile shown inline in a parent page (challenge or club detail).
 * Avoids cramming a full composer + history into a non-chat surface — tapping
 * the tile navigates to the dedicated chat route where the composer can dock
 * to the keyboard cleanly. Same pattern WhatsApp / Strava clubs use for
 * "click to open conversation" rows.
 */
export const ChatPreviewCard = ({ scope, to, title }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: conversation } = useConversation(scope);
  const conversationId = conversation?.id;

  const { data, isLoading } = useQuery<ChatPage>({
    queryKey: ['conversation-preview', conversationId],
    enabled: !!conversationId,
    queryFn: async () =>
      (await conversationsService.listMessages(conversationId!, { limit: 1 })).data ?? {
        messages: [],
        nextCursor: null,
      },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: muteState } = useQuery({
    queryKey: ['conversation-mute', conversationId],
    enabled: !!conversationId,
    queryFn: async () => (await conversationsService.getMute(conversationId!)).data,
  });
  const isMuted = !!muteState?.mutedUntil && new Date(muteState.mutedUntil) > new Date();

  const latest = data?.messages[0];
  const previewText = latest ? messagePreview(latest) : null;
  const previewSender = latest?.author?.firstname ?? null;
  // System notices (e.g. "created the club") have no author — localize them so
  // the preview reflects that the chat exists rather than looking empty.
  const systemText =
    latest?.kind === 'system'
      ? latest.system
        ? t(`messages.system.${latest.system.event}`, {
            name: latest.system.actorName ?? '',
            defaultValue: latest.body ?? '',
          })
        : (latest.body ?? '')
      : null;

  return (
    <section>
      <h3 className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
        <MessageCircle size={12} strokeWidth={2} />
        {title ?? t('chat.title')}
        {isMuted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-200/70 px-2 py-0.5 text-[9px] font-semibold tracking-[0.1em] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <BellOff size={9} strokeWidth={2.25} /> {t('chat.mutedBadge')}
          </span>
        )}
      </h3>

      <GlassCard
        className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-white/80 dark:hover:bg-gray-800/60"
        onClick={() => navigate(to)}
      >
        {isLoading || !conversation ? (
          <Skeleton className="h-10 flex-1" />
        ) : latest && latest.author ? (
          <>
            <Avatar
              src={latest.author.profile}
              firstname={latest.author.firstname}
              lastname={latest.author.lastname}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-50">
                {previewSender}
              </p>
              <p className="truncate text-xs text-gray-600 dark:text-gray-400">{previewText}</p>
            </div>
            <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-gray-400" />
          </>
        ) : latest && latest.kind === 'activity_digest' && latest.digest ? (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-strava-orange/10 text-strava-orange">
              <MessageCircle size={16} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-50">
                {t('chat.digest.previewTitle', { defaultValue: 'Activity recap' })}
              </p>
              <p className="truncate text-xs text-gray-600 dark:text-gray-400">{previewText}</p>
            </div>
            <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-gray-400" />
          </>
        ) : latest && latest.kind === 'system' ? (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-strava-orange/10 text-strava-orange">
              <MessageCircle size={16} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-50">
                {title ?? t('chat.title')}
              </p>
              <p className="truncate text-xs text-gray-600 dark:text-gray-400">{systemText}</p>
            </div>
            <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-gray-400" />
          </>
        ) : (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-strava-orange/10 text-strava-orange">
              <MessageCircle size={16} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                {t('chat.openChat')}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('chat.emptyPreview')}
              </p>
            </div>
            <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-gray-400" />
          </>
        )}
      </GlassCard>
    </section>
  );
};

function messagePreview(m: import('@types').ChatMessage): string {
  if (m.kind === 'text' && m.body) {
    return m.body;
  }
  if (m.kind === 'activity_digest' && m.digest) {
    const count = m.digest.activities.length;
    return `${count} ${count === 1 ? 'activity' : 'activities'} logged`;
  }
  return '…';
}
