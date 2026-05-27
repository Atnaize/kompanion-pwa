import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { Button } from '@components/ui';
import { useStartConversation } from '../hooks/useStartConversation';

interface Props {
  userId: number;
  /** Icon-only 40×40 button for narrow rows (matches FriendActionButton's compact style). */
  compact?: boolean;
}

/** "Message" action — opens (or creates) the 1:1 DM with a friend. */
export const MessageButton = ({ userId, compact = false }: Props) => {
  const { t } = useTranslation();
  const { startDm } = useStartConversation();
  const label = t('messages.action.message', { defaultValue: 'Message' });

  if (compact) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => startDm.mutate(userId)}
        disabled={startDm.isPending}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 text-gray-700 shadow-sm ring-1 ring-gray-900/5 transition-all hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800/90 dark:text-gray-200 dark:ring-gray-100/10 dark:hover:bg-gray-800"
      >
        <MessageCircle size={18} strokeWidth={2.25} aria-hidden="true" />
      </button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="md"
      disabled={startDm.isPending}
      onClick={() => startDm.mutate(userId)}
    >
      <MessageCircle size={14} strokeWidth={2} className="mr-1.5" />
      {label}
    </Button>
  );
};
