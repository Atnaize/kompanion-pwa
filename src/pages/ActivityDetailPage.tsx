import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { GlassCard, Button, Skeleton, Tabs, TabList, Tab, TabPanel } from '@components/ui';
import {
  ActivityMap,
  ActivityChart,
  ActivityLaps,
  ActivityEngagement,
  ActivityPhotos,
  HeroStat,
  StatCell,
} from '@components/activity';
import { activitiesService } from '@api/services';
import { formatDistance, formatElevation, formatDuration } from '@utils/format';
import { useSettingsStore } from '@store/settingsStore';

const activityTypeEmoji = (type: string): string => {
  const emojiMap: Record<string, string> = {
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
  return emojiMap[type] || '🏃';
};

const isFootActivity = (type: string) =>
  ['Run', 'TrailRun', 'Walk', 'Hike', 'VirtualRun'].includes(type);

const formatPace = (metersPerSecond: number): string => {
  if (!metersPerSecond || metersPerSecond <= 0) return '—';
  const secondsPerKm = 1000 / metersPerSecond;
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
};

const formatLocalDateTime = (iso: string, locale: string): string => {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

type TabKey = 'overview' | 'map' | 'charts' | 'laps' | 'segments' | 'photos';

export const ActivityDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const locale = useSettingsStore((s) => s.locale);
  const [tab, setTab] = useState<TabKey>('overview');

  const numericId = id ? parseInt(id, 10) : NaN;
  const validId = !Number.isNaN(numericId);

  const {
    data: activity,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      const response = await activitiesService.getById(numericId);
      return response.data;
    },
    enabled: validId,
  });

  const { data: streams } = useQuery({
    queryKey: ['activity', id, 'streams'],
    queryFn: async () => {
      const response = await activitiesService.getStreams(numericId);
      return response.data;
    },
    enabled: validId && !!activity,
    staleTime: 5 * 60 * 1000,
  });

  const { data: laps } = useQuery({
    queryKey: ['activity', id, 'laps'],
    queryFn: async () => {
      const response = await activitiesService.getLaps(numericId);
      return response.data;
    },
    enabled: validId && !!activity,
    staleTime: 5 * 60 * 1000,
  });

  const { data: kudoers, isLoading: loadingKudoers } = useQuery({
    queryKey: ['activity', id, 'kudoers'],
    queryFn: async () => {
      const response = await activitiesService.getKudoers(numericId);
      return response.data;
    },
    enabled: validId && !!activity && (activity?.kudos_count ?? 0) > 0,
    staleTime: 60 * 1000,
  });

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ['activity', id, 'comments'],
    queryFn: async () => {
      const response = await activitiesService.getComments(numericId);
      return response.data;
    },
    enabled: validId && !!activity && (activity?.comment_count ?? 0) > 0,
    staleTime: 60 * 1000,
  });

  const { data: photos } = useQuery({
    queryKey: ['activity', id, 'photos'],
    queryFn: async () => {
      const response = await activitiesService.getPhotos(numericId);
      return response.data;
    },
    enabled: validId && !!activity,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (error) {
      navigate('/dashboard');
    }
  }, [error, navigate]);

  const foot = activity ? isFootActivity(activity.type) : false;

  const prSegments = useMemo(
    () => activity?.segment_efforts?.filter((e) => e.pr_rank !== null) ?? [],
    [activity]
  );

  const hasMap = !!(activity?.map?.summary_polyline || activity?.map?.polyline);
  const hasStreams = !!(streams && Object.keys(streams).length > 0);
  const hasLaps = !!(laps && laps.length > 1);
  const hasSegments = prSegments.length > 0;
  const hasPhotos = !!(photos && photos.length > 0);

  if (isLoading || !activity) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  const primarySpeed = foot
    ? formatPace(activity.average_speed)
    : `${(activity.average_speed * 3.6).toFixed(1)} km/h`;
  const maxSpeedText = foot
    ? formatPace(activity.max_speed)
    : `${(activity.max_speed * 3.6).toFixed(1)} km/h`;

  return (
    <Layout>
      <div className="space-y-5">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>

        {/* Hero */}
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
              <HeroStat label={t('common.distance')} value={formatDistance(activity.distance)} />
              <HeroStat
                label={t('common.duration')}
                value={formatDuration(activity.moving_time)}
                sub={
                  activity.elapsed_time !== activity.moving_time
                    ? t('activityDetail.elapsedSuffix', {
                        value: formatDuration(activity.elapsed_time),
                      })
                    : undefined
                }
              />
              <HeroStat
                label={foot ? t('activityDetail.avgPace') : t('activityDetail.avgSpeed')}
                value={primarySpeed}
                sub={t('activityDetail.maxSuffix', { value: maxSpeedText })}
              />
              <HeroStat
                label={t('common.elevation')}
                value={formatElevation(activity.total_elevation_gain)}
                sub={
                  activity.elev_high
                    ? t('activityDetail.peakSuffix', { value: Math.round(activity.elev_high) })
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onChange={(v) => setTab(v as typeof tab)}>
          <TabList wrap>
            <Tab value="overview" label={t('activityDetail.tabs.overview')} icon="📋" compact />
            {hasMap && <Tab value="map" label={t('activityDetail.tabs.map')} icon="🗺️" compact />}
            {hasStreams && (
              <Tab value="charts" label={t('activityDetail.tabs.charts')} icon="📊" compact />
            )}
            {hasLaps && (
              <Tab
                value="laps"
                label={t('activityDetail.tabs.laps')}
                count={laps?.length}
                icon="⏱️"
                compact
              />
            )}
            {hasSegments && (
              <Tab
                value="segments"
                label={t('activityDetail.tabs.prs')}
                count={prSegments.length}
                icon="🏆"
                compact
              />
            )}
            {hasPhotos && (
              <Tab
                value="photos"
                label={t('activityDetail.tabs.photos')}
                count={photos?.length}
                icon="📸"
                compact
              />
            )}
          </TabList>

          {/* OVERVIEW */}
          <TabPanel value="overview" className="mt-4 space-y-4">
            {hasMap && (
              <GlassCard className="overflow-hidden p-0">
                <ActivityMap
                  encodedPolyline={activity.map?.polyline || activity.map?.summary_polyline}
                  className="h-56"
                />
              </GlassCard>
            )}

            <GlassCard className="p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('activityDetail.performance')}
              </h2>
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
                    value={`${Math.round(activity.average_cadence)} ${foot ? 'spm' : 'rpm'}`}
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
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('activityDetail.details')}
              </h2>
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
                  label={foot ? t('activityDetail.maxPace') : t('activityDetail.maxSpeed')}
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
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {t('activityDetail.photos')}
                  </h2>
                  {photos.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setTab('photos')}
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
          </TabPanel>

          {/* MAP */}
          {hasMap && (
            <TabPanel value="map" className="mt-4">
              <GlassCard className="overflow-hidden p-0">
                <ActivityMap
                  encodedPolyline={activity.map?.polyline || activity.map?.summary_polyline}
                  streamCoords={streams?.latlng?.data as [number, number][] | undefined}
                  className="h-[60vh] min-h-[360px]"
                />
              </GlassCard>
            </TabPanel>
          )}

          {/* CHARTS */}
          {hasStreams && streams && (
            <TabPanel value="charts" className="mt-4 space-y-4">
              {streams.altitude && (
                <GlassCard className="p-4">
                  <ActivityChart
                    streams={streams}
                    metric="altitude"
                    label="Elevation"
                    unit="m"
                    color="#16a34a"
                  />
                </GlassCard>
              )}
              {streams.heartrate && (
                <GlassCard className="p-4">
                  <ActivityChart
                    streams={streams}
                    metric="heartrate"
                    label="Heart Rate"
                    unit="bpm"
                    color="#dc2626"
                  />
                </GlassCard>
              )}
              {streams.watts && (
                <GlassCard className="p-4">
                  <ActivityChart
                    streams={streams}
                    metric="watts"
                    label="Power"
                    unit="W"
                    color="#7c3aed"
                  />
                </GlassCard>
              )}
              {streams.velocity_smooth && (
                <GlassCard className="p-4">
                  <ActivityChart
                    streams={streams}
                    metric="velocity_smooth"
                    label={foot ? 'Speed' : 'Speed'}
                    unit="km/h"
                    color="#fc4c02"
                  />
                </GlassCard>
              )}
              {streams.cadence && (
                <GlassCard className="p-4">
                  <ActivityChart
                    streams={streams}
                    metric="cadence"
                    label="Cadence"
                    unit={foot ? 'spm' : 'rpm'}
                    color="#0891b2"
                  />
                </GlassCard>
              )}
            </TabPanel>
          )}

          {/* LAPS */}
          {hasLaps && (
            <TabPanel value="laps" className="mt-4">
              <GlassCard className="p-3">
                <ActivityLaps laps={laps!} showPace={foot} />
              </GlassCard>
            </TabPanel>
          )}

          {/* PHOTOS */}
          {hasPhotos && photos && (
            <TabPanel value="photos" className="mt-4">
              <GlassCard className="p-4">
                <ActivityPhotos photos={photos} />
              </GlassCard>
            </TabPanel>
          )}

          {/* SEGMENTS */}
          {hasSegments && (
            <TabPanel value="segments" className="mt-4">
              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {t('activityDetail.segmentPrs')}
                </h2>
                <p className="mt-1 text-xs text-gray-500">{t('activityDetail.segmentPrsHint')}</p>
                <div className="mt-4 space-y-3">
                  {[...prSegments]
                    .sort((a, b) => (a.pr_rank ?? 99) - (b.pr_rank ?? 99))
                    .map((effort) => {
                      const isNewPr = effort.pr_rank === 1;
                      return (
                        <div
                          key={effort.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                            isNewPr
                              ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50'
                              : 'border-gray-200 bg-white/60'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-semibold text-gray-900">
                                {effort.segment.name}
                              </h3>
                              {isNewPr && (
                                <span className="shrink-0 rounded-full bg-gradient-to-r from-strava-orange to-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                                  {t('activityDetail.newPr')}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600">
                              <span>📏 {formatDistance(effort.segment.distance)}</span>
                              <span>⏱️ {formatDuration(effort.elapsed_time)}</span>
                              {effort.segment.average_grade !== 0 && (
                                <span>
                                  📈 {effort.segment.average_grade > 0 ? '+' : ''}
                                  {effort.segment.average_grade.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-center">
                            <div
                              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-lg ${
                                isNewPr
                                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow'
                                  : 'bg-gray-100'
                              }`}
                            >
                              {effort.pr_rank === 1 ? '🥇' : effort.pr_rank === 2 ? '🥈' : '🥉'}
                            </div>
                            <p className="mt-1 text-[10px] font-medium text-gray-500">
                              {effort.pr_rank === 1
                                ? t('activityDetail.prRank1')
                                : effort.pr_rank === 2
                                  ? t('activityDetail.prRank2')
                                  : t('activityDetail.prRank3')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </GlassCard>
            </TabPanel>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};
