import { Activity as ActivityIcon, Bike, Footprints, Waves, type LucideIcon } from 'lucide-react';

const FOOT_ACTIVITIES = new Set(['Run', 'TrailRun', 'Walk', 'Hike', 'VirtualRun']);

/** True for activities measured in pace (min/km) rather than speed (km/h). */
export const isFootActivity = (type: string): boolean => FOOT_ACTIVITIES.has(type);

export interface SportPresentation {
  icon: LucideIcon;
  /** Combined `bg-…/10 text-…` for icon chips. */
  tint: string;
  /** Solid `bg-…` for accent dots / progress bars. */
  accent: string;
  /** Text-only colour (light + dark) for value text like a hero stat. */
  textColor: string;
}

export const getSportPresentation = (type: string | undefined | null): SportPresentation => {
  const normalized = type?.toLowerCase() ?? '';

  if (normalized.includes('ride') || normalized.includes('cycl') || normalized.includes('bike')) {
    return {
      icon: Bike,
      tint: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      accent: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
    };
  }

  if (normalized.includes('swim')) {
    return {
      icon: Waves,
      tint: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      accent: 'bg-cyan-500',
      textColor: 'text-cyan-600 dark:text-cyan-400',
    };
  }

  if (normalized.includes('walk') || normalized.includes('hike')) {
    return {
      icon: Footprints,
      tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      accent: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    };
  }

  if (normalized.includes('run')) {
    return {
      icon: Footprints,
      tint: 'bg-strava-orange/10 text-strava-orange',
      accent: 'bg-strava-orange',
      textColor: 'text-strava-orange',
    };
  }

  return {
    icon: ActivityIcon,
    tint: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    accent: 'bg-purple-500',
    textColor: 'text-purple-600 dark:text-purple-400',
  };
};
