import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Generic full-screen photo viewer. Takes a list of `{ fullUrl, caption? }`
 * and an active index — both consumers (feed PhotoStrip, ActivityPhotos in
 * detail view) normalise their data to this shape.
 *
 * Renders via portal to `document.body` so it escapes any `backdrop-blur`,
 * `transform`, or `filter` ancestor that would trap `position: fixed`
 * (otherwise the bottom nav and other fixed elements can paint over it).
 *
 * Animations:
 *   - Backdrop fades in/out
 *   - Image scales 0.92→1 and fades
 *
 * Keyboard: Esc closes, ←/→ navigate. Body scroll locked while open.
 */
export interface LightboxPhoto {
  fullUrl: string;
  caption?: string | null;
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[];
  activeIndex: number | null;
  onClose: () => void;
  onIndexChange: (idx: number) => void;
}

export const PhotoLightbox = ({
  photos,
  activeIndex,
  onClose,
  onIndexChange,
}: PhotoLightboxProps) => {
  const isOpen = activeIndex !== null;

  useEffect(() => {
    if (!isOpen || activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && activeIndex < photos.length - 1) {
        onIndexChange(activeIndex + 1);
      }
      if (e.key === 'ArrowLeft' && activeIndex > 0) {
        onIndexChange(activeIndex - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, activeIndex, photos.length, onClose, onIndexChange]);

  return createPortal(
    <AnimatePresence>
      {isOpen && activeIndex !== null && photos[activeIndex] && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            ✕
          </button>
          {activeIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(activeIndex - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Previous"
            >
              ‹
            </button>
          )}
          {activeIndex < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(activeIndex + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Next"
            >
              ›
            </button>
          )}

          {/* Key on the index so navigating ←/→ re-runs the entrance
              animation (cross-fade between images). */}
          <motion.img
            key={activeIndex}
            src={photos[activeIndex].fullUrl}
            alt={photos[activeIndex].caption ?? ''}
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          />

          {photos[activeIndex].caption && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, delay: 0.05 }}
              className="absolute inset-x-0 bottom-4 text-center text-sm text-white/90"
            >
              {photos[activeIndex].caption}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
