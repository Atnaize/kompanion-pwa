import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSwipe } from '@contexts/SwipeContext';
import { getNextSwipePage, isSwipeablePage } from '@config/swipeable-pages';

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  indicator: HTMLDivElement | null;
}

const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe (px)
const SWIPE_MAX_TIME = 300; // Maximum time for a swipe (ms)
const SWIPE_MAX_VERTICAL = 30; // Maximum vertical movement to still count as horizontal swipe (px)

export const useSwipeNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSwipeBlocked } = useSwipe();
  const swipeState = useRef<SwipeState | null>(null);

  useEffect(() => {
    // Only enable swipe on swipeable pages
    if (!isSwipeablePage(location.pathname)) {
      return;
    }

    const createSwipeIndicator = (direction: 'left' | 'right', startY: number): HTMLDivElement => {
      const indicator = document.createElement('div');
      indicator.style.position = 'fixed';
      indicator.style.top = `${startY}px`;
      indicator.style.transform = 'translateY(-50%)';
      indicator.style[direction === 'left' ? 'left' : 'right'] = '10px';
      indicator.style.width = '3px';
      indicator.style.height = '40px';
      indicator.style.borderRadius = '2px';
      indicator.style.backgroundColor = 'rgba(255, 75, 0, 0.6)';
      indicator.style.zIndex = '9999';
      indicator.style.pointerEvents = 'none';
      indicator.style.transition = 'opacity 0.2s ease-out';
      indicator.style.opacity = '0';
      document.body.appendChild(indicator);

      // Trigger fade in
      setTimeout(() => {
        indicator.style.opacity = '1';
      }, 10);

      return indicator;
    };

    const removeSwipeIndicator = (indicator: HTMLDivElement | null) => {
      if (indicator) {
        indicator.style.opacity = '0';
        setTimeout(() => indicator.remove(), 200);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isSwipeBlocked) {
        return;
      }

      const touch = e.touches[0];
      swipeState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        indicator: null,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isSwipeBlocked || !swipeState.current) {
        return;
      }

      const touch = e.touches[0];
      const { startX, startY, indicator } = swipeState.current;
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      // Only show indicator if it's a valid horizontal swipe gesture
      if (Math.abs(deltaX) > 30 && deltaY < SWIPE_MAX_VERTICAL && !indicator) {
        const direction = deltaX > 0 ? 'right' : 'left';
        const nextPath = getNextSwipePage(location.pathname, direction);

        // Only show indicator if there's a valid next page
        if (nextPath) {
          const newIndicator = createSwipeIndicator(direction, startY);
          swipeState.current.indicator = newIndicator;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isSwipeBlocked || !swipeState.current) {
        return;
      }

      const touch = e.changedTouches[0];
      const { startX, startY, startTime, indicator } = swipeState.current;

      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      const deltaTime = Date.now() - startTime;

      // Remove indicator
      removeSwipeIndicator(indicator);

      // Reset swipe state
      swipeState.current = null;

      // Check if this is a valid horizontal swipe
      if (
        Math.abs(deltaX) < SWIPE_THRESHOLD || // Not enough horizontal movement
        deltaY > SWIPE_MAX_VERTICAL ||        // Too much vertical movement
        deltaTime > SWIPE_MAX_TIME             // Too slow
      ) {
        return;
      }

      // Determine swipe direction
      const direction = deltaX > 0 ? 'right' : 'left';

      // Get next page
      const nextPath = getNextSwipePage(location.pathname, direction);

      if (nextPath) {
        navigate(nextPath);
      }
    };

    const handleTouchCancel = () => {
      if (swipeState.current) {
        removeSwipeIndicator(swipeState.current.indicator);
        swipeState.current = null;
      }
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);

      // Cleanup any remaining indicator
      if (swipeState.current?.indicator) {
        swipeState.current.indicator.remove();
      }
    };
  }, [navigate, location.pathname, isSwipeBlocked]);
};
