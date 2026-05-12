import { useMemo, useState } from 'react';
import { PhotoLightbox, type LightboxPhoto } from '@components/ui';
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

  // Normalise to the shape the shared lightbox expects. Memo so reference
  // stability holds across renders (avoids spurious AnimatePresence churn).
  const lightboxPhotos = useMemo<LightboxPhoto[]>(
    () => photos.map((p) => ({ fullUrl: pickUrl(p, 'full') ?? '', caption: p.caption })),
    [photos]
  );

  if (!photos.length) return null;

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
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-strava-orange dark:bg-gray-800"
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

      <PhotoLightbox
        photos={lightboxPhotos}
        activeIndex={activeIdx}
        onClose={() => setActiveIdx(null)}
        onIndexChange={setActiveIdx}
      />
    </>
  );
};
