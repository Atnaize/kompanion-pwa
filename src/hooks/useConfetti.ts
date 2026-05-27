import { useCallback, useEffect, useRef } from 'react';

const COLORS = ['#FF4B00', '#FF6B2B', '#4B5563', '#3B82F6', '#8B5CF6', '#F59E0B'];

/**
 * Lightweight DOM confetti — no dependency, no canvas. Appends absolutely
 * positioned bits to <body>, animates them falling, then cleans up. Extracted
 * from AchievementUnlockedModal so the challenge celebration reuses the exact
 * same burst. Call the returned `fire()` to launch; any in-flight bits are
 * cleaned up on unmount.
 */
export function useConfetti() {
  const elementsRef = useRef<HTMLDivElement[]>([]);
  const timersRef = useRef<number[]>([]);

  const fire = useCallback((count = 60) => {
    for (let i = 0; i < count; i += 1) {
      const bit = document.createElement('div');
      const size = Math.random() * 8 + 4; // 4–12px
      const startX = Math.random() * window.innerWidth;
      const endX = startX + (Math.random() - 0.5) * 200;
      const rotation = Math.random() * 720 - 360;
      const delay = Math.random() * 500;
      const duration = Math.random() * 1500 + 2000; // 2–3.5s

      bit.style.position = 'fixed';
      bit.style.width = `${size}px`;
      bit.style.height = `${size}px`;
      bit.style.backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      bit.style.left = `${startX}px`;
      bit.style.top = '-20px';
      bit.style.opacity = '1';
      bit.style.zIndex = '9999';
      bit.style.pointerEvents = 'none';
      bit.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';

      document.body.appendChild(bit);
      elementsRef.current.push(bit);

      const startTimer = window.setTimeout(() => {
        bit.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        bit.style.top = `${window.innerHeight + 20}px`;
        bit.style.left = `${endX}px`;
        bit.style.opacity = '0';
        bit.style.transform = `rotate(${rotation}deg)`;
      }, delay);
      timersRef.current.push(startTimer);
    }

    const cleanupTimer = window.setTimeout(() => {
      elementsRef.current.forEach((el) => el.remove());
      elementsRef.current = [];
    }, 4000);
    timersRef.current.push(cleanupTimer);
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      elementsRef.current.forEach((el) => el.remove());
      elementsRef.current = [];
    },
    []
  );

  return fire;
}
