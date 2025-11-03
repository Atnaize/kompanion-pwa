import { useEffect, useRef } from 'react';

/**
 * Custom hook for infinite scroll using Intersection Observer
 * Triggers callback when the target element becomes visible
 */
export const useInfiniteScroll = (
  callback: () => void,
  options?: {
    threshold?: number;
    rootMargin?: string;
  }
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      {
        threshold: options?.threshold ?? 0.1,
        rootMargin: options?.rootMargin ?? '100px',
      }
    );

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [callback, options?.threshold, options?.rootMargin]);

  return targetRef;
};
