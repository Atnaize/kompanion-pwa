import { Activity as ActivityIcon, Bike, Footprints, Waves, type LucideIcon } from 'lucide-react';

const FOOT_ACTIVITIES = new Set(['Run', 'TrailRun', 'Walk', 'Hike', 'VirtualRun']);

/** True for activities measured in pace (min/km) rather than speed (km/h). */
export const isFootActivity = (type: string): boolean => FOOT_ACTIVITIES.has(type);

export interface SportPresentation {
  icon: LucideIcon;
  tint: string;
  accent: string;
}

export const getSportPresentation = (type: string | undefined | null): SportPresentation => {
  const normalized = type?.toLowerCase() ?? '';

  if (normalized.includes('ride') || normalized.includes('cycl') || normalized.includes('bike')) {
    return {
      icon: Bike,
      tint: 'bg-blue-500/10 text-blue-600',
      accent: 'bg-blue-500',
    };
  }

  if (normalized.includes('swim')) {
    return {
      icon: Waves,
      tint: 'bg-cyan-500/10 text-cyan-600',
      accent: 'bg-cyan-500',
    };
  }

  if (normalized.includes('walk') || normalized.includes('hike')) {
    return {
      icon: Footprints,
      tint: 'bg-emerald-500/10 text-emerald-600',
      accent: 'bg-emerald-500',
    };
  }

  if (normalized.includes('run')) {
    return {
      icon: Footprints,
      tint: 'bg-strava-orange/10 text-strava-orange',
      accent: 'bg-strava-orange',
    };
  }

  return {
    icon: ActivityIcon,
    tint: 'bg-purple-500/10 text-purple-600',
    accent: 'bg-purple-500',
  };
};
