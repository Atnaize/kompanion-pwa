import {
  Flame,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Mountain,
  Rocket,
  Sunrise,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityPostedMetadata, FeedActivitySnapshot } from '@types';

export interface Vibe {
  /** i18n key for the chosen phrase (one of the vibe's variants). */
  key: string;
  icon: LucideIcon;
}

interface VibeDef {
  icon: LucideIcon;
  /**
   * All i18n keys that mean the same vibe. A deterministic hash of the seed
   * picks one so the same activity always shows the same phrase, but different
   * activities of the same vibe cycle through different phrasings.
   */
  phrases: readonly string[];
}

const PACE_TYPES = new Set(['Run', 'TrailRun']);
const FOOT_TYPES = new Set(['Run', 'TrailRun', 'Walk', 'Hike']);

/**
 * Vibe registry. Each entry has 2–3 phrasings.
 * Adding a vibe: add a key here + matching i18n strings.
 * Adding a phrasing: just push a new i18n key to `phrases`.
 */
const VIBES = {
  sub4: {
    icon: Rocket,
    phrases: [
      'feed.vibes.sub4_flying',
      'feed.vibes.sub4_afterburners',
      'feed.vibes.sub4_warpSpeed',
    ],
  },
  marathonMode: {
    icon: Trophy,
    phrases: [
      'feed.vibes.marathonMode_a',
      'feed.vibes.marathonMode_b',
      'feed.vibes.marathonMode_c',
    ],
  },
  epic: {
    icon: Trophy,
    phrases: ['feed.vibes.epic_a', 'feed.vibes.epic_b', 'feed.vibes.epic_c'],
  },
  mountainGoat: {
    icon: Mountain,
    phrases: [
      'feed.vibes.mountainGoat_a',
      'feed.vibes.mountainGoat_b',
      'feed.vibes.mountainGoat_c',
    ],
  },
  sub5: {
    icon: Zap,
    phrases: ['feed.vibes.sub5_a', 'feed.vibes.sub5_b', 'feed.vibes.sub5_c'],
  },
  speedDemon: {
    icon: Zap,
    phrases: ['feed.vibes.speedDemon_a', 'feed.vibes.speedDemon_b'],
  },
  bigDayBike: {
    icon: Flame,
    phrases: ['feed.vibes.bigDayBike_a', 'feed.vibes.bigDayBike_b', 'feed.vibes.bigDayBike_c'],
  },
  verticalChase: {
    icon: Mountain,
    phrases: [
      'feed.vibes.verticalChase_a',
      'feed.vibes.verticalChase_b',
      'feed.vibes.verticalChase_c',
    ],
  },
  cruising: {
    icon: Zap,
    phrases: ['feed.vibes.cruising_a', 'feed.vibes.cruising_b', 'feed.vibes.cruising_c'],
  },
  sufferfest: {
    icon: Flame,
    phrases: ['feed.vibes.sufferfest_a', 'feed.vibes.sufferfest_b', 'feed.vibes.sufferfest_c'],
  },
  sundayLong: {
    icon: Footprints,
    phrases: ['feed.vibes.sundayLong_a', 'feed.vibes.sundayLong_b'],
  },
  longHaul: {
    icon: Footprints,
    phrases: ['feed.vibes.longHaul_a', 'feed.vibes.longHaul_b', 'feed.vibes.longHaul_c'],
  },
  zone2: {
    icon: Leaf,
    phrases: ['feed.vibes.zone2_a', 'feed.vibes.zone2_b', 'feed.vibes.zone2_c'],
  },
  dawnPatrol: {
    icon: Sunrise,
    phrases: ['feed.vibes.dawnPatrol_a', 'feed.vibes.dawnPatrol_b', 'feed.vibes.dawnPatrol_c'],
  },
  afterDark: {
    icon: Moon,
    phrases: ['feed.vibes.afterDark_a', 'feed.vibes.afterDark_b', 'feed.vibes.afterDark_c'],
  },
  unsungHero: {
    icon: Heart,
    phrases: ['feed.vibes.unsungHero_a', 'feed.vibes.unsungHero_b', 'feed.vibes.unsungHero_c'],
  },
} as const satisfies Record<string, VibeDef>;

type VibeKey = keyof typeof VIBES;

/**
 * Stable 32-bit hash. Used to pick a phrasing deterministically per activity.
 */
function hash32(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function build(name: VibeKey, seed: string): Vibe {
  const def = VIBES[name];
  return {
    icon: def.icon,
    key: def.phrases[hash32(seed) % def.phrases.length],
  };
}

/**
 * Pick a single playful "vibe" tag for an activity. Rules ordered by rareness;
 * the most exceptional thing about the activity wins. Returns null when
 * nothing notable fires so the chip stays out of the way.
 *
 * `seed` is typically the activity id — it makes the phrase choice stable per
 * activity (same render every time) but varied across activities.
 */
export function pickVibe(
  meta: ActivityPostedMetadata,
  snapshot: FeedActivitySnapshot | undefined,
  createdAtIso: string,
  seed: string
): Vibe | null {
  const { distance, movingTime, totalElevationGain, averageSpeed, type } = meta;
  const elevationPerKm = (totalElevationGain / Math.max(distance, 1)) * 1000;
  const paceSecPerKm = averageSpeed > 0 ? 1000 / averageSpeed : Infinity;
  const speedKmh = averageSpeed * 3.6;
  const avgHr = snapshot?.averageHeartrate ?? null;
  const startDate = new Date(createdAtIso);
  const startHour = startDate.getHours();
  const startDayOfWeek = startDate.getDay(); // 0 = Sunday

  // 1) Rare achievements — most attention-grabbing.
  if (PACE_TYPES.has(type) && paceSecPerKm < 240) return build('sub4', seed);
  if (type === 'Run' && distance >= 35_000) return build('marathonMode', seed);
  if (movingTime >= 4 * 3600) return build('epic', seed);
  if (totalElevationGain >= 1500) return build('mountainGoat', seed);

  // 2) Notable signals.
  if (PACE_TYPES.has(type) && paceSecPerKm < 270) return build('speedDemon', seed);
  if (PACE_TYPES.has(type) && paceSecPerKm < 300) return build('sub5', seed);
  if (type === 'Ride' && distance >= 100_000) return build('bigDayBike', seed);
  if (elevationPerKm >= 50) return build('verticalChase', seed);
  if (type === 'Ride' && speedKmh >= 35) return build('cruising', seed);
  if (avgHr !== null && avgHr >= 170) return build('sufferfest', seed);

  // 3) Mood + time-of-day + weekday flavour.
  if (startDayOfWeek === 0 && type === 'Run' && distance >= 15_000) {
    return build('sundayLong', seed);
  }
  if (movingTime >= 2 * 3600) return build('longHaul', seed);
  if (avgHr !== null && avgHr < 130 && FOOT_TYPES.has(type)) return build('zone2', seed);
  if (startHour < 6) return build('dawnPatrol', seed);
  if (startHour >= 21) return build('afterDark', seed);

  // 4) Quiet-effort fallback.
  if (snapshot && snapshot.kudosCount === 0 && snapshot.commentCount === 0) {
    return build('unsungHero', seed);
  }

  return null;
}
