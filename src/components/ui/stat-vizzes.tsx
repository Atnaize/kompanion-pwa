// Variant B — each stat card gets its own visual language.
// Each viz is a positioned SVG/div meant to be rendered as a pointer-events-none
// background layer. Entrance animations play on mount and re-run when the
// surrounding card is remounted (e.g., via `key={period}`).

import { motion } from 'framer-motion';

const BAR_HEIGHTS = [0.3, 0.55, 0.4, 0.85, 0.65, 0.95, 0.5];

export const ActivityBarsViz = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute bottom-3 right-3 flex h-10 w-20 items-end gap-[3px] opacity-70"
  >
    {BAR_HEIGHTS.map((h, i) => (
      <motion.div
        key={i}
        className="w-full rounded-sm bg-strava-orange"
        style={{ height: `${h * 100}%`, opacity: 0.25 + h * 0.35, transformOrigin: 'bottom' }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
      />
    ))}
  </div>
);

interface DistanceProgressVizProps {
  /** Progress fraction 0..1 — a fill ratio across the card */
  progress: number;
}

export const DistanceProgressViz = ({ progress }: DistanceProgressVizProps) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-4 bottom-3 h-1 overflow-hidden rounded-full bg-strava-orange/10"
  >
    <motion.div
      className="h-full rounded-full bg-gradient-to-r from-strava-orange/60 to-strava-orange"
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, progress * 100)}%` }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    />
  </div>
);

export const ElevationMountainViz = () => {
  // Quadratic bezier chain (Q) — control points placed alternately above and
  // below the baseline produce a smooth sine-like wave rather than sharp peaks.
  const linePath = 'M0,42 Q30,22 60,32 Q90,42 120,28 Q150,18 180,26 L200,24';
  const fillPath = `${linePath} L200,60 L0,60 Z`;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full"
    >
      <defs>
        <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF4B00" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FF4B00" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={fillPath}
        fill="url(#elevGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="#FF4B00"
        strokeOpacity="0.5"
        strokeWidth="1.2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
};

interface StreakDotsVizProps {
  /** Total days to show (typically 7). First `filled` dots are lit. */
  total?: number;
  filled: number;
}

export const StreakDotsViz = ({ total = 7, filled }: StreakDotsVizProps) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5"
  >
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: i < filled ? '#FF4B00' : '#FF4B0022' }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
      />
    ))}
  </div>
);
