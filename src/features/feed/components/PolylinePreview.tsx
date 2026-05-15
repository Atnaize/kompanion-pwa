import polyline from '@mapbox/polyline';
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface PolylinePreviewProps {
  /** Strava `summary_polyline` (Google encoded polyline format). */
  encoded: string;
  className?: string;
  /** Override the stroke colour / gradient. Defaults to Strava orange. */
  stroke?: string;
  /** Stroke width in viewBox units. */
  strokeWidth?: number;
  /** ViewBox aspect — defaults to wide (100×60). Card-bg uses 100×100. */
  viewBox?: string;
  /**
   * Animate the stroke drawing in on mount. Subtle "the route appears" effect
   * that adds life to the feed. Defaults to true; pass false for places that
   * need a static render (PDFs, screenshots, etc.).
   */
  animateDraw?: boolean;
}

/**
 * Lightweight SVG route preview. Decodes the encoded polyline, normalises to
 * the viewBox, and draws a stroke. No map tiles, no extra requests — just the
 * shape, which is what makes a route recognisable in a feed.
 *
 * The draw-in animation uses `strokeDashoffset` with `pathLength={1}` on the
 * path. Setting the SVG `pathLength` attribute tells the browser "treat this
 * path's length as 1 for all dasharray/dashoffset math" — so we can animate
 * `strokeDashoffset` from 1 (fully hidden) to 0 (fully drawn) with no need
 * for framer-motion to measure the path. That measurement (via
 * `getTotalLength()`) was the iOS Safari failure: when the SVG hadn't laid
 * out yet at mount, the call returned 0, the dasharray collapsed, and the
 * stroke stayed invisible forever even after scrolling.
 *
 * Respects `prefers-reduced-motion` — falls back to a static render.
 */
export const PolylinePreview = ({
  encoded,
  className,
  stroke,
  strokeWidth = 1.6,
  viewBox = '0 0 100 60',
  animateDraw = true,
}: PolylinePreviewProps) => {
  const reduceMotion = useReducedMotion();
  const [, , vbW, vbH] = useMemo(
    () => viewBox.split(' ').map(Number) as [number, number, number, number],
    [viewBox]
  );
  const path = useMemo(() => buildPath(encoded, vbW, vbH), [encoded, vbW, vbH]);
  if (!path) return null;

  const shouldAnimate = animateDraw && !reduceMotion;

  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <motion.path
        d={path}
        fill="none"
        stroke={stroke ?? '#fc4c02'}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        initial={shouldAnimate ? { strokeDashoffset: 1 } : false}
        animate={shouldAnimate ? { strokeDashoffset: 0 } : undefined}
        transition={{ duration: 3, ease: 'easeInOut', delay: 0.3 }}
      />
    </svg>
  );
};

function buildPath(encoded: string, vbW = 100, vbH = 60): string | null {
  let points: Array<[number, number]>;
  try {
    points = polyline.decode(encoded);
  } catch {
    return null;
  }
  if (points.length < 2) return null;

  // Normalise to the 100×60 viewBox with a small inset so the stroke isn't clipped.
  const inset = 3;
  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  // Preserve aspect by scaling on the larger dimension.
  const targetW = vbW - inset * 2;
  const targetH = vbH - inset * 2;
  const scale = Math.min(targetW / lngRange, targetH / latRange);
  const offsetX = (vbW - lngRange * scale) / 2;
  const offsetY = (vbH - latRange * scale) / 2;

  return points
    .map(([lat, lng], i) => {
      const x = offsetX + (lng - minLng) * scale;
      // Invert y so north is up.
      const y = offsetY + (maxLat - lat) * scale;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}
