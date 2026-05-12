import { Flame, Heart } from 'lucide-react';
import clsx from 'clsx';

/**
 * Tiered visual treatment that scales with kudo count. The principle:
 * a single kudo is a quiet acknowledgement, a popular activity earns a
 * louder, more celebratory chip. Adding a new tier = add a branch.
 *
 *   0       → nothing rendered (caller handles empty state separately)
 *   1–4     → small muted heart + count
 *   5–14    → pink heart + count, larger
 *   15–49   → filled pink heart + count, soft glow
 *   50+     → flame icon, gradient bg, "hot" treatment
 */
interface KudosBlockProps {
  count: number;
  /** Compact = single icon + count; non-compact gets extra padding/visual flair. */
  compact?: boolean;
}

export const KudosBlock = ({ count, compact = false }: KudosBlockProps) => {
  if (count <= 0) return null;

  if (count >= 50) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 font-semibold text-white shadow-md',
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
        )}
      >
        <Flame size={compact ? 14 : 16} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
        <span className="tabular-nums">{count > 999 ? '999+' : count}</span>
      </span>
    );
  }

  if (count >= 15) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-full bg-pink-100 font-semibold text-pink-700 ring-1 ring-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:ring-pink-900/50',
          compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'
        )}
      >
        <Heart
          size={compact ? 14 : 16}
          strokeWidth={2}
          fill="currentColor"
          aria-hidden="true"
          className="text-pink-500 dark:text-pink-400"
        />
        <span className="tabular-nums">{count}</span>
      </span>
    );
  }

  if (count >= 5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-pink-600 dark:text-pink-400">
        <Heart size={14} strokeWidth={2.25} aria-hidden="true" />
        <span className="tabular-nums">{count}</span>
      </span>
    );
  }

  // 1–4: quiet acknowledgement.
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
      <Heart size={14} strokeWidth={2} aria-hidden="true" />
      <span className="tabular-nums">{count}</span>
    </span>
  );
};
