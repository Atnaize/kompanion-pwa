import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Watch a zero-height sentinel element and report whether it has scrolled
 * past the top of the viewport. Used for "compact header / sticky tabs once
 * the user scrolls past the hero" patterns — first introduced for the club
 * detail page and now generalised so the same flow works on activity detail,
 * stats, and anywhere else with a tall hero + tabbed content.
 *
 * Returns a tuple: `[ref, hasPassed]`. Mount the ref on a tiny placeholder
 * at the bottom of whatever should "scroll away" (banner, hero, filter row),
 * and use `hasPassed` to toggle the sticky compact strip.
 *
 * Why a sentinel + IntersectionObserver instead of a scroll listener:
 * - Scroll listeners fire on every frame and need throttling.
 * - Sentinels are O(1) on the browser; IO only fires when intersection
 *   actually changes.
 * - Works inside any scroll container without measuring the container itself.
 */
export function useScrollPastSentinel<T extends HTMLElement = HTMLDivElement>(): {
  ref: RefObject<T>;
  hasPassed: boolean;
} {
  const ref = useRef<T | null>(null);
  const [hasPassed, setHasPassed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Sentinel visible → we are still in the hero region → not passed.
        // Sentinel gone (scrolled above the viewport) → user has scrolled past.
        setHasPassed(!entry.isIntersecting);
      },
      // rootMargin pulls the trigger line right at the top of the viewport
      // (the -1px is needed for some browsers to fire the initial state).
      { rootMargin: '-1px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Cast the internal nullable ref to the consumer-facing non-null shape so
  // it slots cleanly into JSX `ref={…}` props without legacy-ref complaints.
  return { ref: ref as RefObject<T>, hasPassed };
}
