import type { ClubAccentColor } from '@types';

/**
 * Named accent palette. Keep the keys in sync with the backend's
 * `CLUB_ACCENT_COLORS` array — the server validates against the same list.
 *
 * When a club has no explicit accent, we fall back to a deterministic
 * hash-based selection (see `clubGradient`) so even un-customised clubs feel
 * branded.
 */
const PALETTE: Record<Exclude<ClubAccentColor, 'default'>, [string, string]> = {
  orange: ['#fc4c02', '#b8390e'],
  sky: ['#38bdf8', '#0369a1'],
  purple: ['#a855f7', '#6b21a8'],
  emerald: ['#10b981', '#065f46'],
  amber: ['#f59e0b', '#b45309'],
  pink: ['#ec4899', '#9d174d'],
};

const ACCENT_KEYS = Object.keys(PALETTE) as Array<Exclude<ClubAccentColor, 'default'>>;

/**
 * Compute the gradient for a club. If the owner picked an accent, use it;
 * otherwise hash the club id into the palette so every club gets a stable
 * (but distinct) banner without anyone configuring anything.
 */
export function clubGradient(id: string, accent?: ClubAccentColor | null): string {
  const key = accent && accent !== 'default' ? accent : hashedAccent(id);
  const [from, to] = PALETTE[key];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

function hashedAccent(id: string): Exclude<ClubAccentColor, 'default'> {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return ACCENT_KEYS[hash % ACCENT_KEYS.length];
}

/**
 * Two-letter initials for the club avatar — first letter of each of the first
 * two whitespace-separated words.
 */
export function clubInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Ordered list of accent options for the settings UI (incl. 'default'). */
export const ACCENT_OPTIONS: ClubAccentColor[] = ['default', ...(ACCENT_KEYS as ClubAccentColor[])];

/** Single-color preview swatch — used by the accent picker. */
export function accentSwatch(accent: ClubAccentColor): string {
  if (accent === 'default') {
    return 'linear-gradient(135deg, #9ca3af, #4b5563)';
  }
  const [from, to] = PALETTE[accent];
  return `linear-gradient(135deg, ${from}, ${to})`;
}
