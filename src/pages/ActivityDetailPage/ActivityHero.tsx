import { useTranslation } from 'react-i18next';
import { AnimatedNumber } from '@components/ui';
import { HeroStat } from '@components/activity';
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatLocalDateTime,
} from '@utils/format';
import { useSettingsStore } from '@store/settingsStore';
import type { Activity } from '@types';

interface ActivityHeroProps {
  activity: Activity;
  isFoot: boolean;
  formatSpeedValue: (mps: number) => string;
}

export const ActivityHero = ({ activity, isFoot, formatSpeedValue }: ActivityHeroProps) => {
  const { t } = useTranslation();
  const locale = useSettingsStore((s) => s.locale);
  const maxSpeedText = formatSpeedValue(activity.max_speed);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-strava-orange via-orange-500 to-orange-600 p-5 shadow-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-black/10 blur-2xl"
      />
      <div className="relative">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-3xl shadow-inner backdrop-blur">
            {activityTypeEmoji(activity.type)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold leading-tight text-white sm:text-2xl">
              {activity.name}
            </h1>
            <p className="mt-0.5 text-sm text-white/80">
              {formatLocalDateTime(activity.start_date_local, locale)} · {activity.type}
            </p>
          </div>
          {activity.pr_count > 0 && (
            <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
              🏆 {t('activityDetail.newPrBadge', { count: activity.pr_count })}
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <HeroStat
            label={t('common.distance')}
            value={<AnimatedNumber value={activity.distance} format={formatDistance} />}
          />
          <HeroStat
            label={t('common.duration')}
            value={<AnimatedNumber value={activity.moving_time} format={formatDuration} />}
            sub={
              activity.elapsed_time !== activity.moving_time
                ? t('activityDetail.elapsedSuffix', {
                    value: formatDuration(activity.elapsed_time),
                  })
                : undefined
            }
          />
          <HeroStat
            label={isFoot ? t('activityDetail.avgPace') : t('activityDetail.avgSpeed')}
            value={<AnimatedNumber value={activity.average_speed} format={formatSpeedValue} />}
            sub={t('activityDetail.maxSuffix', { value: maxSpeedText })}
          />
          <HeroStat
            label={t('common.elevation')}
            value={
              <AnimatedNumber value={activity.total_elevation_gain} format={formatElevation} />
            }
            sub={
              activity.elev_high
                ? t('activityDetail.peakSuffix', { value: Math.round(activity.elev_high) })
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
};

const ACTIVITY_TYPE_EMOJI: Record<string, string> = {
  Run: '🏃',
  TrailRun: '🏃',
  Ride: '🚴',
  MountainBikeRide: '🚵',
  GravelRide: '🚴',
  VirtualRide: '🚴',
  VirtualRun: '🏃',
  Swim: '🏊',
  Walk: '🚶',
  Hike: '🥾',
  AlpineSki: '⛷️',
  BackcountrySki: '🎿',
  NordicSki: '⛷️',
  Snowboard: '🏂',
  IceSkate: '⛸️',
  InlineSkate: '🛼',
  Rowing: '🚣',
  Kayaking: '🛶',
  Canoeing: '🛶',
  Surfing: '🏄',
  Yoga: '🧘',
  Workout: '💪',
  WeightTraining: '🏋️',
  Elliptical: '🏃',
  StairStepper: '🪜',
  RockClimbing: '🧗',
};

const activityTypeEmoji = (type: string): string => ACTIVITY_TYPE_EMOJI[type] ?? '🏃';
