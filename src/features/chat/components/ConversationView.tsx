import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  BellOff,
  ChevronUp,
  CornerDownRight,
  MessageCircle,
  Reply,
  Send,
  Volume2,
  X,
} from 'lucide-react';
import { ActionSheet, type ActionSheetItem, Avatar, Skeleton } from '@components/ui';
import { conversationsService } from '@api/services';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import type {
  ChatMessage,
  ChatMuteState,
  ChatPage,
  ConversationSummary,
  DigestActivity,
} from '@types';
import { ActivityDigestCard } from './ActivityDigestCard';
import { ReactionBar } from './ReactionBar';
import { useRealtimeConversation } from '../hooks/useRealtime';

const PAGE_SIZE = 30;
const POLL_INTERVAL_MS = 15_000;
const FOREVER_ISO = '9999-01-01T00:00:00.000Z';

interface Props {
  conversation: ConversationSummary;
  /** Inline = embedded in a page; fullscreen = takes over the viewport. */
  variant?: 'inline' | 'fullscreen';
  /** Hide the composer (non-members of a club, ended challenges, …). */
  readOnly?: boolean;
}

type MuteOption = 'off' | '1h' | '8h' | 'forever';

interface ReplyDraft {
  parentId: string;
  preview: string;
  authorName: string;
}

/**
 * Scope-agnostic chat surface. Drives challenge chat, club chat, and (when
 * the DM surface lands) friend DMs. Polls every 15s for new messages on the
 * first page only — older pages are stable so we don't thrash their cursors.
 *
 * Activity events: when `kind='activity_digest'` arrives, we render the
 * `ActivityDigestCard` (stacked avatars + "+N logged M today") instead of a
 * chat bubble. Reactions and replies work on these the same as text.
 */
