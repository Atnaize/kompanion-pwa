import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface ChipScrollerProps {
  children: ReactNode;
  /** Optional extra classes on the outer wrapper (e.g. margins). */
  className?: string;
  /** Set false to drop the edge fades — useful when the scroller has a
   *  visually clear "more" affordance already (e.g. it ends in a button row). */
  showFade?: boolean;
  /** Aria role for the inner scroll container. Defaults to none. */
  role?: string;
  ariaLabel?: string;
}

/**
 * Horizontal-scroll chip container. Replaces the `flex flex-wrap` pattern that
 * was making filter rows wrap to 2-3 lines on narrow phones and pushing content
 * around. Touch users get native swipe; desktop users get chevron buttons that
 * only appear on hover-capable devices when there's actually content to reveal
 * in that direction.
 *
 * Implementation notes:
 *   - `overflow-x: auto` with a hidden scrollbar (no-scrollbar)
 *   - `touch-action: pan-x` so iOS doesn't intercept vertical scroll
 *   - `scroll-snap-type: x mandatory` so chips settle nicely on flick
 *   - Edge fades + chevron buttons fade out when at that edge
 *   - Chevrons are hidden on touch-only devices via `[@media(hover:hover)]`
 */
export const ChipScroller = ({
  children,
  className,
  showFade = true,
  role,
  ariaLabel,
}: ChipScrollerProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    // 1px slack to absorb sub-pixel rounding at the right edge.
    setCanScrollLeft(node.scrollLeft > 1);
    setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    updateScrollState();
    node.addEventListener('scroll', updateScrollState, { passive: true });
    // Width or child count can change after mount (e.g. filter chips loading
    // from a query). A ResizeObserver re-evaluates on both container resize
    // and child-set changes.
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(node);
    for (const child of Array.from(node.children)) {
      ro.observe(child);
    }
    return () => {
      node.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, children]);

  const scrollBy = (direction: 1 | -1) => {
    const node = scrollRef.current;
    if (!node) return;
    // Scroll by ~80% of the visible width so the next page slightly overlaps
    // the previous one — keeps the user oriented.
    const amount = Math.round(node.clientWidth * 0.8) * direction;
    node.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className={clsx('group/scroller relative', className)}>
      <div
        ref={scrollRef}
        role={role}
        aria-label={ariaLabel}
        className={clsx(
          'no-scrollbar flex gap-2 overflow-x-auto pb-1',
          '[touch-action:pan-x]',
          '[&>*]:shrink-0 [&>*]:snap-start',
          'snap-x scroll-smooth'
        )}
      >
        {children}
      </div>

      {showFade && (
        <>
          <div
            aria-hidden
            className={clsx(
              'pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-gray-50 to-transparent transition-opacity duration-150 dark:from-gray-950',
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            )}
          />
          <div
            aria-hidden
            className={clsx(
              'pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-gray-50 to-transparent transition-opacity duration-150 dark:from-gray-950',
              canScrollRight ? 'opacity-100' : 'opacity-0'
            )}
          />
        </>
      )}

      {/* Chevron buttons: hover-capable devices only (skips touch), and only
          when there's actually content to reveal in that direction. */}
      <button
        type="button"
        aria-label="Scroll left"
        tabIndex={-1}
        onClick={() => scrollBy(-1)}
        className={clsx(
          'absolute left-1 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 p-1 text-gray-600 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-gray-50',
          '[@media(hover:hover)]:flex',
          canScrollLeft ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <ChevronLeft size={14} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        tabIndex={-1}
        onClick={() => scrollBy(1)}
        className={clsx(
          'absolute right-1 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 p-1 text-gray-600 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-gray-50',
          '[@media(hover:hover)]:flex',
          canScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <ChevronRight size={14} strokeWidth={2.25} />
      </button>
    </div>
  );
};
