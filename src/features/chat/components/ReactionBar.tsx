import { useState } from 'react';
import clsx from 'clsx';
import { SmilePlus } from 'lucide-react';
import { CHAT_REACTION_EMOJIS } from '@api/services';
import type { ReactionSummary } from '@types';

interface Props {
  reactions: ReactionSummary[];
  /** Whether the viewer is allowed to add/remove reactions (i.e. is a member). */
  canReact: boolean;
  onReact: (emoji: string) => void;
  onUnreact: (emoji: string) => void;
}

/**
 * Reactions row + add-reaction popover. Five-emoji quick set (no full picker)
 * — chosen for keyboard-free interaction on mobile, consistent with how the
 * gamification UI handles other taps. Tapping an existing pill toggles the
 * viewer's reaction; the +emoji button surfaces the rest of the allowlist.
 */
export const ReactionBar = ({ reactions, canReact, onReact, onUnreact }: Props) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  // Skip rendering empties when the viewer can't react — avoids a dangling
  // "+" button under every message.
  if (!canReact && reactions.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          disabled={!canReact}
          onClick={() => (r.viewerReacted ? onUnreact(r.emoji) : onReact(r.emoji))}
          className={clsx(
            'flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition disabled:cursor-default',
            r.viewerReacted
              ? 'border-strava-orange/40 bg-strava-orange/15 text-strava-orange'
              : 'border-gray-300/70 bg-white/70 text-gray-700 hover:bg-white dark:border-gray-700/70 dark:bg-gray-800/70 dark:text-gray-200 dark:hover:bg-gray-800'
          )}
        >
          <span>{r.emoji}</span>
          <span className="font-semibold tabular-nums">{r.userIds.length}</span>
        </button>
      ))}
      {canReact && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            aria-label="Add reaction"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300/70 text-gray-500 hover:bg-gray-100 dark:border-gray-700/70 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <SmilePlus size={12} strokeWidth={2} />
          </button>
          {pickerOpen && (
            <>
              {/* Outside-click closer */}
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPickerOpen(false)}
                className="fixed inset-0 z-30 cursor-default bg-transparent"
              />
              <div className="absolute bottom-7 left-0 z-40 flex items-center gap-0.5 rounded-full border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {CHAT_REACTION_EMOJIS.map((emoji) => {
                  const mine = reactions.find((r) => r.emoji === emoji)?.viewerReacted;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        if (mine) onUnreact(emoji);
                        else onReact(emoji);
                        setPickerOpen(false);
                      }}
                      className={clsx(
                        'flex h-7 w-7 items-center justify-center rounded-full text-base transition hover:scale-110',
                        mine && 'bg-strava-orange/15'
                      )}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
