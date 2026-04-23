import { useEffect, useState } from 'react';
import type { ActivityPhoto } from '@types';

interface ActivityPhotosProps {
  photos: ActivityPhoto[];
}

const pickUrl = (photo: ActivityPhoto, preferred: 'thumb' | 'full'): string | undefined => {
  const urls = photo.urls || {};
  const sizeKeys = Object.keys(urls)
    .map((k) => Number(k))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  if (sizeKeys.length === 0) return undefined;
  const key = preferred === 'thumb' ? sizeKeys[0] : sizeKeys[sizeKeys.length - 1];
  return urls[String(key)];
};

export const ActivityPhotos = ({ photos }: ActivityPhotosProps) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIdx(null);
      if (e.key === 'ArrowRight')
        setActiveIdx((i) => (i === null ? i : Math.min(photos.length - 1, i + 1)));
      if (e.key === 'ArrowLeft') setActiveIdx((i) => (i === null ? i : Math.max(0, i - 1)));
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeIdx, photos.length]);

  if (!photos.length) return null;

  const active = activeIdx !== null ? photos[activeIdx] : null;

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {photos.map((photo, i) => {
          const src = pickUrl(photo, 'thumb');
          if (!src) return null;
          return (
            <button
              key={photo.unique_id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-strava-orange"
            >
              <img
                src={src}
                alt={photo.caption || `Photo ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {photo.caption && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1 pt-4 text-[11px] text-white">
                  {photo.caption}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActiveIdx(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIdx(null);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            ✕
          </button>
          {activeIdx !== null && activeIdx > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx((i) => (i === null ? i : Math.max(0, i - 1)));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Previous"
            >
              ‹
            </button>
          )}
          {activeIdx !== null && activeIdx < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx((i) => (i === null ? i : Math.min(photos.length - 1, i + 1)));
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Next"
            >
              ›
            </button>
          )}
          <img
            src={pickUrl(active, 'full')}
            alt={active.caption || ''}
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {active.caption && (
            <div className="absolute inset-x-0 bottom-4 text-center text-sm text-white/90">
              {active.caption}
            </div>
          )}
        </div>
      )}
    </>
  );
};