export const ConversationView = ({ conversation, variant = 'inline', readOnly = false }: Props) => {
  const { t } = useTranslation();
  const viewerId = useAuthStore((s) => s.user?.userId);
  const queryClient = useQueryClient();
  const { error } = useToastStore();

  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  const [draft, setDraft] = useState('');
  const [replyDraft, setReplyDraft] = useState<ReplyDraft | null>(null);
  const [muteSheetOpen, setMuteSheetOpen] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  const conversationId = conversation.id;

  // Live updates when Ably is configured; the 15s poll below is the fallback.
  useRealtimeConversation(conversationId);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
    ChatPage,
    Error
  >({
    queryKey: ['conversation-messages', conversationId],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const response = await conversationsService.listMessages(conversationId, {
        cursor: pageParam as string | undefined,
        limit: PAGE_SIZE,
      });
      return (response.data ?? { messages: [], nextCursor: null }) as ChatPage;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const messages = useMemo<ChatMessage[]>(() => {
    if (!data) return [];
    return [...data.pages.flatMap((p) => p.messages)].reverse();
  }, [data]);

  // Index participants for digest avatars. Pulled from the messages we already
  // have — keeps lookups local, no extra fetch. Falls back gracefully when a
  // digest contributor doesn't have a text message in the window.
  const participantsLookup = useMemo(() => {
    const map: Record<number, { firstname: string; lastname: string; profile: string }> = {};
    for (const m of messages) {
      if (m.author) {
        map[m.author.id] = {
          firstname: m.author.firstname,
          lastname: m.author.lastname,
          profile: m.author.profile,
        };
      }
    }
    return map;
  }, [messages]);

  const { data: muteState } = useQuery<ChatMuteState>({
    queryKey: ['conversation-mute', conversationId],
    queryFn: async () => (await conversationsService.getMute(conversationId)).data!,
  });
  const isMuted = !!muteState?.mutedUntil && new Date(muteState.mutedUntil) > new Date();

  const send = useMutation({
    mutationFn: (input: { body: string; parentId?: string }) =>
      conversationsService.sendMessage(conversationId, input.body, input.parentId),
    onSuccess: () => {
      setDraft('');
      setReplyDraft(null);
      void queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
    },
    onError: (err) => error(err instanceof Error ? err.message : t('chat.toast.sendFailed')),
  });

  const markRead = useMutation({
    mutationFn: () => conversationsService.markRead(conversationId),
  });

  const setMute = useMutation({
    mutationFn: (mutedUntil: string | null) =>
      conversationsService.setMute(conversationId, mutedUntil),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversation-mute', conversationId] });
    },
    onError: (err) => error(err instanceof Error ? err.message : t('chat.toast.muteFailed')),
  });

  const react = useMutation({
    mutationFn: (input: { messageId: string; emoji: string }) =>
      conversationsService.addReaction(conversationId, input.messageId, input.emoji),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
    },
  });

  const unreact = useMutation({
    mutationFn: (input: { messageId: string; emoji: string }) =>
      conversationsService.removeReaction(conversationId, input.messageId, input.emoji),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
    },
  });

  // Mark read on mount + every time the newest message id changes. Cheap (one
  // POST) and keeps the unread badge in sync with what's visually rendered.
  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    const lastId = messages[messages.length - 1]?.id ?? null;
    if (lastId && lastId !== lastSeenIdRef.current) {
      lastSeenIdRef.current = lastId;
      const node = listRef.current;
      if (node) node.scrollTop = node.scrollHeight;
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || send.isPending) return;
    send.mutate({ body: trimmed, parentId: replyDraft?.parentId });
    composerRef.current?.focus();
  };

  const activeMuteOption = useMemo<MuteOption>(() => {
    if (!muteState?.mutedUntil) return 'off';
    const ms = new Date(muteState.mutedUntil).getTime() - Date.now();
    if (ms <= 0) return 'off';
    if (ms > 30 * 24 * 60 * 60 * 1000) return 'forever';
    if (ms <= 75 * 60 * 1000) return '1h';
    return '8h';
  }, [muteState]);

  const handlePickMute = (id: string) => {
    const opt = id as MuteOption;
    const now = Date.now();
    const value =
      opt === 'off'
        ? null
        : opt === '1h'
          ? new Date(now + 60 * 60 * 1000).toISOString()
          : opt === '8h'
            ? new Date(now + 8 * 60 * 60 * 1000).toISOString()
            : FOREVER_ISO;
    setMute.mutate(value);
    setMuteSheetOpen(false);
  };

  const muteItems: ActionSheetItem[] = [
    {
      id: 'off',
      label: t('chat.muteSheet.off'),
      description: t('chat.muteSheet.offDesc'),
      icon: <Volume2 size={16} strokeWidth={2} />,
    },
    { id: '1h', label: t('chat.muteSheet.oneHour'), icon: <BellOff size={16} strokeWidth={2} /> },
    {
      id: '8h',
      label: t('chat.muteSheet.eightHours'),
      icon: <BellOff size={16} strokeWidth={2} />,
    },
    {
      id: 'forever',
      label: t('chat.muteSheet.forever'),
      description: t('chat.muteSheet.foreverDesc'),
      icon: <BellOff size={16} strokeWidth={2} />,
    },
  ].map((item) => ({
    ...item,
    label: activeMuteOption === item.id ? `${item.label}  ✓` : item.label,
    variant: 'default' as const,
  }));

  const startReply = (m: ChatMessage) => {
    setReplyDraft({
      parentId: m.id,
      preview: messagePreview(m),
      authorName: m.author?.firstname ?? t('chat.digest.contributor'),
    });
    composerRef.current?.focus();
  };

  const toggleThread = (id: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isFullscreen = variant === 'fullscreen';

  return (
    <section
      className={clsx(
        'flex flex-col',
        // Fullscreen: take the rest of the flex column (Layout main) and allow
        // the inner list to shrink so overflow-y-auto actually scrolls.
        // Inline: bounded card, no flex behaviour to inherit.
        isFullscreen
          ? 'min-h-0 flex-1'
          : 'min-h-[420px] rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur dark:border-gray-800/60 dark:bg-gray-900/60'
      )}
    >
      {!isFullscreen && (
        <div className="flex items-center justify-between border-b border-gray-200/60 px-4 py-2.5 dark:border-gray-800/60">
          <h3 className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            <MessageCircle size={12} strokeWidth={2} />
            {t('chat.title')}
            {isMuted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-200/70 px-2 py-0.5 text-[9px] font-semibold tracking-[0.1em] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <BellOff size={9} strokeWidth={2.25} /> {t('chat.mutedBadge')}
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={() => setMuteSheetOpen(true)}
            className="text-[11px] font-semibold text-strava-orange hover:underline"
          >
            {t('chat.notifications')}
          </button>
        </div>
      )}

      <div
        ref={listRef}
        className={clsx(
          // min-h-0 so this flex-1 child can shrink below intrinsic content
          // height — required for overflow-y-auto to actually scroll inside a
          // flex-col parent.
          'min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4',
          isFullscreen ? 'mx-auto w-full max-w-lg' : 'max-h-[440px]'
        )}
      >
        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mx-auto flex items-center gap-1.5 rounded-full bg-gray-100/60 px-3 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ChevronUp size={12} strokeWidth={2} />
            {isFetchingNextPage ? t('common.loading') : t('chat.loadEarlier')}
          </button>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="ml-auto h-10 w-2/3" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-400 dark:text-gray-500">
            <MessageCircle size={28} strokeWidth={1.5} aria-hidden="true" />
            <p className="text-xs">{t('chat.empty')}</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const previous = messages[i - 1];
            const isViewer = m.kind === 'text' && m.author?.id === viewerId;
            const sameSenderAsPrev =
              m.kind === 'text' &&
              previous?.kind === 'text' &&
              previous?.author?.id === m.author?.id;
            return (
              <MessageRow
                key={m.id}
                message={m}
                isViewer={isViewer}
                showAuthor={m.kind === 'text' && !sameSenderAsPrev}
                participants={mergeDigestParticipants(participantsLookup, m.digest?.activities)}
                canInteract={!readOnly}
                threadExpanded={expandedThreads.has(m.id)}
                onReply={() => startReply(m)}
                onToggleThread={() => toggleThread(m.id)}
                onReact={(emoji) => react.mutate({ messageId: m.id, emoji })}
                onUnreact={(emoji) => unreact.mutate({ messageId: m.id, emoji })}
                conversationId={conversationId}
                viewerId={viewerId}
              />
            );
          })
        )}
      </div>

      {!readOnly && (
        <form
          onSubmit={handleSubmit}
          className={clsx(
            'border-t border-gray-200/60 dark:border-gray-800/60',
            isFullscreen
              ? 'sticky bottom-0 z-20 bg-white/95 backdrop-blur-md dark:bg-gray-900/95'
              : ''
          )}
          style={
            isFullscreen
              ? { paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }
              : undefined
          }
        >
          {replyDraft && (
            <div className="mx-auto flex w-full max-w-lg items-center gap-2 border-b border-gray-200/60 bg-gray-50/60 px-3 py-1.5 text-[11px] dark:border-gray-800/60 dark:bg-gray-800/50">
              <CornerDownRight size={12} strokeWidth={2} className="text-gray-500" />
              <span className="min-w-0 flex-1 truncate text-gray-600 dark:text-gray-400">
                {t('chat.replyingTo', {
                  name: replyDraft.authorName,
                  defaultValue: `Replying to ${replyDraft.authorName}`,
                })}
                <span className="ml-1 text-gray-500">— {replyDraft.preview}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyDraft(null)}
                aria-label={t('common.cancel')}
                className="flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          )}
          <div
            className={clsx(
              'flex items-center gap-2 px-3 py-2.5',
              isFullscreen && 'mx-auto w-full max-w-lg'
            )}
          >
            <input
              ref={composerRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('chat.placeholder')}
              maxLength={2000}
              disabled={send.isPending}
              className="flex-1 rounded-full bg-gray-100/60 px-4 py-2 text-sm text-gray-900 outline-none ring-strava-orange/30 focus:bg-white focus:ring-2 disabled:opacity-50 dark:bg-gray-800/60 dark:text-gray-100 dark:focus:bg-gray-800"
            />
            <button
              type="submit"
              disabled={!draft.trim() || send.isPending}
              aria-label={t('chat.send')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/25 transition-all hover:from-orange-500 hover:to-orange-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <Send size={14} strokeWidth={2} />
            </button>
          </div>
        </form>
      )}

      <ActionSheet
        open={muteSheetOpen}
        onClose={() => setMuteSheetOpen(false)}
        title={t('chat.muteSheet.title')}
        subtitle={t('chat.muteSheet.subtitle')}
        items={muteItems}
        onSelect={handlePickMute}
      />
    </section>
  );
};

