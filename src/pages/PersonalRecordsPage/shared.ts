import type { PersonalRecordBand, PersonalRecordBandGroup } from '@types';

export const formatRecordTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${minutes}:${pad(secs)}`;
};

export const formatPace = (seconds: number, distanceMeters: number): string => {
  if (distanceMeters <= 0) return '—';
  const paceSecPerKm = Math.round(seconds / (distanceMeters / 1000));
  const m = Math.floor(paceSecPerKm / 60);
  const s = paceSecPerKm % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export interface BandTier {
  /** Hex color used for subtle chart + accent tints */
  hex: string;
  /** Tailwind text utility for the tier color */
  text: string;
  /** Tailwind background utility at full strength for accent bars */
  bg: string;
  /** Tailwind background utility at low opacity for tinted fills */
  tint: string;
  /** Tailwind ring utility for selection / freshest-PR glow */
  ring: string;
}

export const BAND_TIERS: Record<PersonalRecordBand, BandTier> = {
  '400m': {
    hex: '#ef4444',
    text: 'text-red-500',
    bg: 'bg-red-500',
    tint: 'bg-red-500/10',
    ring: 'ring-red-500/30',
  },
  '1km': {
    hex: '#f97316',
    text: 'text-orange-500',
    bg: 'bg-orange-500',
    tint: 'bg-orange-500/10',
    ring: 'ring-orange-500/30',
  },
  '5km': {
    hex: '#f59e0b',
    text: 'text-amber-500',
    bg: 'bg-amber-500',
    tint: 'bg-amber-500/10',
    ring: 'ring-amber-500/30',
  },
  '10km': {
    hex: '#84cc16',
    text: 'text-lime-500',
    bg: 'bg-lime-500',
    tint: 'bg-lime-500/10',
    ring: 'ring-lime-500/30',
  },
  '15km': {
    hex: '#10b981',
    text: 'text-emerald-500',
    bg: 'bg-emerald-500',
    tint: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/30',
  },
  half_marathon: {
    hex: '#06b6d4',
    text: 'text-cyan-500',
    bg: 'bg-cyan-500',
    tint: 'bg-cyan-500/10',
    ring: 'ring-cyan-500/30',
  },
  marathon: {
    hex: '#6366f1',
    text: 'text-indigo-500',
    bg: 'bg-indigo-500',
    tint: 'bg-indigo-500/10',
    ring: 'ring-indigo-500/30',
  },
};

/** Returns the band whose best record was achieved most recently, or null. */
export const findFreshestBand = (groups: PersonalRecordBandGroup[]): PersonalRecordBand | null => {
  let freshest: { band: PersonalRecordBand; achievedAt: string } | null = null;
  for (const group of groups) {
    const best = group.records[0];
    if (!best) continue;
    if (!freshest || new Date(best.achievedAt) > new Date(freshest.achievedAt)) {
      freshest = { band: group.band, achievedAt: best.achievedAt };
    }
  }
  return freshest?.band ?? null;
};
