import { useState } from 'react';
import clsx from 'clsx';
import { PhotoLightbox } from '@components/ui';
import type { FeedActivityPhoto } from '@types';

/**
 * Tiered photo layout — same as before — but tiles are now buttons that open
 * the shared `PhotoLightbox` viewer (same UX as the activity-detail page).
 *
 *   1 photo  → single landscape thumbnail
 *   2 photos → 2-up grid
 *   3 photos → 1 big left + 2 stacked right
 *   4+       → 2×2 grid; the last tile shows "+N" when totalCount > 4
 */
interface PhotoStripProps {
  photos: FeedActivityPhoto[];
  totalCount: number;
}

export const PhotoStrip = ({ photos, totalCount }: PhotoStripProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (photos.length === 0) return null;
  const overflow = Math.max(0, totalCount - photos.length);

  const renderTile = (idx: number, className: string, overlay?: string) => (
    <Tile
      key={idx}
      photo={photos[idx]}
      className={className}
      overlay={overlay}
      onClick={() => setActiveIndex(idx)}
    />
  );

  let grid: JSX.Element;
  if (photos.length === 1) {
    grid = (
      <div className="overflow-hidden rounded-xl">{renderTile(0, 'aspect-[16/9] w-full')}</div>
    );
  } else if (photos.length === 2) {
    grid = (
      <div className="grid grid-cols-2 gap-1.5">
        {renderTile(0, 'aspect-[4/3]')}
        {renderTile(1, 'aspect-[4/3]')}
      </div>
    );
  } else if (photos.length === 3) {
    grid = (
      <div className="grid grid-cols-3 gap-1.5">
        {renderTile(0, 'col-span-2 row-span-2 aspect-[4/3]')}
        {renderTile(1, 'aspect-square')}
        {renderTile(2, 'aspect-square')}
      </div>
    );
  } else {
    grid = (
      <div className="grid grid-cols-2 gap-1.5">
        {renderTile(0, 'aspect-square')}
        {renderTile(1, 'aspect-square')}
        {renderTile(2, 'aspect-square')}
        {renderTile(3, 'aspect-square', overflow > 0 ? `+${overflow}` : undefined)}
      </div>
    );
  }

  return (
    <>
      {grid}
      <PhotoLightbox
        photos={photos.map((p) => ({ fullUrl: p.url, caption: p.caption }))}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onIndexChange={setActiveIndex}
      />
    </>
  );
};

interface TileProps {
  photo: FeedActivityPhoto;
  className?: string;
  overlay?: string;
  onClick: () => void;
}

const Tile = ({ photo, className, overlay, onClick }: TileProps) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      'group relative overflow-hidden rounded-xl bg-gray-200 focus:outline-none focus:ring-2 focus:ring-strava-orange dark:bg-gray-800',
      className
    )}
  >
    <img
      src={photo.url}
      alt={photo.caption ?? ''}
      loading="lazy"
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
    {overlay && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-lg font-semibold text-white">
        {overlay}
      </div>
    )}
  </button>
);