interface MessageRowProps {
  message: ChatMessage;
  isViewer: boolean;
  showAuthor: boolean;
  participants: Record<number, { firstname: string; lastname: string; profile: string }>;
  canInteract: boolean;
  threadExpanded: boolean;
  onReply: () => void;
  onToggleThread: () => void;
  onReact: (emoji: string) => void;
  onUnreact: (emoji: string) => void;
  conversationId: string;
  viewerId: number | undefined;
}

const MessageRow = ({
  message,
  isViewer,
  showAuthor,
  participants,
  canInteract,
  threadExpanded,
  onReply,
  onToggleThread,
  onReact,
  onUnreact,
  conversationId,
  viewerId,
}: MessageRowProps) => {
  const { t } = useTranslation();
  const time = formatTime(message.createdAt);

  // System notice (joined/left/created) = centered pill, no bubble/actions.
  if (message.kind === 'system') {
    return <SystemNotice message={message} />;
  }

  // Activity digest = full-width card, no sender bubble.
  if (message.kind === 'activity_digest' && message.digest) {
    return (
      <div className="space-y-2">
        <ActivityDigestCard digest={message.digest} participants={participants} />
        <div className="flex items-center justify-end gap-3 pr-1 text-[10px] text-gray-500 dark:text-gray-400">
          <span>{time}</span>
          {canInteract && (
            <button
              type="button"
              onClick={onReply}
              className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <Reply size={11} strokeWidth={2} /> {t('chat.reply', { defaultValue: 'Reply' })}
            </button>
          )}
        </div>
        <div className="pl-2">
          <ReactionBar
            reactions={message.reactions}
            canReact={canInteract}
            onReact={onReact}
            onUnreact={onUnreact}
          />
        </div>
        {message.replyCount > 0 && (
          <ReplyThreadRow
            count={message.replyCount}
            expanded={threadExpanded}
            onToggle={onToggleThread}
          />
        )}
        {threadExpanded && (
          <RepliesList
            conversationId={conversationId}
            messageId={message.id}
            viewerId={viewerId}
            canInteract={canInteract}
            onReply={onReply}
            onReact={onReact}
            onUnreact={onUnreact}
          />
        )}
      </div>
    );
  }

  // Text bubble.
  return (
    <div className={clsx('group flex items-end gap-2', isViewer ? 'flex-row-reverse' : 'flex-row')}>
      <div className="w-7 shrink-0">
        {showAuthor && !isViewer && message.author && (
          <Avatar
            src={message.author.profile}
            firstname={message.author.firstname}
            lastname={message.author.lastname}
            size="sm"
            className="!h-7 !w-7"
          />
        )}
      </div>
      <div className={clsx('max-w-[75%]', isViewer ? 'items-end' : 'items-start')}>
        {showAuthor && !isViewer && message.author && (
          <p className="mb-1 text-[10px] text-gray-500 dark:text-gray-400">
            {message.author.firstname} · {time}
          </p>
        )}
        <div
          className={clsx(
            'inline-block rounded-2xl px-3 py-2 text-sm leading-snug',
            isViewer
              ? 'rounded-br-sm bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/25'
              : 'rounded-bl-sm bg-gray-100/80 text-gray-900 dark:bg-gray-800/80 dark:text-gray-50'
          )}
        >
          {message.body ? renderBodyWithMentions(message.body, isViewer) : null}
        </div>
        <ReactionBar
          reactions={message.reactions}
          canReact={canInteract}
          onReact={onReact}
          onUnreact={onUnreact}
        />
        <div
          className={clsx(
            'mt-1 flex items-center gap-2 text-[9px] text-gray-500 dark:text-gray-400',
            isViewer ? 'justify-end' : 'justify-start'
          )}
        >
          {isViewer && <span>{time}</span>}
          {canInteract && (
            <button
              type="button"
              onClick={onReply}
              className="inline-flex items-center gap-1 opacity-0 transition hover:text-gray-700 group-hover:opacity-100 dark:hover:text-gray-200"
            >
              <Reply size={11} strokeWidth={2} /> {t('chat.reply', { defaultValue: 'Reply' })}
            </button>
          )}
        </div>
        {message.replyCount > 0 && (
          <ReplyThreadRow
            count={message.replyCount}
            expanded={threadExpanded}
            onToggle={onToggleThread}
          />
        )}
        {threadExpanded && (
          <RepliesList
            conversationId={conversationId}
            messageId={message.id}
            viewerId={viewerId}
            canInteract={canInteract}
            onReply={onReply}
            onReact={onReact}
            onUnreact={onUnreact}
          />
        )}
      </div>
    </div>
  );
};

