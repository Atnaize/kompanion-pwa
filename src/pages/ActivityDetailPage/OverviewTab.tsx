import { useTranslation } from 'react-i18next';
import { GlassCard } from '@components/ui';
import { ActivityMap, ActivityPhotos, ActivityEngagement, StatCell } from '@components/activity';
import { formatDuration } from '@utils/format';
import type { Activity, ActivityAthlete, ActivityComment, ActivityPhoto } from '@types';

interface OverviewTabProps {
  activity: Activity;
  isFoot: boolean;
  hasMap: boolean;
  hasPhotos: boolean;
  photos: ActivityPhoto[] | undefined;
  kudoers: ActivityAthlete[] | undefined;
  comments: ActivityComment[] | undefined;
  loadingKudoers: boolean;
  loadingComments: boolean;
  maxSpeedText: string;
  onShowAllPhotos: () => void;
}

export const OverviewTab = ({
  activity,
  isFoot,
  hasMap,
  hasPhotos,
  photos,
  kudoers,
  comments,
  loadingKudoers,
  loadingComments,
  maxSpeedText,
  onShowAllPhotos,
}: OverviewTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {hasMap && (
        <GlassCard className="overflow-hidden p-0">
          <ActivityMap
            encodedPolyline={activity.map?.polyline || activity.map?.summary_polyline}
            className="h-56"
          />
        </GlassCard>
      )}

      <GlassCard className="p-5">
        <SectionTitle>{t('activityDetail.performance')}</SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {activity.average_heartrate && (
            <StatCell
              label={t('activityDetail.avgHeartRate')}
              value={`${Math.round(activity.average_heartrate)} bpm`}
            />
          )}
          {activity.max_heartrate && (
            <StatCell
              label={t('activityDetail.maxHeartRate')}
              value={`${Math.round(activity.max_heartrate)} bpm`}
            />
          )}
          {activity.average_watts != null && (
            <StatCell
              label={t('activityDetail.avgPower')}
              value={`${Math.round(activity.average_watts)} W`}
            />
          )}
          {activity.max_watts != null && (
            <StatCell
              label={t('activityDetail.maxPower')}
              value={`${Math.round(activity.max_watts)} W`}
            />
          )}
          {activity.weighted_average_watts != null && (
            <StatCell
              label={t('activityDetail.weightedPower')}
              value={`${Math.round(activity.weighted_average_watts)} W`}
            />
          )}
          {activity.kilojoules != null && (
            <StatCell
              label={t('activityDetail.energy')}
              value={`${Math.round(activity.kilojoules)} kJ`}
            />
          )}
          {activity.average_cadence != null && (
            <StatCell
              label={t('activityDetail.avgCadence')}
              value={`${Math.round(activity.average_cadence)} ${isFoot ? 'spm' : 'rpm'}`}
            />
          )}
          {activity.average_temp != null && (
            <StatCell
              label={t('activityDetail.temperature')}
              value={`${Math.round(activity.average_temp)}°C`}
            />
          )}
          {activity.calories != null && (
            <StatCell
              label={t('activityDetail.calories')}
              value={`${Math.round(activity.calories)} kcal`}
            />
          )}
          {activity.suffer_score != null && (
            <StatCell
              label={t('activityDetail.relativeEffort')}
              value={String(Math.round(activity.suffer_score))}
              accent
            />
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionTitle>{t('activityDetail.details')}</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <StatCell
            label={t('activityDetail.movingTime')}
            value={formatDuration(activity.moving_time)}
          />
          <StatCell
            label={t('activityDetail.elapsedTime')}
            value={formatDuration(activity.elapsed_time)}
          />
          <StatCell
            label={isFoot ? t('activityDetail.maxPace') : t('activityDetail.maxSpeed')}
            value={maxSpeedText}
          />
          {activity.elev_high != null && (
            <StatCell
              label={t('activityDetail.highestPoint')}
              value={`${Math.round(activity.elev_high)} m`}
            />
          )}
          {activity.elev_low != null && (
            <StatCell
              label={t('activityDetail.lowestPoint')}
              value={`${Math.round(activity.elev_low)} m`}
            />
          )}
          {activity.device_name && (
            <StatCell label={t('activityDetail.device')} value={activity.device_name} />
          )}
        </div>
        {activity.description && (
          <p className="mt-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            {activity.description}
          </p>
        )}
      </GlassCard>

      {hasPhotos && photos && (
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <SectionTitle>{t('activityDetail.photos')}</SectionTitle>
            {photos.length > 8 && (
              <button
                type="button"
                onClick={onShowAllPhotos}
                className="text-xs font-medium text-strava-orange hover:underline"
              >
                {t('activityDetail.showMore', { count: photos.length - 8 })}
              </button>
            )}
          </div>
          <ActivityPhotos photos={photos.slice(0, 8)} />
        </div>
      )}

      <div>
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
          {t('activityDetail.engagement')}
        </h2>
        <ActivityEngagement
          kudoers={kudoers}
          comments={comments}
          kudosCount={activity.kudos_count}
          commentCount={activity.comment_count}
          isLoading={loadingKudoers || loadingComments}
        />
      </div>
    </div>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{children}</h2>
);
