import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ChevronRight, Clock, Route, TrendingUp, Trophy, type LucideIcon } from 'lucide-react';
import { GlassCard } from '@components/ui';
import { formatDistance, formatDuration, formatElevation, formatRelativeTime } from '@utils/format';
import { getSportPresentation } from '@utils/sport';
import type { Activity } from '@types';

type ActivityCardVariant = 'compact' | 'detailed';

interface ActivityCardProps {
  activity: Activity;
  variant?: ActivityCardVariant;
  onClick?: () => void;
}

export const ActivityCard = ({ activity, variant = 'compact', onClick }: ActivityCardProps) => {
  const { t } = useTranslation();
  const sport = getSportPresentation(activity.sport_type || activity.type);
  const SportIcon = sport.icon;

  return (
    <GlassCard
      className={clsx(
        'group relative cursor-pointer overflow-hidden transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-xl',
        variant === 'compact' ? 'p-4' : 'p-4 sm:p-5'
      )}
      onClick={onClick}
    >
      <span
        className={clsx('absolute left-0 top-0 h-full w-1 opacity-80', sport.accent)}
        aria-hidden="true"
      />

      <div className="flex items-start gap-3">
        <div
          className={clsx(
            'flex shrink-0 items-center justify-center rounded-xl',
            sport.tint,
            variant === 'compact' ? 'h-12 w-12' : 'h-14 w-14'
          )}
        >
          <SportIcon size={variant === 'compact' ? 22 : 24} strokeWidth={1.75} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-gray-900">{activity.name}</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {formatRelativeTime(activity.start_date_local)}
              </p>
            </div>

            {activity.pr_count > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-strava-orange/10 px-2 py-0.5 text-xs font-semibold text-strava-orange ring-1 ring-strava-orange/20">
                <Trophy size={12} strokeWidth={2} aria-hidden="true" />
                {t('activities.pr', { count: activity.pr_count })}
              </span>
            )}
          </div>

          {variant === 'compact' ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-700">
              <Metric icon={Route} value={formatDistance(activity.distance)} />
              <Metric icon={TrendingUp} value={formatElevation(activity.total_elevation_gain)} />
              <Metric icon={Clock} value={formatDuration(activity.moving_time)} />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-4">
              <DetailedMetric
                icon={Route}
                label={t('common.distance')}
                value={formatDistance(activity.distance)}
              />
              <DetailedMetric
                icon={Clock}
                label={t('common.duration')}
                value={formatDuration(activity.moving_time)}
              />
              <DetailedMetric
                icon={TrendingUp}
                label={t('common.elevation')}
                value={formatElevation(activity.total_elevation_gain)}
              />
              <DetailedMetric
                label={t('common.avgSpeed')}
                value={`${(activity.average_speed * 3.6).toFixed(1)} km/h`}
              />
            </div>
          )}
        </div>

        {variant === 'compact' && (
          <ChevronRight
            size={18}
            strokeWidth={1.75}
            className="shrink-0 self-center text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gray-500"
            aria-hidden="true"
          />
        )}
      </div>
    </GlassCard>
  );
};

interface MetricProps {
  icon: LucideIcon;
  value: string;
}

const Metric = ({ icon: Icon, value }: MetricProps) => (
  <span className="inline-flex items-center gap-1">
    <Icon size={13} strokeWidth={1.75} className="text-gray-400" />
    <span className="font-medium tabular-nums">{value}</span>
  </span>
);

interface DetailedMetricProps {
  icon?: LucideIcon;
  label: string;
  value: string;
}

const DetailedMetric = ({ icon: Icon, label, value }: DetailedMetricProps) => (
  <div className="min-w-0">
    <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-gray-500">
      {Icon && <Icon size={11} strokeWidth={2} className="text-gray-400" />}
      <span className="truncate">{label}</span>
    </p>
    <p className="mt-0.5 truncate font-semibold tabular-nums text-gray-900">{value}</p>
  </div>
);