const SystemNotice = ({ message }: { message: ChatMessage }) => {
  const { t } = useTranslation();
  const sys = message.system;
  const text = sys
    ? t(`messages.system.${sys.event}`, {
        name: sys.actorName ?? '',
        defaultValue: message.body ?? '',
      })
    : (message.body ?? '');
  if (!text) return null;
  return (
    <div className="flex justify-center py-1">
      <span className="rounded-full bg-gray-100/80 px-3 py-1 text-center text-[11px] font-medium text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
        {text}
      </span>
    </div>
  );
};

const ReplyThreadRow = ({
  count,
  expanded,
  onToggle,
}: {
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-strava-orange hover:underline"
    >
      <CornerDownRight size={12} strokeWidth={2} />
      {expanded
        ? t('chat.thread.hide', { defaultValue: 'Hide replies' })
        : t('chat.thread.show', { count, defaultValue: `Show ${count} replies` })}
    </button>
  );
};

const RepliesList = ({
  conversationId,
  messageId,
  viewerId,
  canInteract,
  onReply,
  onReact,
  onUnreact,
}: {
  conversationId: string;
  messageId: string;
  viewerId: number | undefined;
  canInteract: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onUnreact: (emoji: string) => void;
}) => {
  const { data, isLoading } = useQuery<ChatPage>({
    queryKey: ['conversation-replies', conversationId, messageId],
    queryFn: async () =>
      (await conversationsService.listReplies(conversationId, messageId)).data ?? {
        messages: [],
        nextCursor: null,
      },
  });

  if (isLoading) {
    return (
      <div className="mt-2 space-y-1.5 pl-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  const replies = data?.messages ?? [];
  return (
    <div className="mt-2 space-y-2 border-l border-gray-200 pl-3 dark:border-gray-700">
      {replies.map((r) => (
        <div key={r.id} className="flex items-start gap-2">
          {r.author && (
            <Avatar
              src={r.author.profile}
              firstname={r.author.firstname}
              lastname={r.author.lastname}
              size="sm"
              className="!h-6 !w-6"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {r.author?.firstname ?? '…'} · {formatTime(r.createdAt)}
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {r.body ? renderBodyWithMentions(r.body, r.author?.id === viewerId) : null}
            </p>
            <ReactionBar
              reactions={r.reactions}
              canReact={canInteract}
              onReact={(e) => onReact(e)}
              onUnreact={(e) => onUnreact(e)}
            />
          </div>
        </div>
      ))}
      {replies.length === 0 && (
        <p className="py-1 text-[11px] italic text-gray-500 dark:text-gray-400">No replies yet.</p>
      )}
      {canInteract && (
        <button
          type="button"
          onClick={onReply}
          className="text-[11px] font-semibold text-strava-orange hover:underline"
        >
          + Reply
        </button>
      )}
    </div>
  );
};

function mergeDigestParticipants(
  base: Record<number, { firstname: string; lastname: string; profile: string }>,
  activities?: DigestActivity[]
) {
  if (!activities) return base;
  // We don't have profile pics for digest-only contributors from the message
  // window; return the base map plus stubs so the Avatar component falls back
  // to initials. A future enhancement could expand the resolver endpoint to
  // include member summaries.
  const out = { ...base };
  for (const a of activities) {
    if (!out[a.userId]) {
      out[a.userId] = { firstname: '', lastname: '', profile: '' };
    }
  }
  return out;
}

function messagePreview(m: ChatMessage): string {
  if (m.kind === 'text' && m.body) {
    return m.body.length > 60 ? `${m.body.slice(0, 57)}…` : m.body;
  }
  if (m.kind === 'activity_digest' && m.digest) {
    return `${m.digest.activities.length} activities`;
  }
  return '…';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const MENTION_RE = /(@[\p{L}\p{N}_]{1,40})/gu;
function renderBodyWithMentions(body: string, isOwn: boolean): React.ReactNode {
  const parts = body.split(MENTION_RE);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span
          key={i}
          className={clsx(
            'rounded px-1 font-semibold',
            isOwn ? 'bg-white/25 text-white' : 'bg-strava-orange/15 text-strava-orange'
          )}
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
